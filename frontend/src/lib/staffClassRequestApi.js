/**
 * Staff Class Requests API service — Quản lý Lớp cần gia sư dành cho Lễ tân & Admin.
 * Base URL lấy từ biến môi trường VITE_API_BASE_URL.
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

async function readJson(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {};
  }
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

async function request(path, { method = "GET", body, token } = {}, fallbackMessage) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `${fallbackMessage} (${res.status})`));
  }
  return data.result ?? data;
}

/** Danh sách lớp cần gia sư — GET /api/v1/class-requests */
export async function apiGetClassRequests({ tab, keyword, sort, page = 0, size = 20, token }) {
  const query = new URLSearchParams();
  if (tab) query.append("tab", tab);
  if (keyword && keyword.trim()) query.append("keyword", keyword.trim());
  if (sort) query.append("sort", sort);
  if (page !== undefined && page !== null) query.append("page", String(page));
  if (size !== undefined && size !== null) query.append("size", String(size));
  return request(`/api/v1/class-requests?${query.toString()}`, { token }, "Không thể tải danh sách lớp cần gia sư");
}

/** Số lượng lớp theo tab — GET /api/v1/class-requests/counts */
export async function apiGetClassRequestCounts(token) {
  return request(`/api/v1/class-requests/counts`, { token }, "Không thể lấy số lượng lớp");
}

/** Chi tiết lớp kèm danh sách ứng tuyển — GET /api/v1/class-requests/{id} */
export async function apiGetClassRequestDetail(id, token) {
  return request(`/api/v1/class-requests/${id}`, { token }, "Không thể lấy chi tiết lớp cần gia sư");
}

/** Danh sách gia sư ứng tuyển — GET /api/v1/class-requests/{id}/applications */
export async function apiGetClassApplications(id, token) {
  return request(`/api/v1/class-requests/${id}/applications`, { token }, "Không thể tải danh sách gia sư ứng tuyển");
}

/** Kiểm tra SĐT phụ huynh — POST /api/v1/class-requests/parent-check */
export async function apiCheckParent(phone, parentName, token) {
  return request(
    `/api/v1/class-requests/parent-check`,
    { method: "POST", body: { phone, parentName }, token },
    "Không thể kiểm tra số điện thoại"
  );
}

/** Tạo mới lớp cần gia sư — POST /api/v1/class-requests */
export async function apiCreateClassRequest(payload, token) {
  return request(`/api/v1/class-requests`, { method: "POST", body: payload, token }, "Không thể tạo lớp cần gia sư");
}

/** Bổ sung/sửa thông tin lớp — PUT /api/v1/class-requests/{id} */
export async function apiUpdateClassRequest(id, payload, token) {
  return request(`/api/v1/class-requests/${id}`, { method: "PUT", body: payload, token }, "Không thể cập nhật lớp cần gia sư");
}

/** Đăng lớp (NEW → OPEN) — POST /api/v1/class-requests/{id}/publish */
export async function apiPublishClassRequest(id, token) {
  return request(`/api/v1/class-requests/${id}/publish`, { method: "POST", token }, "Không thể đăng tuyển lớp");
}

/** Đổi gia sư chỉ định, tutorId null là không chỉ định — PATCH /api/v1/class-requests/{id}/designated-tutor */
export async function apiChangeDesignatedTutor(id, tutorId, token) {
  return request(
    `/api/v1/class-requests/${id}/designated-tutor`,
    { method: "PATCH", body: { tutorId }, token },
    "Không thể đổi gia sư chỉ định"
  );
}

/** Xác nhận lớp có gia sư chỉ định, chuyển dạy thử — POST /api/v1/class-requests/{id}/confirm */
export async function apiConfirmClassRequest(id, token) {
  return request(`/api/v1/class-requests/${id}/confirm`, { method: "POST", token }, "Không thể xác nhận lớp");
}

/** Xác nhận ghép thành công — POST /api/v1/class-requests/{id}/complete-match */
export async function apiCompleteClassRequest(id, token, body) {
  return request(
    `/api/v1/class-requests/${id}/complete-match`,
    { method: "POST", body, token },
    "Không thể xác nhận ghép thành công"
  );
}

/** Ghép lại khi dạy thử không thành công — POST /api/v1/class-requests/{id}/rematch */
export async function apiRematchClassRequest(id, reason, token) {
  return request(
    `/api/v1/class-requests/${id}/rematch`,
    { method: "POST", body: { reason }, token },
    "Không thể ghép lại"
  );
}

/** Chọn gia sư — POST /api/v1/class-requests/{id}/select-tutor */
export async function apiSelectTutor(id, applicationId, token) {
  return request(
    `/api/v1/class-requests/${id}/select-tutor`,
    { method: "POST", body: { applicationId }, token },
    "Không thể chọn gia sư"
  );
}

/** Hủy lớp cần gia sư — POST /api/v1/class-requests/{id}/cancel */
export async function apiCancelClassRequest(id, reason, token) {
  return request(
    `/api/v1/class-requests/${id}/cancel`,
    { method: "POST", body: { reason }, token },
    "Không thể hủy lớp cần gia sư"
  );
}
