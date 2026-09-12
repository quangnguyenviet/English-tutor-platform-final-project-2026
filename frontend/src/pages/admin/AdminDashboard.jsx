import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Clock,
  ShieldCheck,
  GraduationCap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Banknote,
  Activity,
  ArrowUpRight,
  Cpu,
  Bot,
  Database,
  Zap,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Receipt,
  FileCheck,
  AlertCircle,
  ChevronRight,
  Unlock,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { activityLogs, revenueData } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

const statusMeta = {
  active: { label: "Đang hoạt động", tone: "emerald" },
  inactive: { label: "Ngưng hoạt động", tone: "slate" },
  pending: { label: "Chờ duyệt", tone: "amber" },
};

const actionLabel = {
  approve_tutor: "Duyệt gia sư",
  add_student: "Thêm học sinh",
  approve_payment: "Duyệt học phí QR",
  create_match_offer: "Tạo Match Offer",
  mark_paid: "Thu học phí",
  create_exercise: "Tạo bài tập",
  reply_parent: "Trả lời phụ huynh",
  ai_grade: "AI chấm bài",
  rbac_permission_change: "Phân quyền RBAC",
};

const fmtMil = (n) => (n / 1_000_000).toFixed(1) + "M";
const fmtVND = (n) => n.toLocaleString("vi-VN") + "₫";

