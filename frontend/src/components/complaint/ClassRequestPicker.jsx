import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, Search, X } from "lucide-react";
import Badge from "../ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { apiGetClassRequests } from "../../lib/staffClassRequestApi";
import {
  CLASS_REQUEST_STATUS_META,
  TEACHING_MODE_LABEL,
  classRequestEligibility,
  metaOf,
  windowLabel,
} from "../../lib/complaintModel";
import { inputClass } from "./fields";

/** Tóm tắt một lớp cần gia sư (dùng khi đã chọn và trong danh sách kết quả). */
export function ClassRequestSummary({ item, note }) {
  const status = metaOf(CLASS_REQUEST_STATUS_META, item.status);
  const tutor = item.lastTutorName || item.tutorName;
  const window = windowLabel(item);
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.requestCode}</span>
        <Badge tone={status.tone} size="xs">{status.label}</Badge>
        {item.teachingMode && (
          <Badge tone="neutral" size="xs">{TEACHING_MODE_LABEL[item.teachingMode] || item.teachingMode}</Badge>
        )}
      </div>
      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
        {item.studentName || "Chưa có tên học sinh"}
        <span className="font-normal text-slate-500 dark:text-slate-400"> · PH {item.parentName}</span>
      </p>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
        {tutor ? `Gia sư: ${tutor}` : "Chưa có gia sư"}
        {window ? ` · ${window}` : ""}
      </p>
      {note && <p className="text-xs text-rose-600 dark:text-rose-400">{note}</p>}
    </div>
  );
}

/**
 * Tìm và chọn lớp cần gia sư bị khiếu nại theo mã REQ, tên học sinh, phụ huynh hoặc SĐT.
 * Lớp không hợp lệ với loại khiếu nại bị làm mờ kèm lý do.
 */
export default function ClassRequestPicker({ value, onChange, complaintType, error }) {
  const { token } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (value) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      try {
        const page = await apiGetClassRequests({ tab: "all", keyword, size: 8, token });
        if (alive) setItems(page?.items || []);
      } catch (err) {
        if (alive) setLoadError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [keyword, value, token]);

  if (value) {
    const eligibility = classRequestEligibility(value, complaintType);
    return (
      <div className="space-y-1.5">
        <div
          className={clsx(
            "flex items-start gap-3 rounded-xl border p-3",
            eligibility.ok
              ? "border-blue-200 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20"
              : "border-rose-200 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/20"
          )}
        >
          <div className="min-w-0 flex-1">
            <ClassRequestSummary item={value} note={eligibility.ok ? null : eligibility.reason} />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Chọn lớp khác"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Mã REQ, tên học sinh, tên hoặc SĐT phụ huynh"
          className={clsx(inputClass, "pl-9")}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
        {loadError ? (
          <p className="p-3 text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
        ) : items.length === 0 && !loading ? (
          <p className="p-3 text-sm text-slate-500 dark:text-slate-400">Không tìm thấy lớp phù hợp.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => {
              const eligibility = classRequestEligibility(item, complaintType);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!eligibility.ok}
                    onClick={() => onChange(item)}
                    className="w-full cursor-pointer p-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800/60"
                  >
                    <ClassRequestSummary item={item} note={eligibility.ok ? null : eligibility.reason} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
