import { useState, useRef, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  User,
  GraduationCap,
  ShieldCheck,
  PhoneCall
} from "lucide-react";

// Option presets
const GRADE_OPTIONS = [
  "Lớp 4-5 (Tiểu học)",
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9 (Chuyển cấp)",
  "THPT (Lớp 10-12)",
  "Đại học / Người đi làm",
];

const LEVEL_OPTIONS = [
  "Mất gốc hoàn toàn, sợ tiếng Anh",
  "Trung bình (Mất gốc ngữ pháp / phát âm)",
  "Khá (Cần bứt phá điểm thi chuyên)",
  "Foundation IELTS 4.0 - 5.0",
  "Giao tiếp cơ bản / Phản xạ chậm",
];

const GOAL_OPTIONS = [
  "Lấy lại gốc & Tự tin nói",
  "Thi chứng chỉ IELTS 6.0+",
  "Luyện thi vào 10 / Đại học",
  "Giao tiếp phản xạ tự nhiên",
  "Cải thiện điểm số trên lớp",
];

const GENDER_OPTIONS = ["Bất kỳ", "Gia sư Nữ", "Gia sư Nam"];

const RATE_OPTIONS = [
  "150.000đ - 200.000đ/2h",
  "200.000đ - 300.000đ/2h",
  "300.000đ - 450.000đ/2h",
];

const STYLE_OPTIONS = [
  "Kiên nhẫn & Sửa lỗi chi tiết",
  "Năng động, truyền cảm hứng & Tương tác nhiều",
  "Kỷ luật, nghiêm khắc & Bám sát bài vở",
  "Chuyên gia học thuật, chấm chữa đề thi chuyên sâu",
];

const DAYS_OF_WEEK = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const DAY_SLOT_OPTIONS = [
  { value: "none", label: " Không học (Bận)" },
  { value: "sang", label: " Sáng (08:30 - 11:30)" },
  { value: "chieu", label: " Chiều (14:00 - 17:30)" },
  { value: "toi", label: " Tối (18:30 - 21:00)" },
  { value: "sang_chieu", label: " Sáng & Chiều" },
  { value: "chieu_toi", label: " Chiều & Tối" },
  { value: "sang_toi", label: " Sáng & Tối" },
  { value: "ca_ngay", label: " Cả ngày (Sáng, Chiều, Tối)" },
  { value: "custom", label: " Tự nhập giờ khác..." },
];

/**
 * Kiểm tra định dạng số điện thoại di động Việt Nam hợp lệ:
 * - Gồm 10 chữ số bắt đầu bằng 0 (03, 05, 07, 08, 09) hoặc +84 / 84
 */
export const isValidVietnamesePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  return /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
};

/**
 * Reusable Editable Combobox:
 * - Direct click in box: user can type custom text directly.
 * - Click on the arrow: opens the dropdown options list.
 */
