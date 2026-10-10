import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  ShieldAlert,
  Send,
  UserCheck,
  Ban,
  FileText,
  HelpCircle,
  Sparkles,
  Briefcase,
  Check,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import {
  getAvailableClasses,
  locationData,
  applyForClass,
  cancelApplication,
  getTutorProfileStatus,
  setTutorProfileStatus,
  resetAvailableClasses,
} from "./mockAvailableClasses";

export default function AvailableClasses() {
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState("feed"); // "feed" | "my_applications"
  
  // Simulation Profile Status for Testing Exception 7c
  const [profileStatus, setProfileStatus] = useState(getTutorProfileStatus());

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [selectedMode, setSelectedMode] = useState("Tất cả");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả");
  const [selectedTuitionRange, setSelectedTuitionRange] = useState("Tất cả");
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState("Tất cả");
  const [selectedTutorRequirement, setSelectedTutorRequirement] = useState("Tất cả");
  const [selectedClassStatus, setSelectedClassStatus] = useState("Tất cả");

  // Filter Accordion state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modals & Toast State
  const [toastMessage, setToastMessage] = useState("");
  const [applyingClass, setApplyingClass] = useState(null); // Selected class object for modal
  const [cancelingClass, setCancelingClass] = useState(null); // Selected class object for cancel modal
  const [blockedNotice, setBlockedNotice] = useState(null); // Warning message modal for exceptions (7a, 7b, 7c)

  // Form states inside Apply Modal
  const [scheduleConfirmed, setScheduleConfirmed] = useState(true);
  const [tutorNote, setTutorNote] = useState("");
  const [proposedSchedule, setProposedSchedule] = useState("");
  const [proposedTuition, setProposedTuition] = useState("");

  const refreshData = () => {
    setClasses(getAvailableClasses());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleProfileStatusChange = (newStatus) => {
    setProfileStatus(newStatus);
    setTutorProfileStatus(newStatus);
    showToast(`Đã chuyển trạng thái hồ sơ giả lập sang: ${newStatus === "APPROVED" ? "Đã duyệt (APPROVED)" : newStatus === "PENDING_APPROVAL" ? "Chờ duyệt (PENDING_APPROVAL)" : "Chưa hoàn thiện (PROFILE_INCOMPLETE)"}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const activeFiltersCount = [
    selectedSubject !== "Tất cả",
    selectedMode !== "Tất cả",
    selectedCity !== "Tất cả",
    selectedDistrict !== "Tất cả",
    selectedTuitionRange !== "Tất cả",
    selectedScheduleSlot !== "Tất cả",
    selectedTutorRequirement !== "Tất cả",
    selectedClassStatus !== "Tất cả",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSubject("Tất cả");
    setSelectedMode("Tất cả");
    setSelectedCity("Tất cả");
    setSelectedDistrict("Tất cả");
    setSelectedTuitionRange("Tất cả");
    setSelectedScheduleSlot("Tất cả");
    setSelectedTutorRequirement("Tất cả");
    setSelectedClassStatus("Tất cả");
  };

  // Open Apply Modal or Block (Exceptions 7a, 7b, 7c)
  const handleOpenApplyModal = (cls) => {
    // Check Exception 7c: Profile not approved
    if (profileStatus !== "APPROVED") {
      setBlockedNotice({
        type: "7c",
        title: "Hồ sơ chưa được phê duyệt",
        message: "Hồ sơ của bạn chưa được phê duyệt. Vui lòng hoàn tất và chờ Admin xác thực hồ sơ trước khi ứng tuyển nhận lớp.",
        actionUrl: "/tutor/create-profile",
        actionLabel: "Thiết lập / Hoàn tất hồ sơ",
      });
      return;
    }

    // Check Exception 7b: Class filled/closed
    if (cls.status === "FILLED" || cls.status === "CLOSED") {
      setBlockedNotice({
        type: "7b",
        title: "Lớp học đã ngưng nhận đơn",
        message: "Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển.",
      });
      return;
    }

    // Check Exception 7a: Already applied
    if (cls.applied) {
      setBlockedNotice({
        type: "7a",
        title: "Bạn đã ứng tuyển lớp học này",
        message: "Bạn đã gửi đơn ứng tuyển cho lớp học này rồi. Vui lòng chờ phản hồi từ Trung tâm hoặc xem tại mục 'Đơn ứng tuyển của tôi'.",
      });
      return;
    }

    // Main Flow Step 5: Open Apply Modal
    setApplyingClass(cls);
    setScheduleConfirmed(true);
    setTutorNote(`Em có kinh nghiệm gia sư môn ${cls.subject}, cam kết giảng dạy đúng phương pháp và bám sát mục tiêu của phụ huynh.`);
    setProposedSchedule(cls.schedule || "");
    setProposedTuition(cls.tuition ? String(cls.tuition) : "");
  };

  // Confirm Application Submit
  const handleConfirmApply = (e) => {
    e.preventDefault();
    if (!applyingClass) return;

    if (!scheduleConfirmed) {
      alert("Vui lòng tích xác nhận khả năng đáp ứng khung giờ học của lớp!");
      return;
    }

    if (!tutorNote.trim()) {
      alert("Vui lòng nhập ghi chú / lời nhắn giới thiệu bản thân tới Trung tâm!");
      return;
    }

    applyForClass(applyingClass.id, {
      proposedSchedule,
      proposedTuition,
      note: tutorNote.trim(),
      scheduleConfirmed,
    });

    refreshData();
    const classId = applyingClass.id;
    setApplyingClass(null);
    showToast(`🎉 Đơn ứng tuyển mã ${classId} đã được gửi thành công. Trung tâm sẽ xem xét và thông báo kết quả trong vòng 24h.`);
  };

  // Cancel Application (Flow 6a)
  const handleConfirmCancel = () => {
    if (!cancelingClass) return;
    const classId = cancelingClass.id;
    cancelApplication(classId);
    refreshData();
    setCancelingClass(null);
    showToast(`Đã hủy đơn ứng tuyển cho lớp ${classId} thành công.`);
  };

  // Reset demo data
  const handleResetData = () => {
    resetAvailableClasses();
    refreshData();
    showToast("Đã khôi phục dữ liệu mẫu Bảng tin Lớp học ban đầu.");
  };

  // Filter logic
  const filteredClasses = classes.filter((cls) => {
    // If in my_applications tab, only show applied classes
    if (activeTab === "my_applications") {
      if (!cls.applied) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = cls.title.toLowerCase().includes(term);
      const matchSubject = cls.subject.toLowerCase().includes(term);
      const matchCity = cls.city.toLowerCase().includes(term);
      const matchDistrict = cls.district.toLowerCase().includes(term);
      const matchReq = cls.requirements.toLowerCase().includes(term);
      const matchId = cls.id.toLowerCase().includes(term);
      if (!matchTitle && !matchSubject && !matchCity && !matchDistrict && !matchReq && !matchId) {
        return false;
      }
    }

    if (selectedSubject !== "Tất cả" && !cls.subject.includes(selectedSubject) && cls.gradeCategory !== selectedSubject) return false;
    if (selectedMode !== "Tất cả" && cls.teachingMode !== selectedMode) return false;
    if (selectedCity !== "Tất cả" && cls.city !== selectedCity) return false;
    if (selectedDistrict !== "Tất cả" && cls.district !== selectedDistrict) return false;
    if (selectedTutorRequirement !== "Tất cả" && cls.tutorTypeRequirement !== selectedTutorRequirement) return false;
    if (selectedClassStatus !== "Tất cả" && cls.status !== selectedClassStatus) return false;

    // Filter by tuition
    if (selectedTuitionRange !== "Tất cả") {
      if (selectedTuitionRange === "negotiable") {
        if (cls.tuitionType !== "negotiable") return false;
      } else if (selectedTuitionRange === "under200") {
        if (cls.tuition && cls.tuition >= 200000) return false;
      } else if (selectedTuitionRange === "200to400") {
        if (!cls.tuition || cls.tuition < 200000 || cls.tuition > 400000) return false;
      } else if (selectedTuitionRange === "above400") {
        if (!cls.tuition || cls.tuition <= 400000) return false;
      }
    }

    // Filter by schedule slot
    if (selectedScheduleSlot !== "Tất cả") {
      if (!cls.schedule) return true;
      const scheduleLower = cls.schedule.toLowerCase();
      if (selectedScheduleSlot === "weekend" && !scheduleLower.includes("chủ nhật") && !scheduleLower.includes("thứ 7")) return false;
      if (selectedScheduleSlot === "evening" && !scheduleLower.includes("18:") && !scheduleLower.includes("19:") && !scheduleLower.includes("20:")) return false;
    }

    return true;
  });

  const appliedCount = classes.filter((c) => c.applied).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3.5 text-white shadow-2xl animate-in fade-in slide-in-from-top-3 border border-blue-400">
          <CheckCircle2 size={20} className="text-white shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* BLOCK / EXCEPTION NOTICE MODAL (Luồng ngoại lệ 7a, 7b, 7c) */}
      {blockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <ShieldAlert size={20} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">{blockedNotice.title}</h4>
              </div>
              <button
                onClick={() => setBlockedNotice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-xl bg-rose-50 p-3.5 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200">
                <p className="font-medium leading-relaxed">{blockedNotice.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {blockedNotice.actionUrl ? (
                <Link
                  to={blockedNotice.actionUrl}
                  onClick={() => setBlockedNotice(null)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  {blockedNotice.actionLabel}
                </Link>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setBlockedNotice(null)} className="text-xs font-semibold">
                  Đã hiểu
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỦY ĐƠN ỨNG TUYỂN (Luồng thay thế 6a) */}
      {cancelingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Ban size={20} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Xác Nhận Hủy Đơn Ứng Tuyển</h4>
              </div>
              <button onClick={() => setCancelingClass(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Bạn có chắc chắn muốn hủy đơn ứng tuyển cho lớp học này không?
              </p>
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <p><span className="text-slate-400">Mã lớp:</span> <strong className="font-mono text-blue-600 dark:text-blue-400">{cancelingClass.id}</strong></p>
                <p><span className="text-slate-400">Tên lớp:</span> <strong className="text-slate-800 dark:text-slate-200">{cancelingClass.title}</strong></p>
                <p><span className="text-slate-400">Môn học:</span> <strong>{cancelingClass.subject}</strong></p>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Sau khi hủy, đơn ứng tuyển của bạn sẽ bị loại bỏ khỏi danh sách chờ duyệt của Admin. Bạn có thể gửi lại đơn bất kỳ lúc nào nếu lớp còn mở.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setCancelingClass(null)} className="text-xs font-semibold cursor-pointer">
                Đóng
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancel} className="text-xs font-bold px-4 cursor-pointer">
                Xác Nhận Hủy Đơn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ỨNG TUYỂN (Luồng chính Bước 5 & 6) */}
      {applyingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Gửi Đơn Ứng Tuyển Nhận Lớp</h4>
                  <p className="text-[11px] text-slate-400">Mã lớp: <strong className="font-mono text-blue-600 dark:text-blue-400">{applyingClass.id}</strong></p>
                </div>
              </div>
              <button onClick={() => setApplyingClass(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="space-y-4 text-xs">
              {/* Class Brief Card */}
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{applyingClass.title}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Chương trình:</span> <strong>{applyingClass.subject}</strong></p>
                  <p><span className="text-slate-400">Hình thức:</span> <strong>{applyingClass.teachingMode}</strong></p>
                  <p><span className="text-slate-400">Khu vực:</span> <strong>{applyingClass.city} ({applyingClass.district})</strong></p>
                  <p><span className="text-slate-400">Mức học phí:</span> <strong className="text-blue-600 dark:text-blue-400">{applyingClass.tuitionType === "fixed" ? `${applyingClass.tuition.toLocaleString()} VNĐ/buổi` : "Thỏa thuận"}</strong></p>
                  <p className="col-span-2"><span className="text-slate-400">Khung giờ học:</span> <strong>{applyingClass.schedule}</strong></p>
                </div>
              </div>

              {/* Step 5: Checkbox Confirming Schedule Commitment */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/40 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={scheduleConfirmed}
                    onChange={(e) => setScheduleConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 leading-snug">
                    Tôi xác nhận có thể đáp ứng đúng khung thời gian học dự kiến ({applyingClass.schedule}) và sẵn sàng dạy theo cam kết. <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>

              {/* Step 5: Note / Intro message to Admin / Center */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Lời nhắn / Ghi chú giới thiệu bản thân tới Admin / Trung tâm <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={tutorNote}
                  onChange={(e) => setTutorNote(e.target.value)}
                  placeholder="Nhập giới thiệu tóm tắt về năng lực, điểm chứng chỉ, kinh nghiệm dạy học của bạn..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Optional Proposed Schedule / Tuition if Negotiable */}
              {applyingClass.scheduleType === "negotiable" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Khung giờ dạy đề xuất thêm (nếu có):
                  </label>
                  <input
                    type="text"
                    value={proposedSchedule}
                    onChange={(e) => setProposedSchedule(e.target.value)}
                    placeholder="VD: Thứ 2 & Thứ 4 (18:00 - 19:30)"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              )}

              {applyingClass.tuitionType === "negotiable" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức học phí đề xuất (VNĐ / buổi):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={proposedTuition}
                    onChange={(e) => setProposedTuition(e.target.value)}
                    placeholder="VD: 250000"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              )}

              {/* Policy note */}
              <p className="text-[11px] text-slate-400 italic">
                Sau khi gửi, đơn ứng tuyển sẽ ở trạng thái <strong>Chờ duyệt (APPLIED)</strong>. Trung tâm sẽ xem xét trình độ và duyệt ghép lớp trong vòng 24h.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setApplyingClass(null)} className="text-xs font-semibold cursor-pointer">
                  Hủy Bỏ
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 cursor-pointer">
                  Xác Nhận Gửi Đơn Ứng Tuyển
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="UC-T02: Bảng tin Lớp cần Gia sư"
        description="Xem danh sách các lớp học đang có nhu cầu tìm gia sư được đăng công khai. Lọc lớp theo chương trình học, hình thức và khu vực để gửi đơn ứng tuyển."
      />

      {/* TOOLBAR DEMO / SIMULATION BAR FOR PROTOTYPE TESTING */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Thanh Giả Lập Kiểm Thử Use Case (UC-T02 Prototype Controls)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chuyển đổi trạng thái Hồ sơ Gia sư để kiểm thử luồng ngoại lệ 7c hoặc khôi phục dữ liệu mẫu ban đầu.
              </p>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Khôi phục dữ liệu mẫu</span>
          </button>
        </div>

        {/* Profile Status Switcher (Testing Exception 7c) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trạng thái Hồ sơ Gia sư hiện tại:</span>
            <span className={clsx(
              "rounded-md px-2.5 py-0.5 text-xs font-bold border",
              profileStatus === "APPROVED" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
              profileStatus === "PENDING_APPROVAL" && "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
              profileStatus === "PROFILE_INCOMPLETE" && "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
            )}>
              {profileStatus === "APPROVED" ? "APPROVED (Đã duyệt)" : profileStatus === "PENDING_APPROVAL" ? "PENDING_APPROVAL (Chờ duyệt)" : "PROFILE_INCOMPLETE (Chưa xong)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Đổi để test Exception 7c:</span>
            <button
              onClick={() => handleProfileStatusChange("APPROVED")}
              className={clsx("px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors border", profileStatus === "APPROVED" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800")}
            >
              Đã duyệt
            </button>
            <button
              onClick={() => handleProfileStatusChange("PENDING_APPROVAL")}
              className={clsx("px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors border", profileStatus === "PENDING_APPROVAL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800")}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => handleProfileStatusChange("PROFILE_INCOMPLETE")}
              className={clsx("px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors border", profileStatus === "PROFILE_INCOMPLETE" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800")}
            >
              Chưa xong
            </button>
          </div>
        </div>
      </div>

      {/* Exception 7c Warning Banner if profile is not approved */}
      {profileStatus !== "APPROVED" && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Cảnh báo Tiền điều kiện (Luồng ngoại lệ 7c): Hồ sơ của bạn chưa được phê duyệt!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Hồ sơ của bạn chưa được phê duyệt. Vui lòng hoàn tất và chờ Admin xác thực hồ sơ trước khi ứng tuyển nhận lớp.
                </p>
              </div>
            </div>
            <Link
              to="/tutor/create-profile"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shrink-0 transition-colors"
            >
              <FileText size={14} /> Hoàn tất hồ sơ gia sư
            </Link>
          </div>
        </div>
      )}

      {/* MAIN TABS: BẢNG TIN LỚP HỌC & LỚP ĐÃ ỨNG TUYỂN */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("feed")}
          className={clsx(
            "flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === "feed"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Briefcase size={16} />
          <span>Bảng tin Lớp cần gia sư</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("my_applications")}
          className={clsx(
            "flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === "my_applications"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Send size={16} />
          <span>Đơn ứng tuyển của tôi</span>
          {appliedCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {appliedCount}
            </span>
          )}
        </button>
      </div>

      {/* BỘ LỌC TÌM KIẾM TINH GỌN */}
      <Card className="p-4 border-slate-200/80 dark:border-slate-800 transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập mã lớp (VD: LH-1029), tên lớp, môn học, khu vực, yêu cầu..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border shadow-xs cursor-pointer",
                isFilterOpen || activeFiltersCount > 0
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
              )}
            >
              <Filter size={15} />
              <span>Bộ Lọc Nâng Cao</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-blue-600">
                  {activeFiltersCount}
                </span>
              )}
              {isFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {(activeFiltersCount > 0 || searchTerm) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Accordion Filter Controls */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Chương trình / Môn học
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả môn / chương trình</option>
                  <option value="IELTS">Luyện Thi IELTS</option>
                  <option value="TOEIC">Luyện Thi TOEIC</option>
                  <option value="Tiếng Anh Giao tiếp">Tiếng Anh Giao tiếp</option>
                  <option value="Tiếng Anh Phổ thông">Tiếng Anh Phổ thông (Lớp 1-12)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Hình thức dạy
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả hình thức</option>
                  <option value="Offline">Offline (Tại nhà học sinh)</option>
                  <option value="Online">Online (Zoom/Meet)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedDistrict("Tất cả");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả Tỉnh/Thành</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Quận / Huyện
                </label>
                <select
                  value={selectedDistrict}
                  disabled={selectedCity === "Tất cả"}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả Quận/Huyện</option>
                  {(locationData[selectedCity] || []).map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Mức học phí / buổi
                </label>
                <select
                  value={selectedTuitionRange}
                  onChange={(e) => setSelectedTuitionRange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả mức phí</option>
                  <option value="under200">Dưới 200,000 VNĐ</option>
                  <option value="200to400">200,000 - 400,000 VNĐ</option>
                  <option value="above400">Trên 400,000 VNĐ</option>
                  <option value="negotiable">Thỏa thuận trực tiếp</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Trạng thái tuyển dụng lớp
                </label>
                <select
                  value={selectedClassStatus}
                  onChange={(e) => setSelectedClassStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="OPEN">Đang nhận ứng tuyển (OPEN)</option>
                  <option value="FILLED">Đã chốt gia sư (FILLED)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Yêu cầu đối tượng gia sư
                </label>
                <select
                  value={selectedTutorRequirement}
                  onChange={(e) => setSelectedTutorRequirement(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả đối tượng</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Không yêu cầu">Không yêu cầu</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Khung giờ học
                </label>
                <select
                  value={selectedScheduleSlot}
                  onChange={(e) => setSelectedScheduleSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả ca học</option>
                  <option value="evening">Ca Tối (Sau 18h)</option>
                  <option value="weekend">Cuối tuần (Thứ 7 / Chủ Nhật)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* DANH SÁCH THẺ LỚP HỌC */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {activeTab === "my_applications" ? (
              <>Bạn đã ứng tuyển <strong className="text-blue-600 dark:text-blue-400">{filteredClasses.length}</strong> lớp học</>
            ) : (
              <>Tìm thấy <strong className="text-blue-600 dark:text-blue-400">{filteredClasses.length}</strong> lớp học phù hợp</>
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredClasses.map((cls) => {
            const isFilled = cls.status === "FILLED" || cls.status === "CLOSED";

            return (
              <Card
                key={cls.id}
                className={clsx(
                  "flex flex-col justify-between transition-all border-slate-200/80 dark:border-slate-800 p-5 space-y-4",
                  cls.applied ? "bg-slate-50/90 dark:bg-slate-900/60 border-blue-400 dark:border-blue-800" : "hover:border-blue-400 dark:hover:border-blue-700"
                )}
              >
                <div className="space-y-3">
                  {/* Top Badges Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                        {cls.subject}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {cls.teachingMode}
                      </span>
                      {cls.badges.includes("urgent") && (
                        <span className="rounded bg-slate-800 text-white px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-200 dark:text-slate-900">
                          Cần gấp
                        </span>
                      )}
                      {isFilled && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Đã chốt gia sư
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{cls.postedAt}</span>
                  </div>

                  {/* Class Title & Code */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">{cls.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Mã lớp: <strong className="font-mono text-blue-600 dark:text-blue-400">{cls.id}</strong>
                    </p>
                  </div>

                  {/* Specification Table Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Khu vực:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.city} ({cls.district})</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Học phí đề xuất:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {cls.tuitionType === "fixed" ? `${cls.tuition.toLocaleString()} VNĐ/buổi` : "Thỏa thuận"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Khung giờ học:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{cls.schedule}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Yêu cầu gia sư:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cls.tutorTypeRequirement}</span>
                    </div>
                  </div>

                  {/* Status Banner when Applied */}
                  {cls.applied && (
                    <div className="rounded-xl bg-blue-50/80 p-3 text-xs text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                          <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                          Đã gửi đơn ứng tuyển (`APPLIED`)
                        </span>
                        <span className="text-[10px] text-slate-400">{cls.appliedAt || "Gần đây"}</span>
                      </div>
                      {cls.userNote && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-1">
                          "Lời nhắn: {cls.userNote}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Link
                    to={`/tutor/available-classes/${cls.id}`}
                    className="flex-1 inline-flex items-center justify-center font-bold text-xs py-2.5 rounded-xl transition-colors text-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Xem Chi Tiết Lớp
                  </Link>

                  {cls.applied ? (
                    <button
                      onClick={() => setCancelingClass(cls)}
                      className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      Hủy Ứng Tuyển
                    </button>
                  ) : isFilled ? (
                    <button
                      disabled
                      className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shrink-0"
                    >
                      Đã ngưng nhận
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenApplyModal(cls)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      Ứng Tuyển Nhận Lớp
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="py-12 text-center text-slate-400 space-y-2 border-slate-200/80 dark:border-slate-800">
            <AlertCircle size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {activeTab === "my_applications"
                ? "Bạn chưa gửi đơn ứng tuyển cho lớp học nào."
                : "Không tìm thấy lớp học nào phù hợp với bộ lọc."}
            </p>
            <p className="text-xs">
              {activeTab === "my_applications"
                ? "Chuyển sang tab 'Bảng tin Lớp cần gia sư' để chọn lớp và bấm ứng tuyển."
                : "Vui lòng thử bấm nút 'Đặt lại' bộ lọc để xem lại danh sách lớp học."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}


