import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getClassById, applyForClass } from "./mockAvailableClasses";

export default function AvailableClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [clsData, setClsData] = useState(null);

  // Form states
  const [proposedSchedule, setProposedSchedule] = useState("");
  const [proposedTuition, setProposedTuition] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const found = getClassById(classId);
    if (found) {
      setClsData(found);
    }
  }, [classId]);

  if (!clsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            to="/tutor/available-classes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} /> Quay lại danh sách lớp
          </Link>
        </div>
        <Card className="py-12 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy mã lớp học này</h3>
          <p className="text-xs text-slate-500">Lớp học có thể đã đóng hoặc không tồn tại trên hệ thống.</p>
          <Button variant="primary" onClick={() => navigate("/tutor/available-classes")} className="bg-blue-600 text-xs font-semibold">
            Về Sàn Lớp Học
          </Button>
        </Card>
      </div>
    );
  }

  function handleApplySubmit(e) {
    e.preventDefault();

    if (clsData.scheduleType === "negotiable" && !proposedSchedule.trim()) {
      alert("Vui lòng nhập lịch dạy đề xuất của bạn!");
      return;
    }

    if (clsData.tuitionType === "negotiable" && (!proposedTuition || parseInt(proposedTuition) <= 0)) {
      alert("Vui lòng nhập mức học phí đề xuất hợp lệ!");
      return;
    }

    // Mở Modal hỏi lại xác nhận
    setShowConfirmModal(true);
  }

  function confirmApply() {
    const updatedList = applyForClass(clsData.id, {
      proposedSchedule,
      proposedTuition,
    });

    const updatedCls = updatedList.find((item) => item.id === clsData.id);
    if (updatedCls) {
      setClsData(updatedCls);
    }

    setShowConfirmModal(false);
    setToastMessage("Đã gửi đơn ứng tuyển nhận lớp thành công!");
    setTimeout(() => setToastMessage(""), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-xl animate-in fade-in slide-in-from-top-3 border border-blue-500">
          <CheckCircle2 size={18} className="text-white" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Modal Hỏi lại Chắc chắn Ứng tuyển */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <HelpCircle size={18} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Xác Nhận Đăng Ký Ứng Tuyển</h4>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Bạn có chắc chắn muốn đăng ký ứng tuyển nhận lớp học này không?
              </p>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <p><span className="text-slate-400">Tên lớp:</span> <strong className="text-slate-800 dark:text-slate-200">{clsData.title}</strong></p>
                <p><span className="text-slate-400">Môn học:</span> <strong>{clsData.subject}</strong></p>
                <p><span className="text-slate-400">Khu vực:</span> <strong>{clsData.city} ({clsData.district})</strong></p>
                {clsData.tuitionType === "negotiable" && proposedTuition && (
                  <p><span className="text-slate-400">Học phí đề xuất:</span> <strong className="text-blue-600 dark:text-blue-400">{parseInt(proposedTuition).toLocaleString()} VNĐ/buổi</strong></p>
                )}
                {clsData.scheduleType === "negotiable" && proposedSchedule && (
                  <p><span className="text-slate-400">Lịch dạy đề xuất:</span> <strong>{proposedSchedule}</strong></p>
                )}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Sau khi xác nhận, đơn ứng tuyển của bạn sẽ được chuyển tới bộ phận quản lý để xem xét ghép lớp.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                className="text-xs font-semibold cursor-pointer"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmApply}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 cursor-pointer"
              >
                Xác Nhận Ứng Tuyển
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/tutor/available-classes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lớp học
        </Link>
        <span className="font-mono text-xs text-slate-400">Mã Lớp: {clsData.id}</span>
      </div>

      {/* Title Header Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
              {clsData.subject}
            </span>
            {clsData.badges.includes("urgent") && (
              <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                Cần gấp
              </span>
            )}
            {clsData.badges.includes("high_tuition") && (
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
                Học phí cao
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              Địa Điểm & Lịch Học
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Tỉnh / Thành phố & Quận</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.city} - {clsData.district}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Địa chỉ cụ thể</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.addressDetail}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Hình thức học</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {clsData.teachingMode === "Online" ? "Online (Zoom / Meet)" : "Offline (Tại nhà học sinh)"}
                </p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Thời lượng học</span>
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              Thông Tin Học Sinh & Mục Tiêu
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
                <span className="block text-slate-400 text-[11px] mb-0.5">Mục tiêu học tập cụ thể</span>
                <p className="font-semibold text-blue-700 dark:text-blue-300 leading-relaxed">{clsData.studentGoal}</p>
              </div>
            </div>
          </Card>

          {/* Section 3: Yêu cầu đối với Gia sư */}
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              Yêu Cầu Gia Sư & Ghi Chú
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Đối tượng gia sư</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.tutorTypeRequirement}</p>
              </div>

              <div>
                <span className="block text-slate-400 text-[11px] mb-0.5">Giới tính gia sư</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.tutorGenderRequirement}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-slate-400 text-[11px] mb-0.5">Yêu cầu năng lực & kinh nghiệm</span>
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

        {/* Right 1 Column: Sticky Application & Tuition Sidebar */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          <Card className="p-6 border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm">
            {/* Học phí & Phí nhận lớp */}
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

            {/* Form / Trạng thái ứng tuyển */}
            {clsData.applied ? (
              <div className="rounded-xl bg-blue-50 p-4 text-xs text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300 text-sm">
                  <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" /> Bạn đã ứng tuyển lớp này
                </p>
                <p className="text-slate-600 dark:text-slate-400">Đơn ứng tuyển của bạn đã được chuyển tới trung tâm/phụ huynh để xem xét.</p>
                {clsData.userProposedTuition && (
                  <p>Học phí đề xuất: <strong className="font-mono font-bold">{clsData.userProposedTuition.toLocaleString()} VNĐ/buổi</strong></p>
                )}
                {clsData.userProposedSchedule && (
                  <p>Lịch dạy đề xuất: <strong>{clsData.userProposedSchedule}</strong></p>
                )}
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Đăng Ký Ứng Tuyển
                </h3>

                {clsData.scheduleType === "negotiable" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lịch dạy đề xuất <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proposedSchedule}
                      onChange={(e) => setProposedSchedule(e.target.value)}
                      placeholder="Ví dụ: Thứ 2 & Thứ 4 (18:00 - 19:30)"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {clsData.tuitionType === "negotiable" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Học phí đề xuất (VNĐ / buổi) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="10000"
                      value={proposedTuition}
                      onChange={(e) => setProposedTuition(e.target.value)}
                      placeholder="Ví dụ: 250000"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs border-none shadow-sm cursor-pointer"
                >
                  Gửi Đơn Ứng Tuyển Nhận Lớp
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
