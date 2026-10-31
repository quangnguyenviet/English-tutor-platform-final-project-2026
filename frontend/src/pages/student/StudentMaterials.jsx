import { useMemo, useState } from "react";
import { FileText, Library, Search } from "lucide-react";
import { apiGetMySessions } from "../../lib/studentApi";
import { formatSessionDate, formatSessionTime } from "../../lib/classroomApi";
import { sortSessionsDesc } from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StudentSessionDetail from "../../components/student/StudentSessionDetail";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

/**
 * Kho tài liệu theo buổi học (FR-21): chọn buổi để xem/tải tài liệu.
 * Xem trực tiếp khi tệp hỗ trợ, ngược lại chỉ có nút tải; tệp đã gỡ báo không còn khả dụng.
 */
export default function StudentMaterials() {
  const { data, loading, error, retry } = useStudentData((token) => apiGetMySessions(token), []);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(null); // { id, status }

  const sessions = useMemo(() => {
    const list = sortSessionsDesc(Array.isArray(data) ? data : (data?.content ?? []));
    const text = keyword.trim().toLowerCase();
    return list
      .filter((item) => (item.materialCount ?? 1) > 0)
      .filter((item) => !text || `${item.title ?? ""} ${item.tutorName ?? ""}`.toLowerCase().includes(text));
  }, [data, keyword]);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Học liệu"
        title="Tài liệu buổi học"
        description="Xem trực tiếp hoặc tải tài liệu gia sư đã chia sẻ sau mỗi buổi."
      />

      <label className="relative block max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên buổi học hoặc gia sư"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </label>

      {loading ? (
        <SkeletonRows rows={4} className="h-20" />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Chưa có tài liệu nào"
          description="Tài liệu sẽ xuất hiện khi gia sư tải lên cho buổi học."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sessions.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <FileText size={18} />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title || "Buổi học"}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {formatSessionDate(item.sessionDate)} · {formatSessionTime(item.startTime)}
                  </p>
                  {item.tutorName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gia sư {item.tutorName}</p>
                  )}
                  {item.materialCount != null && (
                    <Badge tone="blue" size="xs">
                      {item.materialCount} tài liệu
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpen({ id: item.id, status: item.status })}>
                  Mở
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <StudentSessionDetail sessionId={open.id} sessionStatus={open.status} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
