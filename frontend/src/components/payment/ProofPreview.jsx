import { ExternalLink, FileText } from "lucide-react";

function isPdf(url) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

/** Hiển thị biên lai: ảnh xem trực tiếp, PDF mở ở tab mới. */
export default function ProofPreview({ url, alt = "Biên lai" }) {
  if (!url) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Chưa có biên lai
      </div>
    );
  }
  if (isPdf(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 transition-colors hover:border-blue-300 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-800"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
        </span>
        <span className="flex-1">Mở biên lai (PDF)</span>
        <ExternalLink size={16} className="text-slate-400" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
      <img
        src={url}
        alt={alt}
        className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain dark:border-slate-800 dark:bg-slate-950"
      />
    </a>
  );
}
