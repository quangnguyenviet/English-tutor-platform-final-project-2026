import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CalendarDays,
  Lightbulb,
  Lock,
  Map,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import { getStudentById } from "../../data/mockData";
import { getProgressSummary } from "../../lib/studentLearningViewModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import ProgressBar from "../../components/ui/ProgressBar";
import ProgressChart from "../../components/charts/ProgressChart";
import LessonSessionDetail from "../../components/student/LessonSessionDetail";

const VIEW_OPTIONS = [
  {
    id: "overview",
    label: "Tổng quan",
    description: "Xu hướng & kết quả",
    icon: BarChart3,
  },
  {
    id: "skills",
    label: "Năng lực",
    description: "Điểm mạnh & điểm yếu",
    icon: Brain,
  },
  {
    id: "roadmap",
    label: "Lộ trình",
    description: "Mục tiêu & chặng học",
    icon: Map,
  },
];

function SummaryMetric({ icon: Icon, label, value, hint, tone = "blue" }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, description }) {
  return (
    <Card className="flex flex-col items-center px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon size={23} strokeWidth={1.75} />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
  );
}

function RoadmapScore({ label, value, active }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-1 font-mono text-sm font-bold ${
          active ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function StudentProgress() {
  const { session } = useAuth();
  const { sessions } = useLessonSessions();
  const student = getStudentById(session?.studentId || "s1");
  const [mainViewMode, setMainViewMode] = useState("overview");
  const [selectedTutorId, setSelectedTutorId] = useState("t1");
  const [overviewTutorId, setOverviewTutorId] = useState("all");
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  const summary = useMemo(() => getProgressSummary(student), [student]);
  const tutorBreakdowns = student?.tutorProgressBreakdown || [];
  const roadmaps = student?.aiRoadmaps || [];
  const knowledgeProfile = student?.studentKnowledgeProfile;
  const studentSessions = sessions.filter((item) => item.studentId === (session?.studentId || "s1"));
  const completedLessons = studentSessions.filter((item) => item.status === "completed");
  const latestLesson = [...completedLessons].sort((left, right) =>
    (right.fullDate || "").localeCompare(left.fullDate || "")
  )[0];
  const openQuestions = studentSessions.reduce(
    (count, item) => count + (item.questions || []).filter((question) => !question.reply).length,
    0
  );
  const selectedRoadmap =
    roadmaps.find((roadmap) => roadmap.tutorId === selectedTutorId) || roadmaps[0] || null;
  const visibleTutorBreakdowns = tutorBreakdowns.filter(
    (tutor) => overviewTutorId === "all" || tutor.tutorId === overviewTutorId
  );
  const visibleResults = summary.gradedExercises.filter(
    (exercise) => overviewTutorId === "all" || exercise.tutorId === overviewTutorId
  );

  function openSessionDetails(roadmap, roadmapSession) {
    const scheduleSession = studentSessions.find(
      (item) => item.tutorId === roadmap.tutorId && item.topic === roadmapSession.topic
    );
    if (scheduleSession) setSelectedSessionForModal(scheduleSession.id);
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        className="mb-0"
        eyebrow="Kết quả học tập"
        title="Kết quả & Tiến bộ"
        description="Xem xu hướng học tập, điểm cần cải thiện và chặng tiếp theo trong lộ trình."
        actions={
          <Button as={Link} to="/student/exercises" size="sm">
            Tiếp tục làm bài
            <ArrowRight size={16} />
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Nội dung kết quả và tiến bộ"
        className="grid w-full sm:w-auto grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 sm:inline-grid sm:grid-cols-3"
      >
        {VIEW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = mainViewMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMainViewMode(option.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>
                <span className="block text-xs font-semibold">{option.label}</span>
                <span className="hidden text-[10px] font-normal opacity-75 lg:block">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {mainViewMode === "overview" && (
        <div className="space-y-6">
          <section aria-label="Chỉ số tiến bộ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryMetric
              icon={Brain}
              label="Mức tinh thông"
              value={`${summary.overallElo}/100`}
              hint="Hồ sơ năng lực hiện tại"
              tone="blue"
            />
            <SummaryMetric
              icon={Award}
              label="Điểm trung bình"
              value={`${summary.averageScore}%`}
              hint={`${summary.gradedExercises.length} bài đã chấm`}
              tone="emerald"
            />
            <SummaryMetric
              icon={CheckCircle2}
              label="Nộp bài đúng hạn"
              value={`${summary.onTimeSubmissionRate}%`}
              hint="Duy trì nhịp học ổn định"
              tone="amber"
            />
            <SummaryMetric
              icon={CalendarDays}
              label="Buổi đã học"
              value={completedLessons.length}
              hint="Từ trạng thái buổi học"
              tone="blue"
            />
          </section>

          {latestLesson && (
            <Card className="border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="emerald" size="xs">Buổi gần nhất đã học</Badge>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {latestLesson.dateStr} · {latestLesson.tutorName}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{latestLesson.topic}</h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {latestLesson.report?.publishedAt
                      ? latestLesson.report.achievement || latestLesson.report.summary
                      : "Đang chờ gia sư cập nhật ghi nhận sau buổi học."}
                  </p>
                  {openQuestions > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <MessageCircle size={13} /> {openQuestions} câu hỏi đang chờ gia sư trả lời
                    </p>
                  )}
                </div>
                <Button as={Link} to={`/student/schedule?lesson=${latestLesson.id}`} variant="outline" size="sm">
                  Xem trao đổi buổi học <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          )}

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-5" aria-label="Bức tranh tiến bộ">
            <Card className="min-w-0 p-5 lg:col-span-3">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <TrendingUp size={17} className="text-blue-500" />
                    Xu hướng kỹ năng
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Điểm theo từng kỹ năng trong 5 tuần gần nhất.
                  </p>
                </div>
                <Badge tone="emerald">Đang tiến bộ</Badge>
              </div>
              {(student?.progressHistory || []).length > 0 ? (
                <ProgressChart data={student.progressHistory} height={260} />
              ) : (
                <p className="py-16 text-center text-xs text-slate-400">Chưa đủ dữ liệu để vẽ biểu đồ.</p>
              )}
            </Card>

            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center gap-2">
                <Target size={17} className="text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Nên tập trung tuần này</h2>
              </div>

              {summary.focusSkill ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Kỹ năng ưu tiên
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                          {summary.focusSkill.name}
                        </h3>
                      </div>
                      <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
                        {summary.focusSkill.masteryElo}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {summary.focusSkill.suggestion}
                    </p>
                  </div>

                  {summary.strongestSkill && (
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Điểm mạnh đang duy trì</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {summary.strongestSkill.name} · {summary.strongestSkill.masteryElo}/100
                        </p>
                      </div>
                    </div>
                  )}

                  <Button as={Link} to="/student/exercises" className="w-full" size="sm">
                    Luyện kỹ năng ưu tiên
                    <ArrowRight size={15} />
                  </Button>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Chưa đủ dữ liệu để đề xuất kỹ năng cần ưu tiên.
                </p>
              )}
            </Card>
          </section>

          <section className="space-y-4" aria-labelledby="tutor-progress-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="tutor-progress-heading" className="text-base font-bold text-slate-900 dark:text-white">
                  Tiến độ theo gia sư
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  So sánh điểm hiện tại với mục tiêu của từng lớp.
                </p>
              </div>
              <label className="w-full sm:w-auto">
                <span className="sr-only">Lọc tiến độ theo gia sư</span>
                <select
                  value={overviewTutorId}
                  onChange={(event) => setOverviewTutorId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
                >
                  <option value="all">Tất cả gia sư</option>
                  {tutorBreakdowns.map((tutor) => (
                    <option key={tutor.tutorId} value={tutor.tutorId}>
                      {tutor.tutorName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibleTutorBreakdowns.length > 0 ? (
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleTutorBreakdowns.map((tutor) => {
                    const tutorSessions = studentSessions.filter((item) => item.tutorId === tutor.tutorId);
                    const completedCount = tutorSessions.filter((item) => item.status === "completed").length;
                    const upcomingCount = tutorSessions.filter((item) => item.status === "upcoming" || item.status === "confirmed" || item.status === "live").length;
                    return (
                      <div key={tutor.tutorId} className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tutor.tutorName}</h3>
                            <Badge tone="blue" size="xs">{completedCount} buổi đã học</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tutor.subject}</p>
                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                            {upcomingCount} buổi đang lên lịch · {tutorSessions.filter((item) => item.status === "reschedule_requested" || item.status === "rescheduled" || item.status === "cancelled").length} buổi cần cập nhật lịch
                          </p>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 p-3 dark:divide-slate-700 dark:bg-slate-800/60">
                          <RoadmapScore label="Khởi điểm" value={tutor.baselineScore} />
                          <RoadmapScore label="Hiện tại" value={tutor.currentScore} active />
                          <RoadmapScore label="Mục tiêu" value={tutor.targetScore} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Chưa có tiến độ theo gia sư"
                description="Dữ liệu sẽ xuất hiện khi bạn bắt đầu lộ trình học."
              />
            )}
          </section>

          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kết quả gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Bài tập và kiểm tra đã được chấm.</p>
              </div>
              <span className="font-mono text-xs text-slate-400">{visibleResults.length} bài</span>
            </div>
            {visibleResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleResults.map((exercise) => (
                  <Link
                    key={exercise.id}
                    to={`/student/exercises/${exercise.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{exercise.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {exercise.tutorName} · {exercise.skill}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {exercise.score}/{exercise.maxScore}
                      </span>
                      <ChevronRight size={15} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-400">Chưa có bài đã chấm trong bộ lọc này.</p>
            )}
          </Card>
        </div>
      )}

      {mainViewMode === "skills" && (
        <div className="space-y-6">
          {knowledgeProfile ? (
            <>
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <Card className="border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 lg:col-span-3">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Brain size={22} strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Hồ sơ năng lực</p>
                        <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Mức tinh thông tổng thể</h2>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Cập nhật sau mỗi câu trả lời bằng thang điểm Elo.</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                        {knowledgeProfile.overallElo}<span className="text-sm font-medium text-slate-400">/100</span>
                      </p>
                      <Badge tone="blue">Đang phát triển</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={17} className="text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gợi ý hành động</h2>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {summary.focusSkill?.name || "Chưa có kỹ năng ưu tiên"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {summary.focusSkill?.suggestion || "Hoàn thành thêm bài tập để nhận đề xuất cá nhân hóa."}
                  </p>
                  <Button as={Link} to="/student/exercises" variant="outline" size="sm" className="mt-4 w-full">
                    Mở bài luyện tập
                    <ArrowRight size={14} />
                  </Button>
                </Card>
              </section>

              <section aria-labelledby="micro-skills-heading" className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 id="micro-skills-heading" className="text-base font-bold text-slate-900 dark:text-white">Kỹ năng chi tiết</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Theo dõi mức tinh thông và độ tin cậy của từng kỹ năng.</p>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{knowledgeProfile.microSkills?.length || 0} kỹ năng</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(knowledgeProfile.microSkills || []).map((skill) => {
                    const isMastered = skill.status === "mastered";
                    const isWeak = skill.status === "weak";
                    return (
                      <Card key={skill.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Badge tone={isMastered ? "emerald" : isWeak ? "rose" : "blue"} size="xs">
                            {isMastered ? "Vững" : isWeak ? "Cần ưu tiên" : "Đang học"}
                          </Badge>
                          <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">{skill.masteryElo}</span>
                        </div>
                        <h3 className="mt-3 min-h-10 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">{skill.name}</h3>
                        <p className="mt-1 text-xs text-slate-400">{skill.category}</p>
                        <div className="mt-3 space-y-1.5">
                          <ProgressBar value={skill.masteryElo} size="sm" tone={isMastered ? "emerald" : isWeak ? "rose" : "blue"} />
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Độ tin cậy</span>
                            <span className="font-mono">{skill.confidence}%</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={18} />
                    <h2 className="text-sm font-bold">Điểm mạnh</h2>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(knowledgeProfile.strengths || []).map((skill, index) => (
                      <div key={skill.name} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-mono text-[10px] font-bold text-white">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{skill.name}</p>
                            <p className="text-[10px] text-slate-500">{skill.category}</p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{skill.masteryElo}/100</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Target size={18} />
                    <h2 className="text-sm font-bold">Cần cải thiện</h2>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(knowledgeProfile.weaknesses || []).map((skill, index) => (
                      <div key={skill.name} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{index + 1}. {skill.name}</p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{skill.suggestion}</p>
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">{skill.masteryElo}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <Card className="p-5">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <AlertCircle size={17} className="text-rose-500" />
                    Lỗi thường gặp
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Các dạng lỗi lặp lại và cách khắc phục được đề xuất.</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(knowledgeProfile.errorPatterns || []).map((pattern) => (
                    <div key={pattern.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">{pattern.title}</h3>
                        <Badge tone="rose" size="xs">{pattern.count} lần</Badge>
                      </div>
                      <p className="mt-2 rounded-lg bg-white p-2 font-mono text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">{pattern.example}</p>
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-blue-700 dark:text-blue-400">
                        <Lightbulb size={12} className="mt-0.5 shrink-0" />
                        {pattern.remedy}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={Brain}
              title="Chưa có hồ sơ năng lực"
              description="Hãy hoàn thành thêm bài tập để hệ thống phân tích điểm mạnh và điểm cần cải thiện."
            />
          )}
        </div>
      )}

      {mainViewMode === "roadmap" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Lộ trình theo gia sư</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Mỗi lớp có mục tiêu và chặng học riêng.</p>
            </div>
            <label className="w-full sm:w-auto">
              <span className="sr-only">Chọn gia sư để xem lộ trình</span>
              <select
                value={selectedRoadmap?.tutorId || ""}
                onChange={(event) => setSelectedTutorId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
              >
                {roadmaps.map((roadmap) => (
                  <option key={roadmap.tutorId} value={roadmap.tutorId}>{roadmap.tutorName} · {roadmap.subject}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedRoadmap ? (
            <>
              <Card className="p-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{selectedRoadmap.subject}</Badge>
                      <span className="font-mono text-[11px] text-slate-400">Cập nhật {selectedRoadmap.generatedAt}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Lộ trình cùng {selectedRoadmap.tutorName}</h2>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{selectedRoadmap.aiRationale}</p>
                  </div>

                  <div className="space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                      <RoadmapScore label="Khởi điểm" value={selectedRoadmap.baselineScore} />
                      <RoadmapScore label="Hiện tại" value={selectedRoadmap.currentScore} active />
                      <RoadmapScore label="Mục tiêu" value={selectedRoadmap.targetScore} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Lộ trình dự kiến</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedRoadmap.overallPercent}%</span>
                      </div>
                      <ProgressBar value={selectedRoadmap.overallPercent} size="md" />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {(selectedRoadmap.phases || []).map((phase) => {
                  const isCompleted = phase.status === "completed";
                  const isCurrent = phase.status === "in_progress";
                  return (
                    <Card key={phase.id} className={`p-0 overflow-hidden ${isCurrent ? "border-blue-300 dark:border-blue-800" : ""}`}>
                      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold ${isCompleted ? "bg-emerald-600 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {isCompleted ? <Check size={17} /> : phase.phaseIndex}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{phase.title}</h3>
                            <Badge tone={isCompleted ? "emerald" : isCurrent ? "blue" : "slate"} size="xs">
                              {isCompleted ? "Đã hoàn thành" : isCurrent ? "Đang học" : "Sắp tới"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{phase.duration} · {phase.targetGoal}</p>
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                            <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />
                            <span>{phase.aiNote}</span>
                          </div>
                        </div>
                        {!isCompleted && !isCurrent && <Lock size={16} className="hidden text-slate-400 lg:block" />}
                      </div>

                      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/20 sm:px-5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Các buổi trong chặng</p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {(phase.sessions || []).map((roadmapSession) => {
                            const hasDetails = studentSessions.some(
                              (item) => item.tutorId === selectedRoadmap.tutorId && item.topic === roadmapSession.topic
                            );
                            const isSessionDone = roadmapSession.status === "completed";
                            const isSessionLive = roadmapSession.status === "live";
                            return (
                              <button
                                key={`${phase.id}-${roadmapSession.num}`}
                                type="button"
                                disabled={!hasDetails}
                                onClick={() => openSessionDetails(selectedRoadmap, roadmapSession)}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors enabled:hover:border-blue-300 enabled:hover:bg-blue-50/50 disabled:cursor-default dark:border-slate-800 dark:bg-slate-900 dark:enabled:hover:border-blue-800 dark:enabled:hover:bg-blue-950/20"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] text-slate-400">Buổi {roadmapSession.num} · {roadmapSession.date}</p>
                                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{roadmapSession.topic}</p>
                                </div>
                                {isSessionDone ? (
                                  <Badge tone="emerald" size="xs">{roadmapSession.quizScore}</Badge>
                                ) : isSessionLive ? (
                                  <Badge tone="rose" size="xs">Đang diễn ra</Badge>
                                ) : (
                                  <Clock3 size={14} className="shrink-0 text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Map}
              title="Chưa có lộ trình học"
              description="Lộ trình sẽ xuất hiện sau khi gia sư hoàn tất đánh giá đầu vào và đặt mục tiêu học tập."
            />
          )}
        </div>
      )}

      {selectedSessionForModal && (
        <LessonSessionDetail
          sessionId={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
        />
      )}
    </div>
  );
}
