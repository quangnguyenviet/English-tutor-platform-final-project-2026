/**
 * API lớp học của gia sư và lịch dạy thử — khớp backend/API_DESIGN.md mục 3.5 (UC-T08).
 * Base URL lấy từ VITE_API_BASE_URL (file .env.local).
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[classroomApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
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

/** Danh sách lớp học của gia sư, lọc theo trạng thái (bỏ trống để lấy tất cả). */
export function apiGetMyClasses(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(token, `/api/v1/tutors/me/classes${query}`);
}

/** Chi tiết lớp học của gia sư (kèm buổi dạy thử nếu đã thiết lập). */
export function apiGetClassDetail(token, classId) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}`);
}

/**
 * Thiết lập lịch dạy thử cho lớp TRIAL.
 * @param {Object} payload - { sessionDate: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
 *                            teachingMode: "ONLINE" | "AT_HOME", meetingUrl?, location? }
 */
export function apiCreateTrialSession(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/trial-session`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Chỉnh sửa/dời lịch dạy thử khi buổi thử chưa diễn ra. */
export function apiUpdateTrialSession(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/trial-session`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Chốt lịch dạy cố định lần đầu cho lớp ACTIVE (UC-T09).
 * @param {Object} payload - { schedules: [ { dayOfWeek: 1-7, startTime: "HH:mm", endTime: "HH:mm",
 *                                           validFrom: "YYYY-MM-DD", validTo: "YYYY-MM-DD" | null } ] }
 */
export function apiFinalizeSchedule(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/finalize-schedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Cập nhật (ghi đè) lịch dạy cố định của lớp ACTIVE. Cùng shape payload với apiFinalizeSchedule. */
export function apiUpdateClassSchedules(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/schedules`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Tạo buổi học chính thức on-demand theo lịch cố định (idempotent).
 * @param {Object} payload - { sessionDate: "YYYY-MM-DD", startTime?: "HH:mm" (bắt buộc khi ngày có nhiều ca) }
 */
export function apiCreateSession(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/sessions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Lattice tuần (occurrences): danh sách ô SESSION / EXCEPTION / OCCURRENCE
 * trong [weekStart, weekStart+6] (kế hoạch class-sessions mục 4.1).
 */
export function apiGetClassSchedule(token, classId, weekStart) {
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/schedule?weekStart=${encodeURIComponent(weekStart)}`,
  );
}

/**
 * Ghi ngoại lệ (overlay) cho 1 ô ảo của ca cố định (mục 4.2).
 * @param {Object} payload - { scheduleId, exceptionDate, exceptionType: "CANCELLED" | "RESCHEDULED" | "MODIFIED",
 *                            newDate?, newStartTime?, newEndTime?, newTeachingMode?, newMeetingUrl?, newLocation?, reason? }
 */
export function apiCreateException(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/exceptions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Gỡ ngoại lệ của 1 ô (mục 4.3). */
export function apiDeleteException(token, classId, scheduleId, exceptionDate) {
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/exceptions/${encodeURIComponent(scheduleId)}/${encodeURIComponent(exceptionDate)}`,
    { method: "DELETE" },
  );
}

/** Danh sách buổi học thật của lớp (ROW_NUMBER ổn định khi lọc, mục 4.4). */
export function apiGetClassSessions(token, classId, { status = "", order = "asc" } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("order", order);
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/sessions?${params.toString()}`,
  );
}

/** Chi tiết buổi học (mục 4.5) — học sinh thấy nhật ký nguyên văn khi không null. */
export function apiGetSession(token, sessionId) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}`);
}

/** Sửa / dời buổi học thật, chỉ trạng thái SCHEDULED (mục 4.6). */
export function apiUpdateSession(token, sessionId, payload) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Đổi trạng thái buổi học thật theo state machine (mục 4.7). */
export function apiSetSessionStatus(token, sessionId, status) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

