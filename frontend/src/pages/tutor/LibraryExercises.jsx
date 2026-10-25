import { useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { exerciseBank, skillList } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import clsx from "clsx";

export default function LibraryExercises() {
  const [skillFilter, setSkillFilter] = useState("Tất cả");

  const filtered =
    skillFilter === "Tất cả" ? exerciseBank : exerciseBank.filter((ex) => ex.skill === skillFilter);

  return (
    <div>
      <PageHeader
        title="Kho bài tập"
        description="Ngân hàng bài tập dùng chung. Vào tab Bài tập của một học sinh để chọn và giao bài này (tạo bản sao riêng cho học sinh đó)."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Tất cả", ...skillList].map((sk) => (
          <button
            key={sk}
            onClick={() => setSkillFilter(sk)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              skillFilter === sk
                ? "accent-pill"
                : "border-slate-200 text-slate-600 accent-pill-outline dark:border-slate-700 dark:text-slate-300"
            )}
          >
            {sk}
          </button>
        ))}
      </div>

      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((ex) => (
            <div key={ex.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{ex.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {ex.skill} &middot; {ex.difficulty} &middot; {ex.type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Users size={12} /> Đã giao {ex.usageCount} lần
                </span>
                <Badge tone="blue">{ex.skill}</Badge>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">Không có bài tập nào cho kỹ năng này.</p>
          )}
        </div>
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Link to="/tutor/classes" className="text-sm font-medium accent-link">
            Chọn lớp để giao bài tập →
          </Link>
        </div>
      </Card>
    </div>
  );
}
