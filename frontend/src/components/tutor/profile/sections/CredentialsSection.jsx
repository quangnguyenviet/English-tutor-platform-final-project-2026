import { useEffect, useRef, useState } from "react";
import { Eye, FileText, X, Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";
import { SectionCard, TextField, SelectField } from "./EditFields";

const TYPE_LABEL = {
  CERTIFICATE: "Chứng chỉ",
  AWARD: "Thành tích",
  DIPLOMA: "Bằng cấp",
  OTHER: "Khác",
};

// Backend enum CredentialType chỉ hỗ trợ 2 giá trị
const TYPE_OPTIONS = [
  { value: "CERTIFICATE", label: "Chứng chỉ" },
  { value: "ACHIEVEMENT", label: "Thành tích" },
];

/**
 * CredentialsSection — Chứng chỉ & thành tích (chế độ xem).
 * @param {Object[]} credentials - [{ title, type, score, fileUrl }]
 */
export default function CredentialsSection({ credentials = [] }) {
  const [preview, setPreview] = useState(null); // { title, url }
  const [imgStatus, setImgStatus] = useState("loading"); // loading | ok | error
  const overlayRef = useRef(null);

  // Đóng xem trước khi nhấn Escape
  useEffect(() => {
    if (!preview) return;
    const handler = (e) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [preview]);

  const closePreview = () => {
    setPreview(null);
    setImgStatus("loading");
  };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Chứng chỉ & thành tích
        </h3>
      </div>

      {credentials.length > 0 ? (
        <div className="space-y-2">
          {credentials.map((cred, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {cred.title || "Chứng chỉ"}
                </span>
                <Badge
                  tone="amber"
                  size="xs"
                >
                  {TYPE_LABEL[cred.type] || cred.type || "Khác"}
                </Badge>
              </div>
              {cred.score && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Điểm: {cred.score}
                </div>
              )}
              {cred.fileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImgStatus("loading");
                    setPreview({ title: cred.title, url: cred.fileUrl });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Eye size={14} /> Xem ảnh
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có chứng chỉ.
        </p>
      )}

      {/* Modal xem trước ảnh chứng chỉ */}
      {preview && (
        <div
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) closePreview();
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="fade-slide-in relative w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {preview.title || "Chứng chỉ"}
              </h3>
              <button
                onClick={closePreview}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-all active:scale-[0.98]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex max-h-[75vh] items-center justify-center bg-slate-100 p-4 dark:bg-slate-950/60">
              {imgStatus === "loading" && (
                <div className="h-64 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              )}
              {imgStatus === "error" && (
                <p className="py-16 text-sm text-slate-500 dark:text-slate-400">
                  Không thể tải ảnh. Vui lòng thử lại sau.
                </p>
              )}
              <img
                src={preview.url}
                alt={preview.title || "Ảnh chứng chỉ"}
                onLoad={() => setImgStatus("ok")}
                onError={() => setImgStatus("error")}
                className={`max-h-[70vh] w-auto max-w-full rounded-lg object-contain ${
                  imgStatus === "ok" ? "block" : "hidden"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * CredentialsSectionEdit — Chứng chỉ & thành tích (chế độ sửa).
 * Repeater tên / loại / điểm + file minh chứng.
 * - Row có sẵn fileUrl: hiển thị link "Xem file", chỉ đổi file khi chọn file mới.
 * - File mới chọn được giữ trong `row.file` (chưa upload — task 7), bị loại
 *   khỏi payload trước khi gửi lên backend.
 */
export function CredentialsSectionEdit({ form, onChange }) {
  const credentials = form.credentials || [];
  const credentialFileRefs = useRef({});

  const updateCredential = (idx, field, value) =>
    onChange(
      "credentials",
      credentials.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  const addCredential = () =>
    onChange("credentials", [
      ...credentials,
      { title: "", type: "CERTIFICATE", score: "", fileUrl: "", file: null },
    ]);
  const removeCredential = (idx) =>
    onChange("credentials", credentials.filter((_, i) => i !== idx));

  return (
    <SectionCard
      icon={FileText}
      iconClass="text-amber-600 dark:text-amber-400"
      title="Chứng chỉ & thành tích"
      hint="Mỗi dòng là một minh chứng riêng, kèm file đính kèm (JPG, PNG, PDF)."
    >
      <div className="space-y-3">
        {credentials.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            Chưa có chứng chỉ.
          </p>
        )}

        {credentials.map((cred, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Chứng chỉ {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeCredential(idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextField
                label="Tên chứng chỉ"
                required
                value={cred.title}
                onChange={(e) => updateCredential(idx, "title", e.target.value)}
                placeholder="VD: IELTS Academic 7.5"
              />
              <SelectField
                label="Loại"
                required
                value={cred.type}
                onChange={(e) => updateCredential(idx, "type", e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectField>
              <TextField
                label="Điểm số"
                value={cred.score}
                onChange={(e) => updateCredential(idx, "score", e.target.value)}
                placeholder="VD: 7.5, 8.0, 900..."
              />
            </div>

            {/* File minh chứng */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                File minh chứng <span className="text-rose-500">*</span>
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{cred.file ? "Đổi file" : "Chọn file"}</span>
                  <input
                    ref={(el) => {
                      credentialFileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      updateCredential(idx, "file", e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>

                {cred.file && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[160px]">
                    {cred.file.name}
                  </span>
                )}

                {!cred.file && cred.fileUrl && (
                  <a
                    href={cred.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <ExternalLink size={13} /> Xem file hiện tại
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Chấp nhận: JPG, PNG, PDF. Tối đa 10MB.
              </p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addCredential}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold transition-colors cursor-pointer w-fit active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm chứng chỉ</span>
        </button>
      </div>
    </SectionCard>
  );
}
