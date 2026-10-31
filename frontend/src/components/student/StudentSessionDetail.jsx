import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  NotebookPen,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetMaterialAccess, apiGetSessionDetail } from "../../lib/studentApi";
import {
  FILE_TYPE_LABELS,
  SESSION_STATUS_META,
  TEACHING_MODE_LABELS,
  formatBytes,
  formatSessionDate,
  formatSessionTime,
} from "../../lib/classroomApi";
import {
  QUIZ_STATUS_META,
  isMaterialUnavailableError,
  materialAction,
  sessionLogState,
} from "../../lib/studentModel";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { ErrorBox, SkeletonRows } from "./AsyncBlock";

function MaterialRow({ material, onOpen, busy, state }) {
  const action = materialAction(material, state);
  const unavailable = action === "unavailable";

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <FileText size={18} />
        </span>
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-medium ${
              unavailable ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-900 dark:text-white"
            }`}
          >
            {material.fileName ?? material.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[FILE_TYPE_LABELS[material.fileType] ?? material.fileType, formatBytes(material.fileSize)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      {unavailable ? (
        <Badge tone="slate">Không còn khả dụng</Badge>
      ) : (
        <div className="flex shrink-0 gap-2">
          {material.previewable !== false && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onOpen(material, "preview")}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Xem
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onOpen(material, "download")}>
            <Download size={14} />
            Tải xuống
          </Button>
        </div>
      )}
    </li>
  );
}

/**
 * Chi tiết buổi học dành cho học sinh: thông tin chung, tài liệu (xem/tải), quiz, nhật ký.
 * `onClose` đóng modal; `onLoaded` (tuỳ chọn) báo dữ liệu đã tải.
 */
export default function StudentSessionDetail({ sessionId, onClose }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [materialState, setMaterialState] = useState({}); // id → { previewable, unavailable }
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiGetSessionDetail(token, sessionId)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, sessionId]);

  async function openMaterial(material, mode) {
    setBusyId(material.id);
    setNotice("");
    try {
      const access = await apiGetMaterialAccess(token, material.id);
      setMaterialState((prev) => ({ ...prev, [material.id]: { previewable: access.previewable } }));
      const url = access.url ?? access.accessUrl;
      // Tệp không xem trực tiếp được thì chỉ cho tải
      if (mode === "preview" && !access.previewable) {
        setNotice("Tệp này không hỗ trợ xem trực tiếp, vui lòng tải xuống.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (isMaterialUnavailableError(err)) {
        setMaterialState((prev) => ({ ...prev, [material.id]: { unavailable: true } }));
      } else {
        setNotice(err.message);
      }
    } finally {
      setBusyId(null);
    }
  }

  const statusMeta = SESSION_STATUS_META[detail?.status] ?? { label: detail?.status, tone: "slate" };
  const log = detail ? sessionLogState(detail) : null;
  const materials = detail?.materials ?? [];
  const quizzes = detail?.quizzes ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết buổi học"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Chi tiết buổi học</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {loading && <SkeletonRows rows={3} />}
        {error && <ErrorBox message={error} />}

        {detail && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                {detail.sessionNumber != null && <Badge tone="slate">Buổi {detail.sessionNumber}</Badge>}
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {detail.title || "Buổi học"}
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {formatSessionDate(detail.sessionDate)} · {formatSessionTime(detail.startTime)} –{" "}
                {formatSessionTime(detail.endTime)}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {detail.tutorName && <span>Gia sư {detail.tutorName}</span>}
                {detail.teachingMode && <span>{TEACHING_MODE_LABELS[detail.teachingMode]}</span>}
                {detail.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {detail.location}
                  </span>
                )}
              </p>
              {detail.meetingUrl && ["SCHEDULED", "IN_PROGRESS"].includes(detail.status) && (
                <Button
                  as="a"
                  href={detail.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  className="mt-1"
                >
                  <Video size={14} />
                  {detail.status === "IN_PROGRESS" ? "Vào lớp học trực tuyến" : "Mở liên kết buổi học"}
                </Button>
              )}
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Tài liệu</h3>
              {notice && (
                <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  {notice}
                </p>
              )}
              {materials.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Buổi này chưa có tài liệu.</p>
              ) : (
                <ul className="space-y-2">
                  {materials.map((material) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      busy={busyId === material.id}
                      state={materialState[material.id]}
                      onOpen={openMaterial}
                    />
                  ))}
                </ul>
              )}
            </section>

            {quizzes.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Bài quiz</h3>
                <ul className="space-y-2">
                  {quizzes.map((quiz) => {
                    const meta = QUIZ_STATUS_META[quiz.status] ?? { label: quiz.status, tone: "slate" };
                    return (
                      <li
                        key={quiz.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{quiz.title}</p>
                          <Badge tone={meta.tone} size="xs">
                            {meta.label}
                          </Badge>
                        </div>
                        {["ASSIGNED", "COMPLETED"].includes(quiz.status) && (
                          <Button as={Link} to={`/student/exercises/${quiz.id}`} variant="outline" size="sm">
                            {quiz.status === "ASSIGNED" ? "Làm bài" : "Xem kết quả"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <NotebookPen size={16} />
                Nhật ký buổi học
              </h3>
              {log.kind === "ready" ? (
                <div className="space-y-3 text-sm">
                  {detail.logKnowledge && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kiến thức đã học</p>
                      <p className="mt-1 whitespace-pre-line text-slate-900 dark:text-white">{detail.logKnowledge}</p>
                    </div>
                  )}
                  {detail.logHomework && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bài tập về nhà</p>
                      <p className="mt-1 whitespace-pre-line text-slate-900 dark:text-white">{detail.logHomework}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{log.label}</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
