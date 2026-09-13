import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles, BookOpen, Clock, ShieldCheck, CheckCircle2, ChevronRight, UserCheck } from "lucide-react";
import { students as initialStudents, classRequests } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import Button from "../../components/ui/Button";
import clsx from "clsx";

export default function StudentsList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Tự động tổng hợp danh sách học sinh từ danh sách sinh sẵn và các Yêu Cầu Nhận Lớp đã chấp nhận
  const acceptedRequests = classRequests
    .filter((cr) => cr.status !== "pending_offer" && cr.status !== "rejected")
    .map((cr) => {
      let statusLabel = "🧪 Đang học thử";
      let statusTone = "violet";
      let overallProgress = 15;

      if (cr.status === "in_trial" || cr.status === "unlocked_trial_setup") {
        statusLabel = "🧪 Đang học thử";
        statusTone = "violet";
        overallProgress = 20;
      } else if (cr.status === "active_pay_later") {
        statusLabel = `⏳ Đang dạy (Còn ${cr.daysRemaining || 18}d hạn phí)`;
        statusTone = "amber";
        overallProgress = 40;
      } else if (cr.status === "waiting_fee_approval") {
        statusLabel = "⏳ Chờ Admin xác nhận phí";
        statusTone = "amber";
        overallProgress = 50;
      } else if (cr.status === "completed_paid") {
        statusLabel = "✅ Học sinh chính thức";
        statusTone = "emerald";
        overallProgress = 75;
      }

      return {
        id: `cr-student-${cr.id}`,
        classRequestId: cr.id,
        name: cr.studentName,
        initials: cr.studentName.split(" ").slice(-2).map((w) => w[0]).join(""),
        level: "Đang đánh giá",
        goal: cr.goal || cr.subject,
        schedule: cr.fixedSchedule || cr.desiredSchedule,
        parentName: cr.parentName,
        phone: cr.unmaskedPhone,
        joinedDate: cr.assignedAt,
        overallProgress,
        statusLabel,
        statusTone,
        classStatus: cr.status,
        subject: cr.subject,
        area: cr.area,
      };
    });

  // Hợp nhất danh sách gốc và danh sách từ Class Requests (loại bỏ trùng tên nếu có)
  const mergedStudents = [
    ...initialStudents,
    ...acceptedRequests.filter((crStudent) => !initialStudents.some((s) => s.name === crStudent.name)),
  ];

  const filtered = mergedStudents.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.goal.toLowerCase().includes(query.toLowerCase()) ||
      (s.subject && s.subject.toLowerCase().includes(query.toLowerCase()));

    if (!matchesQuery) return false;
    if (activeTab === "trial") return s.classStatus === "unlocked_trial_setup" || s.classStatus === "in_trial";
    if (activeTab === "pay_later") return s.classStatus === "active_pay_later" || s.classStatus === "waiting_fee_approval";
    if (activeTab === "official") return s.classStatus === "official" || s.classStatus === "completed_paid" || !s.classStatus;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Học sinh của tôi"
        description="Quản lý toàn bộ danh sách học sinh chính thức, học sinh đang trong thời gian học thử 30 ngày và theo dõi tiến độ học tập."
      />

      {/* Tabs Lọc Học Sinh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          {[
            { id: "all", label: "Tất cả học sinh", count: mergedStudents.length },
            {
              id: "trial",
              label: "🧪 Đang học thử",
              count: mergedStudents.filter((s) => s.classStatus === "unlocked_trial_setup" || s.classStatus === "in_trial").length,
            },
            {
              id: "pay_later",
              label: "⏳ Tháng đầu (Hạn 30d)",
              count: mergedStudents.filter((s) => s.classStatus === "active_pay_later" || s.classStatus === "waiting_fee_approval").length,
            },
            {
              id: "official",
              label: "✅ Chính thức",
              count: mergedStudents.filter((s) => s.classStatus === "official" || s.classStatus === "completed_paid" || !s.classStatus).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Khung Tìm Kiếm */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc môn học..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
          />
        </div>
      </div>

      {/* Grid Danh Sách Thẻ Học Sinh */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const rawId = s.id.startsWith("cr-student-") ? "s1" : s.id;
          const targetPath = `/tutor/students/${rawId}/path`;

          return (
            <Link key={s.id} to={targetPath} className="block h-full">
              <Card className="flex flex-col justify-between h-full transition hover:border-emerald-400 hover:shadow-md dark:hover:border-emerald-700 cursor-pointer">
                <div className="space-y-3">
                  {/* Header Thẻ: Avatar + Tên */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.initials} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-50 text-base">{s.name}</p>
                        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{s.schedule}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badge Nhãn Phân Loại Trạng Thái (Mới nhận / Học thử / Hạn 30d / Chính thức) */}
                  <div>
                    <Badge tone={s.statusTone || "emerald"} className="text-xs py-1 px-2.5 font-semibold">
                      {s.statusLabel || "✅ Học sinh chính thức"}
                    </Badge>
                  </div>

                  {/* Mục tiêu học tập */}
                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-400 block text-[10px] uppercase">Mục tiêu</span>
                    <p className="font-medium truncate mt-0.5">{s.goal}</p>
                  </div>

                  {/* Tiến độ lộ trình */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tiến độ hoàn thành lộ trình</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{s.overallProgress || 10}%</span>
                    </div>
                    <ProgressBar value={s.overallProgress || 10} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}

