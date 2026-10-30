import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, UploadCloud, X } from "lucide-react";
import Button from "../ui/Button";
import { PROOF_ALLOWED_TYPES, validateProofFile } from "../../lib/paymentModel";

/**
 * Chọn tệp biên lai, kiểm tra loại/dung lượng, hiện tiến trình tải lên và lỗi từ máy chủ.
 *
 * @param {(file: File, onProgress: (p: number) => void) => Promise<unknown>} onSubmit
 */
export default function ProofUploader({ onSubmit, submitLabel = "Nộp biên lai", disabled = false, onBusyChange }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e) {
    const picked = e.target.files?.[0] || null;
    e.target.value = "";
    if (!picked) return;
    const problem = validateProofFile(picked);
    setError(problem || "");
    setFile(problem ? null : picked);
    setProgress(0);
  }

  function clear() {
    setFile(null);
    setError("");
    setProgress(0);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    setProgress(0);
    try {
      await onSubmit(file, setProgress);
      setFile(null);
    } catch (err) {
      setError(err.message || "Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={PROOF_ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={pick}
        disabled={busy || disabled}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || disabled}
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <UploadCloud size={18} className="text-blue-600 dark:text-blue-400" />
          </span>
          <span className="font-medium">Chọn ảnh hoặc PDF biên lai</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG hoặc PDF, tối đa 5 MB</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          {previewUrl ? (
            <img src={previewUrl} alt="Xem trước biên lai" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              PDF
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          {!busy && (
            <button
              type="button"
              onClick={clear}
              aria-label="Bỏ tệp"
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {busy && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-all dark:bg-[#00BFFF]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">Đang tải lên {progress}%</p>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <Button type="button" onClick={submit} disabled={!file || busy || disabled} className="w-full cursor-pointer">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? "Đang tải lên..." : submitLabel}
      </Button>
    </div>
  );
}
