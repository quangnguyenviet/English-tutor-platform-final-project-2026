import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Video,
  X,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import {
  apiGetSession,
  apiUpdateSession,
  apiUpdateSessionLog,
  mapSessionDetail,
  relativeDayLabel,
  todayISO,
  TEACHING_MODE_LABELS,
} from "../../lib/classroomApi";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

function FormErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Chi tiết + hành động của 1 buổi học thật (kế hoạch class-sessions Card 3)
 * — dạng modal: chọn buổi từ lưới tuần / danh sách thì mở lên, đóng bằng
 * ESC, click backdrop hoặc nút X. Form sửa/dời (mọi buổi, Mục -1 bỏ guard
 * trạng thái), form nhật ký. Buổi dạy thử (isTrial) chỉ xem,
 * không có nút hành động (R11).
 */
export default function SessionDetailCard({ sessionId, onChanged, onClose }) {
  const { token } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form sửa / dời
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Form nhật ký
  const [logForm, setLogForm] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError, setLogError] = useState("");
  const [logFirstPublish, setLogFirstPublish] = useState(false);

  const load = () => {
    if (!token || !sessionId) {
      setSession(null);
      return;
    }
    setLoading(true);
    setError("");
    apiGetSession(token, sessionId)
      .then((result) => {
        setSession(mapSessionDetail(result));
      })
      .catch((err) => {
        setError(err.message || "Không thể tải chi tiết buổi học.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionId]);

  // Đồng bộ form nhật ký khi có session; accordion mở sẵn nếu đã có nhật ký
  // (gia sư thường nhập nhật ký tại thời điểm đó).
  useEffect(() => {
    if (!session) return;
    setLogForm({
      logKnowledge: session.logKnowledge || "",
      logHomework: session.logHomework || "",
    });
    setLogError("");
    setLogFirstPublish(false);
    setLogOpen(Boolean(session.hasLog));
  }, [session]);

  // Đổi buổi học đang chọn → đóng form sửa để tránh giá trị cũ sót qua buổi khác.
  useEffect(() => {
    setEditForm(null);
    setEditError("");
  }, [sessionId]);

  // ESC để đóng modal.
  useEffect(() => {
    if (!sessionId) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionId, onClose]);

  const isTrial = session?.isTrial;

  const openEditForm = () => {
    if (!session) return;
    setEditForm({
      title: session.title || "",
      sessionDate: session.sessionDate,
      startTime: String(session.startTime).slice(0, 5),
      endTime: String(session.endTime).slice(0, 5),
      teachingMode: session.teachingMode || "ONLINE",
      meetingUrl: session.meetingUrl || "",
      location: session.location || "",
    });
    setEditError("");
  };

  const handleUpdateSession = async (event) => {
    event?.preventDefault();
    if (!token || !session || !editForm || editSubmitting) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      await apiUpdateSession(token, session.sessionId, {
        title: editForm.title.trim() || null,
        sessionDate: editForm.sessionDate,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        teachingMode: editForm.teachingMode,
        meetingUrl:
          editForm.teachingMode === "ONLINE" ? editForm.meetingUrl.trim() : null,
        location: editForm.teachingMode === "AT_HOME" ? editForm.location.trim() : null,
      });
      setEditForm(null);
      load();
      onChanged?.();
    } catch (err) {
      // Giữ form mở khi lỗi conflict để gia sư thấy nguyên message
      setEditError(err.message || "Không thể cập nhật buổi học.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSaveLog = async (event) => {
    event?.preventDefault();
    if (!token || !session || !logForm || logSubmitting) return;
    setLogSubmitting(true);
    setLogError("");
    try {
      const result = await apiUpdateSessionLog(token, session.sessionId, {
        logKnowledge: logForm.logKnowledge.trim(),
        logHomework: logForm.logHomework.trim(),
      });
      setLogFirstPublish(Boolean(result.firstPublish));
      load();
      onChanged?.();
    } catch (err) {
      setLogError(err.message || "Không thể lưu nhật ký.");
    } finally {
      setLogSubmitting(false);
    }
  };

  // Modal chỉ mở khi có sessionId đang chọn.
  if (!sessionId) return null;

  const modalBusy = loading || editSubmitting || logSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!modalBusy) onClose?.();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock size={18} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Chi tiết buổi học
              </h4>
              {session ? (
                <p className="text-[11px] text-slate-400">
                  Buổi {session.sessionNumber} · {session.dateLabel} · {session.timeLabel}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {loading && !session ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error && !session ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <p>{error}</p>
              <button type="button" onClick={load} className="mt-1.5 cursor-pointer font-bold underline">
                Thử lại
              </button>
            </div>
          </div>
        ) : session ? (
          <div className="space-y-5">
            {/* Thông tin */}
            <div className="flex flex-wrap items-center gap-2">
              {isTrial && (
                <Badge tone="rose" size="xs">
                  Buổi dạy thử
                </Badge>
              )}
            </div>

            {/* Gợi ý thời gian tương đối cho buổi sắp diễn ra */}
            {!isTrial ? (
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 dark:border-blue-900/60 dark:bg-blue-950/30">
                <Clock size={13} className="shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-200">
                  {relativeDayLabel(session.sessionDate)}
                  {session.startTime ? ` · ${String(session.startTime).slice(0, 5)}` : ""}
                </p>
              </div>
            ) : null}

            <dl className="space-y-2.5">
              <div>
                <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Tiêu đề</dt>
                <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {session.title || "—"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Buổi thứ</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {session.sessionNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Hình thức</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {TEACHING_MODE_LABELS[session.teachingMode] || session.teachingMode || "—"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Ngày & giờ</dt>
                <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {session.dateLabel} · {session.timeLabel}
                </dd>
              </div>
              {session.teachingMode === "ONLINE" && session.meetingUrl ? (
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Liên kết phòng học</dt>
                  <dd>
                    <a
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 underline underline-offset-2 dark:text-blue-300"
                    >
                      <Video size={12} /> Vào phòng học online
                    </a>
                  </dd>
                </div>
              ) : null}
              {session.teachingMode === "AT_HOME" && session.location ? (
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Địa chỉ</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {session.location}
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Học sinh</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {session.studentName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Gia sư</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {session.tutorName || "—"}
                  </dd>
                </div>
              </div>
            </dl>

            {/* Form sửa / dời (không với buổi thử) */}
            {!isTrial && !editForm && (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/30">
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Sửa / dời buổi học</p>
                  <p className="mt-0.5 text-[11px] text-blue-700/80 dark:text-blue-300/80">
                    Chỉnh sửa tiêu đề, ngày giờ và hình thức của buổi học.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditForm}
                  className="cursor-pointer text-xs font-semibold"
                >
                  <Pencil size={13} /> Chỉnh sửa
                </Button>
              </div>
            )}

            {editForm && (
              <form onSubmit={handleUpdateSession} className="space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Sửa / dời buổi học</p>
                <div>
                  <label htmlFor="edit-title" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tiêu đề
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="edit-date" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ngày <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-date"
                      type="date"
                      min={todayISO()}
                      value={editForm.sessionDate}
                      onChange={(e) => setEditForm({ ...editForm, sessionDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-start" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Giờ bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-start"
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-end" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Giờ kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-end"
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">Hình thức học</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, teachingMode: "ONLINE" })}
                      className={clsx(
                        "flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all",
                        editForm.teachingMode === "ONLINE"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                      )}
                    >
                      <Video size={14} /> Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, teachingMode: "AT_HOME" })}
                      className={clsx(
                        "flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all",
                        editForm.teachingMode === "AT_HOME"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                      )}
                    >
                      <MapPin size={14} /> Tại nhà
                    </button>
                  </div>
                </div>
                {editForm.teachingMode === "ONLINE" ? (
                  <div>
                    <label htmlFor="edit-url" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Liên kết phòng học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-url"
                      type="url"
                      value={editForm.meetingUrl}
                      onChange={(e) => setEditForm({ ...editForm, meetingUrl: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="edit-location" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Địa chỉ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-location"
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                )}
                <FormErrorBanner message={editError} />
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setEditForm(null)}
                    className="cursor-pointer text-xs font-semibold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={editSubmitting}
                    className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    {editSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={13} />}
                    {editSubmitting ? "Đang lưu..." : "Lưu buổi học"}
                  </Button>
                </div>
              </form>
            )}

            {/* Form nhật ký (mọi trạng thái, không với buổi thử) — accordion để
                modal không bị kéo dài khi buổi mới lên lịch. */}
            {!isTrial && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogOpen((open) => !open)}
                  aria-expanded={logOpen}
                  className="flex w-full cursor-pointer items-center justify-between py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    Nhật ký buổi học
                    {session.hasLog && (
                      <Badge tone="emerald" size="xs">
                        Đã lưu
                      </Badge>
                    )}
                  </span>
                  <ChevronDown
                    size={14}
                    className={clsx(
                      "text-slate-400 transition-transform dark:text-slate-500",
                      logOpen && "rotate-180",
                    )}
                  />
                </button>
                {logOpen && (
                  <form onSubmit={handleSaveLog} className="space-y-3 pb-1">
                    <div>
                      <label
                        htmlFor="log-knowledge"
                        className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        Kiến thức đã học
                      </label>
                      <textarea
                        id="log-knowledge"
                        rows={3}
                        value={logForm?.logKnowledge ?? ""}
                        onChange={(e) =>
                          setLogForm((prev) => ({ ...prev, logKnowledge: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="log-homework"
                        className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        Bài tập về nhà
                      </label>
                      <textarea
                        id="log-homework"
                        rows={3}
                        value={logForm?.logHomework ?? ""}
                        onChange={(e) =>
                          setLogForm((prev) => ({ ...prev, logHomework: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    {logFirstPublish && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span>Đã lưu nhật ký — học sinh vừa được thông báo.</span>
                      </div>
                    )}
                    <FormErrorBanner message={logError} />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={logSubmitting}
                        className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        {logSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                        {logSubmitting
                          ? "Đang lưu..."
                          : session.hasLog
                            ? "Cập nhật nhật ký"
                            : "Lưu nhật ký"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
