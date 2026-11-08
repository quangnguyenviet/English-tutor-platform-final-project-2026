import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  apiGetMyDashboard,
  apiGetMyQuizzes,
  apiGetMySessions,
  apiGetMyTutors,
} from "../../lib/studentApi";
import { formatSessionDate, SESSION_STATUS_META } from "../../lib/classroomApi";
import { sortSessionsDesc } from "../../lib/studentModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StudentSessionDetail from "../../components/student/StudentSessionDetail";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

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

export default function StudentProgress() {
  const { token, session } = useAuth();
  const [overviewTutorId, setOverviewTutorId] = useState("all");
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [sessionsData, setSessionsData] = useState([]);
  const [quizzesData, setQuizzesData] = useState([]);
  const [tutorsData, setTutorsData] = useState([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const [dashRes, sessRes, quizRes, tutorRes] = await Promise.allSettled([
        apiGetMyDashboard(token),
        apiGetMySessions(token),
        apiGetMyQuizzes(token),
        apiGetMyTutors(token),
      ]);

      if (dashRes.status === "fulfilled") setDashboardData(dashRes.value);
      if (sessRes.status === "fulfilled") {
        setSessionsData(Array.isArray(sessRes.value) ? sessRes.value : sessRes.value?.content ?? []);
      }
      if (quizRes.status === "fulfilled") {
        setQuizzesData(Array.isArray(quizRes.value) ? quizRes.value : quizRes.value?.content ?? []);
      }
      if (tutorRes.status === "fulfilled") {
        setTutorsData(Array.isArray(tutorRes.value) ? tutorRes.value : tutorRes.value?.content ?? []);
      }

      // Nếu tất cả request đều lỗi
      const allFailed = [dashRes, sessRes, quizRes, tutorRes].every(
        (r) => r.status === "rejected"
      );
      if (allFailed) {
        throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu tiến bộ.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sắp xếp các buổi học giảm dần
  const sortedSessions = useMemo(() => sortSessionsDesc(sessionsData), [sessionsData]);
  const completedSessions = useMemo(
    () => sortedSessions.filter((s) => s.status === "COMPLETED"),
    [sortedSessions]
  );
  const latestLesson = completedSessions[0] || dashboardData?.lastSession || null;

  // Quizzes đã hoàn thành
  const completedQuizzes = useMemo(
    () => quizzesData.filter((q) => q.status === "COMPLETED"),
    [quizzesData]
  );

  // Elo hiện tại
  const currentElo = useMemo(() => {
    if (dashboardData?.elo?.current != null) return Math.round(dashboardData.elo.current);
    if (session?.elo != null) return Math.round(session.elo);
    return 1000;
  }, [dashboardData, session]);

  // Tỉ lệ hoàn thành
  const completionRate = useMemo(() => {
    if (!quizzesData.length) return 0;
    return Math.round((completedQuizzes.length / quizzesData.length) * 100);
  }, [quizzesData, completedQuizzes]);

  // Bộ lọc theo gia sư ở tab Tổng quan
  const visibleTutors = useMemo(() => {
    if (overviewTutorId === "all") return tutorsData;
    return tutorsData.filter(
      (t) => String(t.tutorId) === overviewTutorId || String(t.classId) === overviewTutorId
    );
  }, [tutorsData, overviewTutorId]);

  const visibleResults = useMemo(() => {
    if (overviewTutorId === "all") return completedQuizzes;
    return completedQuizzes.filter(
      (q) => String(q.tutorId) === overviewTutorId || String(q.sessionId) === overviewTutorId
    );
  }, [completedQuizzes, overviewTutorId]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        className="mb-0"
        eyebrow="Kết quả học tập"
        title="Kết quả & Tiến bộ"
        description="Xem xu hướng học tập, tiến trình cùng gia sư và các bài kiểm tra đã hoàn thành."
        actions={
          <Button as={Link} to="/student/exercises" size="sm">
            Tiếp tục làm bài
            <ArrowRight size={16} />
          </Button>
        }
      />

      {loading && <SkeletonRows rows={4} className="h-24" />}
      {!loading && error && <ErrorBox message={error} onRetry={loadData} />}

      {!loading && !error && (
        <div className="space-y-6">
          <section aria-label="Chỉ số tiến bộ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryMetric
              icon={Brain}
              label="Mức tinh thông"
              value={currentElo}
              hint="Điểm Elo cập nhật theo từng câu"
              tone="blue"
            />
            <SummaryMetric
              icon={Award}
              label="Bài đã làm"
              value={completedQuizzes.length}
              hint={`${quizzesData.length} bài được giao`}
              tone="emerald"
            />
            <SummaryMetric
              icon={CheckCircle2}
              label="Tỷ lệ hoàn thành"
              value={`${completionRate}%`}
              hint="Duy trì nhịp học ổn định"
              tone="amber"
            />
            <SummaryMetric
              icon={CalendarDays}
              label="Buổi đã học"
              value={completedSessions.length}
              hint="Từ nhật ký buổi học"
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
                      {formatSessionDate(latestLesson.sessionDate || latestLesson.date)} · Gia sư {latestLesson.tutorName}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {latestLesson.title || latestLesson.className || "Buổi học"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {latestLesson.logKnowledge || "Gia sư đã ghi nhận nhật ký buổi học."}
                  </p>
                  {latestLesson.logHomework && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Bài về nhà: {latestLesson.logHomework}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSessionForModal(latestLesson)}
                >
                  Xem chi tiết buổi học <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          )}

          <section className="space-y-4" aria-labelledby="tutor-progress-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="tutor-progress-heading" className="text-base font-bold text-slate-900 dark:text-white">
                  Tiến độ theo gia sư
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Danh sách lớp học và số buổi đã hoàn thành.
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
                  {tutorsData.map((tutor) => (
                    <option key={tutor.classId || tutor.tutorId} value={String(tutor.tutorId)}>
                      {tutor.tutorName} ({tutor.className})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibleTutors.length > 0 ? (
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleTutors.map((tutor) => {
                    const tutorSessions = sortedSessions.filter((item) => item.classId === tutor.classId);
                    const doneCount = tutor.completedSessions ?? tutorSessions.filter((s) => s.status === "COMPLETED").length;
                    return (
                      <div
                        key={tutor.classId || tutor.tutorId}
                        className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] lg:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {tutor.tutorName}
                            </h3>
                            <Badge tone="blue" size="xs">{doneCount} buổi đã học</Badge>
                            {tutor.classStatus && (
                              <Badge tone="slate" size="xs">{tutor.classStatus}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Lớp: {tutor.className}
                          </p>
                          {Array.isArray(tutor.weeklySlots) && tutor.weeklySlots.length > 0 && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Lịch học: {tutor.weeklySlots.join(" · ")}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Trạng thái lớp
                          </p>
                          <p className="mt-1 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                            {tutor.classStatus === "ACTIVE" ? "Đang học" : tutor.classStatus || "Đang học"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Chưa có dữ liệu theo gia sư"
                description="Khi bạn tham gia lớp học với gia sư, tiến độ sẽ xuất hiện tại đây."
              />
            )}
          </section>

          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kết quả bài tập gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Các bài quiz bạn đã hoàn thành.</p>
              </div>
              <span className="font-mono text-xs text-slate-400">{visibleResults.length} bài</span>
            </div>
            {visibleResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleResults.map((quiz) => (
                  <Link
                    key={quiz.id}
                    to={`/student/exercises/${quiz.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{quiz.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {[quiz.tutorName, quiz.sessionTitle].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {quiz.answeredCount}/{quiz.totalQuestions} câu
                      </span>
                      <ChevronRight size={15} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-400">Chưa có bài hoàn thành trong mục này.</p>
            )}
          </Card>
        </div>
      )}

      {selectedSessionForModal && (
        <StudentSessionDetail
          sessionId={selectedSessionForModal.sessionId ?? selectedSessionForModal.id}
          sessionStatus={selectedSessionForModal.status}
          sessionItem={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
        />
      )}
    </div>
  );
}
