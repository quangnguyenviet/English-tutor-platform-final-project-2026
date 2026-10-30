import { useState } from "react";
import { Pencil } from "lucide-react";
import Button from "../../../components/ui/Button";
import ClassScheduleLattice from "../../../components/tutor/ClassScheduleLattice";
import SessionListCard from "../../../components/tutor/SessionListCard";
import SessionDetailCard from "../../../components/tutor/SessionDetailCard";
import { startOfWeek, toISO } from "../../../components/tutor/FixedScheduleGrid";
import { todayISO } from "../../../lib/classroomApi";

/**
 * Tab "Lịch dạy" của workspace lớp gia sư (kế hoạch class-sessions Phase 2).
 * Cột trái: lattice tuần (ô SESSION / EXCEPTION / OCCURRENCE).
 * Cột phải: danh sách buổi học thật + chi tiết & hành động (trạng thái,
 * sửa/dời, nhật ký). 2 cột xếp chồng trên mobile.
 */
export default function ClassSchedulePage({
  detail,
  classId,
  onCreateSession,
  creatingSessionDate = null,
  createError = "",
  onEditSchedules,
}) {
  const [weekStart, setWeekStart] = useState(() => toISO(startOfWeek(todayISO())));
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="space-y-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Cột trái — lattice tuần */}
        <div className="lg:col-span-7">
          <ClassScheduleLattice
            classId={classId}
            weekStart={weekStart}
            onWeekStartChange={setWeekStart}
            teachingMode={detail?.teachingMode}
            onCreateSession={onCreateSession}
            creatingSessionDate={creatingSessionDate}
            createError={createError}
            onSelectSession={setSelectedSessionId}
            sessionDates={detail?.sessionDates || []}
            onChanged={bumpRefresh}
            refreshKey={refreshKey}
          />
        </div>

        {/* Cột phải — danh sách + chi tiết */}
        <div className="space-y-4 lg:col-span-5">
          <SessionListCard
            classId={classId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectSession={setSelectedSessionId}
            selectedSessionId={selectedSessionId}
            refreshKey={refreshKey}
          />
          <SessionDetailCard sessionId={selectedSessionId} onChanged={bumpRefresh} />
        </div>
      </div>
    </div>
  );
}
