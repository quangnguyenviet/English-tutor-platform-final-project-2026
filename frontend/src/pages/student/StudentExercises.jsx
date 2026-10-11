import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  Hourglass,
  MessageSquare,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import {
  filterAndSortExercises,
  getExerciseSummary,
} from "../../lib/studentLearningViewModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

const STATUS_OPTIONS = [
  { id: "assigned", label: "Chưa làm" },
  { id: "submitted", label: "Đã nộp" },
  { id: "graded", label: "Đã chấm" },
];

const STATUS_META = {
  assigned: { label: "Cần làm", tone: "amber", icon: Clock3 },
  submitted: { label: "Chờ chấm", tone: "blue", icon: Hourglass },
  graded: { label: "Đã chấm", tone: "emerald", icon: CheckCircle2 },
};

function formatDate(value) {
  if (!value) return "Không giới hạn";
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
}

function MetricCard({ icon: Icon, label, value, hint, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
    </Card>
  );
}

export default function StudentExercises() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const student = getStudentById(session?.studentId || "s1");
  const rawExercises = student?.exercises || [];
  const tutorParam = searchParams.get("tutor") || "all";
  const [selectedTutor, setSelectedTutor] = useState(tutorParam);
  const [selectedStatus, setSelectedStatus] = useState("assigned");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  useEffect(() => {
    setSelectedTutor(searchParams.get("tutor") || "all");
  }, [searchParams]);

  const tutorMap = new Map();
  rawExercises.forEach((exercise) => {
    if (!tutorMap.has(exercise.tutorId)) {
      tutorMap.set(exercise.tutorId, {
        id: exercise.tutorId,
        name: exercise.tutorName,
        subject: exercise.subject,
      });
    }
  });
  const tutors = [
    { id: "all", name: "Tất cả gia sư", subject: "Toàn bộ môn học" },
    ...tutorMap.values(),
  ];
  const skills = ["all", ...new Set(rawExercises.map((exercise) => exercise.skill).filter(Boolean))];
  const difficulties = [
    "all",
    ...new Set(rawExercises.map((exercise) => exercise.difficulty).filter(Boolean)),
  ];
  const summary = getExerciseSummary(rawExercises);
  const filteredExercises = filterAndSortExercises(
    rawExercises,
    selectedTutor,
    selectedStatus,
    selectedSkill,
    selectedDifficulty
  );
  const activeTutor = tutors.find((tutor) => tutor.id === selectedTutor) || tutors[0];

  function handleSelectTutor(tutorId) {
    setSelectedTutor(tutorId);
    const nextParams = new URLSearchParams(searchParams);
    if (tutorId === "all") nextParams.delete("tutor");
    else nextParams.set("tutor", tutorId);
    setSearchParams(nextParams);
  }

  function resetFilters() {
    handleSelectTutor("all");
    setSelectedStatus("assigned");
    setSelectedSkill("all");
    setSelectedDifficulty("all");
  }

  const statusCounts = rawExercises.reduce(
    (counts, exercise) => ({
      ...counts,
      [exercise.status]: (counts[exercise.status] || 0) + 1,
    }),
    {}
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        className="mb-0"
        eyebrow="Nhiệm vụ học tập"
        title="Bài tập & Kiểm tra"
        description="Ưu tiên bài gần hạn, theo dõi bài đang chờ chấm và xem lại kết quả."
        actions={
          <Button as={Link} to="/student/progress" variant="outline" size="sm">
            <BarChart3 size={16} />
            Xem tiến bộ
          </Button>
        }
      />

      <section aria-label="Tóm tắt bài tập" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={ClipboardList}
          label="Tổng số bài"
          value={summary.total}
          hint="Trong tất cả lớp học"
          tone="blue"
        />
        <MetricCard
          icon={CalendarClock}
          label="Cần hoàn thành"
          value={summary.assigned}
          hint="Được ưu tiên theo hạn nộp"
          tone="amber"
        />
        <MetricCard
          icon={Hourglass}
          label="Đang chờ chấm"
          value={summary.submitted}
          hint="Đã gửi cho gia sư"
          tone="sky"
        />
        <MetricCard
          icon={FileCheck2}
          label="Đã có kết quả"
          value={summary.graded}
          hint="Có thể xem lại lời giải"
          tone="emerald"
        />
      </section>

      {summary.priorityExercise && (
        <Card className="overflow-hidden border-blue-200 bg-blue-50/60 p-0 dark:border-blue-900/70 dark:bg-blue-950/20">
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <CalendarClock size={19} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Ưu tiên tiếp theo
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {summary.priorityExercise.title}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {summary.priorityExercise.tutorName} · {summary.priorityExercise.subject} · Hạn {formatDate(summary.priorityExercise.dueDate)}
                </p>
              </div>
            </div>
            <Button as={Link} to={`/student/exercises/${summary.priorityExercise.id}`}>
              Làm bài ngay
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      <section className="space-y-4" aria-labelledby="exercise-list-heading">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="exercise-list-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Danh sách bài tập
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {selectedTutor === "all" ? "Tất cả gia sư" : activeTutor.name} · {filteredExercises.length} bài phù hợp
            </p>
          </div>

          <div className="grid w-full sm:w-auto grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))]">
            <span className="hidden items-center text-[11px] font-bold uppercase tracking-wider text-slate-400 lg:flex">
              Bộ lọc
            </span>
            <label className="relative">
              <span className="sr-only">Lọc theo gia sư</span>
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <select
                value={selectedTutor}
                onChange={(event) => handleSelectTutor(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
              >
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Lọc theo kỹ năng</span>
              <select
                value={selectedSkill}
                onChange={(event) => setSelectedSkill(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
              >
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill === "all" ? "Tất cả kỹ năng" : skill}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Lọc theo độ khó</span>
              <select
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "all" ? "Tất cả độ khó" : difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Trạng thái bài tập"
          className="grid w-full grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3"
        >
          {STATUS_OPTIONS.map((status) => {
            const isActive = selectedStatus === status.id;
            return (
              <button
                key={status.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedStatus(status.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>{status.label}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {statusCounts[status.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredExercises.map((exercise) => {
              const status = STATUS_META[exercise.status] || STATUS_META.assigned;
              const StatusIcon = status.icon;
              const isAssigned = exercise.status === "assigned";
              const isGraded = exercise.status === "graded";

              return (
                <article
                  key={exercise.id}
                  className={`grid grid-cols-1 gap-4 p-4 transition-colors sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center ${
                    isAssigned
                      ? "bg-amber-50/35 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      exercise.mode === "assessment"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {exercise.mode === "assessment" ? (
                      <FileCheck2 size={19} strokeWidth={1.75} />
                    ) : (
                      <BookOpen size={19} strokeWidth={1.75} />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={status.tone} size="xs">
                        <StatusIcon size={11} />
                        {status.label}
                      </Badge>
                      <Badge tone="neutral" size="xs">
                        {exercise.mode === "assessment" ? "Kiểm tra" : "Luyện tập"}
                      </Badge>
                      <span className="text-[11px] text-slate-400">{exercise.tutorName}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                      {exercise.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{exercise.skill}</span>
                      <span>{exercise.difficulty}</span>
                      {exercise.questions?.length > 0 && <span>{exercise.questions.length} câu hỏi</span>}
                      {isAssigned && exercise.dueDate && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                          <Clock3 size={12} /> Hạn {formatDate(exercise.dueDate)}
                        </span>
                      )}
                    </div>

                    {exercise.tutorNote && isAssigned && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MessageSquare size={13} className="mt-0.5 shrink-0 text-blue-500" />
                        <span>{exercise.tutorNote}</span>
                      </p>
                    )}

                    {isGraded && exercise.feedback && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Nhận xét:</span>{" "}
                        {exercise.feedback}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
                    {isGraded ? (
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Kết quả</p>
                        <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                          {exercise.score}/{exercise.maxScore}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {exercise.status === "submitted" ? "Gia sư đang xử lý" : exercise.type}
                      </span>
                    )}

                    <Button
                      as={Link}
                      to={`/student/exercises/${exercise.id}`}
                      variant={isAssigned ? "primary" : "outline"}
                      size="sm"
                    >
                      {isAssigned ? "Làm bài" : "Xem lại"}
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </article>
              );
            })}

            {filteredExercises.length === 0 && (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <BookOpen size={23} strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Không có bài phù hợp
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Thử chọn gia sư, kỹ năng, độ khó hoặc trạng thái khác để xem lại toàn bộ bài tập.
                </p>
                <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                  <RotateCcw size={14} />
                  Đặt lại bộ lọc
                </Button>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
