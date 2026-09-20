import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Users,
  Home,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Share2,
  Phone,
  Clock,
  Sparkles,
  Info,
  UserCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import { publicClassListings } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";

export default function GuestClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  // Find listing by id or code
  const listing =
    publicClassListings.find((c) => c.id === classId || c.code === classId) ||
    publicClassListings[0];

  const formattedFee = new Intl.NumberFormat("vi-VN").format(listing.feePerSession);
  const commissionAmount = Math.round(
    (listing.feePerSession * (listing.commissionRate || 30)) / 100
  );
  const formattedCommission = new Intl.NumberFormat("vi-VN").format(commissionAmount);

  // States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimedSuccess, setIsClaimedSuccess] = useState(false);

  const isTutorLoggedIn = session && session.role === "tutor";

  const handleClaimClassClick = () => {
    if (!isTutorLoggedIn) {
      setShowLoginModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmClaim = () => {
    if (!isCommitted) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setIsClaimedSuccess(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div>
          <Link
            to="/classes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách lớp cần gia sư</span>
          </Link>
        </div>

        {/* Success Banner if class claimed */}
        {isClaimedSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-base">Đăng ký nhận lớp #{listing.code} thành công!</p>
                <p className="text-xs opacity-90">
                  Trung tâm đã ghi nhận yêu cầu nhận lớp của bạn. Vui lòng kiểm tra mục Quản lý Lớp để xem thông tin liên hệ phụ huynh.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/tutor/requests")}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer shadow-md"
            >
              Vào mục Quản lý lớp
            </button>
          </div>
        )}

        {/* Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25">
                    Mã lớp: #{listing.code}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang tuyển gia sư
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Ngày đăng: {listing.postedDate}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {listing.subject}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {listing.address}
                </p>
              </div>

              {/* Highlight Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Học phí / buổi:</span>
                  <p className="text-base sm:text-lg font-bold text-primary">{formattedFee} đ</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Hình thức dạy:</span>
                  <p className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1">
                    {listing.teachingMode === "Online" ? "🌐 Online" : "🏠 Tại nhà"}
                  </p>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Phí nhận lớp:</span>
                  <p className="text-sm sm:text-base font-semibold text-amber-600 dark:text-amber-400">
                    {listing.commissionRate}% ({formattedCommission} đ)
                  </p>
                </div>
              </div>

              {/* Specifications List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                  Thông tin lớp học &amp; Yêu cầu
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Lịch học yêu cầu:</span>
                      <strong className="text-foreground">{listing.schedule}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Yêu cầu gia sư:</span>
                      <strong className="text-foreground">
                        {listing.genderRequirement} - {listing.teacherRequirement}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Cấp học / Trình độ:</span>
                      <strong className="text-foreground">{listing.gradeLevel || "Theo yêu cầu môn"}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Home className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Địa điểm học tập:</span>
                      <strong className="text-foreground">{listing.address}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Situation & Goals */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                  Tình trạng học sinh &amp; Mục tiêu
                </h3>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-2 text-xs sm:text-sm">
                  <p className="text-sky-950 dark:text-sky-200 leading-relaxed">
                    <strong>Tình hình học viên:</strong> {listing.studentInfo || "Học sinh cần gia sư theo sát lộ trình, củng cố kiến thức và giải bài tập định kỳ."}
                  </p>
                  <p className="text-sky-950 dark:text-sky-200 leading-relaxed">
                    <strong>Mục tiêu học tập:</strong> {listing.learningGoal || "Tiến bộ rõ rệt trong điểm số học kỳ và nắm vững kiến thức căn bản."}
                  </p>
                </div>
              </div>

              {/* Center Notes */}
              {listing.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Ghi chú từ trung tâm
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed p-3.5 rounded-xl bg-muted/60 border border-border">
                    &ldquo;{listing.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Claim Action & Center Guarantees (1 col) */}
          <div className="space-y-6">
            {/* Claim Action Box */}
            <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-xl space-y-5 sticky top-20">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Đăng ký nhận lớp
                </span>
                <p className="text-2xl font-extrabold text-primary">
                  {formattedFee} đ <span className="text-xs font-normal text-muted-foreground">/ buổi</span>
                </p>
              </div>

              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Chính sách nhận lớp an toàn:</span>
                </div>
                <p>
                  Trung tâm luôn <strong>thu phí sau khi gia sư nhận lương</strong> từ phụ huynh. Bạn hoàn toàn yên tâm nhận lớp mà không lo rủi ro!
                </p>
              </div>

              {/* Claim Button */}
              <button
                type="button"
                onClick={handleClaimClassClick}
                disabled={isClaimedSuccess}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-5 h-5" />
                <span>{isClaimedSuccess ? "Đã đăng ký nhận lớp" : "Nhận lớp ngay"}</span>
              </button>

              {/* Tutor Login State Indicator */}
              <div className="text-center text-xs text-muted-foreground pt-1">
                {isTutorLoggedIn ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã đăng nhập vai trò Gia sư ({session.name})
                  </span>
                ) : (
                  <span>Yêu cầu đăng nhập tài khoản Gia sư để nhận lớp</span>
                )}
              </div>

              {/* Feature Checklist */}
              <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Xác thực phụ huynh 100% trước khi giao lớp</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Đổi lớp miễn phí nếu phụ huynh đổi kế hoạch</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hỗ trợ giáo trình và AI soạn đề thi miễn phí</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: YÊU CẦU ĐĂNG NHẬP VỚI TƯ CÁCH GIA SƯ
      ───────────────────────────────────────────────────────────── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                Đăng nhập tài khoản Gia sư
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Để nhận lớp , bạn cần đăng nhập với tư cách Gia sư trên hệ thống.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/login?role=tutor&redirect=${encodeURIComponent(`/classes/${listing.id}`)}`
                  )
                }
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập ngay</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/tutor/register")}
                className="w-full py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Chưa có tài khoản? Đăng ký làm gia sư</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: XÁC NHẬN NHẬN LỚP (KHI ĐÃ ĐĂNG NHẬP GIA SƯ)
      ───────────────────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Xác nhận nhận lớp #{listing.code}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {listing.subject} - {listing.address}
              </p>
            </div>

            {/* Class Summary Box */}
            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Học phí:</span>
                <span className="font-bold text-primary">{formattedFee} đ / buổi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lịch học:</span>
                <span className="font-semibold text-foreground">{listing.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí nhận lớp ({listing.commissionRate}%):</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{formattedCommission} đ</span>
              </div>
            </div>

            {/* Commitment Checkbox */}
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCommitted}
                onChange={(e) => setIsCommitted(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>
                Tôi cam kết đáp ứng đúng yêu cầu chuyên môn, liên hệ phụ huynh và thực hiện buổi dạy nghiêm túc.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={!isCommitted || isSubmitting}
                onClick={handleConfirmClaim}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận nhận lớp"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
