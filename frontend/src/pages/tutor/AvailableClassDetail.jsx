import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Ban,
  ShieldAlert,
  FileText,
  Clock,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  BookOpen,
  Loader2,
  PauseCircle,
  RefreshCcw,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { apiGetTutorProfile } from "../../lib/tutorApi";
import {
  apiGetOpenClassRequest,
  apiApplyForClass,
  apiWithdrawApplication,
  mapTutorOpenClass,
} from "../../lib/tutorClassApi";

function formatFee(value) {
  return value ? `${Number(value).toLocaleString("vi-VN")} ₫/buổi` : "Thỏa thuận";
}

export default function AvailableClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [clsData, setClsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileStatus, setProfileStatus] = useState(null);
  const [openToTeaching, setOpenToTeaching] = useState(true);

  const [toast, setToast] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDetail = useCallback(async () => {
    if (!token) return;
    if (!/^\d+$/.test(String(classId))) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setLoadError("");
    try {
      const result = await apiGetOpenClassRequest(token, classId);
      setClsData(mapTutorOpenClass(result));
    } catch (error) {
      if (error.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(error.message || "Không thể tải chi tiết lớp học.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!token) return;
    apiGetTutorProfile(token)
      .then((profile) => {
        setProfileStatus(profile?.profileStatus || "INCOMPLETE");
        setOpenToTeaching(profile?.openToTeaching !== false);
      })
      .catch(() => setProfileStatus("INCOMPLETE"));
  }, [token]);

  const isProfileActive = profileStatus === "ACTIVE";
  const isBlocked = Boolean(clsData?.blocked);
  const canApply = isProfileActive && openToTeaching && !isBlocked;

  const handleOpenApplyModal = () => {
    if (isBlocked) {
      showToast("error", clsData.blockHint);
      return;
    }
    if (!openToTeaching) {
      showToast("error", "Bạn đang tạm ngưng nhận lớp. Hãy bật \"Đang mở nhận lớp\" ở trang Lớp cần gia sư để ứng tuyển.");
      return;
    }
    if (!isProfileActive) {
      showToast(
        "error",
        "Hồ sơ của bạn chưa được duyệt hoạt động. Vui lòng hoàn tất hồ sơ trước khi ứng tuyển.",
      );
      return;
    }
    setApplyMessage("");
    setApplyError("");
    setShowApplyModal(true);
  };

  const handleConfirmApply = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setApplyError("");
    try {
      await apiApplyForClass(token, clsData.id, applyMessage.trim());
      setShowApplyModal(false);
      showToast(
        "success",
        "Đơn ứng tuyển của bạn đã được gửi thành công. Trung tâm sẽ xem xét và thông báo kết quả.",
      );
      loadDetail();
    } catch (error) {
      setApplyError(error.message || "Gửi đơn ứng tuyển thất bại.");
      if (error.status === 404) {
        setShowApplyModal(false);
        setNotFound(true);
      } else if (error.status === 409) {
        loadDetail();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!clsData?.applicationId || withdrawing) return;
    setWithdrawing(true);
    try {
      await apiWithdrawApplication(token, clsData.applicationId);
      setShowCancelModal(false);
      showToast("success", "Đã rút đơn ứng tuyển thành công.");
      loadDetail();
    } catch (error) {
      setShowCancelModal(false);
      showToast("error", error.message || "Không thể rút đơn ứng tuyển.");
      loadDetail();
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <Card className="space-y-4 border-slate-200/80 p-6 dark:border-slate-800">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </Card>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="h-48 animate-pulse border-slate-200/80 dark:border-slate-800" />
            <Card className="h-48 animate-pulse border-slate-200/80 dark:border-slate-800" />
          </div>
          <Card className="h-64 animate-pulse border-slate-200/80 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  if (notFound) {
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
        <Card className="space-y-3 py-12 text-center">
          <AlertCircle size={32} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy lớp học này
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lớp học có thể đã chốt gia sư, bị hủy hoặc không còn nhận ứng tuyển.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/tutor/available-classes")}
            className="cursor-pointer bg-blue-600 text-xs font-semibold"
          >
            Về bảng tin lớp cần gia sư
          </Button>
        </Card>
      </div>
    );
  }

  if (loadError || !clsData) {
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
        <Card className="space-y-3 py-12 text-center">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {loadError || "Không thể tải lớp học"}
          </h3>
          <Button
            variant="outline"
            onClick={loadDetail}
            className="cursor-pointer text-xs font-semibold"
          >
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={clsx(
            "fixed right-5 top-5 z-50 flex max-w-md items-center gap-3 rounded-xl px-4 py-3.5 text-white shadow-2xl",
            toast.type === "error" ? "bg-rose-600" : "bg-blue-600",
          )}
        >
          {toast.type === "error" ? (
            <AlertCircle size={20} className="shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Ban size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Xác nhận hủy đơn ứng tuyển
                </h4>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Bạn có chắc chắn muốn hủy đơn ứng tuyển cho lớp học này không?
              </p>
              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <p>
                  <span className="text-slate-400">Mã lớp:</span>{" "}
                  <strong className="font-mono text-blue-600 dark:text-blue-400">
                    {clsData.code}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-400">Tên lớp:</span>{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{clsData.subject}</strong>
                </p>
              </div>
              <p className="text-[11px] italic text-slate-400">
                Sau khi hủy, đơn ứng tuyển sẽ bị xóa khỏi danh sách chờ duyệt của trung tâm.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="cursor-pointer text-xs font-semibold"
              >
                Đóng
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="cursor-pointer px-4 text-xs font-bold"
              >
                {withdrawing ? <Loader2 size={14} className="animate-spin" /> : null}
                {withdrawing ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Gửi đơn ứng tuyển nhận lớp
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Mã lớp:{" "}
                    <strong className="font-mono text-blue-600 dark:text-blue-400">
                      {clsData.code}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="space-y-4 text-xs">
              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {clsData.subject}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="text-slate-400">Hình thức:</span>{" "}
                    <strong>{clsData.teachingMode}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Khu vực:</span> <strong>{clsData.address}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Học phí:</span>{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {formatFee(clsData.feePerSession)}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Cấp lớp:</span>{" "}
                    <strong>{clsData.gradeLevel || "Đang cập nhật"}</strong>
                  </p>
                  <p className="col-span-2">
                    <span className="text-slate-400">Khung giờ học:</span>{" "}
                    <strong>{clsData.schedule}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="apply-message"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Lời nhắn
                </label>
                <textarea
                  id="apply-message"
                  rows={4}
                  value={applyMessage}
                  onChange={(event) => setApplyMessage(event.target.value)}
                  placeholder="Nhập lời nhắn kèm theo đơn ứng tuyển (tùy chọn)..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {applyError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              <p className="text-[11px] italic text-slate-400">
                Sau khi gửi, đơn ứng tuyển ở trạng thái <strong>Chờ duyệt</strong>. Trung tâm sẽ xem
                xét và thông báo kết quả cho bạn.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="cursor-pointer text-xs font-semibold"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {submitting ? "Đang gửi..." : "Xác nhận gửi đơn"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          to="/tutor/available-classes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lớp học
        </Link>
        <span className="font-mono text-xs text-slate-400">Mã lớp: {clsData.code}</span>
      </div>

      {!isProfileActive && profileStatus !== null && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Hồ sơ gia sư chưa được duyệt hoạt động
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Bạn vẫn xem được chi tiết lớp, nhưng cần chờ trung tâm duyệt hồ sơ trước khi ứng
                  tuyển.
                </p>
              </div>
            </div>
            <Link
              to="/tutor/profile"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              <FileText size={14} /> Xem hồ sơ gia sư
            </Link>
          </div>
        </div>
      )}

      {clsData.requestStatus === "REMATCH" && !isBlocked && (
        <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-900 shadow-xs dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-200">
          <RefreshCcw size={18} className="mt-0.5 shrink-0" />
          <p>
            Lớp đang <strong>tuyển lại</strong>: buổi dạy thử trước chưa thành công và phụ huynh muốn trung tâm
            tìm gia sư khác.
          </p>
        </div>
      )}

      {!openToTeaching && profileStatus !== null && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200">
          <PauseCircle size={18} className="mt-0.5 shrink-0" />
          <p>
            Bạn đang tạm ngưng nhận lớp mới nên chưa ứng tuyển được. Bật lại "Đang mở nhận lớp" tại{" "}
            <Link to="/tutor/available-classes" className="font-bold underline">
              trang Lớp cần gia sư
            </Link>
            .
          </p>
        </div>
      )}

      {clsData.applied && !isBlocked && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/80 p-4 text-blue-950 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
              />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Bạn đã gửi đơn ứng tuyển cho lớp học này
                </p>
                <p className="mt-0.5 text-xs text-blue-800/90 dark:text-blue-300/90">
                  Đơn ứng tuyển đang ở trạng thái <strong>Chờ duyệt</strong>. Trung tâm sẽ xem xét và
                  thông báo kết quả cho bạn.
                </p>
                {clsData.myMessage && (
                  <p className="mt-1 text-[11px] italic text-slate-600 dark:text-slate-400">
                    Lời nhắn: {clsData.myMessage}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900"
            >
              <Ban size={14} /> Hủy ứng tuyển
            </button>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Chi tiết lớp cần gia sư"
        title={clsData.subject || "Lớp cần gia sư"}
        description={`Mã lớp ${clsData.code} · Đăng ${clsData.postedDate}`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 border-slate-200/80 p-6 dark:border-slate-800">
            <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
              <MapPin size={16} className="text-blue-600" />
              Địa điểm & lịch học dự kiến
            </h2>
            <div className="grid gap-4 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">Khu vực</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.address}</p>
              </div>
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">Hình thức học</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {clsData.teachingMode}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="mb-0.5 block text-[11px] text-slate-400">Lịch học mong muốn</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{clsData.schedule}</p>
              </div>
              <p className="text-[11px] italic text-slate-400 sm:col-span-2">
                Thông tin liên hệ và địa chỉ cụ thể của phụ huynh sẽ do trung tâm mở sau khi ghép lớp.
              </p>
            </div>
          </Card>

          <Card className="space-y-4 border-slate-200/80 p-6 dark:border-slate-800">
            <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
              <UserCheck size={16} className="text-blue-600" />
              Thông tin học sinh & mục tiêu
            </h2>
            <div className="grid gap-4 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">Giới tính</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {clsData.studentGender || "Đang cập nhật"}
                </p>
              </div>
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">Cấp lớp</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {clsData.gradeLevel || "Đang cập nhật"}
                </p>
              </div>
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">Trường</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {clsData.school || "Đang cập nhật"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="mb-0.5 block text-[11px] text-slate-400">Mục tiêu học tập</span>
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold leading-relaxed text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  {clsData.learningGoal || "Trao đổi thêm với trung tâm"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border-slate-200/80 p-6 dark:border-slate-800">
            <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-slate-100">
              <BookOpen size={16} className="text-blue-600" />
              Yêu cầu đối với gia sư
            </h2>
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">
                  Yêu cầu về năng lực & kinh nghiệm
                </span>
                <p className="font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {clsData.teacherRequirement || "Không có yêu cầu riêng"}
                </p>
              </div>
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-400">
                  Nội dung lớp / yêu cầu của phụ huynh
                </span>
                <p className="font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {clsData.subject || "Đang cập nhật"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="space-y-5 border-slate-200/80 p-6 shadow-sm dark:border-slate-800">
            <div className="space-y-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <Building size={13} /> Học phí mỗi buổi
              </span>
              <span className="block text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatFee(clsData.feePerSession)}
              </span>
              <span className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <Calendar size={13} /> {clsData.schedule}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock size={13} /> Đăng {clsData.postedDate}
              </span>
            </div>

            {isBlocked ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Ban size={16} className="text-slate-400" /> {clsData.blockLabel}
                </p>
                <p>{clsData.blockHint}</p>
              </div>
            ) : clsData.applied ? (
              <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200">
                <p className="flex items-center gap-1.5 text-sm font-bold text-blue-800 dark:text-blue-300">
                  <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" /> Bạn đã ứng
                  tuyển lớp này
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Đơn ứng tuyển đang ở trạng thái <strong>Chờ duyệt</strong>.
                </p>
                {clsData.myMessage && (
                  <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                    Lời nhắn: {clsData.myMessage}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full cursor-pointer justify-center border-slate-300 text-xs font-bold hover:bg-slate-100 dark:border-slate-700"
                >
                  <Ban size={14} /> Hủy đơn ứng tuyển
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Thao tác ứng tuyển
                </h3>
                <Button
                  onClick={handleOpenApplyModal}
                  variant="primary"
                  disabled={!canApply}
                  className="w-full cursor-pointer justify-center border-none bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800"
                >
                  <Send size={16} /> Ứng tuyển nhận lớp
                </Button>
                <p className="text-center text-[11px] italic text-slate-400">
                  Đơn ứng tuyển sau khi gửi sẽ được lưu ở trạng thái Chờ duyệt để trung tâm xem xét.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
