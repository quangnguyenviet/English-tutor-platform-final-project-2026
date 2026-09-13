import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { students } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import ProgressBar from "../../components/ui/ProgressBar";

export default function StudentsList() {
  const [query, setQuery] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.goal.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Học sinh của tôi"
        description="Quản lý danh sách học sinh và theo dõi tiến độ giảng dạy."
      />

      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm học sinh theo tên hoặc mục tiêu..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link key={s.id} to={`/tutor/students/${s.id}`}>
            <Card className="h-full transition hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-800">
              <div className="mb-3 flex items-center gap-3">
                <Avatar initials={s.initials} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-50">{s.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.schedule}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{s.goal}</p>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Tiến độ lộ trình</span>
                <span>{s.overallProgress}%</span>
              </div>
              <ProgressBar value={s.overallProgress} />
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-400">Không tìm thấy học sinh phù hợp.</p>
        )}
      </div>
    </div>
  );
}
