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
 * Tìm hồ sơ gia sư ACTIVE có phân trang phía server (page bắt đầu từ 0).
 * Endpoint này là public nên không gửi access token.
 *
 * @param {Object} [params] - page, size, keyword, province, district, gender, teachingMode, specialty (mảng), gradeGroup
 * @returns {Promise<{items: Object[], page: number, size: number, totalItems: number, totalPages: number}>}
 */
export async function apiGetPublicTutors(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => v && query.append(key, v));
    else if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });

  const res = await fetch(`${BASE}/api/v1/public/tutors?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể lấy danh sách gia sư (${res.status})`));
  }

  const result = data.result || {};
  return {
    items: Array.isArray(result.items) ? result.items : [],
    page: result.page ?? 0,
    size: result.size ?? 0,
    totalItems: result.totalItems ?? 0,
    totalPages: result.totalPages ?? 0,
  };
}

/**
 * Lấy một hồ sơ gia sư ACTIVE theo id.
 *
 * @param {string|number} tutorId
 * @returns {Promise<Object>}
 */
export async function apiGetPublicTutor(tutorId) {
  const res = await fetch(`${BASE}/api/v1/public/tutors/${encodeURIComponent(tutorId)}`, {
    headers: { Accept: "application/json" },
  });
  const data = await readJson(res);

  if (!res.ok) {
    const error = new Error(extractErrorMessage(data, `Không thể lấy hồ sơ gia sư (${res.status})`));
    error.status = res.status;
    throw error;
  }

  return data.result ?? data;
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
    const err = new Error(
      extractErrorMessage(data, `Không thể lấy hồ sơ gia sư (${res.status})`),
    );
    err.status = res.status;
    throw err;
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
 * Hủy hồ sơ đang chờ duyệt — POST /api/v1/tutors/me/profile/cancel
 * Chuyển profile_status từ PENDING -> INCOMPLETE.
 * Chỉ được gọi khi profileStatus = PENDING, khác thì backend trả 409.
 *
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Updated tutor profile với status INCOMPLETE
 */
export async function cancelProfileForReview(token) {
  const res = await fetch(`${BASE}/api/v1/tutors/me/profile/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(
      extractErrorMessage(data, `Hủy duyệt thất bại (${res.status})`),
    );
    err.status = res.status;
    throw err;
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

/**
 * Lấy danh sách gia sư có phân trang và bộ lọc — GET /api/v1/tutors
 *
 * @param {Object} params - { status, keyword, page, size }
 * @param {string} token - JWT token của Lễ tân / Admin
 * @returns {Promise<Object>} PageResponse { items, page, size, totalItems, totalPages }
 */
export async function apiGetTutors({ status, keyword, page = 0, size = 20 } = {}, token) {
  const query = new URLSearchParams();
  if (status && status !== "ALL") query.set("status", status);
  if (keyword && keyword.trim()) query.set("keyword", keyword.trim());
  query.set("page", page);
  query.set("size", size);

  const res = await fetch(`${BASE}/api/v1/tutors?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể tải danh sách gia sư (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Lấy số lượng gia sư theo từng trạng thái để làm badge tab — GET /api/v1/tutors/counts
 *
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Map counts { PENDING, ACTIVE, INACTIVE, REJECTED, ALL }
 */
export async function apiGetTutorCounts(token) {
  const res = await fetch(`${BASE}/api/v1/tutors/counts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể lấy số lượng gia sư (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Lấy chi tiết hồ sơ gia sư đầy đủ (kèm chứng chỉ, bảng giá...) — GET /api/v1/tutors/{id}
 *
 * @param {number|string} tutorId - ID gia sư
 * @param {string} token - JWT token
 * @returns {Promise<Object>} TutorProfileResponse
 */
export async function apiGetTutorDetail(tutorId, token) {
  const res = await fetch(`${BASE}/api/v1/tutors/${tutorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Không thể lấy chi tiết gia sư (${res.status})`));
    err.status = res.status;
    throw err;
  }

  return data.result ?? data;
}

/**
 * Duyệt hồ sơ gia sư: PENDING -> ACTIVE — POST /api/v1/tutors/{id}/approve
 *
 * @param {number|string} tutorId - ID gia sư
 * @param {string} token - JWT token
 * @returns {Promise<Object>} TutorProfileResponse
 */
export async function apiApproveTutor(tutorId, token) {
  const res = await fetch(`${BASE}/api/v1/tutors/${tutorId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Duyệt hồ sơ thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }

  return data.result ?? data;
}

/**
 * Từ chối hồ sơ gia sư kèm lý do: PENDING -> REJECTED — POST /api/v1/tutors/{id}/reject
 *
 * @param {number|string} tutorId - ID gia sư
 * @param {string} rejectionReason - Lý do từ chối bắt buộc
 * @param {string} token - JWT token
 * @returns {Promise<Object>} TutorProfileResponse
 */
export async function apiRejectTutor(tutorId, rejectionReason, token) {
  const res = await fetch(`${BASE}/api/v1/tutors/${tutorId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify({ rejectionReason }),
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Từ chối hồ sơ thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }

  return data.result ?? data;
}

/**
 * Đổi trạng thái hoạt động: ACTIVE <-> INACTIVE — PATCH /api/v1/tutors/{id}/status
 *
 * @param {number|string} tutorId - ID gia sư
 * @param {Object} payload - { status: 'ACTIVE' | 'INACTIVE', note: string }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} TutorProfileResponse
 */
export async function apiUpdateTutorStatus(tutorId, { status, note }, token) {
  const res = await fetch(`${BASE}/api/v1/tutors/${tutorId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify({ status, note }),
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Cập nhật trạng thái thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }

  return data.result ?? data;
}

/**
 * Quản trị viên cập nhật thông tin hồ sơ gia sư — PATCH /api/v1/tutors/{id}
 *
 * @param {number|string} tutorId - ID gia sư
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {string} token - JWT token
 * @returns {Promise<Object>} TutorProfileResponse
 */
export async function apiUpdateTutorProfile(tutorId, updateData, token) {
  const res = await fetch(`${BASE}/api/v1/tutors/${tutorId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify(updateData),
  });

  const data = await readJson(res);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, `Cập nhật thông tin thất bại (${res.status})`));
    err.status = res.status;
    throw err;
  }

  return data.result ?? data;
}

