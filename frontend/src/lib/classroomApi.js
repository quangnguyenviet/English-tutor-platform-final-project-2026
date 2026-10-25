/**
 * API lớp học của gia sư và lịch dạy thử — khớp backend/API_DESIGN.md mục 3.5 (UC-T08).
 * Base URL lấy từ VITE_API_BASE_URL (file .env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[classroomApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
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

/** Danh sách lớp học của gia sư, lọc theo trạng thái (bỏ trống để lấy tất cả). */
export function apiGetMyClasses(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(token, `/api/v1/tutors/me/classes${query}`);
}

/** Chi tiết lớp học của gia sư (kèm buổi dạy thử nếu đã thiết lập). */
export function apiGetClassDetail(token, classId) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}`);
}

/**
 * Thiết lập lịch dạy thử cho lớp TRIAL.
 * @param {Object} payload - { sessionDate: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
 *                            teachingMode: "ONLINE" | "AT_HOME", meetingUrl?, location? }
 */
export function apiCreateTrialSession(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/trial-session`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Chỉnh sửa/dời lịch dạy thử khi buổi thử chưa diễn ra. */
export function apiUpdateTrialSession(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/trial-session`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export const CLASS_STATUS_META = {
  TRIAL: { label: "Đang dạy thử", tone: "violet" },
  ACTIVE: { label: "Đang hoạt động", tone: "emerald" },
  COMPLETED: { label: "Đã kết thúc", tone: "slate" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

export const TEACHING_MODE_LABELS = {
  ONLINE: "Online",
  AT_HOME: "Tại nhà",
};

export const SESSION_STATUS_META = {
  SCHEDULED: { label: "Đã lên lịch", tone: "blue" },
  IN_PROGRESS: { label: "Đang diễn ra", tone: "amber" },
  COMPLETED: { label: "Đã hoàn thành", tone: "emerald" },
  ABSENT: { label: "Vắng mặt", tone: "amber" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

/** "2026-10-28" → "28/10/2026" (không qua Date để tránh lệch múi giờ). */
export function formatSessionDate(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 3) return String(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** "19:00" hoặc "19:00:00" → "19:00". */
export function formatSessionTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

/** Chuẩn hóa buổi dạy thử từ backend sang model hiển thị. */
export function mapTrialSession(item) {
  if (!item) return null;
  return {
    ...item,
    dateLabel: formatSessionDate(item.sessionDate),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    statusLabel: SESSION_STATUS_META[item.status]?.label || item.status,
    statusTone: SESSION_STATUS_META[item.status]?.tone || "slate",
    modeLabel: TEACHING_MODE_LABELS[item.teachingMode] || item.teachingMode,
  };
}

/** Map một lớp học của gia sư sang model hiển thị. */
export function mapClassSummary(item) {
  const meta = CLASS_STATUS_META[item?.status] || { label: item?.status || "", tone: "slate" };
  return {
    classId: item?.classId,
    className: item?.className || item?.studentName || "Lớp học",
    studentName: item?.studentName || "",
    teachingMode: item?.teachingMode || "",
    modeLabel: TEACHING_MODE_LABELS[item?.teachingMode] || item?.teachingMode || "",
    pricePerSession: item?.pricePerSession,
    status: item?.status || "",
    statusLabel: meta.label,
    statusTone: meta.tone,
    createdAt: item?.createdAt || null,
    trialSession: mapTrialSession(item?.trialSession),
  };
}

/** Map chi tiết lớp học sang model hiển thị. */
export function mapClassDetail(item) {
  return {
    ...mapClassSummary(item),
    activeFrom: item?.activeFrom || null,
    activeFromLabel: item?.activeFrom ? formatSessionDate(item.activeFrom) : "",
    school: item?.school || "",
    grade: item?.grade || "",
    learningGoal: item?.learningGoal || "",
  };
}
