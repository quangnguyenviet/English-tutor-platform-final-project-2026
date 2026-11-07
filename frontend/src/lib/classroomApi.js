/**
 * API lớp học của gia sư (V16) — lịch cố định, ca thử (classes.trial_*),
 * nhật ký dạy học (teaching_logs) trên lưới lịch, và bài giảng (lessons —
 * tab riêng, tài liệu + quiz nhúng vào lesson). Khớp backend module
 * classroom/quiz (API_DESIGN.md mục 3.5–3.7).
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
 * Thiết lập / cập nhật ca dạy thử (V16: 6 cột trial_* trên classes, lớp TRIAL).
 * @param {Object} payload - { sessionDate: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
 *                            teachingMode: "ONLINE" | "AT_HOME", meetingUrl?, location? }
 */
export function apiUpsertTrialSlot(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/trial`, {
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
 * Lattice tuần (occurrences): danh sách ô ca cố định + overlay EXCEPTION +
 * TeachingLogMini + ca thử (source TRIAL) trong [weekStart, weekStart+6]
 * (kế hoạch class-sessions mục 4.1).
 */
export function apiGetClassSchedule(token, classId, weekStart) {
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/schedule?weekStart=${encodeURIComponent(weekStart)}`,
  );
}

/**
 * Ghi ngoại lệ (overlay) cho 1 ô ảo của ca cố định (mục 4.2).
 * @param {Object} payload - { scheduleId, exceptionDate, exceptionType: "CANCELLED" | "RESCHEDULED",
 *                            newDate?, newStartTime?, newEndTime?, reason? }
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

// -------------------------------------------------- TEACHING LOG (trên lưới lịch, V16)

/**
 * Ghi / sửa nhật ký dạy học cho 1 ô ca (upsert theo class + log_date + start_time).
 * Lần đầu lưu nội dung → thông báo học sinh (firstPublish = true).
 * @param {Object} payload - { logDate: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
 *                            knowledge?, homework? }
 */
