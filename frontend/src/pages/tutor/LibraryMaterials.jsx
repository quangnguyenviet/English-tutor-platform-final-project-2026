import { useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, FileText, Users } from "lucide-react";
import { materialLibrary } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import clsx from "clsx";

const typeFilters = [
  { value: "all", label: "Tất cả" },
  { value: "video", label: "Video" },
  { value: "doc", label: "Tài liệu" },
];

export default function LibraryMaterials() {
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered =
    typeFilter === "all" ? materialLibrary : materialLibrary.filter((m) => m.type === typeFilter);

  return (
    <div>
      <PageHeader
        title="Kho video & tài liệu"
        description="Thư viện video và tài liệu dùng chung. Vào tab Tài liệu & video của một học sinh để gán (bản sao riêng cho học sinh đó)."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              typeFilter === f.value
                ? "accent-pill"
                : "border-slate-200 text-slate-600 accent-pill-outline dark:border-slate-700 dark:text-slate-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Card key={m.id}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg accent-bg-light accent-text dark:accent-bg-dark dark:accent-text-dark">
                {m.type === "video" ? <PlayCircle size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{m.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {m.topic} {m.duration && `· ${m.duration}`}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Users size={12} /> Đã gán cho {m.usageCount} lượt
            </span>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-400">Không có mục nào.</p>
        )}
      </div>

      <div className="mt-4">
        <Link to="/tutor/classes" className="text-sm font-medium accent-link">
          Chọn lớp để gán tài liệu →
        </Link>
      </div>
    </div>
  );
}
