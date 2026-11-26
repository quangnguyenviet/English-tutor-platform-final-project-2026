/**
 * API hàng đợi "Dạy thử thất bại cần xử lý" (V32) — dành cho Lễ tân & Admin.
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

/** Danh sách task dạy thử thất bại — GET /api/v1/trial-report-tasks */
export async function apiGetTrialReportTasks({ status, assignedTo, page = 0, size = 20, token }) {
  const query = new URLSearchParams();
  if (status) query.append("status", status);
  if (assignedTo !== undefined && assignedTo !== null && assignedTo !== "") query.append("assignedTo", String(assignedTo));
  query.append("page", String(page));
  query.append("size", String(size));
  return request(`/api/v1/trial-report-tasks?${query.toString()}`, { token }, "Không thể tải hàng đợi dạy thử thất bại");
}

/** Số lượng task theo trạng thái — GET /api/v1/trial-report-tasks/counts */
export async function apiGetTrialReportTaskCounts(token) {
  return request(`/api/v1/trial-report-tasks/counts`, { token }, "Không thể lấy số lượng task dạy thử thất bại");
}

/** Chi tiết task — GET /api/v1/trial-report-tasks/{id} */
export async function apiGetTrialReportTaskDetail(id, token) {
  return request(`/api/v1/trial-report-tasks/${id}`, { token }, "Không thể lấy chi tiết task");
}

/** Gán việc cho mình — POST /api/v1/trial-report-tasks/{id}/assign-self */
export async function apiAssignTrialReportTaskSelf(id, token) {
  return request(`/api/v1/trial-report-tasks/${id}/assign-self`, { method: "POST", token }, "Không thể gán task");
}

/** Bỏ gán — DELETE /api/v1/trial-report-tasks/{id}/assignment */
export async function apiUnassignTrialReportTask(id, token) {
  return request(`/api/v1/trial-report-tasks/${id}/assignment`, { method: "DELETE", token }, "Không thể bỏ gán task");
}

/** Gán sang nhân sự khác — PUT /api/v1/trial-report-tasks/{id}/assignment */
export async function apiAssignTrialReportTask(id, userId, token) {
  return request(`/api/v1/trial-report-tasks/${id}/assignment`, { method: "PUT", body: { userId }, token }, "Không thể gán task");
}

/** Đổi trạng thái việc — PATCH /api/v1/trial-report-tasks/{id}/status */
export async function apiChangeTrialReportTaskStatus(id, status, token) {
  return request(`/api/v1/trial-report-tasks/${id}/status`, { method: "PATCH", body: { status }, token }, "Không thể đổi trạng thái task");
}

/** Ghép lại (mở lại yêu cầu lớp) — POST /api/v1/trial-report-tasks/{id}/rematch */
export async function apiRematchTrialReportTask(id, token) {
  return request(`/api/v1/trial-report-tasks/${id}/rematch`, { method: "POST", token }, "Không thể ghép lại từ task");
}
