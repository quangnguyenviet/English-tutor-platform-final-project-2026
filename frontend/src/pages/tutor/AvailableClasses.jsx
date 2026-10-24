import { useCallback, useEffect, useState } from "react";
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
  Send,
  ShieldAlert,
  Ban,
  FileText,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  UserCheck,
  Loader2,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { apiGetTutorProfile } from "../../lib/tutorApi";
import {
  apiGetOpenRequests,
  apiGetMyApplications,
  apiApplyForClass,
  apiWithdrawApplication,
  mapTutorOpenClass,
  mapMyApplication,
} from "../../lib/tutorClassApi";

const PAGE_SIZE = 20;

const GRADE_GROUPS = [
  { value: "tieuhoc", label: "Tiểu học" },
  { value: "thcs", label: "THCS" },
  { value: "thpt", label: "THPT / Đại học" },
  { value: "nguoidilam", label: "Người đi làm" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới đăng gần đây" },
  { value: "fee_asc", label: "Học phí thấp đến cao" },
  { value: "fee_desc", label: "Học phí cao đến thấp" },
];

function formatFee(value) {
  return value ? `${Number(value).toLocaleString("vi-VN")} ₫/buổi` : "Thỏa thuận";
}

function SkeletonCard() {
  return (
    <Card className="space-y-4 border-slate-200/80 p-5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
      <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </Card>
  );
}

export default function AvailableClasses() {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("feed");

  const [feedItems, setFeedItems] = useState([]);
  const [feedPage, setFeedPage] = useState(0);
  const [feedTotalPages, setFeedTotalPages] = useState(0);
  const [feedTotalItems, setFeedTotalItems] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");

  const [profileStatus, setProfileStatus] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedGradeGroup, setSelectedGradeGroup] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [applyingClass, setApplyingClass] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelingClass, setCancelingClass] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const loadFeed = useCallback(
    async (page = 0) => {
      if (!token) return;
      setFeedLoading(true);
      setFeedError("");
      try {
        const result = await apiGetOpenRequests(token, {
          page,
          size: PAGE_SIZE,
          keyword: debouncedKeyword,
          teachingMode: selectedMode,
          gradeGroup: selectedGradeGroup,
          sort: selectedSort,
        });
        setFeedItems(result.items.map(mapTutorOpenClass));
        setFeedPage(result.page);
        setFeedTotalPages(result.totalPages);
        setFeedTotalItems(result.totalItems);
      } catch (error) {
        setFeedError(error.message || "Không thể tải danh sách lớp cần gia sư.");
      } finally {
        setFeedLoading(false);
      }
    },
    [token, debouncedKeyword, selectedMode, selectedGradeGroup, selectedSort],
  );

  const loadApplications = useCallback(async () => {
    if (!token) return;
    setApplicationsLoading(true);
    setApplicationsError("");
    try {
      const result = await apiGetMyApplications(token);
      setApplications(result.map(mapMyApplication));
    } catch (error) {
      setApplicationsError(error.message || "Không thể tải đơn ứng tuyển của bạn.");
    } finally {
      setApplicationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    apiGetTutorProfile(token)
      .then((profile) => setProfileStatus(profile?.profileStatus || "INCOMPLETE"))
      .catch(() => setProfileStatus("INCOMPLETE"));
  }, [token]);

  useEffect(() => {
    setFeedPage(0);
    loadFeed(0);
  }, [loadFeed]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const isProfileActive = profileStatus === "ACTIVE";
  const activeFiltersCount = [selectedMode, selectedGradeGroup, selectedSort !== "newest"].filter(
    Boolean,
  ).length;

  const handleResetFilters = () => {
    setKeyword("");
    setSelectedMode("");
    setSelectedGradeGroup("");
    setSelectedSort("newest");
  };

  const handleOpenApplyModal = (cls) => {
    if (!isProfileActive) {
      showToast(
        "error",
        "Hồ sơ của bạn chưa được duyệt hoạt động. Vui lòng hoàn tất hồ sơ trước khi ứng tuyển.",
      );
      return;
    }
    if (cls.applied) {
      showToast("error", "Bạn đã ứng tuyển lớp này rồi.");
      return;
    }
    setApplyingClass(cls);
    setApplyMessage("");
    setApplyError("");
  };

  const handleConfirmApply = async (event) => {
    event.preventDefault();
    if (!applyingClass || submitting) return;

    if (!applyMessage.trim()) {
      setApplyError("Vui lòng nhập lời nhắn giới thiệu bản thân tới trung tâm.");
      return;
    }

    setSubmitting(true);
    setApplyError("");
    try {
      await apiApplyForClass(token, applyingClass.id, applyMessage.trim());
      setApplyingClass(null);
      showToast(
        "success",
        "Đơn ứng tuyển của bạn đã được gửi thành công. Trung tâm sẽ xem xét và thông báo kết quả.",
      );
      loadFeed(feedPage);
      loadApplications();
    } catch (error) {
      setApplyError(error.message || "Gửi đơn ứng tuyển thất bại.");
      if (error.status === 409 || error.status === 404) {
        loadFeed(feedPage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!cancelingClass || withdrawing) return;
    setWithdrawing(true);
    try {
      await apiWithdrawApplication(token, cancelingClass.applicationId);
      setCancelingClass(null);
      showToast("success", "Đã rút đơn ứng tuyển thành công.");
      loadFeed(feedPage);
      loadApplications();
    } catch (error) {
      setCancelingClass(null);
      showToast("error", error.message || "Không thể rút đơn ứng tuyển.");
      loadFeed(feedPage);
      loadApplications();
    } finally {
      setWithdrawing(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "my_applications") loadApplications();
  };

  const renderClassCard = (cls) => (
    <Card
      key={cls.id}
      className={clsx(
        "flex flex-col justify-between space-y-4 border-slate-200/80 p-5 transition-all dark:border-slate-800",
        cls.applied
          ? "border-blue-400 bg-slate-50/90 dark:border-blue-800 dark:bg-slate-900/60"
          : "hover:border-blue-400 dark:hover:border-blue-700",
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">{cls.gradeLevel || "Đang cập nhật"}</Badge>
            <Badge tone="slate">{cls.teachingMode}</Badge>
            {cls.applied && <Badge tone="emerald">Đã ứng tuyển</Badge>}
          </div>
          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <Clock size={12} /> {cls.postedDate}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50">
            {cls.subject || "Lớp cần gia sư"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mã lớp: <strong className="font-mono text-blue-600 dark:text-blue-400">{cls.code}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/60">
          <div>
            <span className="block text-[11px] text-slate-400">Khu vực:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.address}</span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Học phí:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {formatFee(cls.feePerSession)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Khung giờ học:</span>
            <span className="block truncate font-medium text-slate-800 dark:text-slate-200">
              {cls.schedule}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Yêu cầu gia sư:</span>
            <span className="block truncate font-medium text-slate-800 dark:text-slate-200">
              {cls.teacherRequirement}
            </span>
          </div>
        </div>

        {cls.applied && (
          <div className="space-y-1 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                Đã gửi đơn ứng tuyển
              </span>
              <span className="text-[10px] text-slate-400">{cls.appliedAtLabel || "Gần đây"}</span>
            </div>
            {cls.myMessage && (
              <p className="line-clamp-1 text-[11px] italic text-slate-600 dark:text-slate-400">
                Lời nhắn: {cls.myMessage}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link
          to={`/tutor/available-classes/${cls.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Xem chi tiết lớp
        </Link>

        {cls.applied ? (
          <button
            onClick={() => setCancelingClass(cls)}
            className="shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Hủy ứng tuyển
          </button>
        ) : (
          <button
            onClick={() => handleOpenApplyModal(cls)}
            disabled={!isProfileActive}
            className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            Ứng tuyển nhận lớp
          </button>
        )}
      </div>
    </Card>
  );

  const renderApplicationCard = (application) => (
    <Card
      key={application.applicationId}
      className="flex flex-col justify-between space-y-4 border-slate-200/80 p-5 transition-all dark:border-slate-800"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={application.statusTone}>{application.statusLabel}</Badge>
            {application.requestStatusLabel && (
              <Badge tone={application.requestStatusTone}>{application.requestStatusLabel}</Badge>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Ứng tuyển lúc {application.appliedAtLabel || "gần đây"}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50">
            {application.classInfo.subject || "Lớp cần gia sư"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mã lớp:{" "}
            <strong className="font-mono text-blue-600 dark:text-blue-400">
              {application.classInfo.code}
            </strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/60">
          <div>
            <span className="block text-[11px] text-slate-400">Khu vực:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {application.classInfo.address}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Học phí:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {formatFee(application.classInfo.feePerSession)}
            </span>
          </div>
        </div>

        {application.message && (
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="mb-0.5 block text-[11px] text-slate-400">Lời nhắn đã gửi:</span>
            <p className="italic">{application.message}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {application.requestStatus === "OPEN" ? (
          <Link
            to={`/tutor/available-classes/${application.classInfo.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Xem chi tiết lớp
          </Link>
        ) : (
          <span className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
            Lớp đã đóng nhận ứng tuyển
          </span>
        )}
        {application.canWithdraw && (
          <button
            onClick={() =>
              setCancelingClass({
                ...application.classInfo,
                applicationId: application.applicationId,
              })
            }
            className="shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Rút đơn
          </button>
        )}
      </div>
    </Card>
  );

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

      {cancelingClass && (
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
                onClick={() => setCancelingClass(null)}
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
                    {cancelingClass.code}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-400">Tên lớp:</span>{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {cancelingClass.subject}
                  </strong>
                </p>
              </div>
              <p className="text-[11px] italic text-slate-400">
                Sau khi hủy, đơn ứng tuyển sẽ bị xóa khỏi danh sách chờ duyệt của trung tâm. Bạn có
                thể gửi lại đơn nếu lớp vẫn còn mở.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelingClass(null)}
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

      {applyingClass && (
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
                      {applyingClass.code}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApplyingClass(null)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="space-y-4 text-xs">
              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {applyingClass.subject}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="text-slate-400">Hình thức:</span>{" "}
                    <strong>{applyingClass.teachingMode}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Khu vực:</span>{" "}
                    <strong>{applyingClass.address}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Học phí:</span>{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {formatFee(applyingClass.feePerSession)}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Cấp lớp:</span>{" "}
                    <strong>{applyingClass.gradeLevel || "Đang cập nhật"}</strong>
                  </p>
                  <p className="col-span-2">
                    <span className="text-slate-400">Khung giờ học:</span>{" "}
                    <strong>{applyingClass.schedule}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="apply-message"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Lời nhắn giới thiệu bản thân tới trung tâm{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="apply-message"
                  rows={4}
                  required
                  value={applyMessage}
                  onChange={(event) => setApplyMessage(event.target.value)}
                  placeholder="Nhập giới thiệu tóm tắt về năng lực, chứng chỉ, kinh nghiệm dạy học của bạn..."
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
                  onClick={() => setApplyingClass(null)}
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

      <PageHeader
        title="Lớp cần gia sư"
        description="Xem các lớp đang tuyển, lọc theo hình thức và cấp lớp rồi gửi đơn ứng tuyển tới trung tâm."
      />

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
                  Bạn vẫn xem được danh sách lớp, nhưng cần chờ trung tâm duyệt hồ sơ trước khi ứng
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

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange("feed")}
          className={clsx(
            "flex cursor-pointer items-center gap-2 border-b-2 px-4 pb-3 text-xs font-bold transition-colors",
            activeTab === "feed"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          <Briefcase size={16} />
          <span>Bảng tin lớp cần gia sư</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {feedTotalItems}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("my_applications")}
          className={clsx(
            "flex cursor-pointer items-center gap-2 border-b-2 px-4 pb-3 text-xs font-bold transition-colors",
            activeTab === "my_applications"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          <Send size={16} />
          <span>Đơn ứng tuyển của tôi</span>
          {applications.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "feed" && (
        <Card className="border-slate-200/80 p-4 transition-all dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo mã lớp (VD: LOP-ENG-0001), môn học, trường, khu vực..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-xs font-medium text-slate-800 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={clsx(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-all",
                  isFilterOpen || activeFiltersCount > 0
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                <Filter size={15} />
                <span>Bộ lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-blue-600">
                    {activeFiltersCount}
                  </span>
                )}
                {isFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {(activeFiltersCount > 0 || keyword) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Xóa tất cả bộ lọc"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {isFilterOpen && (
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Hình thức dạy
                </label>
                <select
                  value={selectedMode}
                  onChange={(event) => setSelectedMode(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">Tất cả hình thức</option>
                  <option value="ONLINE">Online</option>
                  <option value="AT_HOME">Tại nhà học sinh</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Cấp lớp
                </label>
                <select
                  value={selectedGradeGroup}
                  onChange={(event) => setSelectedGradeGroup(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">Tất cả cấp lớp</option>
                  {GRADE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Sắp xếp
                </label>
                <select
                  value={selectedSort}
                  onChange={(event) => setSelectedSort(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "feed" ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tìm thấy <strong className="text-blue-600 dark:text-blue-400">{feedTotalItems}</strong>{" "}
            lớp đang tuyển
          </p>

          {feedLoading && feedItems.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : feedError ? (
            <Card className="space-y-3 border-slate-200/80 py-12 text-center dark:border-slate-800">
              <AlertCircle size={32} className="mx-auto text-rose-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{feedError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFeed(feedPage)}
                className="cursor-pointer text-xs font-semibold"
              >
                Thử lại
              </Button>
            </Card>
          ) : feedItems.length === 0 ? (
            <Card className="space-y-2 border-slate-200/80 py-12 text-center text-slate-400 dark:border-slate-800">
              <AlertCircle size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Không tìm thấy lớp học nào phù hợp với bộ lọc.
              </p>
              <p className="text-xs">Vui lòng thử bấm nút "Đặt lại" bộ lọc để xem lại danh sách.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">{feedItems.map(renderClassCard)}</div>
          )}

          {feedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={feedPage <= 0 || feedLoading}
                onClick={() => loadFeed(feedPage - 1)}
                className="cursor-pointer text-xs font-semibold"
              >
                Trang trước
              </Button>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Trang {feedPage + 1} / {feedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={feedPage >= feedTotalPages - 1 || feedLoading}
                onClick={() => loadFeed(feedPage + 1)}
                className="cursor-pointer text-xs font-semibold"
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Bạn đã gửi{" "}
            <strong className="text-blue-600 dark:text-blue-400">{applications.length}</strong> đơn ứng
            tuyển
          </p>

          {applicationsLoading && applications.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : applicationsError ? (
            <Card className="space-y-3 border-slate-200/80 py-12 text-center dark:border-slate-800">
              <AlertCircle size={32} className="mx-auto text-rose-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {applicationsError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplications}
                className="cursor-pointer text-xs font-semibold"
              >
                Thử lại
              </Button>
            </Card>
          ) : applications.length === 0 ? (
            <Card className="space-y-2 border-slate-200/80 py-12 text-center text-slate-400 dark:border-slate-800">
              <AlertCircle size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Bạn chưa gửi đơn ứng tuyển cho lớp học nào.
              </p>
              <p className="text-xs">
                Chuyển sang tab "Bảng tin lớp cần gia sư" để chọn lớp và bấm ứng tuyển.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {applications.map(renderApplicationCard)}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: MapPin, label: "Khu vực chung", value: "Chỉ hiện quận/huyện, tỉnh thành" },
          { icon: DollarSign, label: "Học phí mỗi buổi", value: "Do trung tâm công bố trên lớp" },
          { icon: UserCheck, label: "Liên hệ phụ huynh", value: "Mở sau khi trung tâm ghép lớp" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <item.icon size={15} />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
