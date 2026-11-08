import { useRef, useState } from "react";
import { FileText, ImagePlus, X } from "lucide-react";
import { PROOF_ALLOWED_TYPES } from "../../lib/paymentModel";
import { MAX_EVIDENCE_FILES, validateEvidenceFile } from "../../lib/complaintModel";

/** Chọn nhiều tệp minh chứng (ảnh JPG/PNG, PDF), tối đa 5 tệp, mỗi tệp 5 MB. */
export default function EvidencePicker({ files, onChange, disabled = false, required = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  function pick(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const problems = picked.map(validateEvidenceFile).filter(Boolean);
    const valid = picked.filter((f) => !validateEvidenceFile(f));
    const next = [...files, ...valid].slice(0, MAX_EVIDENCE_FILES);
    if (files.length + valid.length > MAX_EVIDENCE_FILES) {
      problems.push(`Chỉ được đính kèm tối đa ${MAX_EVIDENCE_FILES} tệp minh chứng.`);
    }
    setError(problems.join(" "));
    onChange(next);
  }

  function remove(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PROOF_ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={pick}
        disabled={disabled}
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <FileText size={16} className="text-slate-500 dark:text-slate-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-900 dark:text-white">{file.name}</span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Bỏ tệp"
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {files.length < MAX_EVIDENCE_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <ImagePlus size={16} className="text-blue-600 dark:text-blue-400" />
          {required && files.length === 0 ? "Chọn minh chứng (bắt buộc)" : "Thêm minh chứng"}
          <span className="text-xs text-slate-400">JPG, PNG, PDF · tối đa 5 MB</span>
        </button>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