function EditableSelect({ value, onChange, options, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full p-2.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Mở danh sách lựa chọn"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""
              }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-xl text-card-foreground">
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2 ${isSelected
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted"
                  }`}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ParentContactModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form main data
  const [formData, setFormData] = useState({
    studentName: "",
    grade: GRADE_OPTIONS[3], // "Lớp 8"
    currentLevel: LEVEL_OPTIONS[1], // "Trung bình (Mất gốc ngữ pháp / phát âm)"
    goal: GOAL_OPTIONS[1], // "Thi chứng chỉ IELTS 6.0+"
    tutorGender: GENDER_OPTIONS[0], // "Bất kỳ"
    rateRange: RATE_OPTIONS[1], // "200.000đ - 300.000đ/giờ"
    tutorStyle: STYLE_OPTIONS[0], // "Kiên nhẫn & Sửa lỗi chi tiết"
    parentName: "",
    phone: "",
  });

  // Weekly schedule per day: set separately for each day (e.g. T2 sáng, T3 tối...)
  const [daySchedules, setDaySchedules] = useState({
    "Thứ 2": "sang", // T2 rảnh sáng
    "Thứ 3": "toi",  // T3 rảnh tối
    "Thứ 4": "toi",  // T4 rảnh tối
    "Thứ 5": "none",
    "Thứ 6": "toi",  // T6 rảnh tối
    "Thứ 7": "none",
    "Chủ Nhật": "none",
  });

  // Custom text for day schedule when "custom" option is picked
  const [customDaySchedules, setCustomDaySchedules] = useState({});

  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (!isOpen) return null;

  // Active days count
  const activeDaysCount = DAYS_OF_WEEK.filter(
    (d) => daySchedules[d] && daySchedules[d] !== "none"
  ).length;

  // Phone validation
  const isPhoneValid = isValidVietnamesePhone(formData.phone);
  const isPhoneTouched = Boolean(formData.phone && formData.phone.trim().length > 0);
  const isStep3Valid =
    activeDaysCount > 0 &&
    isPhoneValid &&
    Boolean(formData.parentName?.trim());

  // Schedule preset templates
  const handleApplyScheduleTemplate = (templateKey) => {
    if (!templateKey) return;
    const newSchedules = {
      "Thứ 2": "none",
      "Thứ 3": "none",
      "Thứ 4": "none",
      "Thứ 5": "none",
      "Thứ 6": "none",
      "Thứ 7": "none",
      "Chủ Nhật": "none",
    };

    if (templateKey === "246-evening") {
      newSchedules["Thứ 2"] = "toi";
      newSchedules["Thứ 4"] = "toi";
      newSchedules["Thứ 6"] = "toi";
    } else if (templateKey === "357-evening") {
      newSchedules["Thứ 3"] = "toi";
      newSchedules["Thứ 5"] = "toi";
      newSchedules["Thứ 7"] = "toi";
    } else if (templateKey === "weekend") {
      newSchedules["Thứ 7"] = "ca_ngay";
      newSchedules["Chủ Nhật"] = "ca_ngay";
    } else if (templateKey === "all-evening") {
      DAYS_OF_WEEK.forEach((d) => {
        newSchedules[d] = "toi";
      });
    } else if (templateKey === "clear") {
      // all none
    }
    setDaySchedules(newSchedules);
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (!formData.grade?.trim()) {
        alert("Vui lòng chọn hoặc nhập khối lớp / độ tuổi của con.");
        return;
      }
      if (!formData.currentLevel?.trim()) {
        alert("Vui lòng chọn hoặc nhập trình độ hiện tại của con.");
        return;
      }
      if (!formData.goal?.trim()) {
        alert("Vui lòng chọn hoặc nhập mục tiêu học tập của con.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.rateRange?.trim()) {
        alert("Vui lòng chọn hoặc nhập mức học phí mong muốn.");
        return;
      }
      if (!formData.tutorStyle?.trim()) {
        alert("Vui lòng chọn hoặc nhập tính cách gia sư mong muốn.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (activeDaysCount === 0) {
        alert("Vui lòng chọn ít nhất 1 buổi học rảnh trong tuần.");
        return;
      }
      if (!formData.parentName?.trim()) {
        alert("Vui lòng nhập họ và tên phụ huynh.");
        return;
      }
      if (!isPhoneValid) {
        alert("Vui lòng nhập đúng định dạng số điện thoại (10 chữ số, ví dụ: 0987 654 321).");
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleResetAndClose = () => {
    setCurrentStep(1);
    setRequestSubmitted(false);
    onClose();
  };

  // Human readable schedule summary
  const getScheduleSummary = () => {
    const activeDays = DAYS_OF_WEEK.filter((d) => daySchedules[d] && daySchedules[d] !== "none");
    if (activeDays.length === 0) return "Chưa chọn lịch";
    return activeDays
      .map((d) => {
        const val = daySchedules[d];
        if (val === "custom") return `${d}: ${customDaySchedules[d] || "Giờ tự nhập"}`;
        const opt = DAY_SLOT_OPTIONS.find((o) => o.value === val);
        return `${d}: ${opt ? opt.label.replace(/^[^a-zA-ZÀ-ỹ0-9]+/, "").trim() : val}`;
      })
      .join("; ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {requestSubmitted ? (
        /* ========================================================================= */
        /* POPUP THÔNG BÁO THÀNH CÔNG (DEDICATED SUCCESS MODAL POPUP) */
        /* ========================================================================= */
        <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-card-foreground text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing Success Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Title & Description - Centered */}
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 mx-auto">
              <span>Tiếp nhận yêu cầu thành công</span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-center">
              Trung tâm EnglishPath đã ghi nhận hồ sơ và sẽ liên hệ trực tiếp đến quý phụ huynh trong vòng 12 giờ để tư vấn chọn gia sư phù hợp nhất cho con.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/25 cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 4-STEP FORM MODAL CONTAINER */
        /* ========================================================================= */
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step Progress Bar */}
          {!requestSubmitted && (
            <div className="space-y-2 pr-6">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Smart-Match Form (Bước {currentStep}/4)
                </span>
                <span>
                  {currentStep === 1 && "Mục tiêu học sinh"}
                  {currentStep === 2 && "Yêu cầu gia sư & Học phí"}
                  {currentStep === 3 && "Lịch rảnh & Liên hệ"}
                  {currentStep === 4 && "Xác nhận Hồ sơ"}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Student info & Goal */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  1. Nhu cầu & Trình độ của Học sinh
                </h2>

              </div>

              <div className="space-y-4">
                {/* Tên con */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tên hoặc biệt danh của con
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bé Nam, Minh Khôi..."
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                {/* 1. Khối lớp / Độ tuổi */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Khối lớp / Độ tuổi <span className="text-rose-500">*</span>
                  </label>
                  <EditableSelect
                    value={formData.grade}
                    onChange={(val) => setFormData({ ...formData, grade: val })}
                    options={GRADE_OPTIONS}
                    placeholder="Nhập hoặc ấn mũi tên để chọn khối lớp..."
                    required
                  />
                </div>

                {/* 2. Trình độ hiện tại của con */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Trình độ hiện tại của con <span className="text-rose-500">*</span>
                  </label>
                  <EditableSelect
                    value={formData.currentLevel}
                    onChange={(val) => setFormData({ ...formData, currentLevel: val })}
                    options={LEVEL_OPTIONS}
                    placeholder="Nhập hoặc ấn mũi tên để chọn trình độ..."
                    required
                  />
                </div>

                {/* 3. Mục tiêu học tập ưu tiên hàng đầu */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Mục tiêu học tập ưu tiên hàng đầu <span className="text-rose-500">*</span>
                  </label>
                  <EditableSelect
                    value={formData.goal}
                    onChange={(val) => setFormData({ ...formData, goal: val })}
                    options={GOAL_OPTIONS}
                    placeholder="Nhập hoặc ấn mũi tên để chọn mục tiêu..."
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs sm:text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  Tiếp tục <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Tutor preferences & Rate */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  2. Yêu cầu về Gia sư & Học phí
                </h2>

              </div>

              <div className="space-y-4">
                {/* Giới tính gia sư */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Giới tính gia sư mong muốn
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tutorGender}
                      onChange={(e) => setFormData({ ...formData, tutorGender: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none pr-9"
                    >
                      {GENDER_OPTIONS.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Mức học phí mong muốn */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Mức học phí mong muốn <span className="text-rose-500">*</span>
                  </label>
                  <EditableSelect
                    value={formData.rateRange}
                    onChange={(val) => setFormData({ ...formData, rateRange: val })}
                    options={RATE_OPTIONS}
                    placeholder="Nhập ngân sách hoặc ấn mũi tên để chọn mức..."
                    required
                  />
                </div>

                {/* Tính cách gia sư ưu tiên */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Tính cách & Phong cách gia sư ưu tiên <span className="text-rose-500">*</span>
                  </label>
                  <EditableSelect
                    value={formData.tutorStyle}
                    onChange={(val) => setFormData({ ...formData, tutorStyle: val })}
                    options={STYLE_OPTIONS}
                    placeholder="Nhập phong cách hoặc ấn mũi tên để chọn gợi ý..."
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 border border-border text-foreground font-semibold text-xs sm:text-sm rounded-xl hover:bg-muted transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs sm:text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  Tiếp tục <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Schedule & Contact (Từng thứ riêng biệt) */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  3. Lịch học
                </h2>

              </div>

              <div className="space-y-4">
                {/* Template Select + Day Schedule Dropdowns */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Đặt lịch học
                    </label>
                    <span className="text-[11px]">
                      {activeDaysCount > 0 ? (
                        <span className="text-primary font-bold">
                          ✓ Đã xếp lịch cho {activeDaysCount}/7 ngày
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold">Chưa chọn ngày nào</span>
                      )}
                    </span>
                  </div>


                  {/* 7 Day Dropdowns Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const currentSlot = daySchedules[day] || "none";
                      const isDayActive = currentSlot !== "none";

                      return (
                        <div
                          key={day}
                          className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${isDayActive
                            ? "border-primary/50 bg-primary/5 shadow-xs"
                            : "border-border bg-card hover:border-border/80"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${isDayActive ? "text-primary" : "text-foreground"
                                }`}
                            >
                              {day}
                            </span>
                            {isDayActive && (
                              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold">
                                ✓ Có lịch
                              </span>
                            )}
                          </div>

                          <div className="relative">
                            <select
                              value={currentSlot}
                              onChange={(e) =>
                                setDaySchedules({ ...daySchedules, [day]: e.target.value })
                              }
                              className={`w-full p-2 rounded-lg border text-xs font-medium outline-none focus:border-primary cursor-pointer appearance-none pr-7 ${isDayActive
                                ? "border-primary/40 bg-background text-foreground font-semibold"
                                : "border-border bg-background text-muted-foreground"
                                }`}
                            >
                              {DAY_SLOT_OPTIONS.map((slot) => (
                                <option key={slot.value} value={slot.value}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          {currentSlot === "custom" && (
                            <input
                              type="text"
                              autoFocus
                              placeholder="Nhập giờ rảnh (VD: 17h00 - 18h30)..."
                              value={customDaySchedules[day] || ""}
                              onChange={(e) =>
                                setCustomDaySchedules({
                                  ...customDaySchedules,
                                  [day]: e.target.value,
                                })
                              }
                              className="w-full p-1.5 text-xs rounded-lg border border-primary bg-background outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary badge */}
                  {activeDaysCount > 0 ? (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-xs flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-foreground shrink-0">Lịch đã chọn:</span>
                      {DAYS_OF_WEEK.filter(
                        (d) => daySchedules[d] && daySchedules[d] !== "none"
                      ).map((d) => {
                        const val = daySchedules[d];
                        const label =
                          val === "custom"
                            ? customDaySchedules[d] || "Tự nhập"
                            : DAY_SLOT_OPTIONS.find((o) => o.value === val)?.label.split(" ")[1] ||
                            val;
                        return (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-[11px] border border-primary/20"
                          >
                            <strong>{d}:</strong> {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-500 font-medium">
                      ⚠️ Vui lòng chọn ít nhất 1 ca rảnh trong tuần để trung tâm tìm gia sư có lịch phù hợp.
                    </p>
                  )}
                </div>

                {/* Thông tin liên hệ phụ huynh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Họ và tên Phụ huynh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Lan Anh"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      {isPhoneTouched && (
                        <span
                          className={`text-[11px] font-semibold ${isPhoneValid
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                            }`}
                        >
                          {isPhoneValid ? "✓ SĐT hợp lệ" : "Cần 10 số (03x, 05x, 07x, 08x, 09x)"}
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="tel"
                        required
                        maxLength={15}
                        placeholder="Ví dụ: 0987 654 321"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9+\s\-.]/g, "");
                          setFormData({ ...formData, phone: val });
                        }}
                        className={`w-full p-2.5 rounded-xl border bg-background text-sm outline-none transition-all font-medium pr-9 ${isPhoneTouched
                          ? isPhoneValid
                            ? "border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            : "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 border border-border text-foreground font-semibold text-xs sm:text-sm rounded-xl hover:bg-muted transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="submit"
                  disabled={!isStep3Valid}
                  className={`px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs sm:text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${!isStep3Valid ? "opacity-50 cursor-not-allowed hover:bg-primary" : ""
                    }`}
                >
                  Kiểm tra & Xác nhận hồ sơ <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: Complete Profile Confirmation (Bản profile hoàn chỉnh) */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    4. Xác Nhận Hồ Sơ
                  </h2>
                </div>

              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {/* 1. Thông tin Học sinh */}
                <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Thông tin Học sinh
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Sửa lại
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Tên của con:</span>{" "}
                      <strong className="text-foreground">{formData.studentName || "Con (Chưa điền tên)"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Khối lớp / Độ tuổi:</span>{" "}
                      <strong className="text-foreground">{formData.grade}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Trình độ hiện tại:</span>{" "}
                      <strong className="text-foreground">{formData.currentLevel}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Mục tiêu ưu tiên:</span>{" "}
                      <strong className="text-foreground">{formData.goal}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Tiêu chí gia sư & Học phí */}
                <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Yêu cầu Gia sư & Học phí
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Sửa lại
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Giới tính gia sư:</span>{" "}
                      <strong className="text-foreground">{formData.tutorGender}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mức học phí:</span>{" "}
                      <strong className="text-primary font-bold">{formData.rateRange}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Tính cách & phong cách:</span>{" "}
                      <strong className="text-foreground">{formData.tutorStyle}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Lịch học & Người liên hệ */}
                <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Lịch học & Người liên hệ
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Sửa lại
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Phụ huynh:</span>{" "}
                      <strong className="text-foreground">{formData.parentName}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số điện thoại:</span>{" "}
                      <strong className="text-foreground">{formData.phone}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block mb-1">Lịch rảnh trong tuần:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.filter((d) => daySchedules[d] && daySchedules[d] !== "none").map((d) => {
                          const val = daySchedules[d];
                          const label =
                            val === "custom"
                              ? customDaySchedules[d] || "Giờ tự nhập"
                              : DAY_SLOT_OPTIONS.find((o) => o.value === val)?.label.trim() || val;
                          return (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20"
                            >
                              <strong>{d}:</strong> {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 border border-border text-foreground font-semibold text-xs sm:text-sm rounded-xl hover:bg-muted transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setRequestSubmitted(true)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs sm:text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Gửi yêu cầu đến trung tâm <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParentContactModal;
