const GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const MODE_LABELS = {
  ONLINE: "Dạy trực tuyến",
  AT_HOME: "Dạy tại nhà",
};

const EDUCATION_STATUS_LABELS = {
  STUDENT: "Sinh viên",
  GRADUATED: "Đã tốt nghiệp",
  LECTURER: "Giảng viên",
};

function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "GS";
}

/**
 * Chuẩn hóa response công khai của backend về shape dùng bởi TutorCard và trang chi tiết.
 * Lưu ý: Học phí không công khai cho phụ huynh/khách (chỉ Lễ tân, Admin và chính Gia sư xem được).
 */
export function mapPublicTutor(profile) {
  const serviceAreas = profile.serviceAreas || [];
  const specialties = profile.specialties || [];
  const credentials = profile.credentials || [];
  const modes = [...new Set((profile.teachingModes || []).filter(Boolean))];
  const firstArea = serviceAreas[0] || {};
  const mode = modes.length === 0 ? "both" : modes.length > 1 ? "both" : modes[0] === "ONLINE" ? "online" : "offline";
  const modeLabel = modes.length > 1
    ? "Trực tuyến & tại nhà"
    : MODE_LABELS[modes[0]] || "Trao đổi với gia sư";

  // Danh sách chứng chỉ & minh chứng
  const certificates = credentials.map((item) => ({
    id: item.id,
    name: item.title,
    score: item.score,
    type: item.type === "ACHIEVEMENT" ? "Thành tích" : "Chứng chỉ",
    rawType: item.type,
    fileUrl: item.fileUrl,
  }));

  const highlights = credentials
    .map((item) => [item.title, item.score].filter(Boolean).join(" "))
    .filter(Boolean);

  const subjects = [...new Set(specialties.map((item) => item.specialty).filter(Boolean))];
  const gradeLevels = [...new Set(specialties.map((item) => item.gradeLevel).filter(Boolean))];

  return {
    id: String(profile.tutorId),
    name: profile.fullName || "Gia sư EnglishPath",
    initials: getInitials(profile.fullName),
    avatarUrl: profile.avatarUrl || "",
    gender: GENDER_LABELS[profile.gender] || profile.gender || "",
    university: profile.university || "Thông tin đang cập nhật",
    educationStatus: profile.educationStatus,
    educationStatusLabel: EDUCATION_STATUS_LABELS[profile.educationStatus] || profile.educationStatus || "",
    experienceYears: profile.experienceYears,
    bio: profile.bio || "Gia sư đã được EnglishPath thẩm định hồ sơ.",
    hometown: profile.hometown || "",
    address: profile.address || "",
    videoUrl: profile.videoUrl || "",
    province: firstArea.province || "",
    district: firstArea.district || "",
    location: [firstArea.district, firstArea.province].filter(Boolean).join(", ")
      || profile.address
      || "Dạy trực tuyến",
    serviceAreas,
    specialties,
    subjects,
    specialization: subjects,
    gradeLevels,
    highlights,
    certificates,
    attachedImages: credentials
      .filter((item) => item.fileUrl)
      .map((item) => ({
        id: item.id,
        title: item.title,
        score: item.score,
        category: item.type === "ACHIEVEMENT" ? "Thành tích" : "Chứng chỉ",
        fileUrl: item.fileUrl,
      })),
    learningMode: mode,
    learningModeLabel: modeLabel,
    availabilities: profile.availabilities || [],
  };
}
