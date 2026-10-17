/**
 * Tutor API service — wrapper gọi Tutor Profile backend.
 * Base URL được lấy từ biến môi trường VITE_API_BASE_URL (định nghĩa trong .env.local).
 */
const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[tutorApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
}

import { bearerHeader } from "./authApi";

/**
 * Lấy hồ sơ gia sư hiện tại — GET /api/v1/tutors/me/profile
 *
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Tutor profile data
 */
export async function apiGetTutorProfile(token) {
  const res = await fetch(`${BASE}/api/v1/tutors/me/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Không thể lấy hồ sơ gia sư");
  }

  return data.result;
}

/**
 * Submit/cập nhật hồ sơ gia sư — POST /api/v1/tutors/me/profile
 * Sử dụng multipart/form-data để upload files (avatar, credentials)
 *
 * @param {string} token - JWT token
 * @param {FormData} formData - FormData chứa profile fields và files
 * @returns {Promise<Object>} Updated tutor profile
 */
export async function apiSubmitTutorProfile(token, formData) {
  const res = await fetch(`${BASE}/api/v1/tutors/me/profile`, {
    method: "POST",
    headers: {
      ...bearerHeader(token),
      // Không set Content-Type khi dùng FormData — browser tự set multipart/form-data; boundary=...
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Lưu hồ sơ thất bại");
  }

  return data.result;
}

/**
 * Gửi hồ sơ để duyệt — POST /api/v1/tutors/me/profile/submit
 * Chuyển profile_status từ INCOMPLETE -> PENDING
 *
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Updated tutor profile với status PENDING
 */
export async function apiSubmitProfileForReview(token) {
  const res = await fetch(`${BASE}/api/v1/tutors/me/profile/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Gửi hồ sơ duyệt thất bại");
  }

  return data.result;
}
