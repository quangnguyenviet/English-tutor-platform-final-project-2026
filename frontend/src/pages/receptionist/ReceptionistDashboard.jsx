import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Banknote,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Bell,
  GraduationCap,
  UserCog,
  FileWarning,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

const fmtVND = (n) => n.toLocaleString("vi-VN") + "₫";

export default function ReceptionistDashboard() {
  const {
    tutorList,
    studentList,
    matchRequestList,
    paymentProofList,
    complaintList,
    notificationList = [],
  } = useAuth();

  const [notification, setNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const pendingMatches = matchRequestList?.filter((r) => r.status === "pending") || [];
  const pendingPayments = paymentProofList?.filter((p) => p.status === "pending") || [];
  const pendingComplaints = complaintList?.filter((c) => c.status === "pending") || [];
  const unreadNotifs = notificationList?.filter((n) => !n.read) || [];

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showNotification("Dữ liệu đã được đồng bộ mới nhất.");
    }, 500);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl fade-slide-in">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Bảng điều khiển lễ tân"
          description="Hỗ trợ vận hành trung tâm: ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, xử lý khiếu nại."
        />
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Đồng bộ</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-blue-900/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Yêu cầu ghép lớp</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{matchRequestList.length}</span>
            <span className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
              {pendingMatches.length} chờ xử lý
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-emerald-900/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Thanh toán chờ duyệt</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <Banknote size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{pendingPayments.length}</span>
            <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              minh chứng
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-rose-900/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Khiếu nại chưa xử lý</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{pendingComplaints.length}</span>
            <span className="text-xs font-medium text-slate-500">/ {complaintList.length} tổng</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-5 shadow-sm transition hover:shadow-md dark:border-amber-900/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Thông báo mới</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <Bell size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{unreadNotifs.length}</span>
            <span className="text-xs font-medium text-slate-500">chưa đọc</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={15} className="text-blue-500" /> Thao tác nhanh & Điều hướng nghiệp vụ
          </h2>
          <span className="text-[11px] font-medium text-slate-400">6 chức năng lễ tân</span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Link
            to="/receptionist/match-requests"
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
                Ghép lớp
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingMatches.length} chờ xử lý
              </p>
            </div>
          </Link>

          <Link
            to="/receptionist/payments"
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
                {pendingPayments.length} minh chứng
              </p>
            </div>
          </Link>

          <Link
            to="/receptionist/tutors"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white shadow-sm group-hover:scale-105 transition-transform dark:bg-slate-700">
                <UserCog size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Quản lý Gia sư
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tutorList.length} gia sư
              </p>
            </div>
          </Link>

          <Link
            to="/receptionist/students"
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
                {studentList.length} học sinh
              </p>
            </div>
          </Link>

          <Link
            to="/receptionist/complaints"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-rose-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <FileWarning size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Xử lý khiếu nại
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingComplaints.length} chưa xử lý
              </p>
            </div>
          </Link>

          <Link
            to="/receptionist/notifications"
            className="group relative flex flex-col justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-amber-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Bell size={20} />
              </div>
              <ArrowUpRight size={15} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Thông báo
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {unreadNotifs.length} tin mới
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent complaints preview */}
      {complaintList.length > 0 && (
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-rose-500" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-50">Khiếu nại gần đây</h2>
            </div>
            <Link to="/receptionist/complaints" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Xem tất cả ({complaintList.length}) &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {complaintList.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge tone={c.type === "REFUND" ? "rose" : "blue"}>
                    {c.type === "REFUND" ? "Hoàn tiền" : "Ghép lại"}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{c.complainantName} — {c.classInfo}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.description}</p>
                  </div>
                </div>
                <Badge tone={c.status === "pending" ? "amber" : "emerald"}>{c.statusLabel}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
