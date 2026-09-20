import { useState } from "react";
import {
  X,
  CheckCircle2,
  User,
  PhoneCall,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  BarChart2,
  Plus,
} from "lucide-react";

const GRADE_OPTIONS = [
  "Lớp 1",
  "Lớp 2",
  "Lớp 3",
  "Lớp 4",
  "Lớp 5",
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
  "Luyện thi Đại học",
  "Người đi làm / Sinh viên",
];

const CURRENT_LEVEL_OPTIONS = [
  "Mất gốc / Chưa có nền tảng",
  "Cơ bản / Học lực trung bình",
  "Khá / Nắm được ngữ pháp nhưng phát âm yếu",
  "Khá - Giỏi / Muốn bồi dưỡng nâng cao",
  "Đang luyện thi chứng chỉ (IELTS / TOEIC)",
];

const TARGET_GOAL_OPTIONS = [
  "Lấy lại gốc căn bản & cải thiện điểm trên lớp",
  "Ôn thi vào 10 trường chuyên / Chất lượng cao",
  "Luyện thi Tốt nghiệp THPT & Đại học (Mục tiêu 8.5+)",
  "Luyện thi chứng chỉ IELTS (Target 6.5 - 7.5+)",
  "Luyện thi TOEIC chuẩn đầu ra",
  "Rèn phát âm chuẩn IPA & Giao tiếp phản xạ",
  "Tiếng Anh Cambridge Tiểu học (Starters, Movers, Flyers)",
  "Mục tiêu khác (trao đổi chi tiết với gia sư)",
];

const DAYS_OF_WEEK = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

const SESSION_OPTIONS = ["Buổi Sáng", "Buổi Chiều", "Buổi Tối"];

export const isValidVietnamesePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  return /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
};

