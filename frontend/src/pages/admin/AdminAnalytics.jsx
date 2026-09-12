import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Banknote, TrendingUp, AlertCircle, GraduationCap, Users, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { revenueData, studentFees, students } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";

const fmtMil = (n) => (n / 1_000_000).toFixed(1) + "M";
const fmtVND = (n) => (n ? Number(n).toLocaleString("vi-VN") + "₫" : "0₫");

const exerciseActivity = [
  { month: "T11/2025", created: 12, completed: 10 },
  { month: "T12/2025", created: 15, completed: 13 },
  { month: "T1/2026", created: 18, completed: 15 },
  { month: "T2/2026", created: 22, completed: 19 },
  { month: "T3/2026", created: 25, completed: 21 },
];

const skillKeys = ["Nghe", "Nói", "Đọc", "Viết", "Từ vựng", "Ngữ pháp"];

export function AdminAnalytics() {
  const { tutorList, studentList } = useAuth();

  const current = revenueData[revenueData.length - 1];
  const prev = revenueData[revenueData.length - 2];
  const growth = prev ? Math.round(((current.total - prev.total) / prev.total) * 100) : 0;
  const avgFee = studentList.length ? Math.round(current.total / studentList.length) : 0;
  const totalCreated = exerciseActivity.reduce((s, r) => s + r.created, 0);
  const totalCompleted = exerciseActivity.reduce((s, r) => s + r.completed, 0);
  const completionRate = Math.round((totalCompleted / totalCreated) * 100);

  // Average skill score across each student's last progressHistory entry
  const skillChartData = skillKeys.map((k) => {
    const vals = students
      .filter((s) => s.progressHistory?.length)
      .map((s) => s.progressHistory[s.progressHistory.length - 1][k] ?? 0);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { skill: k, avg: parseFloat(avg.toFixed(1)) };
  });

  const topStudents = [...studentList]
    .sort((a, b) => (b.overallProgress || 0) - (a.overallProgress || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo & Phân tích hệ thống"
        description="Tổng quan doanh thu vận hành, hoạt động giao bài tập AI và tiến độ học sinh (FR-24)."
      />

      {/* Revenue Stat Cards - DESIGN.md tokens */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Doanh thu tháng này"
          value={fmtMil(current.total)}
          hint={`${growth >= 0 ? "+" : ""}${growth}% so với tháng trước`}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Đã thu học phí"
          value={fmtMil(current.collected)}
          hint="Tháng hiện tại"
          tone="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="Chưa thu / Nợ phí"
          value={fmtMil(current.pending)}
          hint="Cần gửi thông báo nhắc"
          tone="amber"
        />
        <StatCard
          icon={GraduationCap}
          label="TB học phí / học sinh"
          value={fmtMil(avgFee)}
          hint="Bình quân toàn hệ thống"
          tone="blue"
        />
      </div>

      {/* Revenue Chart + Skill Chart (Asymmetric 2 + 1 split) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded={false}>
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Doanh thu & Thu hồi công nợ theo tháng (VND)
            </h2>
            <Badge tone="emerald">Tăng trưởng +{growth}%</Badge>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={revenueData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v, name) => [fmtVND(v), name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collected" name="Đã thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Còn nợ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Điểm kỹ năng trung bình (Thang 10)
            </h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={skillChartData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={64} />
                <Tooltip formatter={(v) => [`${v}/10`, "Trung bình"]} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Exercise Activity + Summary Metrics (Asymmetric 3 + 2 split) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" padded={false}>
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Hoạt động bài tập & Tỷ lệ nộp bài theo tháng
            </h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={exerciseActivity} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {/* Replaced purple bar fill with royal blue #2563eb */}
                <Bar dataKey="created" name="Đã giao" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Đã nộp bài" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2" padded={false}>
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Chỉ số hiệu quả học tập
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="flex justify-between p-3.5">
              <span className="text-slate-600 dark:text-slate-400">Tổng số bài tập đã tạo:</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-white">
                {totalCreated} bài
              </span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-600 dark:text-slate-400">Học sinh hoàn thành:</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-white">
                {totalCompleted} bài
              </span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-600 dark:text-slate-400">Tỷ lệ hoàn thành trung bình:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {completionRate}%
              </span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-600 dark:text-slate-400">Gia sư đang dạy hoạt động:</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-white">
                {tutorList.filter((t) => t.status === "active").length} gia sư
              </span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-600 dark:text-slate-400">Tháng nhiều bài tập nhất:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Tháng 3/2026 (25 bài)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Student Fees Breakdown + Top Progressive Students */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fees status list */}
        <Card padded={false}>
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Chi tiết học phí tháng 3/2026
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {studentFees.map((f) => (
              <div key={f.studentId} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    Gia sư phụ trách: {tutorList.find((t) => t.id === f.tutorId)?.name ?? "Chưa gán"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums font-mono text-slate-800 dark:text-slate-200">
                    {fmtVND(f.monthlyFee)}
                  </span>
                  <Badge tone={f.status === "paid" ? "emerald" : "amber"}>
                    {f.status === "paid" ? "Đã thu" : "Chờ thu"}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tổng cộng học phí:
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {fmtVND(studentFees.reduce((s, f) => s + f.monthlyFee, 0))}
              </span>
            </div>
          </div>
        </Card>

        {/* Top students */}
        <Card padded={false}>
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Học sinh tiến bộ nhanh nhất
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {i + 1}
                </span>
                <Avatar initials={s.initials} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Trình độ {s.level} &bull; Kỹ năng cần rèn: {s.weakSkill || "Nói"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {s.overallProgress}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminAnalytics;