function formatTs(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

export function AdminDashboard() {
  const {
    tutorList,
    updateTutor,
    studentList,
    matchRequestList,
    paymentProofList,
    approvePaymentProof,
  } = useAuth();

  const [timeframe, setTimeframe] = useState("month");
  const [notification, setNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTabPending, setActiveTabPending] = useState("tutors"); // "tutors" | "matches" | "payments"

  // Tutor metrics
  const activeCount = tutorList.filter((t) => t.status === "active").length;
  const pendingCount = tutorList.filter((t) => t.status === "pending").length;
  const pendingTutors = tutorList.filter((t) => t.status === "pending");

  // Student metrics
  const assignedCount = studentList.filter((s) => s.assignedTutorId).length;
  const unassignedCount = studentList.length - assignedCount;
  const assignedPercentage = studentList.length
    ? Math.round((assignedCount / studentList.length) * 100)
    : 0;

  // Match Request & Payment metrics
  const pendingMatches = matchRequestList?.filter((r) => r.status === "pending") || [];
  const pendingPayments = paymentProofList?.filter((p) => p.status === "pending") || [];

  // Financial metrics
  const currentRevenue = revenueData[revenueData.length - 1];
  const prevRevenue = revenueData[revenueData.length - 2];
  const growthRate = prevRevenue
    ? Math.round(((currentRevenue.total - prevRevenue.total) / prevRevenue.total) * 100)
    : 12;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleApproveTutor = (tutorId, name) => {
    updateTutor(tutorId, { status: "active" });
    showNotification(`Đã phê duyệt thành công tài khoản gia sư ${name}!`);
  };

  const handleRejectTutor = (tutorId, name) => {
    updateTutor(tutorId, { status: "inactive" });
    showNotification(`Đã từ chối gia sư ${name}.`);
  };

  const handleApprovePaymentQuick = (payment) => {
    approvePaymentProof(payment.id);
    showNotification(`Đã duyệt phí ${fmtVND(payment.amount)} cho gia sư ${payment.tutorName}!`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showNotification("Dữ liệu bảng điều khiển đã được đồng bộ mới nhất.");
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification with subtle fadeSlideIn */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-950 fade-slide-in">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner & Timeframe Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Bảng điều khiển quản trị"
          description="Điều hành trung tâm gia sư: phân công ghép lớp, duyệt phí VietQR, giám sát gia sư & học sinh."
        />

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {[
              { id: "today", label: "Hôm nay" },
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-[0.98] ${
                  timeframe === tf.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Đồng bộ</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid (4 Asymmetric Stat Cards - DESIGN.md compliant) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Gia sư */}
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-blue-900/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Đội ngũ gia sư
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {tutorList.length}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={14} /> {activeCount} hoạt động
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chờ phê duyệt:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {pendingCount} gia sư
            </span>
          </div>
        </div>

        {/* Card 2: Học sinh (Indigo / Slate accent - No Purple) */}
        <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-indigo-900/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Học sinh đăng ký
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {studentList.length}
            </span>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {assignedPercentage}% đã phân công
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chưa có gia sư:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {unassignedCount} học sinh
            </span>
          </div>
        </div>

        {/* Card 3: Yêu cầu Ghép lớp (Match Requests - FR-16) */}
        <div className="relative overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-500/10 via-white to-sky-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-sky-900/30 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Yêu cầu ghép lớp
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {matchRequestList.length}
            </span>
            <span className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
              {pendingMatches.length} chờ xử lý
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Đã ghép thành công:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {matchRequestList.filter((r) => r.status === "matched").length} lớp
            </span>
          </div>
        </div>

        {/* Card 4: Doanh thu & Thu học phí */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-emerald-900/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Doanh thu tháng
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <Banknote size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {fmtMil(currentRevenue.total)}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={14} className="mr-0.5" /> +{growthRate}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Đã thu: {fmtMil(currentRevenue.collected)}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Còn nợ {fmtMil(currentRevenue.pending)}
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Action Center: Tabbed Pending Requests */}
      {(pendingTutors.length > 0 || pendingMatches.length > 0 || pendingPayments.length > 0) && (
        <Card padded={false} className="border-amber-200 shadow-sm dark:border-amber-800/40">
          <div className="flex flex-col gap-3 border-b border-amber-200 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  Trung tâm xử lý tác vụ chờ duyệt
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Các mục cần quản trị viên xem xét và xử lý ngay trong ngày.
                </p>
              </div>
            </div>

            {/* Sub-tabs for pending items */}
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 p-1 dark:bg-slate-800/80 border border-amber-200/60 dark:border-amber-900/40">
              <button
                onClick={() => setActiveTabPending("tutors")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  activeTabPending === "tutors"
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                Gia sư mới ({pendingTutors.length})
              </button>
              <button
                onClick={() => setActiveTabPending("matches")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  activeTabPending === "matches"
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                Ghép lớp ({pendingMatches.length})
              </button>
              <button
                onClick={() => setActiveTabPending("payments")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  activeTabPending === "payments"
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                Phí VietQR ({pendingPayments.length})
              </button>
            </div>
          </div>

          {/* Pending Tutors Tab */}
          {activeTabPending === "tutors" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingTutors.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">
                  Không có gia sư nào đang chờ duyệt.
                </p>
              ) : (
                pendingTutors.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar initials={t.initials} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                          <Badge tone="amber">Chờ duyệt</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.email} &bull; SĐT: {t.phone || "Chưa cập nhật"} &bull; {t.specialization.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleApproveTutor(t.id, t.name)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle size={14} /> Duyệt tài khoản
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRejectTutor(t.id, t.name)}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <XCircle size={14} /> Từ chối
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending Matches Tab */}
          {activeTabPending === "matches" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingMatches.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">
                  Tất cả yêu cầu ghép lớp đã được tạo Match Offer.
                </p>
              ) : (
                pendingMatches.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          Học sinh: {r.studentName} ({r.grade})
                        </p>
                        <Badge tone="blue">Trình độ {r.currentLevel}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Mục tiêu: {r.targetGoal}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PH: {r.parentName} &bull; Lịch học: {r.preferredSchedule} &bull; Ngân sách: {fmtVND(r.budgetPerSession)}/b
                      </p>
                    </div>
                    <Link to="/admin/match-requests">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                        <Zap size={14} /> Tạo Match Offer &rarr;
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending Payments Tab */}
          {activeTabPending === "payments" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingPayments.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">
                  Không có biên lai nộp phí nào đang chờ duyệt.
                </p>
              ) : (
                pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          Gia sư: {p.tutorName}
                        </p>
                        <span className="text-xs text-slate-400">&rarr; Lớp {p.studentName}</span>
                        <Badge tone="amber">Chờ duyệt</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mã GD: <strong className="font-mono text-slate-700 dark:text-slate-200">{p.transactionCode}</strong> &bull; {p.bankName} &bull; Số tiền:{" "}
                        <strong className="text-blue-600 dark:text-blue-400 font-mono">{fmtVND(p.amount)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to="/admin/payments">
                        <Button size="sm" variant="secondary">
                          Xem minh chứng
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleApprovePaymentQuick(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle size={14} /> Duyệt & Mở khóa
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions Shortcuts (6 Asymmetric Navigation Cards) */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={15} className="text-blue-500" /> Thao tác nhanh & Điều hướng nghiệp vụ
          </h2>
          <span className="text-[11px] font-medium text-slate-400">6 chức năng quản trị</span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Action 1: Yêu cầu Ghép lớp (FR-16) */}
          <Link
            to="/admin/match-requests"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <ClipboardList size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Ghép lớp & Đề nghị
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingMatches.length} yêu cầu chờ xử lý
              </p>
            </div>
          </Link>

          {/* Action 2: Duyệt phí VietQR (FR-23) */}
          <Link
            to="/admin/payments"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Banknote size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Duyệt thanh toán
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingPayments.length} minh chứng chờ duyệt
              </p>
            </div>
          </Link>

          {/* Action 3: Quản lý Gia sư */}
          <Link
            to="/admin/tutors"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white shadow-sm group-hover:scale-105 transition-transform dark:bg-slate-700">
                <Users size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Quản lý Gia sư
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tutorList.length} hồ sơ giáo viên
              </p>
            </div>
          </Link>

          {/* Action 4: Quản lý Học sinh */}
          <Link
            to="/admin/students"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <GraduationCap size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Quản lý Học sinh
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {studentList.length} học viên đang theo học
              </p>
            </div>
          </Link>

          {/* Action 5: Báo cáo & Phân tích (FR-24) */}
          <Link
            to="/admin/analytics"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-sky-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <TrendingUp size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Báo cáo & Tài chính
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Doanh thu, nợ phí & kỹ năng
              </p>
            </div>
          </Link>

          {/* Action 6: Nhật ký Audit (FR-19, FR-20) */}
          <Link
            to="/admin/logs"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Nhật ký hoạt động
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail & bảo mật RBAC
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Core Revenue Chart + System Health Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Revenue Trend Chart (2 columns) */}
        <Card padded={false} className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                Xu hướng doanh thu & Thu học phí theo tháng
              </h2>
            </div>
            <Link to="/admin/analytics" className="text-xs font-medium accent-link">
              Chi tiết tài chính &rarr;
            </Link>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [fmtVND(v), name]} />
                <Bar dataKey="collected" name="Đã thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Còn nợ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Live System Health Widget (1 column) */}
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                Trạng thái hệ thống
              </h2>
            </div>
            <Badge tone="emerald">Hoạt động tốt</Badge>
          </div>

          <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800 text-xs">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Cpu size={16} className="text-blue-500" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">AI Tutor Assistant API</p>
                  <p className="text-[10px] text-slate-400">LangGraph Agent &bull; P95: 1.8s</p>
                </div>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Bot size={16} className="text-sky-500" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">Telegram Parent Bot</p>
                  <p className="text-[10px] text-slate-400">Webhook connected &bull; Auto-reply</p>
                </div>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Database size={16} className="text-amber-500" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">PostgreSQL & S3 Storage</p>
                  <p className="text-[10px] text-slate-400">Sync: OK &bull; Ping 12ms</p>
                </div>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Synced</span>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">Tải tài nguyên máy chủ</p>
                  <p className="text-[10px] text-slate-400">RAM: 1.4 GB / 4.0 GB &bull; CPU: 24%</p>
                </div>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ổn định</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tutor & Student Distribution Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tutor list preview */}
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Đội ngũ gia sư nổi bật
            </h2>
            <Link to="/admin/tutors" className="text-xs font-medium accent-link">
              Quản lý tất cả ({tutorList.length}) &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tutorList.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4">
                <Avatar initials={t.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {t.specialization.slice(0, 2).join(", ")}
                    {t.specialization.length > 2 && ` +${t.specialization.length - 2}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{t.studentsCount} học sinh</span>
                  <Badge tone={statusMeta[t.status]?.tone}>{statusMeta[t.status]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Student list preview */}
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Danh sách học sinh mới
            </h2>
            <Link to="/admin/students" className="text-xs font-medium accent-link">
              Quản lý phân công ({studentList.length}) &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {studentList.slice(0, 4).map((s) => {
              const tutor = tutorList.find((t) => t.id === s.assignedTutorId);
              return (
                <div key={s.id} className="flex items-center gap-4 p-4">
                  <Avatar initials={s.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.goal}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="neutral">{s.level}</Badge>
                    {tutor ? (
                      <span className="text-xs text-slate-400">{tutor.name}</span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500">Chưa gán gia sư</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity Audit Trail */}
      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Nhật ký hoạt động hệ thống & Audit Trail gần đây (FR-19)
            </h2>
          </div>
          <Link to="/admin/logs" className="text-xs font-medium accent-link">
            Xem toàn bộ nhật ký &rarr;
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activityLogs.slice(0, 5).map((log, idx) => (
            <div
              key={log.id}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="fade-slide-in flex items-center justify-between gap-3 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                  {log.actor.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-white">{log.actor}</span>: {log.detail}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatTs(log.ts)} {log.ipAddress && `&bull; IP: ${log.ipAddress}`}
                  </p>
                </div>
              </div>
              <Badge tone="neutral" className="shrink-0 text-xs">
                {actionLabel[log.action] ?? log.action}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboard;
