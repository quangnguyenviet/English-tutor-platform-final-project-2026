import {
  Clock,
  RotateCcw,
  Undo2,
  Banknote,
  TrendingUp,
  Wallet,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";

const fmtVND = (n) => n.toLocaleString("vi-VN") + "₫";

// Dữ liệu tạm thời (mock) — sẽ thay bằng GET /api/v1/accounting/dashboard khi nối API thật.
const KPIS = [
  { icon: Clock, tone: "amber", label: "Khoản phí chờ xác nhận", value: 6, hint: "Trạng thái SUBMITTED" },
  { icon: RotateCcw, tone: "rose", label: "Minh chứng chờ nộp lại", value: 2, hint: "RESUBMIT_REQUIRED" },
  { icon: Undo2, tone: "violet", label: "Yêu cầu hoàn tiền chờ xử lý", value: 3, hint: "PENDING từ Lễ tân" },
  { icon: Banknote, tone: "emerald", label: "Tiền thu trong tháng", value: fmtVND(18_400_000), hint: "Đã xác nhận" },
  { icon: Undo2, tone: "sky", label: "Tiền hoàn trong tháng", value: fmtVND(1_200_000), hint: "Đã hoàn thành công" },
  { icon: TrendingUp, tone: "blue", label: "Doanh thu thuần", value: fmtVND(17_200_000), hint: "Thu − Hoàn" },
  { icon: Wallet, tone: "slate", label: "Tổng công nợ hiện tại", value: fmtVND(5_600_000), hint: "Phí chưa hoàn tất" },
];

export default function AccountantDashboard() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kế toán"
        title={`Xin chào, ${session?.name || "Kế toán"}`}
        description="Tổng quan dòng tiền và các khoản cần xử lý trong ca làm việc."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <StatCard
            key={k.label}
            icon={k.icon}
            tone={k.tone}
            label={k.label}
            value={k.value}
            hint={k.hint}
          />
        ))}
      </div>

      {/* Thông báo giai đoạn phát triển */}
      <Card className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <BarChart2 size={20} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Khu làm việc Kế toán
            </h2>
            <Badge tone="amber">Đang phát triển</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quyền truy cập cho vai trò Kế toán đã được mở. Các màn hình nghiệp vụ (đối chiếu
            khoản phí, xử lý hoàn tiền, thống kê &amp; xuất báo cáo) sẽ được bổ sung ở các giai
            đoạn tiếp theo. Số liệu hiển thị hiện là dữ liệu mẫu.
          </p>
          <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-400 dark:text-slate-500">
            <ArrowRight size={13} />
            Tài khoản này được tạo từ chức năng Quản lý nhân sự của Quản trị viên.
          </p>
        </div>
      </Card>
    </div>
  );
}
