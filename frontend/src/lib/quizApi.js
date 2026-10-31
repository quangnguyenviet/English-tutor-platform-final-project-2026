/**
 * API quiz buổi học của gia sư (soạn quiz thủ công, FR-13) — khớp
 * backend module `quiz` (API_DESIGN.md mục 3.7, lát cắt DRAFT→ASSIGNED).
 * Base URL lấy từ VITE_API_BASE_URL (file .env.local).
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

// ---------------------------------------------------- QUIZ BUỔI HỌC (FR-13)

/**
 * Tạo quiz bản nháp (DRAFT) cho buổi học.
 * @param {string} token
 * @param {number|string} sessionId
 * @param {Object} payload - { title: string,
 *   questions: [{ questionText, optionA, optionB, optionC, optionD,
 *                 correctAnswer: "A"|"B"|"C"|"D", explanation?, cefrLevel?, skillCode? }] }
 * @returns {Promise<Object>} chi tiết quiz vừa tạo (kèm danh sách câu hỏi)
 */
export function apiCreateSessionQuiz(token, sessionId, payload) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}/quizzes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Danh sách quiz của 1 buổi học (card "Quiz buổi học"). */
export function apiGetSessionQuizzes(token, sessionId) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}/quizzes`);
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
