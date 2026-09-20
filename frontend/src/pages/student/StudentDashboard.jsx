import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  NotebookPen,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Video,
  User,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Brain,
  Flame,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import Button from "../../components/ui/Button";

export default function StudentDashboard() {
  const { session } = useAuth();
  const student = getStudentById(session?.studentId || "s1");

  const [selectedTutorFilter, setSelectedTutorFilter] = useState("all");

  const rawSchedule = student?.multiTutorSchedule || [];
  const rawExercises = student?.exercises || [];
  const tutorBreakdowns = student?.tutorProgressBreakdown || [];

  // Tutors List for filter
  const tutorsList = [
    { id: "all", name: "Tất cả Gia sư", color: "slate" },
    { id: "t1", name: "Nguyễn Lan Anh (IELTS)", color: "indigo" },
    { id: "t2", name: "Trần Minh Quân (Writing)", color: "blue" },
    { id: "t3", name: "Phạm Thu Hà (Giao tiếp)", color: "emerald" },
  ];

  // Active tutors overview cards data
  const activeTutorsData = [
    {
      id: "t1",
      name: "Nguyễn Lan Anh",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
      subject: "Luyện thi IELTS 6.5+",
      colorTheme: "indigo",
      nextSession: "Thứ 4 (19:30)",
      progress: 75,
      currentBand: "6.0/6.5 Band",
      statusBadge: "RẢNH 3 BUỔI/TUẦN",
      meetingLink: "https://meet.jit.si/EdTech_CoLanAnh_IELTS",
    },
    {
      id: "t2",
      name: "Trần Minh Quân",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      subject: "IELTS Writing Task 2",
      colorTheme: "blue",
      nextSession: "Thứ 3 (19:00 - LIVE)",
      progress: 60,
      currentBand: "5.5/6.5 Band",
      statusBadge: "FULL LỊCH",
      meetingLink: "https://meet.jit.si/EdTech_ThayMinhQuan_WritingTask2",
    },
    {
      id: "t3",
      name: "Phạm Thu Hà",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
      subject: "Giao tiếp & Phát âm IPA",
      colorTheme: "emerald",
      nextSession: "Thứ 5 (18:00)",
      progress: 82,
      currentBand: "Trình độ B1",
      statusBadge: "RẢNH 4 BUỔI/TUẦN",
      meetingLink: "https://meet.jit.si/EdTech_CoThuHa_Pronunciation",
    },
  ];

  // Filter schedule & exercises
  const filteredSchedule = rawSchedule.filter(
    (s) => selectedTutorFilter === "all" || s.tutorId === selectedTutorFilter
  );
  const filteredExercises = rawExercises.filter(
    (e) => selectedTutorFilter === "all" || e.tutorId === selectedTutorFilter
  );

  const upcomingSessions = filteredSchedule.filter((s) => s.status !== "completed").slice(0, 3);
  const todoExercises = filteredExercises.filter((e) => e.status === "assigned" || e.status === "submitted");

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title={`Chào ${student.name.split(" ").pop()}! 👋`}
        description="Tổng quan Lộ trình Cá nhân hóa Multi-Tutor & Tiến độ học tập thích ứng Adaptive LMS."
      />

      {/* Quick Metrics Bar */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={User} label="Gia sư đang học" value="3 Gia sư" tone="neutral" />
        <StatCard icon={CalendarDays} label="Buổi học tuần này" value={`${rawSchedule.length} buổi`} tone="neutral" />
        <StatCard icon={NotebookPen} label="Bài tập cần làm" value={`${todoExercises.length} bài`} tone="neutral" />
        <StatCard icon={Brain} label="Thẻ ôn hôm nay" value={`${student?.spacedRepetitionDeck?.dueTodayCount || 5} câu`} tone="neutral" />
      </div>

      {/* Spaced Repetition SM-2 Daily Widget - Clean & Minimal */}
      <Card className="p-4 sm:p-5 border border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Brain size={18} className="text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Ôn tập ngắt quãng (SM-2)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                  Chuỗi {student?.spacedRepetitionDeck?.streakDays || 5} ngày
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hôm nay có {student?.spacedRepetitionDeck?.dueTodayCount || 5} thẻ câu hỏi đến lịch ôn tập để củng cố trí nhớ dài hạn.
              </p>
            </div>
          </div>
          <Link
            to="/student/spaced-repetition"
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
          >
            Bắt đầu ôn tập ({student?.spacedRepetitionDeck?.dueTodayCount || 5} thẻ) <ArrowRight size={13} />
          </Link>
        </div>
      </Card>

      {/* AI Roadmap Banner - Clean & Neutral */}
      <Card className="p-4 border border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Lộ trình học cá nhân hóa
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kế hoạch học tập 3 giai đoạn được điều chỉnh riêng theo năng lực và các gia sư phụ trách.
              </p>
            </div>
          </div>
          <Link
            to="/student/progress"
            className="px-3.5 py-1.5 border border-border hover:bg-muted text-foreground font-medium text-xs rounded-lg shrink-0 flex items-center justify-center gap-1.5 transition-colors"
          >
            Xem lộ trình <ArrowRight size={13} />
          </Link>
        </div>
      </Card>

      {/* 1. Active Tutors Cards Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Gia sư đang phụ trách (3 gia sư)
          </h2>
          <Link to="/student/chat" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Hộp thư trao đổi <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {activeTutorsData.map((tutor) => {
            const isLive = tutor.nextSession.includes("LIVE");
            return (
              <Card
                key={tutor.id}
                className="p-4 border border-border bg-card hover:border-primary/40 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {tutor.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tutor.subject}</p>
                  </div>
                  <Badge tone="neutral" size="xs">
                    {tutor.currentBand}
                  </Badge>
                </div>

                <div className="space-y-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Buổi tiếp:</span>
                    <span className={`font-medium flex items-center gap-1 ${isLive ? "text-rose-600 font-semibold" : "text-foreground"}`}>
                      <Clock size={12} /> {tutor.nextSession}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Tiến độ</span>
                      <span className="font-medium text-foreground">{tutor.progress}%</span>
                    </div>
                    <ProgressBar value={tutor.progress} size="xs" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Link
                    to="/student/chat"
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-medium transition-colors"
                  >
                    <MessageSquare size={12} /> Chat
                  </Link>
                  <Link
                    to={`/student/exercises?tutor=${tutor.id}`}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 border border-border hover:bg-muted text-foreground rounded-lg text-xs font-medium transition-colors"
                  >
                    <NotebookPen size={12} /> Bài tập
                  </Link>
                  <a
                    href={tutor.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                      isLive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    <Video size={12} /> {isLive ? "LIVE" : "Phòng"}
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs py-1">
        <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1">
          <Filter size={13} /> Lọc theo gia sư:
        </span>
        {tutorsList.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTutorFilter(t.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedTutorFilter === t.id
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Weak Skill Alert */}
      {student?.weakSkill && (
        <Card className="flex items-center justify-between gap-4 border-border bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted text-muted-foreground rounded-lg shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Kỹ năng cần ưu tiên: <span className="text-primary">{student.weakSkill}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gia sư đã giao bài luyện tập bổ trợ giúp bạn cải thiện kỹ năng này.
              </p>
            </div>
          </div>
          <Link
            to="/student/exercises"
            className="shrink-0 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors"
          >
            Làm bài ngay
          </Link>
        </Card>
      )}

      {/* 2-Column Section: Upcoming Sessions & Todo Exercises */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Upcoming Sessions */}
        <Card padded={false} className="border border-border">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
              <CalendarDays size={15} className="text-muted-foreground" /> Buổi học sắp tới
            </h2>
            <Link to="/student/schedule" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Xem lịch ➔
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingSessions.map((sessionItem) => (
              <div key={sessionItem.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {sessionItem.tutorName}
                    </span>
                    <Badge tone="neutral" size="xs">
                      {sessionItem.subject}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sessionItem.dayOfWeek} ({sessionItem.startTime})
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {sessionItem.topic}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground italic">💡 {sessionItem.prepNote}</span>
                  <a
                    href={sessionItem.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    Vào phòng ➔
                  </a>
                </div>
              </div>
            ))}
            {upcomingSessions.length === 0 && (
              <p className="p-6 text-center text-xs text-muted-foreground">Không có buổi học sắp tới nào.</p>
            )}
          </div>
        </Card>

        {/* Column 2: Todo Exercises */}
        <Card padded={false} className="border border-border">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
              <NotebookPen size={15} className="text-muted-foreground" /> Bài tập cần làm ({todoExercises.length})
            </h2>
            <Link to="/student/exercises" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Tất cả bài tập ➔
            </Link>
          </div>
          <div className="divide-y divide-border">
            {todoExercises.map((ex) => (
              <Link
                key={ex.id}
                to={`/student/exercises/${ex.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {ex.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ex.tutorName} · {ex.skill} · {ex.difficulty}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Badge tone={ex.status === "assigned" ? "neutral" : "neutral"} size="xs">
                    {ex.status === "assigned" ? "Chưa làm" : "Chờ chấm"}
                  </Badge>
                </div>
              </Link>
            ))}
            {todoExercises.length === 0 && (
              <p className="p-6 text-center text-xs text-muted-foreground">Bạn đã hoàn thành hết bài tập!</p>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Multi-Tutor Progress Breakdown */}
      <Card className="p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <TrendingUp size={15} className="text-muted-foreground" /> Tiến độ theo từng gia sư
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Điểm khởi điểm đầu vào và tiến độ các kỹ năng.</p>
          </div>
          <Link to="/student/progress" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Báo cáo chi tiết ➔
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {tutorBreakdowns.map((tb) => (
            <div
              key={tb.tutorId}
              className="p-3.5 rounded-lg bg-muted/20 border border-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">{tb.tutorName}</p>
                  <p className="text-[11px] text-muted-foreground">{tb.subject}</p>
                </div>
                <Badge tone="neutral" size="xs">
                  {tb.growthPercentage}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-muted/40 p-2 rounded-md text-center text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Đầu vào</span>
                  <span className="font-semibold text-foreground">{tb.baselineScore}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Hiện tại</span>
                  <span className="font-semibold text-foreground">{tb.currentScore}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Mục tiêu</span>
                  <span className="font-semibold text-foreground">{tb.targetScore}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {tb.skills.map((sk) => (
                  <div key={sk.name} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground font-medium">{sk.name}</span>
                      <span className="font-medium text-foreground">{sk.current}%</span>
                    </div>
                    <ProgressBar value={sk.current} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
