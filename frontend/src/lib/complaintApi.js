/**
 * Complaint API service — Khiếu nại & Hoàn tiền (API_DESIGN mục 3.9).
 * Base URL lấy từ VITE_API_BASE_URL; token đọc từ localStorage (cùng khoá với AuthContext).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = "gsa_token";
const NETWORK_ERROR = "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.";

function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return { Accept: "application/json", ...(token ? bearerHeader(token) : {}), ...extra };
}

function errorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.details)) return data.details.join("; ");
  return fallback;
}

async function request(path, { method = "GET", json, query } = {}) {
  const qs = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const url = `${BASE}/api/v1${path}${qs.toString() ? `?${qs}` : ""}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: authHeaders(json !== undefined ? { "Content-Type": "application/json" } : {}),
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  let data = {};
  if ((res.headers.get("content-type") || "").includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  }
  if (!res.ok) throw new Error(errorMessage(data, `Yêu cầu thất bại (${res.status})`));
  return data.result;
}

/**
 * Gửi multipart kèm tiến trình. `fields` là các trường text, `files` là { name, file }.
 *
 * @param {(percent: number) => void} [onProgress]
 */
function upload(path, { fields = {}, files = [] }, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") form.append(k, v);
    });
    files.forEach(({ name, file }) => form.append(name, file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/v1${path}`);
    Object.entries(authHeaders()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error(NETWORK_ERROR));
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        // body không phải JSON
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.result);
      else reject(new Error(errorMessage(data, `Gửi thất bại (${xhr.status})`)));
    };
    xhr.send(form);
  });
}

// ------------------------------------------------------------- Khiếu nại

/** Danh sách khiếu nại: status, type, keyword, page, size. */
export const apiGetComplaints = ({ status, type, keyword, page = 0, size = 20 } = {}) =>
  request("/complaints", { query: { status, type, keyword: keyword?.trim(), page, size } });

/** Số đơn theo trạng thái: { PENDING, PROCESSING, RESOLVED, CANCELLED, TOTAL }. */
export const apiGetComplaintCounts = () => request("/complaints/counts");

/** Chi tiết: { complaint, target, attachments, refunds, refundablePayments }. */
export const apiGetComplaint = (id) => request(`/complaints/${id}`);

export const apiCreateComplaint = (payload) => request("/complaints", { method: "POST", json: payload });

export const apiUpdateComplaint = (id, payload) =>
  request(`/complaints/${id}`, { method: "PUT", json: payload });

export const apiCancelComplaint = (id) => request(`/complaints/${id}/cancel`, { method: "POST" });

/** Giải quyết khiếu nại không hoàn tiền: requestOutcome (CANCELLED/REMATCH), resolution, files. */
export const apiResolveComplaint = (id, { requestOutcome, resolution, files = [] }, onProgress) =>
  upload(
    `/complaints/${id}/resolve`,
    { fields: { requestOutcome, resolution }, files: files.map((file) => ({ name: "files", file })) },
    onProgress
  );

/** Gửi yêu cầu hoàn tiền cho Kế toán. */
export const apiCreateRefundRequest = (id, payload) =>
  request(`/complaints/${id}/refund-requests`, { method: "POST", json: payload });

// ------------------------------------------------------------- Hoàn tiền

export const apiGetRefunds = ({ tab, page = 0, size = 20 } = {}) =>
  request("/refunds", { query: { tab, page, size } });

export const apiGetRefundCounts = () => request("/refunds/counts");

export const apiGetRefund = (id) => request(`/refunds/${id}`);

export const apiPayRefund = (id, approvedAmount, file, onProgress) =>
  upload(`/refunds/${id}/pay`, { fields: { approvedAmount }, files: [{ name: "file", file }] }, onProgress);

export const apiRejectRefund = (id, reason) =>
  request(`/refunds/${id}/reject`, { method: "POST", json: { reason } });
