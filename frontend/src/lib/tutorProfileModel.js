/**
 * tutorProfileModel.js
 * Mapper, validate, build payload và field-lock logic cho form hồ sơ gia sư.
 *
 * Toàn bộ là pure functions — không phụ thuộc DOM, không gọi API.
 * Dùng cho trang /tutor/profile (xem / sửa / gửi duyệt / hủy duyệt).
 */

// ── Trạng thái hồ sơ ────────────────────────────────────────────────────────
export const PROFILE_STATUS = {
  INCOMPLETE: "INCOMPLETE",
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
};

/**
 * Các trường BỊ KHÓA khi profileStatus = ACTIVE (không được sửa, backend cũng bỏ qua).
 * Tham chiếu plan.md §2.3.
 */
export const LOCKED_FIELDS_WHEN_ACTIVE = [
  "fullName",
  "dateOfBirth",
  "gender",
  "hometown",
  "university",
];

/**
 * Trường bắt buộc khi chỉnh sửa đầy đủ (INCOMPLETE / REJECTED).
 */
export const REQUIRED_FIELDS = [
  "fullName",
  "dateOfBirth",
  "gender",
  "phone",
  "address",
  "university",
  "educationStatus",
  "experienceYears",
  "bio",
];

// ── Trạng thái chỉnh sửa ────────────────────────────────────────────────────

/**
 * Trả về chế độ chỉnh sửa cho phép theo profileStatus:
 *  - "full"      : sửa tất cả trường (INCOMPLETE, REJECTED)
 *  - "restricted": chỉ sửa whitelist (ACTIVE)
 *  - "locked"    : không sửa được (PENDING, INACTIVE)
 *
 * @param {string} profileStatus
 * @returns {"full" | "restricted" | "locked"}
 */
export function getEditMode(profileStatus) {
  switch (profileStatus) {
    case PROFILE_STATUS.INCOMPLETE:
    case PROFILE_STATUS.REJECTED:
      return "full";
    case PROFILE_STATUS.ACTIVE:
      return "restricted";
    case PROFILE_STATUS.PENDING:
    case PROFILE_STATUS.INACTIVE:
    default:
      return "locked";
  }
}

/**
 * Kiểm tra một trường có bị khóa khi ACTIVE hay không.
 * @param {string} fieldName
 * @param {string} profileStatus
 * @returns {boolean}
 */
export function isFieldLocked(fieldName, profileStatus) {
  if (profileStatus !== PROFILE_STATUS.ACTIVE) return false;
  return LOCKED_FIELDS_WHEN_ACTIVE.includes(fieldName);
}

// ── Mapper API ⇄ Form ───────────────────────────────────────────────────────

/**
 * Trả về form state trống (mặc định).
 * @returns {Object}
 */
export function emptyForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    dateOfBirth: "",
    gender: "",
    hometown: "",
    address: "",
    university: "",
    educationStatus: "",
    experienceYears: 0,
    bio: "",
    videoUrl: "",
    serviceAreas: [],
    specialties: [],
    prices: [],
    availabilities: [],
    credentials: [],
    profileStatus: "",
    rejectionReason: "",
    reviewedAt: "",
    updatedAt: "",
    userId: undefined,
    tutorId: undefined,
  };
}

/**
 * Map dữ liệu API (TutorProfileResponse) → form state dùng ở UI.
 * Các mảng con từ backend có kèm `id` — bỏ qua id, giữ chỉ dữ liệu form.
 *
 * @param {Object|null|undefined} api - DTO từ backend
 * @returns {Object} form state
 */
export function mapApiToForm(api) {
  if (!api) return emptyForm();

  return {
    // Thông tin cá nhân & liên hệ (từ User + Tutor)
    fullName: api.fullName || "",
    email: api.email || "",
    phone: api.phone || "",
    avatarUrl: api.avatarUrl || "",

    dateOfBirth: api.dateOfBirth || "", // đã là ISO "YYYY-MM-DD" từ backend
    gender: api.gender || "",
    hometown: api.hometown || "",
    address: api.address || "",
    university: api.university || "",

    // Trình độ & kinh nghiệm
    educationStatus: api.educationStatus || "",
    experienceYears: api.experienceYears ?? 0,
    bio: api.bio || "",
    videoUrl: api.videoUrl || "",

    // Mảng con — bỏ id backend, giữ dữ liệu form
    serviceAreas: (api.serviceAreas || []).map((sa) => ({
      province: sa.province || "",
      district: sa.district || "",
    })),
    specialties: (api.specialties || []).map((sp) => ({
      specialty: sp.specialty || "",
      gradeLevel: sp.gradeLevel || "",
    })),
    prices: (api.prices || []).map((pr) => ({
      teachingMode: pr.teachingMode || "",
      pricePerSession: pr.pricePerSession ?? 0,
      program: pr.program || "",
    })),
    availabilities: (api.availabilities || []).map((av) => ({
      dayOfWeek: av.dayOfWeek ?? 1,
      timeSlot: av.timeSlot || "",
    })),
    credentials: (api.credentials || []).map((cr) => ({
      title: cr.title || "",
      type: cr.type || "",
      score: cr.score || "",
      fileUrl: cr.fileUrl || "",
    })),

    // Meta chỉ đọc
    profileStatus: api.profileStatus || "",
    rejectionReason: api.rejectionReason || "",
    reviewedAt: api.reviewedAt || "",
    updatedAt: api.updatedAt || "",
    userId: api.userId,
    tutorId: api.tutorId,
  };
}

