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
    // Mã lỗi nghiệp vụ dạng số của backend (ErrorCode): 1410 = quiz quá hạn, 1156 = tài liệu đã gỡ
    error.code = typeof data?.code === "number" ? data.code : null;
    throw error;
  }
  return data.result ?? data;
}

const enc = encodeURIComponent;

// ---------- Trang cá nhân ----------

export const apiGetMyProfile = (token) => request(token, "/api/v1/students/me/profile");
export const apiUpdateMyProfile = (token, payload) =>
  request(token, "/api/v1/students/me/profile", { method: "PUT", body: JSON.stringify(payload) });

// ---------- Lịch & buổi học (3.6) ----------

/** Lịch tuần T2–CN của học sinh; có thể lọc theo một lớp trong workspace. */
export function apiGetMySchedule(token, weekStart, classId) {
  const params = new URLSearchParams();
  if (weekStart) params.set("weekStart", weekStart);
  if (classId) params.set("classId", classId);
  const query = params.size ? `?${params.toString()}` : "";
  return request(token, `/api/v1/students/me/schedule${query}`);
}

/** Lịch sử buổi học (giảm dần), lọc theo lớp nếu có. */
export function apiGetMySessions(token, { classId } = {}) {
  const query = classId ? `?classId=${enc(classId)}` : "";
  return request(token, `/api/v1/students/me/sessions${query}`);
}

/** Tài liệu kèm buổi học (từ các bài giảng PUBLISHED của lớp, V16). */
export function apiGetSessionMaterials(token, logId) {
  return request(token, `/api/v1/students/me/sessions/${enc(logId)}/materials`);
}

/** Link ký sẵn (10 phút) + cờ `previewable`. Tệp đã gỡ → lỗi MATERIAL_UNAVAILABLE. */
export function apiGetMaterialAccess(token, materialId) {
  return request(token, `/api/v1/materials/${enc(materialId)}/access-url`);
}

export function apiGetMyTutors(token) {
  return request(token, "/api/v1/students/me/tutors");
}

export function apiGetMyClasses(token) {
  return request(token, "/api/v1/students/me/classes");
}

export function apiGetMyClassDetail(token, classId) {
  return request(token, `/api/v1/students/me/classes/${enc(classId)}`);
}

export function apiGetMyClassLessons(token, classId) {
  return request(token, `/api/v1/students/me/classes/${enc(classId)}/lessons`);
}

export function apiGetMyClassMaterials(token, classId) {
  return request(token, `/api/v1/students/me/classes/${enc(classId)}/materials`);
}

/** Dashboard gộp; mỗi khu vực lỗi độc lập (`null` + `error`). */
export function apiGetMyDashboard(token) {
  return request(token, "/api/v1/students/me/dashboard");
}

// ---------- Quiz, Elo (3.7) ----------

export function apiGetMyQuizzes(token, status, classId) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (classId) params.set("classId", classId);
  const query = params.size ? `?${params.toString()}` : "";
  return request(token, `/api/v1/students/me/quizzes${query}`);
}

/** Chi tiết quiz và toàn bộ câu hỏi; đáp án chỉ có ở câu học sinh đã trả lời. */
export function apiGetQuizDetail(token, quizId) {
  return request(token, `/api/v1/quizzes/${enc(quizId)}`);
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

export function apiGetDueReviews(token, limit = 20, deckId) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", limit);
  if (deckId != null) params.set("deckId", deckId);
  const query = params.size ? `?${params.toString()}` : "";
  return request(token, `/api/v1/students/me/reviews/due${query}`);
}

/** deckId trống = thống kê mọi bộ thẻ. */
export function apiGetReviewStats(token, deckId) {
  const query = deckId != null ? `?deckId=${enc(deckId)}` : "";
  return request(token, `/api/v1/students/me/reviews/stats${query}`);
}

export function apiAnswerReview(token, cardId, selectedAnswer) {
  return request(token, `/api/v1/students/me/reviews/${enc(cardId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ selectedAnswer }),
  });
}

export function apiRateReview(token, cardId, reviewAttemptId, rating) {
  return request(token, `/api/v1/students/me/reviews/${enc(cardId)}/rate`, {
    method: "POST",
    body: JSON.stringify({ reviewAttemptId, rating }),
  });
}

/** Cấu hình ôn tập: học sinh có bật/tắt "tự động thêm câu sai vào danh sách ôn" không. */
export function apiGetReviewSettings(token) {
  return request(token, "/api/v1/students/me/review-settings");
}

export function apiUpdateReviewSettings(token, autoReviewWrong) {
  return request(token, "/api/v1/students/me/review-settings", {
    method: "PUT",
    body: JSON.stringify({ autoReviewWrong }),
  });
}

/** Thêm thủ công một câu đã trả lời (đúng hoặc sai) vào danh sách ôn.
 *  deckId trống = deck mặc định. Trả {cardId, created} (created=false khi câu
 *  đã có thẻ trong đúng deck). */
export function apiAddReviewCard(token, quizId, questionId, deckId) {
  return request(token, "/api/v1/students/me/review-cards", {
    method: "POST",
    body: JSON.stringify({ quizId, questionId, ...(deckId != null ? { deckId } : {}) }),
  });
}

// ---------- Bộ thẻ ôn tập (decks, V26) ----------

/** Danh sách bộ thẻ ôn tập của học sinh (deck mặc định trước, kèm số thẻ / câu đến hạn). */
export function apiGetReviewDecks(token) {
  return request(token, "/api/v1/students/me/review-decks");
}

export function apiCreateReviewDeck(token, name) {
  return request(token, "/api/v1/students/me/review-decks", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function apiRenameReviewDeck(token, deckId, name) {
  return request(token, `/api/v1/students/me/review-decks/${enc(deckId)}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function apiDeleteReviewDeck(token, deckId) {
  return request(token, `/api/v1/students/me/review-decks/${enc(deckId)}`, {
    method: "DELETE",
  });
}
