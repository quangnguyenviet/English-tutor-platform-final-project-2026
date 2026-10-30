import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Loader2,
  MoreVertical,
  Pencil,
  X,
  XCircle,
} from "lucide-react";
import Card from "../ui/Card";
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
    return {
      iso,
      label: dayOfWeekLabel(isoDay),
      shortDate: formatSessionDate(iso).slice(0, 5),
      dayNumber: String(iso.slice(8, 10)),
      isToday: iso === today,
    };
  });
}

/** Nền chip sự kiện theo tone trạng thái (kiểu Google Calendar: nền nhạt + viền trái đậm). */
const TONE_SURFACE = {
  blue: "border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  amber: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  emerald: "border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  rose: "border-l-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
  sky: "border-l-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  slate: "border-l-slate-400 bg-slate-50 text-slate-800 dark:bg-slate-800/40 dark:text-slate-200",
};

/**
 * Lưới tuần kiểu Google Calendar (thiết kế /tutor/schedule): cột giờ bên trái
 * (06:00–22:00), 7 cột ngày, mỗi sự kiện là 1 chip đặt đúng vị trí giờ trên trục.
 * Sự kiện render theo source SESSION / EXCEPTION / OCCURRENCE từ API thật.
 * Dưới lg: fallback danh sách dọc theo ngày (mobile không có trục giờ).
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
  selectedSessionId = null,
  onChanged,
  refreshKey = 0,
  sessionDates = [],
  createErrorDate = null,
}) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(null); // { slot, exceptionType }
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [kebabKey, setKebabKey] = useState(null); // ô OCCURRENCE đang mở menu
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

  const handleGoToday = () => {
    onWeekStartChange(toISO(startOfWeek(todayISO())));
  };

  const openExceptionModal = (occ, exceptionType) => {
    setKebabKey(null);
    setModalError("");
    setModal({ slot: occ, exceptionType });
  };

  const closeExceptionModal = () => {
    setModal(null);
    setModalError("");
  };

  // Tạo buổi học on-demand + tự chọn buổi mới (WP2.4) để mở chi tiết (modal).
  const handleCreateAndSelect = async (occ) => {
    const result = await onCreateSession?.(occ.date, formatSessionTime(occ.startTime), occ.dateLabel);
    if (result != null) onSelectSession?.(result);
  };

  // Đóng modal exception bằng ESC (WP2.6).
  useEffect(() => {
    if (!modal) return;
    const onKey = (event) => {
      if (event.key === "Escape") closeExceptionModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

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

  const KEBAB_ACTIONS = [
    { type: "CANCELLED", label: "Hủy ca này", icon: XCircle, tone: "rose" },
    { type: "RESCHEDULED", label: "Dời ca này", icon: ArrowRightLeft, tone: "amber" },
    { type: "MODIFIED", label: "Sửa chi tiết ca", icon: Pencil, tone: "sky" },
  ];

  const kebabTone = {
    rose: "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40",
    amber: "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40",
    sky: "text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40",
  };

  // Chip sự kiện trong ô ngày (không dùng trục giờ): mỗi ca/lượt dạy là 1 chip
  // hiển thị giờ + trạng thái/nhãn; nhiều ca trong ngày xếp chồng dọc trong ô.
  const renderDayChip = (occ) => {
    if (occ.source === "SESSION") {
      const session = occ.session || {};
      const isSelected = selectedSessionId != null && session.sessionId === selectedSessionId;
      // Mục -1: bỏ nhãn/trạng thái buổi — chip SESSION luôn tone emerald (đã có buổi thật).
      const surface = TONE_SURFACE.emerald;
      return (
        <button
          key={occ.occurrenceKey}
          type="button"
          onClick={() => onSelectSession?.(session.sessionId)}
          aria-current={isSelected || undefined}
          className={clsx(
            "block w-full cursor-pointer rounded-lg border border-l-4 px-2 py-1.5 text-left transition-all hover:brightness-[0.97] active:scale-[0.99] dark:hover:brightness-110",
            surface,
            isSelected && "ring-2 ring-blue-500/60",
          )}
        >
          <p className="font-mono text-[11px] font-semibold">
            {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
          </p>
          {session.hasLog && (
            <p className="mt-0.5 text-[10px] opacity-70">Có nhật ký</p>
          )}
        </button>
      );
    }

    if (occ.source === "EXCEPTION") {
      const exc = occ.exception || {};
      const meta = EXCEPTION_TYPE_META[exc.type] || { label: exc.type, tone: "slate" };
      const surface =
        exc.type === "CANCELLED"
          ? TONE_SURFACE.rose
          : exc.type === "RESCHEDULED"
            ? TONE_SURFACE.amber
            : TONE_SURFACE.sky;
      return (
        <div key={occ.occurrenceKey} className={clsx("rounded-lg border border-l-4 px-2 py-1.5", surface)}>
          <p className="flex items-center justify-between gap-1 font-mono text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
              <span className="rounded-full bg-white/60 px-1.5 text-[10px] font-bold dark:bg-slate-900/40">
                {meta.label}
              </span>
            </span>
            <button
              type="button"
              onClick={() => askDeleteException(occ)}
              className="cursor-pointer rounded p-0.5 transition-all hover:bg-white/50 active:scale-[0.98] dark:hover:bg-slate-800/50"
              aria-label="Gỡ ngoại lệ"
              title="Gỡ ngoại lệ"
            >
              <Eraser size={11} />
            </button>
          </p>
          {exc.type === "RESCHEDULED" && (
            <p className="mt-0.5 text-[10px] opacity-70">
              Sang {exc.newDateLabel}
              {exc.timeLabel ? ` · ${exc.timeLabel}` : ""}
            </p>
          )}
          {exc.type === "CANCELLED" && exc.reason && (
            <p className="mt-0.5 truncate text-[10px] opacity-70" title={exc.reason}>
              {exc.reason}
            </p>
          )}
        </div>
      );
    }

    // OCCURRENCE — ca cố định chưa có buổi thật: chip giờ + "Tạo buổi học" + kebab
    const kebabOpen = kebabKey === occ.occurrenceKey;
    return (
      <div key={occ.occurrenceKey} className="group/occ relative rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-2 py-1.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20">
        <p className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Clock size={10} className="shrink-0 text-blue-500 dark:text-blue-400" />
          {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
        </p>
        <button
          type="button"
          onClick={() => handleCreateAndSelect(occ)}
          disabled={creatingSessionDate !== null}
          className={clsx(
            "mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold transition-all active:scale-[0.98]",
            "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80 disabled:opacity-50 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-900/80",
          )}
        >
          {creatingSessionDate === occ.date ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <CalendarPlus size={11} />
          )}
          Tạo buổi học
        </button>
        {/* Nút kebab gom 3 hành động exception (desktop: hiện khi hover ô) */}
        <button
          type="button"
          aria-label="Hủy / dời / sửa ca này"
          aria-expanded={kebabOpen}
          onClick={() => setKebabKey(kebabOpen ? null : occ.occurrenceKey)}
          className={clsx(
            "absolute right-1.5 top-1.5 hidden cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 text-slate-500 shadow-sm transition-all active:scale-[0.98] lg:block",
            "hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
            "lg:opacity-0 lg:group-hover/occ:opacity-100 lg:group-focus-within/occ:opacity-100 lg:focus:opacity-100",
            kebabOpen && "opacity-100 border-blue-300 dark:border-blue-800",
          )}
        >
          <MoreVertical size={11} />
        </button>
        {kebabOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setKebabKey(null)} aria-hidden="true" />
            <div
              role="menu"
              className="absolute top-full right-0 z-40 mt-1 w-40 space-y-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {KEBAB_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.type}
                    type="button"
                    role="menuitem"
                    onClick={() => openExceptionModal(occ, action.type)}
                    className={clsx(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all active:scale-[0.98]",
                      kebabTone[action.tone],
                    )}
                  >
                    <Icon size={12} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {/* Mobile: 3 nút chữ thay kebab (không có hover trên touch) */}
        <div className="mt-1 flex gap-1 lg:hidden">
          {KEBAB_ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => openExceptionModal(occ, action.type)}
              className={clsx(
                "flex-1 cursor-pointer rounded-md px-1 py-0.5 text-[9px] font-bold transition-all active:scale-[0.98]",
                kebabTone[action.tone],
              )}
            >
              {action.label.replace(" ca này", "").replace(" chi tiết ca", " chi tiết")}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Ngày chứa buổi học đang được chọn (highlight ô khi chọn từ danh sách).
  const selectedDate = useMemo(() => {
    if (selectedSessionId == null) return null;
    for (const [date, occurrences] of occurrencesByDate.entries()) {
      if (occurrences.some((occ) => occ.session?.sessionId === selectedSessionId)) {
        return date;
      }
    }
    return null;
  }, [selectedSessionId, occurrencesByDate]);

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Lịch dạy tuần
          </h2>
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
          <button
            type="button"
            onClick={handleGoToday}
            className={clsx(
              "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors active:scale-[0.98]",
              weekStart === toISO(startOfWeek(todayISO()))
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
            )}
          >
            Hôm nay
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="h-[110px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
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
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3">
          {/* ===== 7 ô ngày (1 ô/1 ngày), trong ô hiện chip giờ buổi học ===== */}
          {days.map((day) => {
            const dayOccurrences = occurrencesByDate.get(day.iso) || [];
            const dayCreateError = createError && createErrorDate === day.iso;
            return (
              <div
                key={day.iso}
                className={clsx(
                  "flex flex-col rounded-xl border p-2",
                  day.isToday
                    ? "border-blue-300 bg-blue-50/50 dark:border-blue-800/60 dark:bg-blue-950/20"
                    : selectedDate === day.iso
                      ? "border-blue-400 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/15"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
                )}
              >
                {/* Header ngày: vòng tròn số kiểu Google Calendar */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={clsx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                      day.isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-800 dark:text-slate-200",
                    )}
                  >
                    {day.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-[11px] font-medium leading-tight",
                        day.isToday
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {day.label}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      {day.shortDate}
                    </p>
                  </div>
                </div>

                {/* Chip sự kiện trong ô */}
                <div className="flex-1 space-y-1.5">
                  {dayOccurrences.length ? (
                    dayOccurrences.map(renderDayChip)
                  ) : sessionDates.includes(day.iso) ? (
                    <p className="rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1.5 text-[10px] font-medium leading-tight text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                      Có buổi học ngoài ca cố định — xem ở danh sách buổi học.
                    </p>
                  ) : (
                    <p className="px-1 text-[11px] text-slate-400 dark:text-slate-600">
                      Không có ca dạy
                    </p>
                  )}
                  {dayCreateError && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] leading-snug text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                      <AlertCircle size={11} className="mt-0.5 shrink-0 text-rose-500" />
                      <span>{createError}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createError && !createErrorDate && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <span>{createError}</span>
        </div>
      )}

      {/* Modal form exception (overlay 1 ô) — đóng bằng ESC hoặc click backdrop */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeExceptionModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
                    modal.exceptionType === "CANCELLED" &&
                      "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
                    modal.exceptionType === "RESCHEDULED" &&
                      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                  )}
                >
                  {modal.exceptionType === "CANCELLED" ? (
                    <XCircle size={18} />
                  ) : modal.exceptionType === "RESCHEDULED" ? (
                    <ArrowRightLeft size={18} />
                  ) : (
                    <Pencil size={18} />
                  )}
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
