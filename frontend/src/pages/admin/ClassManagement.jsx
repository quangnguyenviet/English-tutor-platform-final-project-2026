import { useState } from "react";
import { BookOpen, CheckCircle2, AlertCircle, Info } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import TrialReportTasks from "../operations/TrialReportTasks";

/**
 * Menu "Quản lý lớp học" (quản lý `classes`), 3 mục con:
 * - Lớp dạy thử (TRIAL, chưa có báo cáo) — chưa xây dựng màn hình, chỉ đặt tên.
 * - Lớp chính thức (ACTIVE) — chưa xây dựng màn hình, chỉ đặt tên.
 * - Dạy thử thất bại cần xử lý — hàng đợi report dạy thử thất bại (V32).
 * Theo quy định phạm vi hiện tại (mục 6, điểm 4), chỉ làm màn hình "Dạy thử thất bại cần xử lý".
 */
const SUB_TABS = [
  { key: "trial", label: "Lớp dạy thử", icon: BookOpen, placeholder: true },
  { key: "active", label: "Lớp chính thức", icon: CheckCircle2, placeholder: true },
  { key: "failed", label: "Dạy thử thất bại cần xử lý", icon: AlertCircle, placeholder: false },
];

const PLACEHOLDER_TEXT = {
  trial: "Lớp đang ở trạng thái dạy thử, chưa có báo cáo kết quả.",
  active: "Lớp đã kích hoạt chính thức.",
};

export default function ClassManagement() {
  const [tab, setTab] = useState("failed");
  const active = SUB_TABS.find((t) => t.key === tab) || SUB_TABS[2];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Quản lý lớp học" title="Quản lý lớp học" description="Theo dõi lớp dạy thử, lớp chính thức và xử lý các báo cáo dạy thử không thành công." />

      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === item.key
                ? "bg-amber-500 text-white shadow-xs"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {active.placeholder ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Info size={28} className="text-muted-foreground" />
          <p className="font-semibold text-foreground">{active.label}</p>
          <p className="max-w-md text-sm text-muted-foreground">{PLACEHOLDER_TEXT[active.key]}</p>
        </Card>
      ) : (
        <TrialReportTasks />
      )}
    </div>
  );
}
