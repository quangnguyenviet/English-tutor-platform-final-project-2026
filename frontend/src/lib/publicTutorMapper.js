const GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const MODE_LABELS = {
  ONLINE: "Dạy trực tuyến",
  AT_HOME: "Dạy tại nhà",
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

  return {
    id: String(profile.tutorId),
    name: profile.fullName || "Gia sư EnglishPath",
    initials: getInitials(profile.fullName),
    avatarUrl: profile.avatarUrl || "",
    gender: GENDER_LABELS[profile.gender] || profile.gender || "",
    university: profile.university || "Thông tin đang cập nhật",
    educationStatus: profile.educationStatus,
    experienceYears: profile.experienceYears,
    bio: profile.bio || "Gia sư đã được EnglishPath thẩm định hồ sơ.",
    province: firstArea.province || "",
    district: firstArea.district || "",
    location: [firstArea.district, firstArea.province].filter(Boolean).join(", ") || "Dạy trực tuyến",
    serviceAreas,
    subjects: specialties.map((item) => item.specialty).filter(Boolean),
    specialization: specialties.map((item) => item.specialty).filter(Boolean),
    gradeLevels: [...new Set(specialties.map((item) => item.gradeLevel).filter(Boolean))],
    highlights: credentials.map((item) => [item.title, item.score].filter(Boolean).join(" ")).filter(Boolean),
    certificates: credentials.map((item) => ({
      name: item.title,
      score: item.score,
      type: item.type,
      fileUrl: item.fileUrl,
    })),
    attachedImages: credentials
      .filter((item) => item.fileUrl)
      .map((item) => ({ id: item.id, title: item.title, category: item.type, fileUrl: item.fileUrl })),
    learningMode: mode,
    learningModeLabel: modeLabel,
    availabilities: profile.availabilities || [],
    selfIntroduction: null,
    teachingAchievements: [],
    awards: [],
    taughtClasses: [],
  };
}
