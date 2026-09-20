import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Grid,
  List,
  User,
  BookOpen,
  FileText,
  Send,
  X,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Key,
  Layers,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SessionDetailModal from "../../components/student/SessionDetailModal";

export default function StudentSchedule() {
  const { session } = useAuth();
  const student = getStudentById(session?.studentId || "s1");

  // Raw schedule items
  const rawSchedule = student?.multiTutorSchedule || [];

  // State management
  const [selectedTutorId, setSelectedTutorId] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "agenda"
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // -1 (prev), 0 (current), 1, 2 (future)
  const [agendaCategory, setAgendaCategory] = useState("all"); // "all" | "upcoming" | "completed"
  const [rescheduleModalSession, setRescheduleModalSession] = useState(null);
  const [selectedDetailSession, setSelectedDetailSession] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [preferredSlots, setPreferredSlots] = useState("");
  const [notification, setNotification] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Extract unique tutors from schedule
  const tutorList = [
    { id: "all", name: "Tất cả gia sư", color: "slate" },
    { id: "t1", name: "Nguyễn Lan Anh (IELTS)", color: "indigo" },
    { id: "t2", name: "Trần Minh Quân (Writing)", color: "blue" },
    { id: "t3", name: "Phạm Thu Hà (Giao tiếp)", color: "emerald" },
  ];

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
        isToday: offset === 0 && idx === 1 // Tuesday 04/08 is today
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
    (s) => s.status === "live" || s.status === "upcoming" || s.status === "rescheduled"
  );
  const completedJournalSessions = agendaTutorFilteredSchedule.filter(
    (s) => s.status === "completed"
  );

  // Calculate Quick Stats for current active view
  const totalSessions = currentWeekRawSchedule.length;
  const completedSessions = currentWeekRawSchedule.filter((s) => s.status === "completed").length;
  const liveSessions = rawSchedule.filter((s) => s.status === "live").length;
  const upcomingSessions = currentWeekRawSchedule.filter((s) => s.status === "upcoming").length;

  // Color helper functions
  const getThemeClasses = (colorTheme) => {
    switch (colorTheme) {
      case "indigo":
        return {
          badgeTone: "indigo",
          border: "border-indigo-200 dark:border-indigo-800/60",
          bg: "bg-indigo-50/70 dark:bg-indigo-950/30",
          accentBg: "bg-indigo-600 text-white",
          text: "text-indigo-700 dark:text-indigo-300",
          ring: "ring-indigo-500",
          dotBg: "bg-indigo-500",
        };
      case "blue":
        return {
          badgeTone: "blue",
          border: "border-blue-200 dark:border-blue-800/60",
          bg: "bg-blue-50/70 dark:bg-blue-950/30",
          accentBg: "bg-blue-600 text-white",
          text: "text-blue-700 dark:text-blue-300",
          ring: "ring-blue-500",
          dotBg: "bg-blue-500",
        };
      case "emerald":
        return {
          badgeTone: "emerald",
          border: "border-emerald-200 dark:border-emerald-800/60",
          bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
          accentBg: "bg-emerald-600 text-white",
          text: "text-emerald-700 dark:text-emerald-300",
          ring: "ring-emerald-500",
          dotBg: "bg-emerald-500",
        };
      default:
        return {
          badgeTone: "slate",
          border: "border-slate-200 dark:border-slate-700",
          bg: "bg-slate-50 dark:bg-slate-800/50",
          accentBg: "bg-slate-700 text-white",
          text: "text-slate-700 dark:text-slate-300",
          ring: "ring-slate-400",
          dotBg: "bg-slate-400",
        };
    }
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleReason) return;
    setNotification(
      `Đã gửi yêu cầu đổi lịch buổi "${rescheduleModalSession.topic}" tới ${rescheduleModalSession.tutorName} thành công!`
    );
    setRescheduleModalSession(null);
    setRescheduleReason("");
    setPreferredSlots("");
    setTimeout(() => setNotification(null), 4000);
  };

  // Days of week mapping for Grid View
  const daysOfWeek = [
    { name: "Thứ 2", date: "03/08", dayIndex: 1 },
    { name: "Thứ 3", date: "04/08", dayIndex: 2 },
    { name: "Thứ 4", date: "05/08", dayIndex: 3 },
    { name: "Thứ 5", date: "06/08", dayIndex: 4 },
    { name: "Thứ 6", date: "07/08", dayIndex: 5 },
    { name: "Thứ 7", date: "08/08", dayIndex: 6 },
    { name: "Chủ Nhật", date: "09/08", dayIndex: 7 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 size={22} />
          <span className="text-sm font-medium">{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Lịch học & Phòng học Trực tuyến"
        description="Hệ thống Lịch trình Cá nhân hóa Multi-Tutor: Đồng bộ thời gian học với các Gia sư của bạn."
      />

      {/* 1. Metrics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Buổi học tuần này</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {totalSessions} <span className="text-xs font-normal text-slate-400">buổi</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đã hoàn thành</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {completedSessions}/{totalSessions} <span className="text-xs font-normal text-slate-400">buổi</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-rose-500">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl relative">
            <Video size={22} />
            {liveSessions > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang diễn ra (LIVE)</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {liveSessions} <span className="text-xs font-normal text-slate-400">phòng học</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-indigo-500">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
            <User size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Gia sư cá nhân</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              3 <span className="text-xs font-normal text-slate-400">Gia sư</span>
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Control Toolbar & Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tutor Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
              <Filter size={14} /> Lọc Gia sư:
            </span>
            {tutorList.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTutorId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTutorId === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* View Switcher & Quick Actions */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* View Switch Buttons */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Grid size={14} /> Xem theo Tuần
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "agenda"
                    ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <List size={14} /> Nhật ký Buổi học
              </button>
            </div>

            {/* Sync Calendar Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw size={14} /> Đồng bộ Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Weekly Grid View */}
      {viewMode === "grid" && (
        <Card className="p-4 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Week Navigator Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 mb-4 gap-3">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => Math.max(-1, prev - 1))}
                disabled={currentWeekOffset <= -1}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                <ChevronLeft size={16} /> Tuần trước
              </button>

              <div className="text-center">
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center justify-center gap-1.5">
                  <CalendarDays size={15} /> {currentWeekInfo.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                  {currentWeekOffset === 0
                    ? "📍 Đang hiển thị Tuần hiện tại (03/08 - 09/08/2026)"
                    : currentWeekOffset < 0
                    ? "⏪ Nhật ký Lịch học các tuần quá khứ"
                    : "⏩ Lịch học các tuần tương lai"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => Math.min(2, prev + 1))}
                disabled={currentWeekOffset >= 2}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
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
                    className={`py-2 px-1 rounded-xl transition-all ${
                      day.isToday
                        ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wider">{day.name}</p>
                    <p className="text-sm font-bold mt-0.5">{day.date}</p>
                    {day.isToday && (
                      <span className="inline-block mt-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal">
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
                // Get sessions for this day
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
                        const theme = getThemeClasses(sessionItem.colorTheme);
                        const isLive = sessionItem.status === "live";
                        const isCompleted = sessionItem.status === "completed";
                        const isRescheduled = sessionItem.status === "rescheduled";

                        return (
                          <div
                            key={sessionItem.id}
                            className={`p-3 rounded-xl border ${theme.border} ${theme.bg} relative transition-all hover:shadow-md group`}
                          >
                            {/* Live Badge Pulsing */}
                            {isLive && (
                              <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                LIVE
                              </div>
                            )}

                            {/* Status Tag */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                <Clock size={12} className={theme.text} />
                                {sessionItem.startTime} - {sessionItem.endTime}
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge tone={sessionItem.learningMode === "offline" ? "amber" : "blue"} size="xs">
                                  {sessionItem.learningMode === "offline" ? "🏠 Off" : "💻 On"}
                                </Badge>
                                {isCompleted && (
                                  <Badge tone="emerald" size="xs">
                                    ✓ Xong
                                  </Badge>
                                )}
                                {isRescheduled && (
                                  <Badge tone="amber" size="xs">
                                    ⏳ Chờ đổi
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Subject & Tutor */}
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {sessionItem.tutorName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">{sessionItem.subject}</p>
                            </div>

                            {/* Topic Title */}
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2 mb-1.5">
                              {sessionItem.topic}
                            </p>

                            {/* Online Room Info Preview */}
                            {sessionItem.learningMode === "online" && sessionItem.classCode && (
                              <div className="mb-2 p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-lg text-[10px] space-y-0.5 border border-slate-200/50 dark:border-slate-800">
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                  <span>🔑 Mã: <strong className="font-mono text-blue-600 dark:text-blue-400">{sessionItem.classCode}</strong></span>
                                  <span>🔒 <strong className="font-mono text-emerald-600 dark:text-emerald-400">{sessionItem.passcode}</strong></span>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {isLive ? (
                              <div className="space-y-1">
                                {sessionItem.learningMode === "offline" ? (
                                  <div className="w-full text-center py-1 px-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm truncate">
                                    📍 Offline: {sessionItem.location}
                                  </div>
                                ) : (
                                  <a
                                    href={sessionItem.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                  >
                                    <Video size={13} /> Vào học ngay
                                  </a>
                                )}
                                <button
                                  onClick={() => setSelectedDetailSession(sessionItem)}
                                  className="w-full text-center text-[10px] font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 underline pt-0.5"
                                >
                                  Xem chi tiết ➔
                                </button>
                              </div>
                            ) : isCompleted ? (
                              <button
                                onClick={() => setSelectedDetailSession(sessionItem)}
                                className="w-full flex items-center justify-between text-[11px] text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-medium transition-colors"
                              >
                                {sessionItem.learningMode === "offline" ? (
                                  <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                                    🏠 Offline
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                    <PlayCircle size={12} /> {sessionItem.recordDuration || "Rec"}
                                  </span>
                                )}
                                <span className="font-bold underline text-[10px]">Chi tiết ➔</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                                <button
                                  onClick={() => setSelectedDetailSession(sessionItem)}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <Eye size={11} /> Chi tiết
                                </button>
                                <button
                                  onClick={() => setRescheduleModalSession(sessionItem)}
                                  className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline shrink-0"
                                >
                                  Đổi lịch
                                </button>
                              </div>
                            )}
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

      {/* 4. Agenda Stream View (Nhật ký Buổi học) */}
      {viewMode === "agenda" && (
        <div className="space-y-6">
          {/* Agenda Category Filters */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAgendaCategory("all")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                agendaCategory === "all"
                  ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Tất cả nhật ký ({agendaTutorFilteredSchedule.length})
            </button>
            <button
              type="button"
              onClick={() => setAgendaCategory("upcoming")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                agendaCategory === "upcoming"
                  ? "bg-white text-blue-600 dark:bg-slate-700 dark:text-blue-300 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              📌 Lịch tuần này & tới ({upcomingAndLiveSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setAgendaCategory("completed")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                agendaCategory === "completed"
                  ? "bg-white text-emerald-600 dark:bg-slate-700 dark:text-emerald-300 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              📚 Đã hoàn thành ({completedJournalSessions.length})
            </button>
          </div>

          {/* SECTION 1: BUỔI HỌC SẮP DIỄN RA & KẾ HOẠCH TỚI (LÊN ĐẦU) */}
          {(agendaCategory === "all" || agendaCategory === "upcoming") && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>📌 LỊCH HỌC TUẦN NÀY & KẾ HOẠCH TỚI ({upcomingAndLiveSessions.length} buổi)</span>
              </div>

              {upcomingAndLiveSessions.length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-400 italic">
                  Không có buổi học nào sắp diễn ra.
                </Card>
              ) : (
                upcomingAndLiveSessions.map((item) => {
                  const theme = getThemeClasses(item.colorTheme);
                  const isLive = item.status === "live";
                  const isOffline = item.learningMode === "offline";

                  return (
                    <Card key={item.id} className="p-5 border border-border bg-card hover:border-primary/40 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Column: Date, Time & Tutor */}
                        <div className="min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                              {item.dayOfWeek} ({item.dateStr})
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} /> {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-foreground mt-1">
                            {item.tutorName}
                          </h4>
                          <p className="text-xs text-muted-foreground">{item.subject}</p>
                        </div>

                        {/* Middle Column: Topic, Online Room Info & Prep Note */}
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge tone={isOffline ? "amber" : "blue"} size="xs">
                              {isOffline ? "🏠 Offline Tại nhà/Trung tâm" : "💻 Online Trực tuyến"}
                            </Badge>
                            {isLive && (
                              <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                ĐANG DIỄN RA (LIVE)
                              </span>
                            )}
                            {item.status === "upcoming" && (
                              (item.weekOffset ?? 0) === 0 ? (
                                <Badge tone="blue">Sắp diễn ra (Tuần này)</Badge>
                              ) : (
                                <Badge tone="slate">Theo kế hoạch (Tuần tới)</Badge>
                              )
                            )}
                            {item.status === "rescheduled" && <Badge tone="amber">Chờ duyệt đổi lịch</Badge>}

                            <div className="flex flex-wrap gap-1">
                              {item.skills.map((sk) => (
                                <Badge key={sk} tone={theme.badgeTone} size="xs">
                                  {sk}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item.topic}
                          </p>

                          {/* Online Credentials Banner */}
                          {!isOffline && item.classCode && (
                            <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg text-xs space-y-1 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                                🔑 Mã lớp: <strong className="font-mono text-blue-600 dark:text-blue-400">{item.classCode}</strong>
                              </span>
                              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                                🔒 Mật khẩu: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{item.passcode}</strong>
                              </span>
                            </div>
                          )}

                          {isOffline && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                              📍 <strong>Địa điểm:</strong> {item.location}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Sparkles size={13} className="text-amber-500 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Ghi chú chuẩn bị:</span> {item.prepNote}
                          </p>
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {isLive ? (
                            isOffline ? (
                              <div className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm">
                                📍 Học Offline tại nhà
                              </div>
                            ) : (
                              <a
                                href={item.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all hover:scale-105"
                              >
                                <Video size={16} /> Vào phòng học ngay
                              </a>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => setSelectedDetailSession(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                              >
                                <Eye size={14} /> Chi tiết lịch học
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRescheduleModalSession(item)}
                                className="text-xs text-slate-600 dark:text-slate-400"
                              >
                                Xin đổi lịch
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* SECTION 2: NHẬT KÝ BUỔI HỌC ĐÃ HOÀN THÀNH (XUỐNG CUỐI) */}
          {(agendaCategory === "all" || agendaCategory === "completed") && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>📚 NHẬT KÝ BUỔI HỌC ĐÃ HOÀN THÀNH ({completedJournalSessions.length} buổi)</span>
              </div>

              {completedJournalSessions.length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-400 italic">
                  Chưa có nhật ký buổi học nào đã hoàn thành.
                </Card>
              ) : (
                completedJournalSessions.map((item) => {
                  const theme = getThemeClasses(item.colorTheme);
                  const isOffline = item.learningMode === "offline";

                  return (
                    <Card key={item.id} className="p-5 border border-border bg-card hover:border-primary/40 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Column: Date, Time & Tutor */}
                        <div className="min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                              {item.dayOfWeek} ({item.dateStr})
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} /> {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-foreground mt-1">
                            {item.tutorName}
                          </h4>
                          <p className="text-xs text-muted-foreground">{item.subject}</p>
                        </div>

                        {/* Middle Column: Lesson Takeaways Summary & Tutor Eval */}
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge tone="emerald" size="xs">✓ Đã hoàn thành</Badge>
                            <Badge tone={isOffline ? "amber" : "blue"} size="xs">
                              {isOffline ? "🏠 Offline" : "💻 Online"}
                            </Badge>
                            {item.hasRecord && (
                              <Badge tone="emerald" size="xs">
                                📹 Record ({item.recordDuration})
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.topic}
                          </p>

                          {item.lessonSummary?.takeaways && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                              💡 <strong>Tóm tắt:</strong> {item.lessonSummary.takeaways[0]}
                            </p>
                          )}

                          {item.tutorEvaluation?.comment && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic line-clamp-1">
                              💬 Gia sư nhận xét: &quot;{item.tutorEvaluation.comment}&quot;
                            </p>
                          )}
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <Button
                            size="sm"
                            onClick={() => setSelectedDetailSession(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles size={14} /> Chi tiết & Feedback
                          </Button>
                          {!isOffline && item.hasRecord && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDetailSession(item)}
                              className="text-xs flex items-center gap-1.5"
                            >
                              <PlayCircle size={14} className="text-emerald-500" /> Video Record
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
        </div>
      )}

      {/* 5. Modal: Xin nghỉ / Đổi lịch */}
      {rescheduleModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
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
                <p className="font-semibold text-slate-900 dark:text-white">
                  Buổi học: {rescheduleModalSession.topic}
                </p>
                <p className="text-slate-500">
                  Thời gian gốc: {rescheduleModalSession.dayOfWeek} ({rescheduleModalSession.startTime} - {rescheduleModalSession.endTime})
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
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="school">Trùng lịch kiểm tra tại trường</option>
                  <option value="family">Bận việc gia đình xuất thần</option>
                  <option value="health">Sức khỏe không tốt</option>
                  <option value="other">Lý do cá nhân khác</option>
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
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                <Button type="submit" size="sm" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                  <Send size={14} /> Gửi yêu cầu qua Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Sync Google Calendar */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-blue-500" /> Đồng bộ Google / Apple Calendar
              </h3>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có thể đồng bộ toàn bộ lịch học của 3 Gia sư vào ứng dụng Lịch cá nhân trên Điện thoại hoặc Máy tính để nhận thông báo tự động trước 15 phút.
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
                  setNotification("Đã sao chép đường dẫn Lịch iCal/Google Calendar vào Khay nhớ tạm!");
                  setIsSyncModalOpen(false);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Sao chép Link .iCal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Session Detail & Feedback */}
      {selectedDetailSession && (
        <SessionDetailModal
          sessionItem={selectedDetailSession}
          onClose={() => setSelectedDetailSession(null)}
        />
      )}
    </div>
  );
}
