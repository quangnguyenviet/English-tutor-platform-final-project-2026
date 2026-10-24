/**
 * Match Requests API service — Quản lý Đơn ghép lớp dành cho Lễ tân & Admin.
 * Base URL được lấy từ biến môi trường VITE_API_BASE_URL.
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Đọc JSON an toàn từ response.
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
 * Lấy thông điệp lỗi từ response backend.
 *
 * @param {Object} data
 * @param {string} fallback
 * @returns {string}
 */
function extractErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.details)) return data.details.join("; ");
  if (typeof data?.details === "string") return data.details;
  return fallback;
}

/**
 * Lấy danh sách Đơn ghép lớp phân trang theo Tab — GET /api/v1/match-requests
 *
 * @param {Object} params
 * @param {string} [params.tab] - pending | trial | matched | cancelled | all
 * @param {string} [params.keyword]
 * @param {number} [params.page] - bắt đầu từ 0
 * @param {number} [params.size]
 * @param {string} params.token
 * @returns {Promise<{items: Array, page: number, size: number, totalItems: number, totalPages: number}>}
 */
export async function apiGetMatchRequests({ tab, keyword, page = 0, size = 20, token }) {
  const query = new URLSearchParams();
  if (tab) query.append("tab", tab);
  if (keyword && keyword.trim()) query.append("keyword", keyword.trim());
  if (page !== undefined && page !== null) query.append("page", String(page));
  if (size !== undefined && size !== null) query.append("size", String(size));

  const res = await fetch(`${BASE}/api/v1/match-requests?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể tải danh sách đơn ghép lớp (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Lấy số lượng đơn theo từng tab thống kê — GET /api/v1/match-requests/counts
 *
 * @param {string} token
 * @returns {Promise<{pending: number, trial: number, matched: number, cancelled: number, total: number}>}
 */
export async function apiGetMatchRequestCounts(token) {
  const res = await fetch(`${BASE}/api/v1/match-requests/counts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể lấy số lượng đơn (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Lấy chi tiết một đơn ghép lớp — GET /api/v1/match-requests/{id}
 *
 * @param {number|string} id
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function apiGetMatchRequestDetail(id, token) {
  const res = await fetch(`${BASE}/api/v1/match-requests/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể lấy chi tiết đơn ghép lớp (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Tạo mới đơn ghép lớp tại quầy (UC-REC-05, UC-ADM-04) — POST /api/v1/match-requests
 *
 * @param {Object} payload
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function apiCreateMatchRequest(payload, token) {
  const res = await fetch(`${BASE}/api/v1/match-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Không thể tạo đơn ghép lớp (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Duyệt / Xác nhận đơn ghép lớp (UC-REC-06, UC-ADM-05) — POST /api/v1/match-requests/{id}/confirm
 *
 * @param {number|string} id
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function apiConfirmMatchRequest(id, token) {
  const res = await fetch(`${BASE}/api/v1/match-requests/${id}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Xác nhận đơn thất bại (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Hủy đơn ghép lớp kèm lý do (UC-REC-07, UC-ADM-06) — POST /api/v1/match-requests/{id}/cancel
 *
 * @param {number|string} id
 * @param {string} reason
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function apiCancelMatchRequest(id, reason, token) {
  const res = await fetch(`${BASE}/api/v1/match-requests/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
    body: JSON.stringify({ reason }),
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Hủy đơn thất bại (${res.status})`));
  }

  return data.result ?? data;
}

/**
 * Duyệt đơn ghép lớp từ dạy thử sang ghép thành công (UC-REC-06.1, UC-ADM-05.1) — POST /api/v1/match-requests/{id}/complete-match
 *
 * @param {number|string} id
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function apiCompleteMatchRequest(id, token) {
  const res = await fetch(`${BASE}/api/v1/match-requests/${id}/complete-match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerHeader(token),
    },
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Xác nhận ghép thành công thất bại (${res.status})`));
  }

  return data.result ?? data;
}