export function HireTutorModal({ isOpen, onClose, tutor }) {
  const [formData, setFormData] = useState({
    studentName: "",
    grade: tutor?.gradeLevels?.[0] || "Lớp 10",
    currentLevel: "Mất gốc / Chưa có nền tảng",
    targetGoal: "Lấy lại gốc căn bản & cải thiện điểm trên lớp",
    preferredSchedule: "Thứ 2 - Buổi Tối",
    parentName: "",
    phone: "",
    learningMode: tutor?.learningMode === "offline" ? "Tại nhà" : "Online",
    address: "",
    note: "",
  });

  const [selectedSchedules, setSelectedSchedules] = useState(["Thứ 2 - Buổi Tối"]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !tutor) return null;

  const isPhoneValid = isValidVietnamesePhone(formData.phone);
  const isPhoneTouched = Boolean(formData.phone && formData.phone.trim().length > 0);

  const handleToggleSchedule = (slot) => {
    if (selectedSchedules.includes(slot)) {
      setSelectedSchedules(selectedSchedules.filter((s) => s !== slot));
    } else {
      setSelectedSchedules([...selectedSchedules, slot]);
    }
  };

  const handleRemoveSchedule = (slot) => {
    setSelectedSchedules(selectedSchedules.filter((s) => s !== slot));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentName || !formData.parentName || !formData.phone) return;
    if (!isPhoneValid) return;
    const finalSchedule =
      selectedSchedules.length > 0
        ? selectedSchedules.join("; ")
        : "Linh hoạt / Thỏa thuận trực tiếp";
    setFormData((prev) => ({
      ...prev,
      preferredSchedule: finalSchedule,
    }));
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setIsAddingSchedule(false);
    setSelectedDay(null);
    setSelectedSchedules(["Thứ 2 - Buổi Tối"]);
    setFormData({
      studentName: "",
      grade: tutor?.gradeLevels?.[0] || "Lớp 10",
      currentLevel: "Mất gốc / Chưa có nền tảng",
      targetGoal: "Lấy lại gốc căn bản & cải thiện điểm trên lớp",
      preferredSchedule: "Thứ 2 - Buổi Tối",
      parentName: "",
      phone: "",
      learningMode: tutor?.learningMode === "offline" ? "Tại nhà" : "Online",
      address: "",
      note: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
        {/* Close button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đăng ký học thử 1-kèm-1 & Tư vấn lộ trình</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Liên hệ học cùng gia sư {tutor.name}
              </h2>
            </div>

            {/* Tutor Snapshot Card */}
            <div className="p-4 rounded-2xl border border-primary/25 bg-primary/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white shrink-0 shadow-xs"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
                >
                  {tutor.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">{tutor.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{tutor.university}</div>
                  <div className="text-[11px] text-primary font-medium mt-0.5">
                    {tutor.gender ? `Giới tính: ${tutor.gender} • ` : ""}
                    {tutor.learningModeLabel || "Gia sư Tiếng Anh"}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-foreground text-sm">{tutor.ratePerHour}</div>
                <div className="text-[11px] text-muted-foreground">/buổi học</div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SECTION 1: THÔNG TIN HỌC SINH & YÊU CẦU */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>1. Thông tin học sinh & Nhu cầu học tập</span>
                </div>

                {/* 1.1 Tên học sinh & Lớp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Tên học sinh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Minh Khôi"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Lớp học <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                    >
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1.2 Trình độ hiện tại & Mục tiêu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5 text-primary" />
                      Trình độ hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.currentLevel}
                      onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                    >
                      {CURRENT_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Mục tiêu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.targetGoal}
                      onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                    >
                      {TARGET_GOAL_OPTIONS.map((goal) => (
                        <option key={goal} value={goal}>
                          {goal}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1.3 Lịch học mong muốn */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Lịch học mong muốn <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingSchedule(!isAddingSchedule)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingSchedule ? "Thu gọn" : "Thêm lịch"}</span>
                    </button>
                  </div>

                  {/* Danh sách các buổi đã chọn */}
                  <div className="min-h-[42px] p-2.5 rounded-xl border border-border bg-background flex flex-wrap items-center gap-2">
                    {selectedSchedules.length > 0 ? (
                      selectedSchedules.map((schedule, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-foreground text-xs font-medium"
                        >
                          <Calendar className="w-3 h-3 text-primary shrink-0" />
                          <span>{schedule}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSchedule(schedule)}
                            className="p-0.5 rounded-md hover:bg-rose-500/20 hover:text-rose-500 text-muted-foreground transition-colors cursor-pointer"
                            title="Xóa lịch này"
                            aria-label="Xóa lịch này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Chưa chọn lịch nào. Nhấn nút <strong>"+ Thêm lịch"</strong> ở trên để chọn thứ & buổi học.
                      </span>
                    )}
                  </div>

                  {/* Bảng chọn lịch tương tác: Chọn Thứ -> Chọn Buổi */}
                  {isAddingSchedule && (
                    <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                      {/* BƯỚC 1: CHỌN THỨ */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">1</span>
                            Chọn thứ trong tuần:
                          </span>
                          {selectedDay && (
                            <span className="text-[11px] font-semibold text-primary">
                              Đã chọn: {selectedDay}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isCurrent = selectedDay === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${isCurrent
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                                  : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/60"
                                  }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* BƯỚC 2: CHỌN BUỔI */}
                      {selectedDay ? (
                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">2</span>
                              Chọn buổi học cho <span className="text-primary underline font-bold">{selectedDay}</span>:
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {SESSION_OPTIONS.map((sess) => {
                              const itemValue = `${selectedDay} - ${sess}`;
                              const isAdded = selectedSchedules.includes(itemValue);
                              return (
                                <button
                                  key={sess}
                                  type="button"
                                  onClick={() => handleToggleSchedule(itemValue)}
                                  className={`py-2 px-2.5 rounded-xl text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${isAdded
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                    : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50 font-medium"
                                    }`}
                                >
                                  <span>{sess}</span>
                                  {isAdded && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingSchedule(false)}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1.4 Hình thức học */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hình thức học</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, learningMode: "Online" })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${formData.learningMode === "Online"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, learningMode: "Tại nhà" })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${formData.learningMode === "Tại nhà"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                    >
                      Tại nhà
                    </button>
                  </div>
                </div>

                {formData.learningMode === "Tại nhà" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Địa chỉ nhà học sinh
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Số 25 ngõ 120 Hoàng Quốc Việt, Cầu Giấy, HN"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: THÔNG TIN PHỤ HUYNH LIÊN HỆ */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  <span>2. Thông tin phụ huynh liên hệ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Tên phụ huynh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      // placeholder="Ví dụ: Nguyễn Văn Tuấn"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-primary" />
                      SĐT / Zalo phụ huynh <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        // placeholder="Ví dụ: 0912 345 678"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9+\s\-.]/g, "");
                          setFormData({ ...formData, phone: val });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-hidden transition-all pr-9 ${isPhoneTouched
                          ? isPhoneValid
                            ? "border-emerald-500 focus:border-emerald-500"
                            : "border-rose-500 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/10"
                          : "border-border focus:border-primary"
                          }`}
                      />
                      {isPhoneTouched && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {isPhoneValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <span className="text-xs text-rose-500 font-bold">✕</span>
                          )}
                        </span>
                      )}
                    </div>
                    {isPhoneTouched && !isPhoneValid && (
                      <p className="text-[11px] text-rose-500 mt-1">
                        Vui lòng nhập đúng số điện thoại.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Ghi chú thêm gửi riêng cho gia sư
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`Ví dụ: Bé khá rụt rè khi nói tiếng Anh, mong gia sư kiên nhẫn sửa lỗi phát âm từng chút...`}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Cam kết */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Học thử 01 buổi miễn phí:</strong> Phụ huynh được học thử 1 buổi đánh giá năng lực & phương pháp giảng dạy trước khi quyết định nhận lớp chính thức.
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
              >

                <span>Gửi thông tin liên hệ</span>
              </button>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Gửi yêu cầu liên hệ thành công!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Yêu cầu đã được gửi đến gia sư <strong className="text-primary">{tutor.name}</strong>
              </p>


            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HireTutorModal;
