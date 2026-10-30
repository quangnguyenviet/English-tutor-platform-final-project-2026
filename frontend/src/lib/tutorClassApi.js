/**
 * API gia sư xem lớp cần gia sư và ứng tuyển — khớp backend/API_DESIGN.md mục 3.4.
 * Base URL lấy từ VITE_API_BASE_URL (file .env.local).
 */
import { bearerHeader } from "./authApi";
import { mapPublicClass } from "./publicClassApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[tutorClassApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
}

async function readJson(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function extractErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.details)) return data.details.join("; ");
  if (typeof data?.details === "string") return data.details;
  return fallback;
}

async function request(token, path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...bearerHeader(token),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  const data = await readJson(res);
  if (!res.ok) {
    const error = new Error(extractErrorMessage(data, `Yêu cầu thất bại (${res.status})`));
    error.status = res.status;
    throw error;
  }
  return data.result ?? data;
}

/**
 * Danh sách lớp đang mở nhận ứng tuyển (page bắt đầu từ 0).
 *
 * @param {string} token
 * @param {Object} params - page, size, keyword, teachingMode, gradeGroup, sort
 * @returns {Promise<{items: Object[], page: number, size: number, totalItems: number, totalPages: number}>}
 */
export async function apiGetOpenRequests(token, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });

  const result = await request(token, `/api/v1/tutors/me/open-requests?${query.toString()}`);
  return {
    items: Array.isArray(result.items) ? result.items : [],
    page: result.page ?? 0,
    size: result.size ?? 0,
    totalItems: result.totalItems ?? 0,
    totalPages: result.totalPages ?? 0,
  };
}

/** Chi tiết một lớp đang mở; lớp không còn OPEN sẽ trả lỗi 404. */
export function apiGetOpenClassRequest(token, classRequestId) {
  return request(token, `/api/v1/tutors/me/open-requests/${encodeURIComponent(classRequestId)}`);
}

/** Ứng tuyển lớp (lời nhắn kèm theo tùy chọn). */
export function apiApplyForClass(token, classRequestId, message) {
  return request(token, `/api/v1/tutors/me/open-requests/${encodeURIComponent(classRequestId)}/apply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/** Rút đơn ứng tuyển theo id đơn (không phải id lớp). */
export function apiWithdrawApplication(token, applicationId) {
  return request(token, `/api/v1/tutors/me/applications/${encodeURIComponent(applicationId)}`, {
    method: "DELETE",
  });
}

/** Lịch sử ứng tuyển của gia sư (gồm cả đơn lớp đã ghép/hủy). */
export async function apiGetMyApplications(token) {
  const result = await request(token, "/api/v1/tutors/me/applications");
  return Array.isArray(result) ? result : [];
}

const APPLIED_AT_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : APPLIED_AT_FORMATTER.format(date);
}

/** Map lớp đang mở từ backend sang model hiển thị dùng chung với trang khách. */
export function mapTutorOpenClass(item) {
  return {
    ...mapPublicClass(item),
    applied: Boolean(item?.applied),
    applicationId: item?.applicationId ?? null,
    myMessage: item?.myMessage || "",
    appliedAt: item?.appliedAt || null,
    appliedAtLabel: formatDateTime(item?.appliedAt),
    // Danh sách lớp đang tuyển trả requestStatus; tóm tắt lớp trong "Lớp đã ứng tuyển" trả status.
    requestStatus: item?.requestStatus || item?.status || "OPEN",
    applicationStatus: item?.applicationStatus || null,
    // Đã bị từ chối hoặc bị loại sau dạy thử: không ứng tuyển lại đơn này (kể cả khi đơn tuyển lại).
    blocked: BLOCKED_APPLICATION_STATUSES.includes(item?.applicationStatus),
    blockLabel: APPLICATION_STATUS_META[item?.applicationStatus]?.label || "",
    blockHint: BLOCKED_HINTS[item?.applicationStatus] || "",
  };
}

export const APPLICATION_STATUS_META = {
  APPLIED: { label: "Chờ duyệt", tone: "amber" },
  SELECTED: { label: "Được chọn", tone: "emerald" },
  REJECTED: { label: "Không được chọn", tone: "rose" },
  TERMINATED: { label: "Đã loại – dạy thử không thành công", tone: "slate" },
};

/** Lượt ứng tuyển không thể ứng tuyển lại đơn này nữa (mỗi gia sư một lượt / đơn). */
const BLOCKED_APPLICATION_STATUSES = ["REJECTED", "TERMINATED"];

/** Chú thích cho lượt bị từ chối / bị loại (UC gia sư 6b2, 6b4, 6b5). */
const BLOCKED_HINTS = {
  REJECTED: "Bạn đã không được chọn cho lớp này trước đó nên không thể ứng tuyển lại.",
  TERMINATED: "Dạy thử không thành công, bạn không thể ứng tuyển lại lớp này.",
};

export const REQUEST_STATUS_LABELS = {
  OPEN: "Đang tuyển",
  REMATCH: "Đang tuyển lại",
  MATCHED: "Đã ghép lớp",
  CANCELLED: "Đã hủy",
};

const REQUEST_STATUS_TONES = {
  OPEN: "slate",
  REMATCH: "violet",
  MATCHED: "violet",
  CANCELLED: "rose",
};

/** Lớp đang nhận ứng tuyển: đăng tuyển lần đầu hoặc đang ghép lại sau dạy thử thất bại. */
export const isRecruitingStatus = (status) => status === "OPEN" || status === "REMATCH";

/** Map một đơn ứng tuyển (kèm tóm tắt lớp) sang model hiển thị. */
export function mapMyApplication(application) {
  const status = application?.status || "";
  const classRequest = application?.classRequest || {};
  const requestStatus = classRequest.status || "";

  return {
    applicationId: application?.applicationId,
    status,
    statusLabel: APPLICATION_STATUS_META[status]?.label || "Chờ duyệt",
    statusTone: APPLICATION_STATUS_META[status]?.tone || "amber",
    message: application?.message || "",
    appliedAtLabel: formatDateTime(application?.appliedAt),
    requestStatus,
    requestStatusLabel: REQUEST_STATUS_LABELS[requestStatus] || "",
    requestStatusTone: REQUEST_STATUS_TONES[requestStatus] || "slate",
    statusHint: status === "TERMINATED" || (status === "REJECTED" && isRecruitingStatus(requestStatus))
      ? BLOCKED_HINTS[status]
      : "",
    canWithdraw: status === "APPLIED" && isRecruitingStatus(requestStatus),
    classInfo: mapTutorOpenClass(classRequest),
  };
}
