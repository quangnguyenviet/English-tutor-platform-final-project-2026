import { Link } from "react-router-dom";
import { useState } from "react";
import { Sparkles, CalendarDays, Users, ArrowRight } from "lucide-react";
import { students } from "../../data/mockData";
import clsx from "clsx";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

// --- Helpers ---
function formatDate(date) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "numeric" }).format(date);
}

const activityIcons = {
  exercise_created: { bg: "bg-emerald-50", color: "text-emerald-600", icon: "📝" },
  exercise_submitted: { bg: "bg-blue-50", color: "text-blue-600", icon: "📋" },
  grading_done: { bg: "bg-green-50", color: "text-green-600", icon: "✅" },
  new_request: { bg: "bg-violet-50", color: "text-violet-600", icon: "🆕" },
  parent_reply: { bg: "bg-amber-50", color: "text-amber-600", icon: "💬" },
  trial_confirmed: { bg: "bg-teal-50", color: "text-teal-600", icon: "🎯" },
};

const activityFeed = [
  {
    id: "a1",
    type: "exercise_created",
    text: "Bài tập <strong>Writing Task 2</strong> đã được giao cho <strong>Nguyễn Minh Khôi</strong>",
    time: "Hôm nay, 08:45",
  },
  {
    id: "a2",
    type: "exercise_submitted",
    text: "<strong>Nguyễn Minh Khôi</strong> nộp bài kiểm tra",
    time: "Hôm nay, 07:30",
    badge: "Chờ chấm",
    badgeTone: "amber",
  },
  {
    id: "a3",
    type: "new_request",
    text: "Yêu cầu nhận lớp mới từ <strong>Trần Thu Hà</strong> cho bé Đặng Gia Bảo",
    time: "Hôm qua, 18:20",
    badge: "Mới",
    badgeTone: "blue",
  },
  {
    id: "a4",
    type: "parent_reply",
    text: "<strong>Anh Nguyễn Văn Hùng</strong> phản hồi về tiến độ Writing của Khôi",
    time: "Hôm qua, 20:05",
  },
  {
    id: "a5",
    type: "trial_confirmed",
    text: "Yêu cầu dạy thử của <strong>Lê Minh Anh</strong> đã được xác nhận thành công",
    time: "2 ngày trước",
  },
];

const upcomingSessions = [
  {
    id: "sess1",
    studentName: "Nguyễn Thảo Minh",
    initials: "NT",
    studentClass: "Lớp 5 · TH School",
    time: "19:00 – 21:00",
    dayLabel: "Thứ 3 hàng tuần",
    topic: "Bài 3: Present Continuous",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
    statusTone: "emerald",
    colorTheme: "orange",
    colorMap: {
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
      teal: "bg-teal-100 text-teal-600",
    },
  },
  {
    id: "sess2",
    studentName: "Lê Hoàng Nam",
    initials: "LH",
    studentClass: "Lớp 7 · Ams",
    time: "16:00 – 17:30",
    dayLabel: "Thứ 3 hàng tuần",
    topic: "Bài 5: Past Simple Tense",
    status: "pending",
    statusLabel: "Chờ xác nhận",
    statusTone: "amber",
    colorTheme: "purple",
    colorMap: {
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
      teal: "bg-teal-100 text-teal-600",
    },
  },
  {
    id: "sess3",
    studentName: "Phạm Thanh Trà",
    initials: "PT",
    studentClass: "Lớp 4 · Vinschool",
    time: "14:00 – 15:30",
    dayLabel: "Thứ 3 hàng tuần",
    topic: "Bài 2: Animals & Nature",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
    statusTone: "emerald",
    colorTheme: "teal",
    colorMap: {
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
      teal: "bg-teal-100 text-teal-600",
    },
  },
];

