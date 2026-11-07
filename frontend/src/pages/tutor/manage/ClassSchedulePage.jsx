import { useState } from "react";
import { Pencil } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ClassScheduleLattice from "../../../components/tutor/ClassScheduleLattice";
import { startOfWeek, toISO, todayISO } from "../../../lib/classroomApi";

/**
 * Tab "Lịch dạy" của workspace lớp gia sư (V16: lattice ca dạy +
 * overlay ngoại lệ + nhật ký dạy học). 1 cột dọc — lưới tuần compact;
 * nhật ký dạy học (kiến thức + dặn dò) ghi trực tiếp trong lưới (modal
 * "ghi nhật ký" của ô ca), không còn tạo buổi học on-demand.
 */
export default function ClassSchedulePage({
  detail,
  classId,
  onEditSchedules,
}) {
  const [weekStart, setWeekStart] = useState(() => toISO(startOfWeek(todayISO())));
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {detail?.className || "Chi tiết lớp"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
            {detail && (
              <Badge tone={detail.statusTone} size="xs">
                {detail.statusLabel}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quản lý các ca dạy, ngoại lệ (hủy / dời) và nhật ký dạy học của lớp.
          </p>
        </div>
        {onEditSchedules && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditSchedules}
            className="cursor-pointer text-xs font-semibold"
          >
            <Pencil size={13} /> Chỉnh sửa lịch
          </Button>
        )}
      </div>

      <ClassScheduleLattice
        classId={classId}
        weekStart={weekStart}
        onWeekStartChange={setWeekStart}
        // sessionDates = các ngày đã có nhật ký dạy học (teaching_logs) — V16.
        sessionDates={detail?.sessionDates || []}
        onChanged={bumpRefresh}
        refreshKey={refreshKey}
      />
    </div>
  );
}