/** Lưu / cập nhật nhật ký buổi học (mục 4.8). */
export function apiUpdateSessionLog(token, sessionId, payload) {
  return request(token, `/api/v1/sessions/${encodeURIComponent(sessionId)}/log`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export const CLASS_STATUS_META = {
  TRIAL: { label: "Đang dạy thử", tone: "violet" },
  ACTIVE: { label: "Đang hoạt động", tone: "emerald" },
  COMPLETED: { label: "Đã kết thúc", tone: "slate" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

export const TEACHING_MODE_LABELS = {
  ONLINE: "Online",
  AT_HOME: "Tại nhà",
};

export const SESSION_STATUS_META = {
  SCHEDULED: { label: "Đã lên lịch", tone: "blue" },
  IN_PROGRESS: { label: "Đang diễn ra", tone: "amber" },
  COMPLETED: { label: "Đã hoàn thành", tone: "emerald" },
  ABSENT: { label: "Vắng mặt", tone: "amber" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

/** Nhãn + tone ngoại lệ lịch dạy (overlay, mục 4.2). */
export const EXCEPTION_TYPE_META = {
  CANCELLED: { label: "Đã hủy", tone: "rose" },
  RESCHEDULED: { label: "Dời sang", tone: "amber" },
  MODIFIED: { label: "Đã điều chỉnh", tone: "sky" },
};

/** "2026-10-28" → "28/10/2026" (không qua Date để tránh lệch múi giờ). */
export function formatSessionDate(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 3) return String(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** "19:00" hoặc "19:00:00" → "19:00". */
export function formatSessionTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

/** Nhãn thứ trong tuần theo ISO backend: 1 = Thứ 2 ... 7 = Chủ nhật. */
export const DAY_OF_WEEK_LABELS = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

export function dayOfWeekLabel(dayOfWeek) {
  return DAY_OF_WEEK_LABELS[dayOfWeek] || `Thứ ${dayOfWeek}`;
}

/** Ngày hiện tại dạng "YYYY-MM-DD" (theo máy client, không qua Date.now ISO để tránh lệch múi giờ). */
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Chuẩn hóa buổi dạy thử từ backend sang model hiển thị. */
export function mapTrialSession(item) {
  if (!item) return null;
  return {
    ...item,
    dateLabel: formatSessionDate(item.sessionDate),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    statusLabel: SESSION_STATUS_META[item.status]?.label || item.status,
    statusTone: SESSION_STATUS_META[item.status]?.tone || "slate",
    modeLabel: TEACHING_MODE_LABELS[item.teachingMode] || item.teachingMode,
  };
}

/** Map một lớp học của gia sư sang model hiển thị. */
export function mapClassSummary(item) {
  const meta = CLASS_STATUS_META[item?.status] || { label: item?.status || "", tone: "slate" };
  return {
    classId: item?.classId,
    className: item?.className || item?.studentName || "Lớp học",
    studentName: item?.studentName || "",
    teachingMode: item?.teachingMode || "",
    modeLabel: TEACHING_MODE_LABELS[item?.teachingMode] || item?.teachingMode || "",
    pricePerSession: item?.pricePerSession,
    status: item?.status || "",
    statusLabel: meta.label,
    statusTone: meta.tone,
    createdAt: item?.createdAt || null,
    trialSession: mapTrialSession(item?.trialSession),
  };
}

/** Chuẩn hóa một ca dạy cố định (ScheduleInfo) sang model hiển thị. */
export function mapScheduleInfo(item) {
  if (!item) return null;
  return {
    dayOfWeek: item.dayOfWeek,
    startTime: formatSessionTime(item.startTime),
    endTime: formatSessionTime(item.endTime),
    validFrom: item.validFrom || null,
    validTo: item.validTo || null,
  };
}

/** Map chi tiết lớp học sang model hiển thị. */
export function mapClassDetail(item) {
  const schedules = Array.isArray(item?.schedules)
    ? item.schedules.map(mapScheduleInfo).filter(Boolean)
    : [];
  return {
    ...mapClassSummary(item),
    activeFrom: item?.activeFrom || null,
    activeFromLabel: item?.activeFrom ? formatSessionDate(item.activeFrom) : "",
    school: item?.school || "",
    grade: item?.grade || "",
    learningGoal: item?.learningGoal || "",
    schedules,
    hasSchedules: schedules.length > 0,
    sessionDates: Array.isArray(item?.sessionDates) ? item.sessionDates : [],
    todaySlots: Array.isArray(item?.todaySlots)
      ? item.todaySlots.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: formatSessionTime(slot.startTime),
          endTime: formatSessionTime(slot.endTime),
        }))
      : [],
  };
}

/** Chuẩn hóa thông tin ngoại lệ (overlay) của 1 ô lattice (mục 4.1). */
export function mapExceptionInfo(item) {
  if (!item) return null;
  const meta = EXCEPTION_TYPE_META[item.type] || { label: item.type, tone: "slate" };
  const hasNewTime = item.newStartTime && item.newEndTime;
  return {
    ...item,
    typeLabel: meta.label,
    typeTone: meta.tone,
    newDateLabel: item.newDate ? formatSessionDate(item.newDate) : "",
    timeLabel: hasNewTime
      ? `${formatSessionTime(item.newStartTime)} - ${formatSessionTime(item.newEndTime)}`
      : "",
    modeLabel: item.newTeachingMode
      ? TEACHING_MODE_LABELS[item.newTeachingMode] || item.newTeachingMode
      : "",
  };
}

/**
 * Chuẩn hóa 1 ô lattice tuần (mục 4.1): gộp dateLabel/timeLabel và — nếu ô
 * có buổi học thật (source = SESSION) — statusLabel/statusTone từ SESSION_STATUS_META.
 */
export function mapOccurrence(item) {
  if (!item) return null;
  const statusMeta = item.session
    ? SESSION_STATUS_META[item.session.status] || { label: item.session.status, tone: "slate" }
    : null;
  return {
    ...item,
    dateLabel: formatSessionDate(item.date),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    exception: mapExceptionInfo(item.exception),
    session: item.session
      ? {
          ...item.session,
          statusLabel: statusMeta.label,
          statusTone: statusMeta.tone,
        }
      : null,
  };
}

/** Chuẩn hóa 1 buổi học trong danh sách (mục 4.4). */
export function mapSessionListItem(item) {
  if (!item) return null;
  const meta = SESSION_STATUS_META[item.status] || { label: item.status, tone: "slate" };
  return {
    ...item,
    dateLabel: formatSessionDate(item.sessionDate),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    modeLabel: TEACHING_MODE_LABELS[item.teachingMode] || item.teachingMode || "",
    statusLabel: meta.label,
    statusTone: meta.tone,
  };
}

/** Chuẩn hóa chi tiết buổi học (mục 4.5). */
export function mapSessionDetail(item) {
  if (!item) return null;
  const meta = SESSION_STATUS_META[item.status] || { label: item.status, tone: "slate" };
  return {
    ...item,
    dateLabel: formatSessionDate(item.sessionDate),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    modeLabel: TEACHING_MODE_LABELS[item.teachingMode] || item.teachingMode || "",
    statusLabel: meta.label,
    statusTone: meta.tone,
  };
}
