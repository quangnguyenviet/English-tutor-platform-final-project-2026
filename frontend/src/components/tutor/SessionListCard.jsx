import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2 } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import {
  apiGetClassSessions,
  mapSessionListItem,
  relativeDayLabel,
} from "../../lib/classroomApi";

/**
 * Danh sách buổi học thật của lớp (kế hoạch class-sessions Card 2) — API thật.
 * Số thứ tự = sessionNumber (ROW_NUMBER) của backend nên không nhảy.
 * (Mục -1: bỏ lọc + nhãn trạng thái buổi học.)
 */
export default function SessionListCard({
  classId,
  onSelectSession,
  selectedSessionId,
  refreshKey = 0,
}) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!token || !classId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError("");
    apiGetClassSessions(token, classId, { order: "asc" })
      .then((items) => {
        if (isMounted) setSessions((items || []).map(mapSessionListItem));
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Không thể tải danh sách buổi học.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token, classId, refreshKey]);

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Danh sách buổi học
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <p>{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Chưa có buổi học nào.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => {
            const relative = relativeDayLabel(session.sessionDate);
            const isToday = relative === "Hôm nay";
            return (
              <li key={session.sessionId}>
                <button
                  type="button"
                  onClick={() => onSelectSession?.(session.sessionId)}
                  className={clsx(
                    "flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border p-3 text-left transition-all",
                    selectedSessionId === session.sessionId
                      ? "border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-900",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {session.sessionNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={clsx(
                          "text-xs font-bold",
                          isToday
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-800 dark:text-slate-100",
                        )}
                      >
                        {relative || session.dateLabel}
                      </span>
                      {session.isTrial && (
                        <Badge tone="rose" size="xs">
                          Buổi dạy thử
                        </Badge>
                      )}
                      {session.hasLog && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                          title="Đã có nhật ký"
                        >
                          <CheckCircle2 size={11} /> Có nhật ký
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {session.dateLabel} · {session.timeLabel} · {session.modeLabel}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
