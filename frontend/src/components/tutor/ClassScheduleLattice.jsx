import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Loader2,
  Pencil,
  Play,
  X,
} from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import ConfirmModal from "../ui/ConfirmModal";
import ExceptionForm from "./ExceptionForm";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import {
  EXCEPTION_TYPE_META,
  apiCreateException,
  apiDeleteException,
  apiGetClassSchedule,
  dayOfWeekLabel,
  formatSessionDate,
  formatSessionTime,
  todayISO,
} from "../../lib/classroomApi";
import { startOfWeek, toISO } from "./FixedScheduleGrid";

const MODAL_TITLES = {
  CANCELLED: "Hủy buổi học này",
  RESCHEDULED: "Dời buổi học này",
  MODIFIED: "Sửa chi tiết buổi học",
};

/** 7 ngày (Thứ 2 → Chủ nhật) của tuần có mốc weekStart. */
function weekDays(weekStartISO) {
  const first = startOfWeek(weekStartISO);
  const today = todayISO();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    const iso = toISO(date);
    const isoDay = date.getDay() || 7;
    return { iso, label: dayOfWeekLabel(isoDay), isToday: iso === today };
  });
}

/**
 * Lattice tuần (kế hoạch class-sessions Card 1): mỗi ô là 1 lần diễn (ca × ngày),
 * render theo source SESSION / EXCEPTION / OCCURRENCE từ API thật. Ô ảo tác động
 * bằng overlay exception (hủy / dời / sửa chi tiết); ô có buổi học thật chọn vào
 * chi tiết Card 3.
 */