export function apiSaveTeachingLog(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/logs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Xóa 1 nhật ký dạy học. */
export function apiDeleteTeachingLog(token, classId, logId) {
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/logs/${encodeURIComponent(logId)}`,
    { method: "DELETE" },
  );
}

/** Đọc nhật ký của 1 ô ca (trống nếu chưa ghi). */
export function apiGetTeachingLog(token, classId, logDate, startTime) {
  const params = new URLSearchParams();
  params.set("logDate", logDate);
  params.set("startTime", startTime);
  return request(
    token,
    `/api/v1/classes/${encodeURIComponent(classId)}/logs?${params.toString()}`,
  );
}

// -------------------------------------------------- BÀI GIẢNG (lessons, tab riêng)

/** Tạo bài giảng mới cho lớp (driver nhúng, không lên lịch). */
export function apiCreateLesson(token, classId, payload) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/lessons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Danh sách bài giảng của lớp (ROW_NUMBER theo thời gian tạo). */
export function apiGetClassLessons(token, classId) {
  return request(token, `/api/v1/classes/${encodeURIComponent(classId)}/lessons`);
}

/** Chi tiết bài giảng (tiêu đề, trạng thái, tài liệu, số quiz). */
export function apiGetLesson(token, lessonId) {
  return request(token, `/api/v1/lessons/${encodeURIComponent(lessonId)}`);
}

/** Sửa tiêu đề và/hoặc ẩn/hiện bài giảng (PUBLISHED | HIDDEN). */
export function apiUpdateLesson(token, lessonId, payload) {
  return request(token, `/api/v1/lessons/${encodeURIComponent(lessonId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Xóa bài giảng (CASCADE tự xóa tài liệu + quiz). */
export function apiDeleteLesson(token, lessonId) {
  return request(token, `/api/v1/lessons/${encodeURIComponent(lessonId)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------- TÀI LIỆU BÀI GIẢNG (FR-12, FR-21)

/**
 * Helper multipart — upload tệp (không phải JSON). Dùng cùng envelope
 * {@code {code,message,result}} với {@link request}; trả về {@code result}.
 * KHÔNG set Content-Type (trình duyệt tự gắn boundary cho FormData).
 */
async function requestMultipart(token, path, file, field = "file") {
  const form = new FormData();
  form.append(field, file, file.name || "file");

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Accept: "application/json", ...bearerHeader(token) },
      body: form,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  const data = await readJson(res);
  if (!res.ok) {
    const error = new Error(extractErrorMessage(data, `Lỗi ${res.status} khi tải tệp lên`));
    error.status = res.status;
    throw error;
  }
  return data.result ?? data;
}

/**
 * Upload tài liệu bài giảng (FR-12) — PDF, DOCX, ảnh, âm thanh; tối đa 20 MB.
 * @returns {Promise<Object>} item {@code lesson_materials} vừa tạo
 */
export function apiUploadLessonMaterial(token, lessonId, file) {
  return requestMultipart(
    token,
    `/api/v1/lessons/${encodeURIComponent(lessonId)}/materials`,
    file,
  );
}

/** Gỡ tài liệu bài giảng (FR-12). */
export function apiDeleteLessonMaterial(token, lessonId, materialId) {
  return request(
    token,
    `/api/v1/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}`,
    { method: "DELETE" },
  );
}

/** Link tải an toàn (ký sẵn 10 phút) cho tài liệu bài giảng (FR-21). */
export function apiGetMaterialAccessUrl(token, materialId) {
  return request(
    token,
    `/api/v1/materials/${encodeURIComponent(materialId)}/access-url`,
  );
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

/** Nhãn định dạng tài liệu buổi học (PDF / DOCX / IMAGE / AUDIO). */
export const FILE_TYPE_LABELS = {
  PDF: "Tài liệu PDF",
  DOCX: "Tài liệu Word",
  IMAGE: "Hình ảnh",
  AUDIO: "Âm thanh",
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

/** Thứ 2 làm mốc đầu tuần (ISO dayOfWeek 1). */
export function startOfWeek(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const isoDay = date.getDay() || 7; // 0 (Chủ nhật) → 7
  date.setDate(date.getDate() - isoDay + 1);
  return date;
}

/** Date → "YYYY-MM-DD" (theo múi giờ máy client). */
export function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Ngày hiện tại dạng "YYYY-MM-DD" (theo máy client, không qua Date.now ISO để tránh lệch múi giờ). */
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Nhãn tương đối so với hôm nay cho 1 ngày "YYYY-MM-DD":
 * "Hôm nay", "Hôm qua", "Ngày mai", "Sau N ngày", "N ngày trước".
 */
export function relativeDayLabel(dateISO) {
  if (!dateISO) return "";
  const today = todayISO();
  if (String(dateISO) === today) return "Hôm nay";
  const [y, m, d] = String(dateISO).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const diff = Math.round((new Date(y, m - 1, d) - new Date(ty, tm - 1, td)) / 86400000);
  if (diff === -1) return "Hôm qua";
  if (diff === 1) return "Ngày mai";
  if (diff > 1) return `Sau ${diff} ngày`;
  return `${Math.abs(diff)} ngày trước`;
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
    parentName: item?.parentName || "",
    parentPhone: item?.parentPhone || "",
    parentEmail: item?.parentEmail || "",
    parentAddress: item?.parentAddress || "",
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
  };
}

/**
 * Chuẩn hóa 1 ô lattice tuần (mục 4.1, V16): ô ca cố định (OCCURRENCE) +
 * overlay ngoại lệ (EXCEPTION) + ca thử (TRIAL), kèm TeachingLogMini nếu
 * ô đã có nhật ký. Gộp dateLabel/timeLabel.
 */
export function mapOccurrence(item) {
  if (!item) return null;
  return {
    ...item,
    dateLabel: formatSessionDate(item.date),
    timeLabel: `${formatSessionTime(item.startTime)} - ${formatSessionTime(item.endTime)}`,
    modeLabel: item.teachingMode ? TEACHING_MODE_LABELS[item.teachingMode] || item.teachingMode : "",
    exception: mapExceptionInfo(item.exception),
    log: item.log ? { ...item.log } : null,
    session: item.session ? { ...item.session } : null,
  };
}

/**
 * Chuẩn hóa 1 item bài giảng (danh sách + chi tiết, vì LessonListItem đã gồm
 * materials). createdAtLabel "dd/MM/yyyy" cho created_at.
 */
export function mapLessonListItem(item) {
  if (!item) return null;
  return {
    ...item,
    materials: Array.isArray(item.materials) ? item.materials.map(mapLessonMaterial) : [],
    createdAtLabel: item.createdAt ? formatSessionDate(String(item.createdAt).slice(0, 10)) : "",
  };
}

/** Chuẩn hóa chi tiết bài giảng — kèm danh sách tài liệu đính kèm. */
export function mapLessonDetail(item) {
  if (!item) return null;
  return {
    ...item,
    materials: Array.isArray(item.materials) ? item.materials.map(mapLessonMaterial) : [],
  };
}

/** "12345" (bytes) → "0.1 MB" / "512 KB" / "10 B". */
export function formatBytes(value) {
  if (value == null) return "";
  const bytes = Number(value);
  if (Number.isNaN(bytes)) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Chuẩn hóa 1 tài liệu bài giảng (bảng lesson_materials). */
export function mapLessonMaterial(item) {
  if (!item) return null;
  return {
    ...item,
    typeLabel: FILE_TYPE_LABELS[item.fileType] || item.fileType || "Tệp tin",
    sizeLabel: formatBytes(item.fileSize),
  };
}

/** Nhãn trạng thái bài giảng (PUBLISHED | HIDDEN). */
export const LESSON_STATUS_META = {
  PUBLISHED: { label: "Đang hiển thị", tone: "emerald" },
  HIDDEN: { label: "Đã ẩn", tone: "slate" },
};

