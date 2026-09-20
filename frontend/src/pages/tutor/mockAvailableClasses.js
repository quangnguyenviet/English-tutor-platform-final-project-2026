// Data store cho Sàn Lớp Học Cần Gia Sư (Tutor Available Classes)
const STORAGE_KEY = "available_tutor_classes_v2";

export const locationData = {
  "Hà Nội": ["Cầu Giấy", "Đống Đa", "Thanh Xuân", "Ba Đình", "Hai Bà Trưng", "Hoàn Kiếm", "Nam Từ Liêm", "Bắc Từ Liêm"],
  "TP. Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 7", "Quận 10", "Bình Thạnh", "Tân Bình", "Thủ Đức", "Gò Vấp"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Cẩm Lệ"],
};

const initialAvailableClasses = [
  {
    id: "LH-1029",
    title: "Tiếng Anh Lớp 8 - Luyện Thi HSG & Củng Cố Ngữ Pháp",
    subject: "Tiếng Anh",
    gradeCategory: "Lớp 8",
    city: "Hà Nội",
    district: "Cầu Giấy",
    addressDetail: "Đường Nguyễn Chánh, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
    teachingMode: "Offline",
    sessionsPerWeek: 2,
    durationPerSession: "90 phút",
    scheduleType: "fixed",
    schedule: "Thứ 3 & Thứ 5 (19:00 - 20:30)",
    studentAge: 14,
    studentGender: "Nam",
    studentLevel: "Khá (Học sinh lớp 8 trường THCS Cầu Giấy)",
    studentGoal: "Củng cố ngữ pháp chuyên sâu, giải đề thi HSG Cấp Quận và hướng tới thi Chuyên Anh Cấp 3",
    tutorTypeRequirement: "Giáo viên",
    tutorGenderRequirement: "Không yêu cầu",
    requirements: "Gia sư có điểm thi Đại học Tiếng Anh >= 9.0 hoặc IELTS >= 7.0, ưu tiên cựu học sinh trường Chuyên.",
    additionalNotes: "Bé ngoan, tự giác học nhưng cần người định hướng phương pháp giải bài thi chuẩn.",
    tuitionType: "fixed",
    tuition: 250000,
    classFeeRate: "30% học phí tháng đầu (Hạn đóng 30 ngày)",
    postedAt: "10 phút trước",
    badges: ["urgent", "high_tuition"],
    applied: false,
  },
  {
    id: "LH-1030",
    title: "Luyện Thi IELTS Academic (Target 6.5+) Cho Sinh Viên",
    subject: "IELTS",
    gradeCategory: "IELTS",
    city: "TP. Hồ Chí Minh",
    district: "Quận 10",
    addressDetail: "Học Online qua Zoom / Meet",
    teachingMode: "Online",
    sessionsPerWeek: 3,
    durationPerSession: "120 phút",
    scheduleType: "fixed",
    schedule: "Thứ 2, 4, 6 (20:00 - 22:00)",
    studentAge: 20,
    studentGender: "Nữ",
    studentLevel: "Hiện tại Overall 5.0 (Listening: 5.5, Speaking: 4.5)",
    studentGoal: "Tăng band Speaking & Writing từ 4.5 lên 6.5 để chuẩn bị nộp hồ sơ tốt nghiệp đại học.",
    tutorTypeRequirement: "Giáo viên",
    tutorGenderRequirement: "Nữ",
    requirements: "Gia sư có chứng chỉ IELTS >= 8.0 (Speaking >= 7.5), có kinh nghiệm chấm chữa bài Writing Task 2.",
    additionalNotes: "Cung cấp tài liệu và sửa bài viết cẩn thận ngoài giờ học.",
    tuitionType: "fixed",
    tuition: 350000,
    classFeeRate: "30% học phí tháng đầu (Hạn đóng 30 ngày)",
    postedAt: "30 phút trước",
    badges: ["high_tuition"],
    applied: false,
  },
  {
    id: "LH-1031",
    title: "Tiếng Anh Tiểu Học - Phát Âm Chuẩn IPA Lớp 3",
    subject: "Tiếng Anh",
    gradeCategory: "Lớp 3",
    city: "TP. Hồ Chí Minh",
    district: "Quận 7",
    addressDetail: "Khu dân cư Him Lam, Phường Tân Hưng, Quận 7, TP.HCM",
    teachingMode: "Offline",
    sessionsPerWeek: 2,
    durationPerSession: "90 phút",
    scheduleType: "negotiable",
    schedule: "Linh hoạt cuối tuần hoặc ca tối từ 18:00",
    studentAge: 9,
    studentGender: "Nam",
    studentLevel: "Mới bắt đầu tiếp xúc tiếng Anh, nói còn ngại",
    studentGoal: "Rèn phản xạ giao tiếp tự nhiên, chuẩn hóa phát âm IPA và tạo hứng thú học tập.",
    tutorTypeRequirement: "Sinh viên",
    tutorGenderRequirement: "Nữ",
    requirements: "Gia sư vui vẻ, kiên nhẫn, yêu trẻ em, nói tiếng Anh giọng chuẩn không bị ngọng.",
    additionalNotes: "Gia đình có chỗ để xe hơi / xe máy thoải mái.",
    tuitionType: "negotiable",
    tuition: null,
    classFeeRate: "30% học phí tháng đầu (Hạn đóng 30 ngày)",
    postedAt: "2 giờ trước",
    badges: [],
    applied: false,
  },
  {
    id: "LH-1032",
    title: "Luyện Thi TOEIC 700+ Cho Người Đi Làm",
    subject: "TOEIC",
    gradeCategory: "TOEIC",
    city: "Đà Nẵng",
    district: "Hải Châu",
    addressDetail: "Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng",
    teachingMode: "Offline",
    sessionsPerWeek: 2,
    durationPerSession: "90 phút",
    scheduleType: "fixed",
    schedule: "Thứ 3 & Thứ 6 (18:30 - 20:00)",
    studentAge: 25,
    studentGender: "Nam",
    studentLevel: "Nền tảng khá, TOEIC 450",
    studentGoal: "Cần lấy bằng TOEIC 700+ gấp trong vòng 2 tháng để nộp hồ sơ thăng tiến.",
    tutorTypeRequirement: "Không yêu cầu",
    tutorGenderRequirement: "Không yêu cầu",
    requirements: "TOEIC >= 900 hoặc IELTS >= 7.5, nắm rõ bẫy đề thi TOEIC mới.",
    additionalNotes: "Học tại nhà học sinh hoặc quán cafe yên tĩnh.",
    tuitionType: "fixed",
    tuition: 220000,
    classFeeRate: "30% học phí tháng đầu (Hạn đóng 30 ngày)",
    postedAt: "5 giờ trước",
    badges: ["urgent"],
    applied: false,
  },
  {
    id: "LH-1033",
    title: "Tiếng Anh Lớp 1 - Làm Quần Từ Vựng & Song Ngữ",
    subject: "Tiếng Anh",
    gradeCategory: "Lớp 1",
    city: "Hà Nội",
    district: "Đống Đa",
    addressDetail: "Phố Chùa Bộc, Phường Quang Trung, Quận Đống Đa, Hà Nội",
    teachingMode: "Offline",
    sessionsPerWeek: 2,
    durationPerSession: "60 phút",
    scheduleType: "fixed",
    schedule: "Thứ 7 & Chủ Nhật (16:30 - 17:30)",
    studentAge: 6,
    studentGender: "Nữ",
    studentLevel: "Chuẩn bị vào lớp 1",
    studentGoal: "Học qua trò chơi, flashcard, bài hát để thuộc từ vựng chỉ màu sắc, động vật, gia đình.",
    tutorTypeRequirement: "Sinh viên",
    tutorGenderRequirement: "Nữ",
    requirements: "Nhiệt tình, có phương pháp sư phạm cho trẻ mầm non/tiểu học.",
    additionalNotes: "Mẹ bé theo sát buổi học.",
    tuitionType: "fixed",
    tuition: 180000,
    classFeeRate: "30% học phí tháng đầu (Hạn đóng 30 ngày)",
    postedAt: "1 ngày trước",
    badges: [],
    applied: false,
  }
];

export function getAvailableClasses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load available classes from storage", e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAvailableClasses));
  return initialAvailableClasses;
}

export function getClassById(classId) {
  const classes = getAvailableClasses();
  return classes.find((c) => c.id === classId) || null;
}

export function applyForClass(classId, { proposedSchedule, proposedTuition }) {
  const classes = getAvailableClasses();
  const updated = classes.map((c) => {
    if (c.id === classId) {
      return {
        ...c,
        applied: true,
        userProposedSchedule: proposedSchedule || c.schedule,
        userProposedTuition: proposedTuition ? parseInt(proposedTuition) : c.tuition,
        appliedAt: new Date().toISOString(),
      };
    }
    return c;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
