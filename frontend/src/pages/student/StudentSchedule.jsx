import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  User,
  MapPin,
  Send,
  X,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarDays,
  Radio,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LessonSessionDetail from "../../components/student/LessonSessionDetail";

/**
 * Lịch học & trạng thái lớp học — UC-S01 (lịch học cá nhân)
 * Hai chế độ xem: lưới tuần (desktop) và nhật ký buổi học (mọi kích thước).
 */

export default function StudentSchedule() {
  const { session } = useAuth();
  const { sessions, requestReschedule } = useLessonSessions();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSchedule = sessions.filter((item) => item.studentId === (session?.studentId || "s1"));

  // State management
  const [selectedTutorId, setSelectedTutorId] = useState("all");
  // Lưới tuần cần tối thiểu 900px → dưới ngưỡng lg chỉ hiển thị dạng nhật ký,
  // tránh buộc người dùng cuộn ngang.
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );
  const [viewMode, setViewMode] = useState("agenda"); // "grid" | "agenda"
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // -1 (prev), 0 (current), 1, 2 (future)
  const [agendaCategory, setAgendaCategory] = useState("all"); // "all" | "upcoming" | "completed"
  const [rescheduleModalSession, setRescheduleModalSession] = useState(null);
  const [selectedDetailSession, setSelectedDetailSession] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [preferredSlots, setPreferredSlots] = useState("");
  const [notification, setNotification] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    const lessonId = searchParams.get("lesson");
    if (lessonId && sessions.some((item) => item.id === lessonId && item.studentId === (session?.studentId || "s1"))) {
      setSelectedDetailSession({ id: lessonId });
    }
  }, [searchParams, session?.studentId, sessions]);

  function closeLessonDetail() {
    setSelectedDetailSession(null);
    if (searchParams.has("lesson")) {
      const next = new URLSearchParams(searchParams);
      next.delete("lesson");
      setSearchParams(next);
    }
  }

  // Extract unique tutors from schedule
  const tutorList = [
    { id: "all", name: "Tất cả gia sư" },
    { id: "t1", name: "Nguyễn Lan Anh (IELTS)" },
    { id: "t2", name: "Trần Minh Quân (Writing)" },
    { id: "t3", name: "Phạm Thu Hà (Giao tiếp)" },
  ];

  function getOfflineLocation(item) {
    if (item?.learningMode === "online" || /online|jitsi|zoom|meet/i.test(item?.location || "")) {
      return "Tại lớp / Trung tâm EnglishPath";
    }
    return item?.location || "Tại lớp / Trung tâm EnglishPath";
  }

  // Helper calculation for Days of Week & Date Headers based on Week Offset
  const getDaysOfWeekForOffset = (offset) => {
    const weekLabels = {
      "-1": { title: "Tuần 27/07 - 02/08/2026 (Tuần trước)", dates: ["27/07", "28/07", "29/07", "30/07", "31/07", "01/08", "02/08"] },
      "0": { title: "Tuần 03/08 - 09/08/2026 (Tuần hiện tại)", dates: ["03/08", "04/08", "05/08", "06/08", "07/08", "08/08", "09/08"] },
      "1": { title: "Tuần 10/08 - 16/08/2026 (Tuần sau)", dates: ["10/08", "11/08", "12/08", "13/08", "14/08", "15/08", "16/08"] },
      "2": { title: "Tuần 17/08 - 23/08/2026 (Tuần tiếp theo)", dates: ["17/08", "18/08", "19/08", "20/08", "21/08", "22/08", "23/08"] }
    };

    const weekInfo = weekLabels[offset] || {
      title: `Tuần ${offset > 0 ? '+' : ''}${offset}`,
      dates: ["03/08", "04/08", "05/08", "06/08", "07/08", "08/08", "09/08"]
    };

    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

    return {
      title: weekInfo.title,
      days: dayNames.map((name, idx) => ({
        name,
        date: weekInfo.dates[idx],
        dayIndex: idx + 1,
        isToday: offset === 0 && idx === 1 // Ngày tham chiếu của dữ liệu mẫu: 04/08/2026.
      }))
    };
  };

  const currentWeekInfo = getDaysOfWeekForOffset(currentWeekOffset);

  // Filter schedule for Grid View (strictly matches current week offset + tutor filter)
  const currentWeekRawSchedule = rawSchedule.filter(s => (s.weekOffset ?? 0) === currentWeekOffset);
  const gridFilteredSchedule = currentWeekRawSchedule.filter((item) => {
    if (selectedTutorId === "all") return true;
    return item.tutorId === selectedTutorId;
  });

  // Filter schedule for Agenda View (all weeks, filtered by tutor)
  const agendaTutorFilteredSchedule = rawSchedule.filter((item) => {
    if (selectedTutorId === "all") return true;
    return item.tutorId === selectedTutorId;
  });

  // Group Agenda items: Live/Upcoming at TOP, Completed at BOTTOM
  const upcomingAndLiveSessions = agendaTutorFilteredSchedule.filter(
    (s) => s.status === "live" || s.status === "upcoming" || s.status === "reschedule_requested" || s.status === "rescheduled"
  );
  const completedJournalSessions = agendaTutorFilteredSchedule.filter(
    (s) => s.status === "completed"
  );

  // Calculate Quick Stats for current active view
  const totalSessions = currentWeekRawSchedule.length;
  const completedSessions = currentWeekRawSchedule.filter((s) => s.status === "completed").length;
  const liveSessions = rawSchedule.filter((s) => s.status === "live").length;

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleReason) return;
    const success = requestReschedule(
      rescheduleModalSession.id,
      rescheduleReason,
      preferredSlots.trim() ? [preferredSlots.trim()] : []
    );
    setNotification(success
      ? `Đã ghi nhận yêu cầu đổi lịch buổi "${rescheduleModalSession.topic}" để trung tâm và gia sư theo dõi.`
      : "Không thể gửi yêu cầu ở trạng thái hiện tại. Hãy tải lại lịch học và thử lại.");
    if (!success) return;
    setRescheduleModalSession(null);
    setRescheduleReason("");
    setPreferredSlots("");
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fade-slide-in fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        className="mb-0"
        eyebrow="Theo dõi lịch trình"
        title="Lịch học & Trạng thái Lớp học"
        description="Theo dõi lịch trình và trao đổi theo từng buổi học. Lịch minh họa dùng ngày tham chiếu 04/08/2026."
      />

      {/* 1. Metrics Overview Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Calendar size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {totalSessions}
          </p>
          <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">Buổi trong tuần đang xem</p>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {completedSessions}
            <span className="text-sm font-normal text-slate-400">/{totalSessions}</span>
          </p>
          <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">Đã hoàn thành</p>
        </Card>

        <Card
          className={`p-4 ${
            liveSessions > 0 ? "border-emerald-200 dark:border-emerald-900/60" : ""
          }`}
        >
          <div
            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
              liveSessions > 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-blue-50 dark:bg-blue-950/40"
            }`}
          >
            <Radio
              size={18}
              strokeWidth={1.75}
              className={liveSessions > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}
            />
          </div>
          <p className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {liveSessions}
          </p>
          <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">Đang diễn ra</p>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <User size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {tutorList.length - 1}
          </p>
          <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">Gia sư cá nhân</p>
        </Card>
      </div>

      {/* 2. Control Toolbar & Filters */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tutor Filter Dropdown (Dropbox) */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="tutor-select-dropdown" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
              <Filter size={14} /> Gia sư:
            </label>
            <select
              id="tutor-select-dropdown"
              value={selectedTutorId}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer min-w-[200px]"
            >
              {tutorList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Switcher & Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode("grid")}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "grid"
                  ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
              >
                <LayoutGrid size={14} /> Xem theo Tuần
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "agenda" || !isDesktop
                  ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
              >
                <List size={14} /> Nhật ký Buổi học
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw size={13} /> Đồng bộ Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Weekly Grid View — chỉ hiển thị trên màn hình lớn */}
      {viewMode === "grid" && isDesktop && (
        <Card className="p-4 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Week Navigator Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4 gap-3">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => Math.max(-1, prev - 1))}
                disabled={currentWeekOffset <= -1}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} /> Tuần trước
              </button>

              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center justify-center gap-1.5">
                  <CalendarDays size={15} /> {currentWeekInfo.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => Math.min(2, prev + 1))}
                disabled={currentWeekOffset >= 2}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Tuần sau <ChevronRight size={16} />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-center">
              {currentWeekInfo.days.map((day) => {
                return (
                  <div
                    key={day.dayIndex}
                    className={`py-2 px-1 rounded-xl transition-all ${day.isToday
                      ? "bg-slate-800 text-white font-semibold dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    <p className="text-xs uppercase tracking-wider">{day.name}</p>
                    <p className="text-sm font-bold mt-0.5">{day.date}</p>
                    {day.isToday && (
                      <span className="inline-block mt-1 text-[10px] bg-white/20 dark:bg-slate-900/20 px-2 py-0.5 rounded-full font-normal">
                        Hôm nay
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid Columns */}
            <div className="grid grid-cols-7 gap-2 min-h-[420px]">
              {currentWeekInfo.days.map((day) => {
                const daySessions = gridFilteredSchedule.filter((s) => s.dayIndex === day.dayIndex);

                return (
                  <div
                    key={day.dayIndex}
                    className="flex flex-col gap-3 p-1.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80"
                  >
                    {daySessions.length === 0 ? (
                      <div className="h-full min-h-[120px] flex items-center justify-center text-center p-2">
                        <span className="text-[11px] text-slate-400 italic">Không có buổi học</span>
                      </div>
                    ) : (
                      daySessions.map((sessionItem) => {
                        const isLive = sessionItem.status === "live";
                        const isCompleted = sessionItem.status === "completed";
                        const isRescheduled = sessionItem.status === "rescheduled" || sessionItem.status === "reschedule_requested";

                        return (
                          <div
                            key={sessionItem.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 relative transition-all hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs space-y-2"
                          >
                            {/* Live Indicator */}
                            {isLive && (
                              <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white"></span>
                                ĐANG DIỄN RA
                              </div>
                            )}

                            {/* Status & Mode Row */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Clock size={12} className="text-slate-500" />
                                {sessionItem.startTime} - {sessionItem.endTime}
                              </span>
                              {/* Removed Mode Badge */}
                            </div>

                            {/* Subject & Tutor */}
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {sessionItem.tutorName}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{sessionItem.subject}</p>
                            </div>

                            {/* Topic Title - Clean concise preview */}
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                              {sessionItem.topic}
                            </p>

                            {/* Status indicator badge */}
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
                              {isCompleted ? (
                                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={11} strokeWidth={1.75} /> Đã hoàn thành
                                </span>
                              ) : isRescheduled ? (
                                <span className="font-medium text-amber-600 dark:text-amber-400">{sessionItem.status === "reschedule_requested" ? "Chờ xác nhận lịch mới" : "Đã dời lịch"}</span>
                              ) : isLive ? (
                                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                  <Radio size={11} strokeWidth={1.75} /> Đang diễn ra
                                </span>
                              ) : (
                                <span className="text-slate-500">Sắp diễn ra</span>
                              )}

                              <button
                                onClick={() => setSelectedDetailSession(sessionItem)}
                                className="flex items-center gap-0.5 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                              >
                                <Eye size={11} strokeWidth={1.75} /> Xem chi tiết
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* 4. Agenda Stream View (Nhật ký Buổi học) — mặc định trên mobile */}
      {(viewMode === "agenda" || !isDesktop) && (
        <div className="space-y-6">
          {/* Agenda Category Filters */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAgendaCategory("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${agendaCategory === "all"
                ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Tất cả ({agendaTutorFilteredSchedule.length})
            </button>
            <button
              type="button"
              onClick={() => setAgendaCategory("upcoming")}
              className={`px-3 py-1.5 rounded-lg transition-all ${agendaCategory === "upcoming"
                ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Sắp học / cần xử lý ({upcomingAndLiveSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setAgendaCategory("completed")}
              className={`px-3 py-1.5 rounded-lg transition-all ${agendaCategory === "completed"
                ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Đã hoàn thành ({completedJournalSessions.length})
            </button>
          </div>

          {/* SECTION 1: BUỔI HỌC SẮP DIỄN RA */}
          {(agendaCategory === "all" || agendaCategory === "upcoming") && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>LỊCH HỌC & YÊU CẦU ĐỔI LỊCH ({upcomingAndLiveSessions.length} buổi)</span>
              </div>

              {upcomingAndLiveSessions.length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-400 italic border border-slate-200 dark:border-slate-800">
                  Không có buổi học nào sắp diễn ra.
                </Card>
              ) : (
                upcomingAndLiveSessions.map((item) => {
                  const isLive = item.status === "live";

                  return (
                    <Card key={item.id} className="p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left Column: Date, Time & Tutor */}
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                              {item.dayOfWeek} ({item.dateStr})
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                              <Clock size={12} /> {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {item.tutorName}
                          </h4>
                          <p className="text-xs text-slate-500">{item.subject}</p>
                        </div>

                        {/* Middle Column: Topic & Location */}
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                              {/* Removed Mode Badge */}
                            {isLive && (
                              <Badge tone="emerald" size="xs">
                                <Radio size={10} /> ĐANG DIỄN RA
                              </Badge>
                            )}
                            {item.status === "reschedule_requested" && <Badge tone="amber" size="xs">Chờ trung tâm xác nhận lịch mới</Badge>}
                            {item.status === "rescheduled" && <Badge tone="amber" size="xs">Đã dời lịch</Badge>}
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.topic}
                          </p>

                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex items-center gap-1">
                            <MapPin size={11} className="shrink-0 text-slate-400" /> Địa điểm: {getOfflineLocation(item)}
                          </p>
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            size="sm"
                            onClick={() => setSelectedDetailSession(item)}
                            className="text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Eye size={13} strokeWidth={1.75} /> Xem chi tiết
                          </Button>
                          {(item.status === "upcoming" || item.status === "live") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRescheduleModalSession(item)}
                              className="text-xs text-slate-600 dark:text-slate-400"
                            >
                              Đổi lịch
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* SECTION 2: NHẬT KÝ BUỔI HỌC ĐÃ HOÀN THÀNH */}
          {(agendaCategory === "all" || agendaCategory === "completed") && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>NHẬT KÝ BUỔI HỌC ĐÃ HOÀN THÀNH ({completedJournalSessions.length} buổi)</span>
              </div>

              {completedJournalSessions.length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-400 italic border border-slate-200 dark:border-slate-800">
                  Chưa có nhật ký buổi học nào đã hoàn thành.
                </Card>
              ) : (
                completedJournalSessions.map((item) => {

                  return (
                    <Card key={item.id} className="p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left Column: Date, Time & Tutor */}
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                              {item.dayOfWeek} ({item.dateStr})
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                              <Clock size={12} /> {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {item.tutorName}
                          </h4>
                          <p className="text-xs text-slate-500">{item.subject}</p>
                        </div>

                        {/* Middle Column: Topic & Location */}
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge tone="emerald" size="xs">
                              <CheckCircle2 size={10} /> Hoàn thành
                            </Badge>
                            {/* Removed Mode Badge */}
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.topic}
                          </p>

                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex items-center gap-1">
                            <MapPin size={11} className="shrink-0 text-slate-400" /> Địa điểm: {getOfflineLocation(item)}
                          </p>
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            size="sm"
                            onClick={() => setSelectedDetailSession(item)}
                            className="text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Sparkles size={13} strokeWidth={1.75} /> Xem chi tiết &amp; nhận xét
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Modal: Xin nghỉ / Đổi lịch */}
      {rescheduleModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Yêu cầu Đổi lịch Học
                  </h3>
                  <p className="text-xs text-slate-500">Gửi tới {rescheduleModalSession.tutorName}</p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModalSession(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Buổi học: {rescheduleModalSession.topic}
                </p>
                <p className="text-slate-500">
                  Thời gian: {rescheduleModalSession.dayOfWeek} ({rescheduleModalSession.startTime} - {rescheduleModalSession.endTime})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do xin đổi lịch: *
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Trùng lịch kiểm tra tại trường">Trùng lịch kiểm tra tại trường</option>
                  <option value="Bận việc gia đình đột xuất">Bận việc gia đình đột xuất</option>
                  <option value="Sức khỏe không tốt">Sức khỏe không tốt</option>
                  <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đề xuất 2-3 khung giờ rảnh thay thế của bạn:
                </label>
                <textarea
                  rows={3}
                  value={preferredSlots}
                  onChange={(e) => setPreferredSlots(e.target.value)}
                  placeholder="Ví dụ: Tối Thứ 5 (19:30 - 21:00) hoặc Sáng Chủ Nhật (09:00 - 10:30)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleModalSession(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="flex items-center gap-1.5 font-semibold">
                  <Send size={13} strokeWidth={1.75} /> Gửi yêu cầu đổi lịch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Sync Google Calendar */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-slate-600 dark:text-slate-400" /> Đồng bộ Calendar
              </h3>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có thể đồng bộ toàn bộ lịch học vào ứng dụng Lịch cá nhân trên Điện thoại hoặc Máy tính để nhận thông báo tự động.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
              https://edtech.platform/api/calendar/v1/student_s1_feed.ics
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSyncModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText("https://edtech.platform/api/calendar/v1/student_s1_feed.ics");
                  setNotification("Đã sao chép đường dẫn Lịch iCal vào Khay nhớ tạm!");
                  setIsSyncModalOpen(false);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="font-semibold"
              >
                Sao chép Link .iCal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Session Detail & Feedback */}
      {selectedDetailSession && (
        <LessonSessionDetail
          sessionId={selectedDetailSession.id}
          onClose={closeLessonDetail}
        />
      )}
    </div>
  );
}