/**
 * Build payload gửi lên API upsert (POST /api/v1/tutors/me/profile).
 * Luôn gửi đủ 5 mảng (serviceAreas, specialties, prices, availabilities, credentials),
 * kể cả rỗng `[]`.
 *
 * Khi profileStatus = ACTIVE: loại bỏ các trường bị khóa (fullName, dateOfBirth,
 * gender, hometown, university) khỏi payload — backend cũng sẽ bỏ qua, nhưng FE
 * không gửi để tránh nhầm lẫn (defense in depth).
 *
 * @param {Object} form - form state
 * @param {string} profileStatus - trạng thái hiện tại của hồ sơ
 * @returns {Object} payload gửi lên backend
 */
export function buildUpsertPayload(form, profileStatus) {
  const isActive = profileStatus === PROFILE_STATUS.ACTIVE;

  const payload = {
    // Trường được sửa ở mọi chế độ (trừ khi ACTIVE thì bỏ qua trường khóa)
    ...(!isActive
      ? {
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          hometown: form.hometown || null,
          university: form.university || null,
        }
      : {}),
    phone: form.phone,
    avatarUrl: form.avatarUrl,
    address: form.address,
    educationStatus: form.educationStatus,
    experienceYears: Number(form.experienceYears) || 0,
    bio: form.bio,
    videoUrl: form.videoUrl,

    // 5 mảng con — luôn gửi đủ, kể cả []
    serviceAreas: Array.isArray(form.serviceAreas) ? form.serviceAreas : [],
    specialties: Array.isArray(form.specialties) ? form.specialties : [],
    prices: Array.isArray(form.prices) ? form.prices : [],
    availabilities: Array.isArray(form.availabilities)
      ? form.availabilities
      : [],
    credentials: Array.isArray(form.credentials) ? form.credentials : [],
  };

  return payload;
}

// ── Validate ────────────────────────────────────────────────────────────────

const PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;

/**
 * Validate form trước khi lưu.
 * Trả về object { [fieldName]: errorMessage }, rỗng nếu hợp lệ.
 *
 * @param {Object} form
 * @param {string} profileStatus
 * @returns {Object}
 */
export function validate(form, profileStatus) {
  const errors = {};
  const isFullEdit =
    profileStatus === PROFILE_STATUS.INCOMPLETE ||
    profileStatus === PROFILE_STATUS.REJECTED;

  // Helper: gán lỗi nếu chưa có
  function setError(field, msg) {
    if (!errors[field]) errors[field] = msg;
  }

  // ---- Trường bắt buộc cho full edit (INCOMPLETE / REJECTED) ----
  if (isFullEdit) {
    if (!form.fullName?.trim()) setError("fullName", "Họ và tên là bắt buộc");
    if (!form.dateOfBirth)
      setError("dateOfBirth", "Ngày sinh là bắt buộc");
    if (!form.gender) setError("gender", "Giới tính là bắt buộc");
    if (!form.address?.trim())
      setError("address", "Địa chỉ là bắt buộc");
    if (!form.university?.trim())
      setError("university", "Trường đại học là bắt buộc");
    if (!form.educationStatus)
      setError("educationStatus", "Trạng thái học vấn là bắt buộc");
    if (
      form.experienceYears == null ||
      Number(form.experienceYears) < 0
    )
      setError("experienceYears", "Số năm kinh nghiệm phải >= 0");
    if (!form.bio?.trim()) setError("bio", "Giới thiệu là bắt buộc");
  }

  // ---- Trường luôn bắt buộc (có thể sửa ở mọi chế độ chỉnh sửa) ----
  const rawPhone = String(form.phone || "").replace(/\s/g, "");
  if (!rawPhone) {
    setError("phone", "Số điện thoại là bắt buộc");
  } else if (!PHONE_REGEX.test(rawPhone)) {
    setError("phone", "Số điện thoại không hợp lệ");
  }

  if (
    form.experienceYears == null ||
    Number(form.experienceYears) < 0
  ) {
    setError("experienceYears", "Số năm kinh nghiệm phải >= 0");
  }

  return errors;
}