/**
 * Model thuần cho cổng Học sinh (lịch, buổi học, quiz) — không gọi mạng, dễ test.
 * Khớp backend/API_DESIGN.md mục 3.1, 3.6, 3.7.
 */

/** Mật khẩu mặc định do hệ thống cấp, không được dùng lại làm mật khẩu mới. */
export function validateNewPassword({ oldPassword, newPassword, confirm }) {
  if (!oldPassword) return "Vui lòng nhập mật khẩu hiện tại";
  if (!newPassword) return "Vui lòng nhập mật khẩu mới";
  if (newPassword.length < 8) return "Mật khẩu mới phải có tối thiểu 8 ký tự";
  if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return "Mật khẩu mới phải gồm chữ hoa, chữ thường và số";
  }
  if (newPassword === oldPassword) return "Mật khẩu mới không được trùng mật khẩu hiện tại";
  if (newPassword !== confirm) return "Mật khẩu nhập lại không khớp";
  return "";
}

// ---------- Lịch tuần T2–CN ----------

const pad = (n) => String(n).padStart(2, "0");

function parseISO(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Thứ 2 của tuần chứa `iso` (YYYY-MM-DD). */
export function weekStartOf(iso) {
  const date = parseISO(iso);
  const offset = (date.getDay() + 6) % 7; // T2 = 0 ... CN = 6
  date.setDate(date.getDate() - offset);
  return toISO(date);
}

/** Cộng `days` ngày vào `iso`. */
export function addDays(iso, days) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

/**
 * Gom các buổi của tuần vào đủ 7 cột T2–CN (cột trống vẫn có mặt để lưới đều).
 * Mỗi buổi cần `date` (YYYY-MM-DD) và `startTime`.
 */
export function buildWeekDays(weekStart, items = []) {
  return WEEKDAY_LABELS.map((label, index) => {
    const date = addDays(weekStart, index);
    const sessions = (items || [])
      .filter((item) => item.date === date)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    return { date, label, sessions };
  });
}

/** Nhãn khoảng tuần: "26/10 – 01/11/2026". */
export function weekRangeLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const [sy, sm, sd] = weekStart.split("-");
  const [ey, em, ed] = end.split("-");
  const start = sy === ey ? `${sd}/${sm}` : `${sd}/${sm}/${sy}`;
  return `${start} – ${ed}/${em}/${ey}`;
}

// ---------- Buổi học & nhật ký ----------

/**
 * Trạng thái hiển thị nhật ký buổi học cho học sinh.
 * Học sinh chỉ thấy nhật ký khi gia sư đã công bố (backend trả null nếu chưa).
 * - Buổi đã hoàn thành mà chưa có nhật ký → gia sư chưa gửi.
 * - Buổi chưa/đang diễn ra, vắng, hủy → chưa có.
 */
export function sessionLogState(session) {
  const hasLog = Boolean(session?.logKnowledge || session?.logHomework);
  if (hasLog) return { kind: "ready", label: "" };
  if (session?.status === "COMPLETED") {
    return { kind: "pending", label: "Gia sư chưa gửi nhật ký" };
  }
  return { kind: "none", label: "Chưa có" };
}

/** Sắp lịch sử buổi học giảm dần theo ngày giờ (mới nhất trước). */
export function sortSessionsDesc(sessions = []) {
  return [...(sessions || [])].sort((a, b) => {
    const left = `${a.sessionDate ?? ""} ${a.startTime ?? ""}`;
    const right = `${b.sessionDate ?? ""} ${b.startTime ?? ""}`;
    return right.localeCompare(left);
  });
}

// ---------- Tài liệu ----------

/**
 * Quyết định hành động cho một tài liệu:
 * - `unavailable`: tệp đã gỡ (backend trả MATERIAL_UNAVAILABLE hoặc cờ removed).
 * - `preview`: xem trực tiếp + tải (PDF, ảnh, âm thanh).
 * - `download`: chỉ có nút tải.
 */
export function materialAction(material, access) {
  if (material?.removed || material?.status === "REMOVED" || access?.unavailable) {
    return "unavailable";
  }
  return access?.previewable ? "preview" : "download";
}

/** Backend trả mã lỗi MATERIAL_UNAVAILABLE khi tệp đã gỡ. */
export function isMaterialUnavailableError(error) {
  return error?.code === "MATERIAL_UNAVAILABLE" || error?.status === 410 || error?.status === 404;
}

// ---------- Quiz ----------

export const QUIZ_STATUS_META = {
  ASSIGNED: { label: "Cần làm", tone: "blue" },
  COMPLETED: { label: "Đã hoàn thành", tone: "emerald" },
  EXPIRED: { label: "Quá hạn", tone: "rose" },
};

/** Số câu đã làm / tổng → phần trăm nguyên 0–100. */
export function quizProgressPercent(answered, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((answered / total) * 100));
}

/** Nhãn thay đổi Elo: "+12", "−8", "0". */
export function formatEloChange(change) {
  const value = Math.round(Number(change) || 0);
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

/** Tone Badge cho thay đổi Elo (tăng = emerald, giảm = rose). */
export function eloChangeTone(change) {
  const value = Number(change) || 0;
  if (value > 0) return "emerald";
  if (value < 0) return "rose";
  return "slate";
}

/** Hạn nộp còn bao lâu: trả { label, overdue } để tô màu cảnh báo. */
export function deadlineInfo(deadline, now = Date.now()) {
  if (!deadline) return { label: "Không có hạn nộp", overdue: false };
  const time = Date.parse(deadline);
  if (Number.isNaN(time)) return { label: "Không có hạn nộp", overdue: false };
  const diffMs = time - now;
  if (diffMs < 0) return { label: "Đã quá hạn", overdue: true };
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return { label: "Còn dưới 1 giờ", overdue: false };
  if (hours < 24) return { label: `Còn ${hours} giờ`, overdue: false };
  return { label: `Còn ${Math.floor(hours / 24)} ngày`, overdue: false };
}

/** Sắp bài cần làm: hạn gần nhất trước, bài không hạn xuống cuối. */
export function sortQuizzesByDeadline(quizzes = []) {
  const key = (q) => {
    const time = Date.parse(q?.deadline);
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
  };
  return [...(quizzes || [])].sort((a, b) => key(a) - key(b));
}
