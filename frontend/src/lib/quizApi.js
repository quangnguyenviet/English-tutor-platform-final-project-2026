/**
 * API quiz của gia sư (soạn quiz thủ công, FR-13, V16) — quiz gắn BÀI GIẢNG
 * (lessons), không gắn buổi học. Khớp backend module `quiz` (mục 3.7,
 * lát cắt DRAFT→ASSIGNED). Base URL lấy từ VITE_API_BASE_URL (.env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[quizApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
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

function extractErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.details)) return data.details.join("; ");
  if (typeof data?.details === "string") return data.details;
  return fallback;
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
    const error = new Error(extractErrorMessage(data, `Yêu cầu thất bại (${res.status})`));
    error.status = res.status;
    throw error;
  }
  return data.result ?? data;
}

// ---------------------------------------------------- QUIZ BÀI GIẢNG (FR-13, V16)

/**
 * Tạo quiz bản nháp (DRAFT) cho BÀI GIẢNG.
 * @param {string} token
 * @param {number|string} lessonId
 * @param {Object} payload - { title: string,
 *   questions: [{ questionText, optionA, optionB, optionC, optionD,
 *                 correctAnswer: "A"|"B"|"C"|"D", explanation?, cefrLevel?, skillCode? }] }
 * @returns {Promise<Object>} chi tiết quiz vừa tạo (kèm danh sách câu hỏi)
 */
export function apiCreateLessonQuiz(token, lessonId, payload) {
  return request(token, `/api/v1/lessons/${encodeURIComponent(lessonId)}/quizzes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Danh sách quiz của 1 bài giảng (card "Quiz bài giảng"). */
export function apiGetLessonQuizzes(token, lessonId) {
  return request(token, `/api/v1/lessons/${encodeURIComponent(lessonId)}/quizzes`);
}

/** Chi tiết quiz (mở lại bản nháp để sửa). */
export function apiGetQuiz(token, quizId) {
  return request(token, `/api/v1/quizzes/${encodeURIComponent(quizId)}`);
}

/** Sửa tiêu đề + ghi đè toàn bộ câu hỏi (chỉ khi quiz còn DRAFT). */
export function apiUpdateQuiz(token, quizId, payload) {
  return request(token, `/api/v1/quizzes/${encodeURIComponent(quizId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Giao bài (DRAFT → ASSIGNED): đặt thời hạn làm quiz, hệ thống thông báo
 * học sinh của lớp.
 * @param {string} deadline - ISO datetime, ví dụ "2026-11-02T23:59:00+07:00"
 */
export function apiAssignQuiz(token, quizId, deadline) {
  return request(token, `/api/v1/quizzes/${encodeURIComponent(quizId)}/assign`, {
    method: "POST",
    body: JSON.stringify({ deadline }),
  });
}

/** Catalog kỹ năng chung toàn hệ thống (ô chọn kỹ năng khi soạn quiz). */
export function apiGetSkills(token) {
  return request(token, `/api/v1/skills`);
}

// ---------------------------------------------------- TRỢ LÝ AI SOẠN QUIZ (FR-13, UC-T06)

/**
 * Trò chuyện với trợ lý AI để soạn / sửa bộ câu hỏi quiz. Backend gọi AI
 * Service, ghép ngữ cảnh ẩn danh của học sinh (SKP + catalog kỹ năng) và
 * trả về nhận xét + bộ câu đề xuất (sẵn map vào form).
 *
 * @param {string} token
 * @param {number|string} lessonId - Bài giảng (V16; guard quyền sở hữu)
 * @param {Object} payload
 * @param {string} payload.message - Yêu cầu của gia sư (bắt buộc)
 * @param {number} [payload.quizId] - ID quiz DRAFT đang sửa (nếu có)
 * @param {Array<{role: string, content: string}>} [payload.recentMessages]
 *        - Lịch hội thoại gần nhất (chat stateless, tối đa 10 tin)
 * @returns {Promise<{reply: string, draftQuestions: Array<{
 *   questionText, optionA, optionB, optionC, optionD, correctAnswer,
 *   explanation, cefrLevel, skillCode }>}>}
 */
export function apiAiChatQuiz(token, lessonId, payload) {
  return request(
    token,
    `/api/v1/lessons/${encodeURIComponent(lessonId)}/quizzes/ai-chat`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

/**
 * Bảng thống kê hồ sơ kỹ năng học sinh của lớp (drawer SKP, FR-13).
 * Sắp theo tỷ lệ sai giảm dần + thời gian chưa ôn. Rỗng nếu chưa có dữ
 * liệu trả lời quiz.
 * @param {string} token
 * @param {number|string} classId
 * @returns {Promise<Array<{skillCode, skillName, category, totalCorrect,
 *   totalIncorrect, totalAttempts, errorRate, lastPracticedAt}>>}
 */
export function apiGetSkillProfile(token, classId) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/skill-profile`);
}

// ---------------------------------------------------- META HIỂN THỊ

/** Trạng thái quiz → nhãn + tone badge (chuẩn tone AGENTS.md). */
export const QUIZ_STATUS_META = {
  DRAFT: { label: "Nháp", tone: "amber" },
  ASSIGNED: { label: "Đã giao", tone: "blue" },
  COMPLETED: { label: "Đã hoàn thành", tone: "emerald" },
  EXPIRED: { label: "Hết hạn", tone: "slate" },
};

/** Trừ đi phần chèn (timezone offset) để "YYYY-MM-DDTHH:mm" hợp lệ cho <input datetime-local>. */
export function formatDeadlineInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Nhãn "HH:mm dd/MM/yyyy" cho deadline hiển thị. */
export function formatDeadlineLabel(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
