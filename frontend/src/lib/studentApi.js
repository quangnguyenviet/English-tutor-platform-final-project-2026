/**
 * Student API service — wrapper gọi module Quản lý học sinh (FR-34) của backend.
 * Tất cả endpoint yêu cầu vai trò RECEPTIONIST hoặc ADMIN. Base URL lấy từ VITE_API_BASE_URL (.env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[studentApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
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

async function request(path, { method = "GET", body, token, fallback }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...bearerHeader(token) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `${fallback} (${res.status})`));
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data.result ?? data;
}

function filterQuery({ status, keyword, learning } = {}) {
  const query = new URLSearchParams();
  if (status && status !== "ALL") query.set("status", status);
  if (keyword && keyword.trim()) query.set("keyword", keyword.trim());
  if (learning && learning !== "ALL") query.set("learning", learning);
  return query;
}

/**
 * Danh sách học sinh có phân trang và bộ lọc — GET /api/v1/students
 *
 * @param {Object} params - { status: ACTIVE|INACTIVE|ALL, keyword, learning: STUDYING|NOT_STUDYING|ALL, page, size }
 * @param {string} token - JWT token của Lễ tân / Admin
 * @returns {Promise<Object>} PageResponse { items, page, size, totalItems, totalPages }
 */
export function apiGetStudents({ status, keyword, learning, page = 0, size = 20 } = {}, token) {
  const query = filterQuery({ status, keyword, learning });
  query.set("page", page);
  query.set("size", size);
  return request(`/api/v1/students?${query.toString()}`, { token, fallback: "Không thể tải danh sách học sinh" });
}

/**
 * Số lượng học sinh theo trạng thái (badge tab) — GET /api/v1/students/counts
 *
 * @param {Object} params - { keyword, learning }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { ALL, ACTIVE, INACTIVE }
 */
export function apiGetStudentCounts({ keyword, learning } = {}, token) {
  const query = filterQuery({ keyword, learning });
  return request(`/api/v1/students/counts?${query.toString()}`, {
    token,
    fallback: "Không thể lấy số lượng học sinh",
  });
}

/**
 * Chi tiết học sinh (cá nhân, phụ huynh, lớp đang/đã học) — GET /api/v1/students/{id}
 *
 * @param {number|string} id
 * @param {string} token - JWT token
 * @returns {Promise<Object>} StudentDetailResponse
 */
export function apiGetStudentDetail(id, token) {
  return request(`/api/v1/students/${id}`, { token, fallback: "Không thể lấy chi tiết học sinh" });
}

/**
 * Khóa/mở tài khoản học sinh — PATCH /api/v1/students/{id}/status
 *
 * @param {number|string} id
 * @param {Object} payload - { status: 'ACTIVE' | 'INACTIVE', note }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} StudentDetailResponse sau cập nhật
 */
export function apiUpdateStudentStatus(id, { status, note } = {}, token) {
  return request(`/api/v1/students/${id}/status`, {
    method: "PATCH",
    body: { status, note: note?.trim() || undefined },
    token,
    fallback: "Cập nhật trạng thái học sinh thất bại",
  });
}
