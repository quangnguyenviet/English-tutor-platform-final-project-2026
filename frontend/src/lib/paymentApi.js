/**
 * Payment API service — phí nhận lớp (API_DESIGN mục 3.8).
 * Base URL lấy từ VITE_API_BASE_URL; token đọc từ localStorage (cùng khoá với AuthContext).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = "gsa_token";

function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return { Accept: "application/json", ...(token ? bearerHeader(token) : {}), ...extra };
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
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, `Yêu cầu thất bại (${res.status})`));
  return data.result;
}

/**
 * Gửi multipart kèm tiến trình tải lên (fetch không hỗ trợ upload progress).
 *
 * @param {(percent: number) => void} [onProgress]
 */
function upload(path, file, paymentMethod, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (paymentMethod) form.append("paymentMethod", paymentMethod);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/v1${path}`);
    const headers = authHeaders();
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau."));
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        // body không phải JSON
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.result);
      else reject(new Error(errorMessage(data, `Tải lên thất bại (${xhr.status})`)));
    };
    xhr.send(form);
  });
}

/** Gia sư: các khoản phí của mình theo tab trạng thái. */
export const apiGetMyPayments = ({ tab, page = 0, size = 20 } = {}) =>
  request("/tutors/me/payments", { query: { tab, page, size } });

/** Lễ tân / Kế toán / Admin: tìm khoản phí. keyword = mã lớp, tên gia sư hoặc SĐT phụ huynh. */
export const apiSearchPayments = ({ keyword, status, month, tutorId, page = 0, size = 20 } = {}) =>
  request("/payments", { query: { keyword: keyword?.trim(), status, month, tutorId, page, size } });

/** Chi tiết khoản phí, có proofUrl (link xem biên lai có thời hạn). */
export const apiGetPayment = (id) => request(`/payments/${id}`);

/** Gia sư tự nộp biên lai (chỉ chuyển khoản). */
export const apiSubmitProof = (id, file, onProgress, paymentMethod) =>
  upload(`/payments/${id}/proof`, file, paymentMethod, onProgress);

/** Lễ tân / Admin thu hộ tại quầy. */
export const apiCollectProof = (id, file, paymentMethod, onProgress) =>
  upload(`/payments/${id}/collect-proof`, file, paymentMethod, onProgress);

/** Lễ tân / Admin chỉnh tỷ lệ phí (0-50%) khi chưa có minh chứng. */
export const apiUpdateFeePercentage = (id, feePercentage) =>
  request(`/payments/${id}/fee-percentage`, { method: "PATCH", json: { feePercentage } });

/** Kế toán / Admin đối chiếu: đủ tiền thì APPROVED, thiếu thì RESUBMIT_REQUIRED. */
export const apiApprovePayment = (id, receivedAmount) =>
  request(`/payments/${id}/approve`, { method: "POST", json: { receivedAmount } });

/** Kế toán / Admin yêu cầu nộp lại biên lai kèm lý do. */
export const apiRequestResubmit = (id, reason) =>
  request(`/payments/${id}/request-resubmit`, { method: "POST", json: { reason } });