export default function TutorDashboard() {
  const [today] = useState(new Date());
  const activeClasses = 3; // TODO: compute from enrollment data

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-6xl mx-auto">

      {/* --- Desktop Header --- */}
      <div className="hidden lg:flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {formatDate(today)}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Chào Minh
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hôm nay bạn có{" "}
            <span className="font-semibold text-blue-600">{upcomingSessions.length} buổi dạy</span>{" "}
            đang chờ.
          </p>
        </div>
        <Link
          to="/tutor/exercise-generator"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Sparkles size={16} />
          Soạn bài tập AI
        </Link>
      </div>

      {/* --- Mobile Header --- */}
      <div className="lg:hidden">
        <p className="text-xs font-medium text-slate-400 mb-1">{formatDate(today)}</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Chào Minh</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {upcomingSessions.length} buổi dạy hôm nay
        </p>
      </div>

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-3 gap-3">
        {/* Stat: Học sinh đang dạy */}
        <Link to="/tutor/classes" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-3">
            <Users size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1 leading-tight">Lớp học của tôi</p>
        </Link>

        {/* Stat: Bài đã giao */}
        <Link to="/tutor/classes" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-3">
            <svg className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{students.length > 0 ? "3" : "0"}</p>
          <p className="text-xs text-slate-500 mt-1 leading-tight">Bài đã giao</p>
        </Link>

        {/* Stat: Lớp đang hoạt động */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
            <CalendarDays size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{activeClasses}</p>
          <p className="text-xs text-slate-500 mt-1 leading-tight">Lớp đang hoạt động</p>
        </div>
      </div>

      {/* --- Quick Actions --- */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Primary CTA */}
          <Link
            to="/tutor/exercise-generator"
            className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-start gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold leading-tight">Soạn bài tập AI</p>
            <p className="text-xs opacity-80 leading-tight">Trong 2 phút</p>
          </Link>

          {/* Secondary: Lịch dạy */}
          <Link
            to="/tutor/schedule"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-4 flex flex-col items-start gap-2 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold leading-tight">Xem lịch dạy</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {upcomingSessions.length} buổi hôm nay
            </p>
          </Link>

          {/* Secondary: Lớp học */}
          <Link
            to="/tutor/classes"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-4 flex flex-col items-start gap-2 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Users size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold leading-tight">Xem lớp học</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{students.length} học sinh</p>
          </Link>

          {/* Secondary: Yêu cầu lớp */}
          <Link
            to="/tutor/requests"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-4 flex flex-col items-start gap-2 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <p className="text-sm font-semibold leading-tight">Yêu cầu lớp</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Xem & phản hồi</p>
          </Link>
        </div>
      </div>

      {/* --- Two-column layout: Sessions + Activity --- */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* --- Sessions (3/5) --- */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Buổi dạy hôm nay</h2>
            <Link
              to="/tutor/schedule"
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
            >
              Xem tất cả
              <ArrowRight size={12} />
            </Link>
          </div>

          {upcomingSessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm",
                    sess.colorMap[sess.colorTheme]
                  )}
                >
                  {sess.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{sess.studentName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sess.studentClass}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={clsx(
                        "text-xs font-semibold px-2 py-1 rounded-lg",
                        sess.status === "confirmed"
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                      )}>
                        {sess.time}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{sess.dayLabel}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">📚 {sess.topic}</span>
                    <Badge tone={sess.statusTone}>{sess.statusLabel}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- Activity Feed (2/5) --- */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Hoạt động gần đây</h2>
            <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5">
              Xem tất cả
              <ArrowRight size={12} />
            </button>
          </div>

          <Card padded={false} className="border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {activityFeed.map((item) => {
              const meta = activityIcons[item.type];
              return (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      meta.bg
                    )}
                  >
                    <span className="text-sm" role="img" aria-label="">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm text-slate-700 dark:text-slate-300 leading-snug [&_strong]:font-medium [&_strong]:text-slate-900 dark:[&_strong]:text-white"
                      dangerouslySetInnerHTML={{ __html: item.text }}
                    />
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        "text-[11px] px-2 py-0.5 rounded-md font-medium flex-shrink-0",
                        item.badgeTone === "amber"
                          ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                          : "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {/* --- Bottom padding for mobile nav bar --- */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
