import { useState } from "react";
import {
  ShieldCheck,
  GraduationCap,
  Bot,
  Search,
  Filter,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Server,
  Lock,
} from "lucide-react";
import { activityLogs } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";

const actionMeta = {
  approve_tutor: { label: "Duyệt gia sư", tone: "emerald" },
  approve_payment: { label: "Duyệt phí VietQR", tone: "emerald" },
  create_match_offer: { label: "Tạo Match Offer", tone: "blue" },
  add_student: { label: "Thêm học sinh", tone: "blue" },
  mark_paid: { label: "Thu học phí", tone: "emerald" },
  create_exercise: { label: "Tạo bài tập", tone: "neutral" },
  reply_parent: { label: "Trả lời phụ huynh", tone: "neutral" },
  ai_grade: { label: "AI chấm bài", tone: "slate" },
  rbac_permission_change: { label: "Phân quyền RBAC", tone: "amber" },
};

const roleMeta = {
  admin: { label: "Admin", Icon: ShieldCheck, color: "text-blue-500" },
  tutor: { label: "Gia sư", Icon: GraduationCap, color: "text-emerald-500" },
  system: { label: "Hệ thống AI", Icon: Bot, color: "text-sky-500" },
};

const filterOpts = [
  { key: "all", label: "Tất cả vai trò" },
  { key: "admin", label: "Quản trị viên (Admin)" },
  { key: "tutor", label: "Gia sư" },
  { key: "system", label: "Hệ thống tự động" },
];

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

export function AdminLogs() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = activityLogs.filter((l) => {
    const matchRole = roleFilter === "all" || l.role === roleFilter;
    const matchSearch =
      l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.ipAddress && l.ipAddress.includes(searchQuery)) ||
      (l.action && l.action.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchRole && matchSearch;
  });

  const adminCount = activityLogs.filter((l) => l.role === "admin").length;
  const tutorCount = activityLogs.filter((l) => l.role === "tutor").length;
  const systemCount = activityLogs.filter((l) => l.role === "system").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hoạt động & Audit Trail"
        description="Lịch sử kiểm soát an ninh, ghi nhận thao tác của Admin, Gia sư và Hệ thống AI (FR-19, FR-20)."
      />

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Tổng số sự kiện audit"
          value={activityLogs.length}
          hint="Toàn bộ lịch sử thao tác"
          tone="blue"
        />
        <StatCard
          icon={ShieldCheck}
          label="Tác vụ Quản trị viên"
          value={adminCount}
          hint="Phê duyệt, phân quyền, ghép lớp"
          tone="blue"
        />
        <StatCard
          icon={GraduationCap}
          label="Tác vụ Gia sư"
          value={tutorCount}
          hint="Giao bài tập, phản hồi phụ huynh"
          tone="emerald"
        />
        <StatCard
          icon={Bot}
          label="Tác vụ Hệ thống & AI"
          value={systemCount}
          hint="Tự động chấm, phân tích dữ liệu"
          tone="slate"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterOpts.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRoleFilter(opt.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  roleFilter === opt.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {opt.label}
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
              placeholder="Tìm theo người thực hiện, chi tiết, IP..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Entries List */}
      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((log, idx) => {
            const rm = roleMeta[log.role] ?? {
              label: log.role,
              Icon: ShieldCheck,
              color: "text-slate-500",
            };
            const am = actionMeta[log.action] ?? { label: log.action, tone: "neutral" };
            const { Icon } = rm;

            return (
              <div
                key={log.id}
                style={{ animationDelay: `${idx * 35}ms` }}
                className="fade-slide-in flex items-start gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Role Avatar/Icon */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Icon size={17} className={rm.color} />
                </div>

                {/* Main Detail */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {log.actor}
                    </span>
                    <Badge tone={am.tone}>{am.label}</Badge>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {rm.label}
                    </span>
                    {log.status === "warning" && (
                      <Badge tone="amber">Cảnh báo bảo mật</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">{log.detail}</p>

                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400 font-mono">
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    {log.entityType && (
                      <span>
                        Thực thể: {log.entityType} #{log.entityId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right">
                  <span className="whitespace-nowrap font-mono text-xs text-slate-400">
                    {formatTs(log.ts)}
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Không tìm thấy sự kiện nào phù hợp với điều kiện lọc.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminLogs;
