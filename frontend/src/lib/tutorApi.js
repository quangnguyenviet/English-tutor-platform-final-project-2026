/**
 * Tutor API service — wrapper gọi Tutor Profile backend.
 * Base URL được lấy từ biến môi trường VITE_API_BASE_URL (định nghĩa trong .env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[tutorApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
}

/**
 * Đọc JSON an toàn từ response (tránh lỗi khi body rỗng hoặc không phải JSON).
 *
 * @param {Response} res
 * @returns {Promise<Object>}
 */
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

/**
 * Lấy thông điệp lỗi thân thiện từ body lỗi của backend.
 *
 * @param {Object} data - Body JSON đã parse
 * @param {string} fallback - Thông điệp mặc định
 * @returns {string}
 */
function extractErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.details)) return data.details.join("; ");
  if (typeof data?.details === "string") return data.details;
  return fallback;
}

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

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Không thể lấy hồ sơ gia sư"));
  }

  return data.result ?? data;
}

/**
 * Tải ảnh đại diện gia sư — POST /api/v1/tutors/me/profile/avatar
 * Chỉ upload file và trả URL; ảnh chưa được lưu vào hồ sơ cho đến khi gọi Lưu hồ sơ.
 *
 * @param {string} token - JWT token
 * @param {File} file - File ảnh đại diện
 * @returns {Promise<string>} URL ảnh đại diện đã lưu
 */
export async function uploadTutorAvatar(token, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${BASE}/api/v1/tutors/me/profile/avatar`, {
    method: "POST",
    headers: {
      ...bearerHeader(token),
      // Không set Content-Type — browser tự thêm boundary cho multipart/form-data
    },
    body: formData,
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Tải ảnh đại diện thất bại (${res.status})`));
  }

  const payload = data.result ?? data;
  if (!payload?.avatarUrl) {
    throw new Error("Máy chủ không trả về URL ảnh đại diện");
  }
  return payload.avatarUrl;
}

/**
 * Tải các file minh chứng (chứng chỉ/thành tích) — POST /api/v1/tutors/me/profile/credentials/upload
 * URL trả về giữ nguyên thứ tự với danh sách file gửi lên.
 *
 * @param {string} token - JWT token
 * @param {File[]} files - Danh sách file minh chứng
 * @returns {Promise<string[]>} Danh sách URL file đã lưu
 */
export async function uploadTutorCredentials(token, files) {
  if (!files || files.length === 0) {
    return [];
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch(`${BASE}/api/v1/tutors/me/profile/credentials/upload`, {
    method: "POST",
    headers: {
      ...bearerHeader(token),
    },
    body: formData,
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Tải file minh chứng thất bại (${res.status})`));
  }

  const payload = data.result ?? data;
  return Array.isArray(payload) ? payload : [];
}

/**
 * Submit/cập nhật hồ sơ gia sư — POST /api/v1/tutors/me/profile
 * Gửi JSON thuần; file (avatar, minh chứng) đã được upload qua 2 API riêng.
 *
 * @param {string} token - JWT token
 * @param {Object} profileData - Hồ sơ đã có sẵn avatarUrl/fileUrl
 * @returns {Promise<Object>} Updated tutor profile
 */
export async function apiSubmitTutorProfile(token, profileData) {
  const res = await fetch(`${BASE}/api/v1/tutors/me/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify(profileData),
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Lưu hồ sơ thất bại (${res.status})`));
  }

  return data.result ?? data;
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

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Gửi duyệt thất bại (${res.status})`));
  }

  return data.result ?? data;
}
