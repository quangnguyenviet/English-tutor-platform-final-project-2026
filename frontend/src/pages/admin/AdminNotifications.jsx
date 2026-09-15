import { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Search,
  Banknote,
  ClipboardList,
  UserPlus,
  Settings,
  Circle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";

const typeIcons = {
  payment: Banknote,
  match: ClipboardList,
  tutor_registration: UserPlus,
  system: Settings,
};

const typeTones = {
  payment: "emerald",
  match: "blue",
  tutor_registration: "amber",
  system: "slate",
};

const typeLabels = {
  payment: "Thanh toán",
  match: "Ghép lớp",
  tutor_registration: "Đăng ký GS",
  system: "Hệ thống",
};

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AdminNotifications() {
  const { notificationList, markNotificationRead, markAllNotificationsRead } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState("all"); // "all" | "unread" | "read"

  const unreadCount = notificationList.filter((n) => !n.read).length;
  const totalCount = notificationList.length;

  // Filter notifications
  const filtered = notificationList.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.from.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRead =
      readFilter === "all" ||
      (readFilter === "unread" && !n.read) ||
      (readFilter === "read" && n.read);

    return matchSearch && matchRead;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Thông báo"
        description="Nhận và quản lý thông báo từ gia sư, học sinh và hệ thống."
        actions={
          unreadCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={markAllNotificationsRead}
              className="text-blue-600 hover:text-blue-700"
            >
              <CheckCheck size={14} /> Đánh dấu tất cả đã đọc
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Bell}
          label="Tổng thông báo"
          value={totalCount}
          hint="Tất cả thông báo"
          tone="blue"
        />
        <StatCard
          icon={Circle}
          label="Chưa đọc"
          value={unreadCount}
          hint="Cần xem"
          tone="amber"
        />
        <StatCard
          icon={CheckCheck}
          label="Đã đọc"
          value={totalCount - unreadCount}
          hint="Đã xử lý"
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Read Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả", count: totalCount },
              { key: "unread", label: "Chưa đọc", count: unreadCount },
              { key: "read", label: "Đã đọc", count: totalCount - unreadCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReadFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  readFilter === tab.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                    readFilter === tab.key
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung, người gửi..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
            />
          </div>
        </div>
      </Card>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.map((notif, idx) => {
          const Icon = typeIcons[notif.type] || Bell;
          const tone = typeTones[notif.type] || "slate";
          const label = typeLabels[notif.type] || "Khác";

          return (
            <div
              key={notif.id}
              style={{ animationDelay: `${idx * 30}ms` }}
              onClick={() => {
                if (!notif.read) markNotificationRead(notif.id);
              }}
              className={`fade-slide-in flex items-start gap-3.5 rounded-xl border p-4 transition-all cursor-pointer ${
                notif.read
                  ? "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  : "border-blue-200 bg-blue-50/40 hover:border-blue-300 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  tone === "emerald"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : tone === "blue"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : tone === "amber"
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon size={18} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${notif.read ? "font-medium text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <Badge tone={tone}>{label}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(notif.createdAt)}
                  </span>
                  <span>Từ: {notif.from}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <BellOff size={36} className="text-slate-300 dark:text-slate-600" />
            <h4 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Không có thông báo nào
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              {readFilter === "unread"
                ? "Tất cả thông báo đã được đọc."
                : "Chưa có thông báo phù hợp với bộ lọc tìm kiếm."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotifications;
