/**
 * API cổng Học sinh — khớp backend/API_DESIGN.md mục 3.6, 3.7.
 * Base URL lấy từ VITE_API_BASE_URL (file .env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[studentApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
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

async function request(token, path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...bearerHeader(token),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  const data = await readJson(res);
  if (!res.ok) {
    const error = new Error(data?.message || `Yêu cầu thất bại (${res.status})`);
    error.status = res.status;
    // Mã lỗi nghiệp vụ (QUIZ_EXPIRED, MATERIAL_UNAVAILABLE...) nằm trong message/code của backend
    error.code = typeof data?.code === "string" ? data.code : data?.error ?? null;
    error.businessMessage = data?.message ?? "";
    throw error;
  }
  return data.result ?? data;
}

const enc = encodeURIComponent;

// ---------- Lịch & buổi học (3.6) ----------

/** Lịch tuần T2–CN của học sinh. `weekStart` = thứ 2 (YYYY-MM-DD), bỏ trống = tuần hiện tại. */
export function apiGetMySchedule(token, weekStart) {
  const query = weekStart ? `?weekStart=${enc(weekStart)}` : "";
  return request(token, `/api/v1/students/me/schedule${query}`);
}

/** Lịch sử buổi học (giảm dần), lọc theo lớp nếu có. */
export function apiGetMySessions(token, { classId } = {}) {
  const query = classId ? `?classId=${enc(classId)}` : "";
  return request(token, `/api/v1/students/me/sessions${query}`);
}

/** Chi tiết buổi học: tài liệu, quiz, nhật ký (chỉ khi gia sư đã công bố). */
export function apiGetSessionDetail(token, sessionId) {
  return request(token, `/api/v1/sessions/${enc(sessionId)}`);
}

/** Link ký sẵn (10 phút) + cờ `previewable`. Tệp đã gỡ → lỗi MATERIAL_UNAVAILABLE. */
export function apiGetMaterialAccess(token, materialId) {
  return request(token, `/api/v1/materials/${enc(materialId)}/access-url`);
}

export function apiGetMyTutors(token) {
  return request(token, "/api/v1/students/me/tutors");
}

/** Dashboard gộp; mỗi khu vực lỗi độc lập (`null` + `error`). */
export function apiGetMyDashboard(token) {
  return request(token, "/api/v1/students/me/dashboard");
}

// ---------- Quiz, Elo (3.7) ----------

export function apiGetMyQuizzes(token, status) {
  const query = status ? `?status=${enc(status)}` : "";
  return request(token, `/api/v1/students/me/quizzes${query}`);
}

/** Bắt đầu hoặc làm tiếp: trả câu chưa trả lời kế tiếp và tiến độ. */
export function apiStartAttempt(token, quizId) {
  return request(token, `/api/v1/quizzes/${enc(quizId)}/attempts/start`, { method: "POST" });
}

/** Chấm ngay; gọi lại cùng câu trả về kết quả cũ (idempotent). */
export function apiAnswerQuestion(token, quizId, questionId, selectedAnswer) {
  return request(token, `/api/v1/quizzes/${enc(quizId)}/questions/${enc(questionId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ selectedAnswer }),
  });
}

export function apiGetQuizResult(token, quizId) {
  return request(token, `/api/v1/quizzes/${enc(quizId)}/result`);
}

export function apiGetReviewList(token) {
  return request(token, "/api/v1/students/me/review-list");
}
