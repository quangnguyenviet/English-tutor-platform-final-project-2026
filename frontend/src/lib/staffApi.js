/**
 * Staff API service — wrapper gọi module Quản lý nhân sự (Lễ tân / Kế toán) của backend.
 * Tất cả endpoint yêu cầu vai trò ADMIN. Base URL lấy từ VITE_API_BASE_URL (.env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[staffApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
}

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

/**
 * Danh sách nhân sự có phân trang và bộ lọc — GET /api/v1/employees
 *
 * @param {Object} params - { role, status, keyword, page, size }
 * @param {string} token - JWT token của Admin
 * @returns {Promise<Object>} PageResponse { items, page, size, totalItems, totalPages }
 */
export async function apiGetEmployees({ role, status, keyword, page = 0, size = 20 } = {}, token) {
  const query = new URLSearchParams();
  if (role && role !== "ALL") query.set("role", role);
  if (status && status !== "ALL") query.set("status", status);
  if (keyword && keyword.trim()) query.set("keyword", keyword.trim());
  query.set("page", page);
  query.set("size", size);

  const res = await fetch(`${BASE}/api/v1/employees?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
  });
  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể tải danh sách nhân sự (${res.status})`));
  }
  return data.result ?? data;
}

/**
 * Số lượng nhân sự theo trạng thái (badge tab) — GET /api/v1/employees/counts
 *
 * @param {string} role - Lọc theo vai trò (RECEPTIONIST/ACCOUNTANT/ALL)
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { ALL, ACTIVE, INACTIVE }
 */
export async function apiGetEmployeeCounts(role, token) {
  const query = new URLSearchParams();
  if (role && role !== "ALL") query.set("role", role);

  const res = await fetch(`${BASE}/api/v1/employees/counts?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
  });
  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể lấy số lượng nhân sự (${res.status})`));
  }
  return data.result ?? data;
}

/**
 * Chi tiết một nhân sự — GET /api/v1/employees/{id}
 *
 * @param {number|string} id
 * @param {string} token - JWT token
 * @returns {Promise<Object>} EmployeeDetailResponse
 */
export async function apiGetEmployeeDetail(id, token) {
  const res = await fetch(`${BASE}/api/v1/employees/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
  });
  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Không thể lấy chi tiết nhân sự (${res.status})`));
    err.status = res.status;
    throw err;
  }
  return data.result ?? data;
}

/**
 * Tạo mới nhân sự — POST /api/v1/employees
 *
 * @param {Object} payload - { role, fullName, email, phone, startDate }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} EmployeeCreatedResponse { employee, username, defaultPassword }
 */
export async function apiCreateEmployee(payload, token) {
  const res = await fetch(`${BASE}/api/v1/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Tạo nhân sự thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }
  return data.result ?? data;
}

/**
 * Đổi trạng thái hoạt động của nhân sự — PATCH /api/v1/employees/{id}/status
 *
 * @param {number|string} id
 * @param {string} status - 'ACTIVE' | 'INACTIVE'
 * @param {string} token - JWT token
 * @returns {Promise<Object>} EmployeeDetailResponse
 */
export async function apiUpdateEmployeeStatus(id, status, token) {
  const res = await fetch(`${BASE}/api/v1/employees/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
    body: JSON.stringify({ status }),
  });
  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Cập nhật trạng thái thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }
  return data.result ?? data;
}
