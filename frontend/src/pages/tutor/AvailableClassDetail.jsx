import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Send,
  Ban,
  ShieldAlert,
  FileText,
  Clock,
  Check,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  BookOpen,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import {
  getClassById,
  applyForClass,
  cancelApplication,
  getTutorProfileStatus,
} from "./mockAvailableClasses";

export default function AvailableClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [clsData, setClsData] = useState(null);
  const [profileStatus, setProfileStatus] = useState(getTutorProfileStatus());

  // Form states inside Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleConfirmed, setScheduleConfirmed] = useState(true);
  const [tutorNote, setTutorNote] = useState("");
  const [proposedSchedule, setProposedSchedule] = useState("");
  const [proposedTuition, setProposedTuition] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const refreshClass = () => {
    const found = getClassById(classId);
    if (found) {
      setClsData(found);
      setProposedSchedule(found.schedule || "");
      setProposedTuition(found.tuition ? String(found.tuition) : "");
    }
  };

  useEffect(() => {
    refreshClass();
    setProfileStatus(getTutorProfileStatus());
  }, [classId]);

  if (!clsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            to="/tutor/available-classes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} /> Quay lại danh sách lớp học
          </Link>
        </div>
        <Card className="py-12 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy mã lớp học này</h3>
          <p className="text-xs text-slate-500">Lớp học có thể đã đóng hoặc không tồn tại trên hệ thống.</p>
          <Button variant="primary" onClick={() => navigate("/tutor/available-classes")} className="bg-blue-600 text-xs font-semibold">
            Về Bảng Tin Lớp Học
          </Button>
        </Card>
      </div>
    );
  }

  const isFilled = clsData.status === "FILLED" || clsData.status === "CLOSED";

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Click Apply Button Handler (With exception checks 7a, 7b, 7c)
  const handleOpenApplyModal = () => {
    if (profileStatus !== "APPROVED") {
      alert("Hồ sơ của bạn chưa được phê duyệt. Vui lòng hoàn tất và chờ Admin xác thực hồ sơ trước khi ứng tuyển nhận lớp.");
      return;
    }

    if (isFilled) {
      alert("Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển.");
      return;
    }

    if (clsData.applied) {
      alert("Bạn đã gửi đơn ứng tuyển cho lớp học này rồi. Vui lòng chờ phản hồi từ Trung tâm.");
      return;
    }

    setScheduleConfirmed(true);
    setTutorNote(`Em có kinh nghiệm gia sư môn ${clsData.subject}, cam kết giảng dạy đúng phương pháp và bám sát mục tiêu của phụ huynh.`);
    setShowApplyModal(true);
  };

  // Submit Application
  const handleConfirmApply = (e) => {
    e.preventDefault();

    if (!scheduleConfirmed) {
      alert("Vui lòng tích xác nhận khả năng đáp ứng khung giờ học!");
      return;
    }

    if (!tutorNote.trim()) {
      alert("Vui lòng nhập lời nhắn giới thiệu bản thân tới Admin / Trung tâm!");
      return;
    }

    applyForClass(clsData.id, {
      proposedSchedule,
      proposedTuition,
      note: tutorNote.trim(),
      scheduleConfirmed,
    });

    refreshClass();
    setShowApplyModal(false);
    showToast(`🎉 Đơn ứng tuyển của bạn đã được gửi thành công. Trung tâm sẽ xem xét và thông báo kết quả trong vòng 24h.`);
  };

  // Cancel Application (Flow 6a)
  const handleConfirmCancel = () => {
    cancelApplication(clsData.id);
    refreshClass();
    setShowCancelModal(false);
    showToast("Đã hủy đơn ứng tuyển thành công.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3.5 text-white shadow-2xl animate-in fade-in slide-in-from-top-3 border border-blue-400">
          <CheckCircle2 size={20} className="text-white shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* MODAL HỦY ĐƠN ỨNG TUYỂN (Luồng thay thế 6a) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Ban size={20} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Xác Nhận Hủy Đơn Ứng Tuyển</h4>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Bạn có chắc chắn muốn hủy đơn ứng tuyển cho lớp học này không?
              </p>
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <p><span className="text-slate-400">Mã lớp:</span> <strong className="font-mono text-blue-600 dark:text-blue-400">{clsData.id}</strong></p>
                <p><span className="text-slate-400">Tên lớp:</span> <strong className="text-slate-800 dark:text-slate-200">{clsData.title}</strong></p>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Sau khi hủy, đơn ứng tuyển của bạn sẽ bị loại bỏ khỏi danh sách chờ duyệt của Admin.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)} className="text-xs font-semibold cursor-pointer">
                Đóng
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancel} className="text-xs font-bold px-4 cursor-pointer">
                Xác Nhận Hủy Đơn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ỨNG TUYỂN NHẬN LỚP (Luồng chính Bước 5 & 6) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Xác Nhận Đăng Ký Ứng Tuyển</h4>
                  <p className="text-[11px] text-slate-400">Mã lớp: <strong className="font-mono text-blue-600 dark:text-blue-400">{clsData.id}</strong></p>
                </div>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{clsData.title}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Chương trình:</span> <strong>{clsData.subject}</strong></p>
                  <p><span className="text-slate-400">Hình thức:</span> <strong>{clsData.teachingMode}</strong></p>
                  <p><span className="text-slate-400">Khu vực:</span> <strong>{clsData.city} ({clsData.district})</strong></p>
                  <p><span className="text-slate-400">Học phí:</span> <strong className="text-blue-600 dark:text-blue-400">{clsData.tuitionType === "fixed" ? `${clsData.tuition.toLocaleString()} VNĐ/buổi` : "Thỏa thuận"}</strong></p>
                  <p className="col-span-2"><span className="text-slate-400">Khung giờ:</span> <strong>{clsData.schedule}</strong></p>
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
                    Tôi xác nhận có thể đáp ứng đúng khung thời gian học dự kiến ({clsData.schedule}) và sẵn sàng dạy theo cam kết. <span className="text-rose-500">*</span>
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

              {/* Negotiable Fields if applicable */}
              {clsData.scheduleType === "negotiable" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lịch dạy đề xuất thêm:
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

              {clsData.tuitionType === "negotiable" && (
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

              <p className="text-[11px] text-slate-400 italic">
                Sau khi xác nhận, đơn ứng tuyển của bạn sẽ được lưu ở trạng thái <strong>Chờ duyệt (APPLIED)</strong> để Admin/Trung tâm ghép lớp.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowApplyModal(false)} className="text-xs font-semibold cursor-pointer">
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

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/tutor/available-classes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lớp học
        </Link>
        <span className="font-mono text-xs text-slate-400">Mã Lớp: {clsData.id}</span>
      </div>

      {/* Profile Exception 7c Warning Banner if unapproved */}
      {profileStatus !== "APPROVED" && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Cảnh báo Tiền điều kiện (Luồng ngoại lệ 7c): Hồ sơ Gia sư của bạn chưa được phê duyệt!
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

      {/* Exception 7b Banner if Filled */}
      {isFilled && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle size={18} className="text-slate-500" />
            <span>Thông báo (Luồng ngoại lệ 7b): Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển.</span>
          </div>
        </div>
      )}

      {/* Exception 7a Banner if Applied */}
      {clsData.applied && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/80 p-4 text-blue-950 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Thông báo (Luồng ngoại lệ 7a): Bạn đã gửi đơn ứng tuyển cho lớp học này rồi!
                </p>
                <p className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                  Đơn ứng tuyển đang ở trạng thái <strong>Chờ duyệt (`APPLIED`)</strong>. Trung tâm sẽ xem xét và thông báo kết quả cho bạn trong vòng 24h.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 shrink-0 transition-colors cursor-pointer"
            >
              <Ban size={14} /> Hủy ứng tuyển
            </button>
          </div>
        </div>
      )}

      {/* Title Header Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
              {clsData.subject}
            </span>
            {clsData.badges.includes("urgent") && (
              <span className="rounded-md bg-slate-800 text-white px-2.5 py-1 text-xs font-bold dark:bg-slate-200 dark:text-slate-900">
                Cần gấp
              </span>
            )}
            {clsData.badges.includes("high_tuition") && (
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60">
                Học phí cao
              </span>
            )}
            {isFilled && (
              <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Đã chốt gia sư
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Đăng lúc {clsData.postedAt}</span>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-snug">
          {clsData.title}
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Khu vực: <strong className="text-slate-700 dark:text-slate-300">{clsData.city} ({clsData.district})</strong>
        </p>
      </Card>

      {/* Main 2-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left 2 Columns: Detailed Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Thông tin địa điểm & thời gian học */}
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Địa Điểm & Lịch Học Dự Kiến
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Tỉnh / Thành phố & Quận</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.city} - {clsData.district}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Địa chỉ nhà học sinh</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.addressDetail}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Hình thức học</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {clsData.teachingMode === "Online" ? "Online (Zoom / Meet)" : "Offline (Tại nhà học sinh)"}
                </p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Thời lượng & Tần suất</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.sessionsPerWeek} buổi / tuần ({clsData.durationPerSession})</p>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-slate-400 text-[11px] mb-0.5">Lịch học mong muốn</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {clsData.scheduleType === "fixed" ? clsData.schedule : "Linh hoạt / Thỏa thuận trực tiếp với Gia sư"}
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Thông tin học sinh & mục tiêu */}
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800 flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600" />
              Trình Độ Chi Tiết Học Sinh & Mục Tiêu
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Độ tuổi & Giới tính</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.studentAge} tuổi ({clsData.studentGender})</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Trình độ hiện tại</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.studentLevel}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-slate-400 text-[11px] mb-0.5">Mục tiêu học tập cụ thể từ Phụ huynh</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {clsData.studentGoal}
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Yêu cầu đối với Gia sư */}
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              Yêu Cầu Cụ Thể Từ Phụ Huynh & Gia Sư
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Đối tượng gia sư yêu cầu</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.tutorTypeRequirement}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Giới tính gia sư</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.tutorGenderRequirement}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-slate-400 text-[11px] mb-0.5">Yêu cầu về năng lực & kinh nghiệm</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{clsData.requirements}</p>
              </div>

              {clsData.additionalNotes && (
                <div className="sm:col-span-2">
                  <span className="block text-slate-400 text-[11px] mb-0.5">Ghi chú bổ sung từ Phụ huynh</span>
                  <p className="italic text-slate-600 dark:text-slate-400">{clsData.additionalNotes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Sidebar Application Actions */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-medium text-slate-400">Mức học phí đề xuất</span>
                <div className="mt-1">
                  {clsData.tuitionType === "fixed" ? (
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                      {clsData.tuition.toLocaleString()} <span className="text-xs font-semibold text-slate-500">VNĐ / buổi</span>
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Thỏa thuận với Phụ huynh
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-400 text-[11px]">Phí nhận lớp (trung tâm):</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.classFeeRate}</p>
              </div>
            </div>

            {/* Application State Action Controls */}
            {clsData.applied ? (
              <div className="rounded-xl bg-blue-50/80 p-4 text-xs text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <p className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300 text-sm">
                  <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" /> Bạn đã ứng tuyển lớp này
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Đơn ứng tuyển của bạn đang ở trạng thái <strong>Chờ duyệt (`APPLIED`)</strong>.
                </p>
                {clsData.userNote && (
                  <p className="text-[11px] text-slate-500 italic">"Lời nhắn: {clsData.userNote}"</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full justify-center text-xs font-bold border-slate-300 hover:bg-slate-100 dark:border-slate-700"
                >
                  <Ban size={14} /> Hủy Đơn Ứng Tuyển
                </Button>
              </div>
            ) : isFilled ? (
              <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400 space-y-2 text-center">
                <p className="font-bold text-slate-700 dark:text-slate-300">Đã chốt gia sư / Đóng đơn tuyển</p>
                <p className="text-[11px]">Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Thao Tác Ứng Tuyển
                </h3>
                <Button
                  onClick={handleOpenApplyModal}
                  variant="primary"
                  className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-xs border-none shadow-md cursor-pointer"
                >
                  <Send size={16} /> Ứng Tuyển Nhận Lớp Ngay
                </Button>
                <p className="text-[11px] text-slate-400 text-center italic">
                  Đơn ứng tuyển sau khi gửi sẽ được lưu ở trạng thái Chờ duyệt (`APPLIED`) để Admin xem xét ghép lớp.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


