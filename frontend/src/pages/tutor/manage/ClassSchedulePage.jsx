import { useState } from "react";
import { Pencil } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ClassScheduleLattice from "../../../components/tutor/ClassScheduleLattice";
import SessionListCard from "../../../components/tutor/SessionListCard";
import SessionDetailCard from "../../../components/tutor/SessionDetailCard";
import { startOfWeek, toISO } from "../../../components/tutor/FixedScheduleGrid";
import { todayISO } from "../../../lib/classroomApi";

/**
 * Tab "Lịch dạy" của workspace lớp gia sư (kế hoạch class-sessions Phase 2).
 * Thiết kế theo prototype /tutor/schedule: 1 cột dọc — lưới tuần compact trên,
 * danh sách buổi học của tuần bên dưới, chi tiết buổi học cuối.
 */
export default function ClassSchedulePage({
  detail,
  classId,
  onCreateSession,
  creatingSessionDate = null,
  createError = "",
  createErrorDate = null,
  onEditSchedules,
}) {
  const [weekStart, setWeekStart] = useState(() => toISO(startOfWeek(todayISO())));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
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
            Quản lý các lần diễn của ca cố định, buổi học thật và nhật ký của lớp.
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
        teachingMode={detail?.teachingMode}
        onCreateSession={onCreateSession}
        creatingSessionDate={creatingSessionDate}
        createError={createError}
        onSelectSession={setSelectedSessionId}
        selectedSessionId={selectedSessionId}
        sessionDates={detail?.sessionDates || []}
        createErrorDate={createErrorDate}
        onEditSchedules={onEditSchedules}
        onChanged={bumpRefresh}
        refreshKey={refreshKey}
      />

      <SessionListCard
        classId={classId}
        onSelectSession={setSelectedSessionId}
        selectedSessionId={selectedSessionId}
        refreshKey={refreshKey}
      />

      {/* Chi tiết buổi học — modal: chọn buổi từ lưới / danh sách thì mở lên */}
      <SessionDetailCard
        sessionId={selectedSessionId}
        onChanged={bumpRefresh}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
