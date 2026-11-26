import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  RefreshCcw,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import {
  apiAssignTrialReportTaskSelf,
  apiChangeTrialReportTaskStatus,
  apiGetTrialReportTaskCounts,
  apiGetTrialReportTaskDetail,
  apiGetTrialReportTasks,
  apiRematchTrialReportTask,
  apiUnassignTrialReportTask,
} from "../../lib/trialReportTaskApi";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
];
const statusMeta = {
  PENDING: { label: "Chờ xử lý", tone: "amber" },
  IN_PROGRESS: { label: "Đang xử lý", tone: "blue" },
  RESOLVED: { label: "Đã xử lý", tone: "emerald" },
};

const fmtDate = (value) =>
  value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtTime = (value) => (value ? String(value).slice(0, 5) : "—");

function StatusBadge({ value }) {
  const meta = statusMeta[value] || { label: value || "—", tone: "slate" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function DetailModal({ detail, onClose, onRefresh }) {
  const task = detail?.task;
  const info = task?.classInfo;
  const report = task?.report;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { token, session } = useAuth();
  const currentToken = token || session?.token;

  const run = async (callback) => {
    setBusy(true);
    setError("");
    try {
      await callback();
      await onRefresh();
    } catch (err) {
      setError(err.message || "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task #{task?.taskId}</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{info?.className || "Dạy thử không thành công"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge value={task?.status} />
              <span className="text-xs text-muted-foreground">Báo cáo {fmtDate(report?.createdAt)}</span>
            </div>
          </div>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-semibold text-foreground">Lý do gia sư báo</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report?.note || "Không có lý do."}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-foreground">Ca dạy thử</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {info?.trialSession?.trialDate || "—"} · {fmtTime(info?.trialSession?.startTime)}–
              {fmtTime(info?.trialSession?.endTime)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {info?.trialSession?.teachingMode || info?.teachingMode || "—"}
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-foreground">Học viên</h3>
            <p className="mt-2 text-sm text-muted-foreground">{info?.student?.name || "—"}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-foreground">Gia sư</h3>
            <p className="mt-2 text-sm text-muted-foreground">{info?.tutor?.name || "—"}</p>
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
          <span className="mr-auto text-sm text-muted-foreground">
            Phụ trách: <strong className="text-foreground">{task?.assignedToName || "Chưa gán"}</strong>
          </span>
          {!task?.assignedToId && (
            <Button size="sm" onClick={() => run(() => apiAssignTrialReportTaskSelf(task.taskId, currentToken))}>
              <UserCheck size={15} /> Gán cho mình
            </Button>
          )}
          {task?.assignedToId && (
            <Button size="sm" variant="outline" onClick={() => run(() => apiUnassignTrialReportTask(task.taskId, currentToken))}>
              <UserX size={15} /> Bỏ gán
            </Button>
          )}
          <select
            value={task?.status || "PENDING"}
            disabled={busy}
            onChange={(event) => run(() => apiChangeTrialReportTaskStatus(task.taskId, event.target.value, currentToken))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="PENDING">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="RESOLVED">Đã xử lý</option>
          </select>
          {info?.classRequest && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => apiRematchTrialReportTask(task.taskId, currentToken))}>
              <RefreshCcw size={15} /> Ghép lại
            </Button>
          )}
        </div>
        {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-6">
          <h3 className="font-semibold text-foreground">Lịch sử thao tác</h3>
          <div className="mt-2 divide-y divide-border rounded-xl border border-border">
            {(detail.history || []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Chưa có thao tác.</p>
            ) : (
              detail.history.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="font-medium text-foreground">{item.action}</span>
                  <span className="text-muted-foreground">
                    {item.actorName || "—"} · {fmtDate(item.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrialReportTasks() {
  const { token, session } = useAuth();
  const currentToken = token || session?.token;
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, counter] = await Promise.all([
        apiGetTrialReportTasks({ status, assignedTo, page, size: PAGE_SIZE, token: currentToken }),
        apiGetTrialReportTaskCounts(currentToken),
      ]);
      setItems(list?.items || []);
      setTotalPages(list?.totalPages || 0);
      setCounts(counter || {});
    } catch (err) {
      setError(err.message || "Không thể tải hàng đợi.");
    } finally {
      setLoading(false);
    }
  }, [currentToken, status, assignedTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (item) => {
    try {
      setDetail(await apiGetTrialReportTaskDetail(item.taskId, currentToken));
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản lý lớp học"
        title="Dạy thử thất bại cần xử lý"
        description="Theo dõi, xác minh và xử lý các báo cáo dạy thử không thành công."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Chờ xử lý" value={counts.PENDING || 0} icon={Clock3} />
        <StatCard label="Đang xử lý" value={counts.IN_PROGRESS || 0} icon={AlertCircle} />
        <StatCard label="Đã xử lý" value={counts.RESOLVED || 0} icon={CheckCircle2} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => {
              setPage(0);
              setStatus(event.target.value);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            placeholder="ID người phụ trách"
            className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Báo cáo</th>
                <th className="px-4 py-3">Lớp / học viên</th>
                <th className="px-4 py-3">Gia sư</th>
                <th className="px-4 py-3">Ca dạy thử</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Phụ trách</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-muted-foreground">
                    Đang tải…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-muted-foreground">
                    Không có task phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.taskId} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{fmtDate(item.reportedAt)}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                        {item.reportNote || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.className || "—"}</p>
                      <p className="text-xs text-muted-foreground">{item.studentName || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.tutorName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.trialDate || "—"}
                      <br />
                      {fmtTime(item.trialStartTime)}–{fmtTime(item.trialEndTime)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.assignedToName || "Chưa gán"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(item)}>
                        <Eye size={15} /> Xem
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Trang {totalPages ? page + 1 : 0} / {totalPages || 0}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft size={15} />
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </Card>

      {detail && (
        <DetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onRefresh={async () => {
            await load();
            const refreshed = await apiGetTrialReportTaskDetail(detail.task.taskId, currentToken);
            setDetail(refreshed);
          }}
        />
      )}
    </div>
  );
}
