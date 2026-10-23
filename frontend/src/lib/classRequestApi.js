/**
 * Phụ huynh (khách, chưa đăng nhập) để lại họ tên + SĐT để trung tâm gọi lại.
 * POST /api/v1/public/class-requests
 */
const BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * @param {Object} payload
 * @param {string} payload.parentName
 * @param {string} payload.phone
 * @param {number|string} [payload.tutorId] - có: liên hệ gia sư cụ thể; bỏ trống: nhận tư vấn chung
 * @returns {Promise<{requestCode: string, message: string}>}
 */
export async function apiSubmitClassRequest({ parentName, phone, tutorId }) {
  // Backend chỉ nhận số liền (bỏ khoảng trắng, dấu chấm, gạch ngang, ngoặc).
  const body = {
    parentName: String(parentName || "").trim(),
    phone: String(phone || "").replace(/[\s.\-()]/g, ""),
  };
  if (tutorId !== undefined && tutorId !== null && tutorId !== "") body.tutorId = Number(tutorId);

  let res;
  try {
    res = await fetch(`${BASE}/api/v1/public/class-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  if (!res.ok) {
    let message = "";
    try {
      message = (await res.json())?.message || "";
    } catch {
      // body không phải JSON
    }
    throw new Error(message || `Gửi yêu cầu thất bại (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  return data.result || {};
}
