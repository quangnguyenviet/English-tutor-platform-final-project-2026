import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, ExternalLink, FileAudio, FileImage, FileText, Loader2 } from "lucide-react";
import { apiGetMaterialAccess, apiGetMyClassMaterials } from "../../lib/studentApi";
import { FILE_TYPE_LABELS, formatBytes, formatSessionDate } from "../../lib/classroomApi";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

function MaterialIcon({ type }) {
  if (type === "AUDIO") return <FileAudio size={19} />;
  if (type === "IMAGE") return <FileImage size={19} />;
  return <FileText size={19} />;
}

export default function StudentClassMaterials() {
  const { classId, detail, token } = useOutletContext();
  const { data, loading, error, retry } = useStudentData((authToken) => apiGetMyClassMaterials(authToken, classId), [classId]);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const materials = Array.isArray(data) ? data : [];

  async function openMaterial(item, mode) {
    setBusy(item.materialId);
    setNotice("");
    try {
      const access = await apiGetMaterialAccess(token, item.materialId);
      if (mode === "preview" && !access.previewable) {
        setNotice("Tệp này không hỗ trợ xem trực tiếp. Vui lòng tải xuống.");
        return;
      }
      window.open(access.url ?? access.accessUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setNotice(err.message || "Không thể mở tài liệu.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{detail.className}</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tài liệu & video</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Xem và tải tài liệu từ các bài giảng đã công bố.</p>
      </div>

      {notice && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">{notice}</div>}
      {loading ? <SkeletonRows rows={3} /> : error ? <ErrorBox message={error} onRetry={retry} /> : materials.length === 0 ? (
        <EmptyState icon={FileText} title="Chưa có tài liệu" description="Tài liệu sẽ xuất hiện khi gia sư đính kèm vào bài giảng." />
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {materials.map((item) => (
              <div key={item.materialId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><MaterialIcon type={item.fileType} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.fileName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Badge tone="slate">{FILE_TYPE_LABELS[item.fileType] ?? item.fileType}</Badge>
                      <span>{formatBytes(item.fileSize)}</span>
                      <span>{item.lessonTitle}</span>
                      {item.createdAt && <span>{formatSessionDate(String(item.createdAt).slice(0, 10))}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" disabled={busy === item.materialId} onClick={() => openMaterial(item, "preview")}>{busy === item.materialId ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}Xem</Button>
                  <Button variant="outline" size="sm" disabled={busy === item.materialId} onClick={() => openMaterial(item, "download")}><Download size={14} />Tải xuống</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
