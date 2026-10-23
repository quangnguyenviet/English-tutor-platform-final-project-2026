const BASE = import.meta.env.VITE_API_BASE_URL;

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : {};
}

async function request(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  const data = await readJson(response);

  if (!response.ok) {
    const error = new Error(data.message || `Không thể tải dữ liệu lớp học (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data.result ?? data;
}

/**
 * Lấy lớp đang mở có phân trang phía server (page bắt đầu từ 0).
 * @param {Object} [params] - page, size, teachingMode (ONLINE|AT_HOME), gradeGroup, sort (newest|fee_asc|fee_desc)
 * @returns {Promise<{items: Object[], page: number, size: number, totalItems: number, totalPages: number}>}
 */
export async function apiGetPublicClasses(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const result = await request(`/api/v1/public/classes?${query.toString()}`);
  return {
    items: Array.isArray(result.items) ? result.items : [],
    page: result.page ?? 0,
    size: result.size ?? 0,
    totalItems: result.totalItems ?? 0,
    totalPages: result.totalPages ?? 0,
  };
}

export function apiGetPublicClass(classRequestId) {
  return request(`/api/v1/public/classes/${encodeURIComponent(classRequestId)}`);
}

const GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export function mapPublicClass(item) {
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const gender = GENDER_LABELS[item.studentGender] || item.studentGender || "";
  const grade = item.gradeLevel || "Trình độ đang cập nhật";

  return {
    id: String(item.id),
    code: item.requestCode,
    subject: item.classRequirement,
    gradeLevel: grade,
    studentGender: gender,
    teachingMode: item.teachingMode === "ONLINE" ? "Online" : "Tại nhà",
    address: item.generalLocation || "Trao đổi sau khi được kết nối",
    feePerSession: Number(item.pricePerSession) || 0,
    postedDate: createdAt && !Number.isNaN(createdAt.valueOf())
      ? new Intl.DateTimeFormat("vi-VN").format(createdAt)
      : "Đang cập nhật",
    createdAt: createdAt?.valueOf() || 0,
    schedule: item.preferredSchedule || "Trao đổi với trung tâm",
    requirements: item.tutorRequirement || "",
    teacherRequirement: item.tutorRequirement || "Không có yêu cầu riêng",
    studentInfo: [gender, grade, item.school].filter(Boolean).join(" - "),
    learningGoal: item.learningGoal || item.classRequirement,
  };
}