export default function ClassScheduleLattice({
  classId,
  weekStart,
  onWeekStartChange,
  teachingMode = "ONLINE",
  onCreateSession,
  creatingSessionDate = null,
  createError = "",
  onSelectSession,
  onChanged,
  refreshKey = 0,
  sessionDates = [],
}) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(null); // { slot, exceptionType }
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // occurrence cần gỡ exception
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    if (!token || !classId || !weekStart) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetClassSchedule(token, classId, weekStart);
      setData(result);
    } catch (err) {
      setError(err.message || "Không thể tải lịch dạy tuần.");
    } finally {
      setLoading(false);
    }
  }, [token, classId, weekStart]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const occurrencesByDate = useMemo(() => {
    const map = new Map();
    for (const occ of data?.occurrences || []) {
      if (!map.has(occ.date)) map.set(occ.date, []);
      map.get(occ.date).push(occ);
    }
    return map;
  }, [data]);

  const handleShiftWeek = (direction) => {
    const next = startOfWeek(weekStart);
    next.setDate(next.getDate() + direction * 7);
    onWeekStartChange(toISO(next));
  };

  const openExceptionModal = (occ, exceptionType) => {
    setModalError("");
    setModal({ slot: occ, exceptionType });
  };

  const closeExceptionModal = () => {
    setModal(null);
    setModalError("");
  };

  const handleCreateException = async (payload) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setModalError("");
    try {
      await apiCreateException(token, classId, payload);
      closeExceptionModal();
      onChanged?.();
    } catch (err) {
      setModalError(err.message || "Không thể ghi ngoại lệ lịch dạy.");
    } finally {
      setSubmitting(false);
    }
  };

  const askDeleteException = (occ) => {
    setDeleteError("");
    setDeleteTarget(occ);
  };

  const handleDeleteException = async () => {
    if (!token || !deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await apiDeleteException(
        token,
        classId,
        deleteTarget.scheduleId,
        deleteTarget.date,
      );
      setDeleteTarget(null);
      onChanged?.();
    } catch (err) {
      setDeleteError(err.message || "Không thể gỡ ngoại lệ.");
    } finally {
      setDeleting(false);
    }
  };

  // Render nội dung 1 ô theo source
  const renderCellContent = (occ) => {
    if (occ.source === "SESSION") {
      const session = occ.session || {};
      return (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
            {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
          </p>
          <Badge tone={session.statusTone || "slate"} size="xs">
            {session.statusLabel || session.status}
          </Badge>
          <button
            type="button"
            onClick={() => onSelectSession?.(session.sessionId)}
            className={clsx(
              "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
              "bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.98] dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
            )}
          >
            <Play size={12} /> Chi tiết buổi học
          </button>
        </div>
      );
    }

    if (occ.source === "EXCEPTION") {
      const exc = occ.exception || {};
      const meta = EXCEPTION_TYPE_META[exc.type] || { label: exc.type, tone: "slate" };
      return (
        <div className="space-y-1.5">
          <Badge tone={meta.tone} size="xs">
            {meta.label}
          </Badge>
          {exc.type === "RESCHEDULED" ? (
            <p className="text-[11px] text-slate-700 dark:text-slate-200">
              Sang <strong>{exc.newDateLabel}</strong>
              {exc.timeLabel ? <span> · {exc.timeLabel}</span> : null}
            </p>
          ) : null}
          {exc.type === "CANCELLED" && exc.reason ? (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={exc.reason}>
              {exc.reason}
            </p>
          ) : null}
          {(exc.type === "MODIFIED" || exc.type === "RESCHEDULED") &&
          exc.newTeachingMode ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {exc.modeLabel}
              {exc.newMeetingUrl ? " · có link phòng học" : ""}
              {exc.newLocation ? ` · ${exc.newLocation}` : ""}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => askDeleteException(occ)}
            className={clsx(
              "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
              "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
            )}
          >
            <Eraser size={12} /> Gỡ ngoại lệ
          </button>
        </div>
      );
    }

    // OCCURRENCE — ô ảo
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
          <Clock size={11} className="shrink-0 text-blue-500 dark:text-blue-400" />
          {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
        </p>
        <button
          type="button"
          onClick={() =>
            onCreateSession?.(occ.date, formatSessionTime(occ.startTime), occ.dateLabel)
          }
          disabled={creatingSessionDate !== null}
          className={clsx(
            "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
            "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
          )}
        >
          {creatingSessionDate === occ.date ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CalendarPlus size={12} />
          )}
          Tạo buổi học
        </button>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => openExceptionModal(occ, "CANCELLED")}
            className="cursor-pointer rounded-lg border border-slate-200 px-1 py-1 text-[10px] font-bold text-rose-600 transition-all hover:bg-rose-50 active:scale-[0.98] dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => openExceptionModal(occ, "RESCHEDULED")}
            className="cursor-pointer rounded-lg border border-slate-200 px-1 py-1 text-[10px] font-bold text-amber-600 transition-all hover:bg-amber-50 active:scale-[0.98] dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/40"
          >
            Dời
          </button>
          <button
            type="button"
            onClick={() => openExceptionModal(occ, "MODIFIED")}
            className="cursor-pointer rounded-lg border border-slate-200 px-1 py-1 text-[10px] font-bold text-sky-600 transition-all hover:bg-sky-50 active:scale-[0.98] dark:border-sky-900/50 dark:text-sky-400 dark:hover:bg-sky-950/40"
          >
            Sửa chi tiết
          </button>
        </div>
      </div>
    );
  };

  const hasAnyOccurrences = days.some((day) =>
    (occurrencesByDate.get(day.iso) || []).length > 0,
  );

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch dạy tuần</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftWeek(-1)}
            aria-label="Tuần trước"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="min-w-[120px] text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {formatSessionDate(days[0].iso)} - {formatSessionDate(days[6].iso)}
          </p>
          <button
            type="button"
            onClick={() => handleShiftWeek(1)}
            aria-label="Tuần sau"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid min-w-[860px] grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="h-[150px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-1.5 cursor-pointer font-bold underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : !hasAnyOccurrences ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tuần này không có ca dạy — ca chỉ áp dụng trong khoảng hiệu lực đã chốt.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[860px] grid-cols-7 gap-2">
            {days.map((day) => {
              const dayOccurrences = occurrencesByDate.get(day.iso) || [];
              return (
                <div
                  key={day.iso}
                  className={clsx(
                    "flex min-h-[150px] flex-col rounded-xl border p-2.5",
                    day.isToday
                      ? "border-blue-300 bg-blue-50/60 dark:border-blue-800/60 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <p
                      className={clsx(
                        "text-[11px] font-bold",
                        day.isToday
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {day.label}
                    </p>
                    {day.isToday && (
                      <Badge tone="blue" size="xs">
                        Hôm nay
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dayOccurrences.length ? (
                      dayOccurrences.map((occ) => (
                        <div
                          key={occ.occurrenceKey}
                          className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900/60"
                        >
                          {renderCellContent(occ)}
                        </div>
                      ))
                    ) : sessionDates.includes(day.iso) ? (
                      // Buổi học thật nằm ngoài khoảng hiệu lực của ca cố định
                      // (không có ô lattice) — xem ở danh sách buổi học.
                      <p className="rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1.5 text-[11px] font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                        Ngày này có buổi học ngoài ca cố định — xem ở danh sách
                        buổi học.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-600">
                        Không có ca dạy
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {createError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <span>{createError}</span>
        </div>
      )}

      {/* Modal form exception (overlay 1 ô) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Pencil size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {MODAL_TITLES[modal.exceptionType] || "Chỉnh sửa lần diễn"}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {formatSessionDate(modal.slot.date)} · ca {formatSessionTime(modal.slot.startTime)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeExceptionModal}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <ExceptionForm
              key={modal.slot.occurrenceKey}
              slot={modal.slot}
              exceptionType={modal.exceptionType}
              classTeachingMode={teachingMode}
              submitting={submitting}
              serverError={modalError}
              onCancel={closeExceptionModal}
              onSubmit={handleCreateException}
            />
          </div>
        </div>
      )}

      {/* Xác nhận gỡ exception */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Gỡ ngoại lệ lịch dạy"
        message={
          deleteTarget
            ? `Gỡ ngoại lệ của ca ${formatSessionTime(deleteTarget.startTime)} - ${formatSessionTime(
                deleteTarget.endTime,
              )} ngày ${formatSessionDate(deleteTarget.date)}? Ô sẽ quay lại ca cố định bình thường.`
            : ""
        }
        confirmLabel="Gỡ ngoại lệ"
        confirmTone="rose"
        icon={Eraser}
        onConfirm={handleDeleteException}
        onCancel={() => setDeleteTarget(null)}
      />
      {deleteError && deleteTarget && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl">
          <AlertCircle size={14} />
          <span>{deleteError}</span>
        </div>
      )}
      {deleting && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xl">
          <Loader2 size={14} className="animate-spin" /> Đang gỡ...
        </div>
      )}
    </Card>
  );
}
