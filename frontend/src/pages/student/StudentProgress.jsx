import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  User,
  Target,
  BarChart3,
  Calendar,
  Map,
  Clock,
  Lock,
  PlayCircle,
  ArrowRight,
  BookOpen,
  FileText,
  ChevronRight,
  Check,
  Bot,
  Zap,
  Brain,
  Flame,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import { useStudentMatching } from "../../context/StudentMatchingContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import ProgressChart from "../../components/charts/ProgressChart";
import SessionDetailModal from "../../components/student/SessionDetailModal";

export default function StudentProgress() {
  const { session } = useAuth();
  const { placementTestResult } = useStudentMatching();
  const student = getStudentById(session?.studentId || "s1");

  // State management: "roadmap" | "skp" | "scores"
  const [mainViewMode, setMainViewMode] = useState("roadmap");
  const [selectedTutorId, setSelectedTutorId] = useState("t1"); // "t1" | "t2" | "t3"
  const [activeScoreTutorTab, setActiveScoreTutorTab] = useState("all");
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  const gradedExercises = student?.exercises?.filter((e) => e.status === "graded") || [];
  const tutorBreakdowns = student?.tutorProgressBreakdown || [];
  const aiRoadmaps = student?.aiRoadmaps || [];
  const skp = student?.studentKnowledgeProfile;

  const selectedRoadmap =
    aiRoadmaps.find((r) => r.tutorId === selectedTutorId) || aiRoadmaps[0];

  const filteredGraded = gradedExercises.filter(
    (ex) => activeScoreTutorTab === "all" || ex.tutorId === activeScoreTutorTab
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Lộ trình AI, Hồ sơ Tri thức & Báo cáo Tiến bộ"
        description="Theo dõi Lộ trình Học cá nhân hóa, Hồ sơ tri thức SKP với Elo rating và các chỉ số tăng trưởng năng lực thực chất."
      />

      {/* Main View Mode Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit text-xs font-bold shadow-inner flex-wrap">
        <button
          onClick={() => setMainViewMode("roadmap")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            mainViewMode === "roadmap"
              ? "bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 shadow-md"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Bot size={16} className="text-amber-500" />
          🤖 AI Lộ trình Học Cá nhân hóa
        </button>
        <button
          onClick={() => setMainViewMode("skp")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            mainViewMode === "skp"
              ? "bg-white text-purple-600 dark:bg-slate-900 dark:text-purple-400 shadow-md"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Brain size={16} className="text-purple-500" />
          🧠 Hồ sơ Tri thức (SKP) & Elo Rating
        </button>
        <button
          onClick={() => setMainViewMode("scores")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            mainViewMode === "scores"
              ? "bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 shadow-md"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BarChart3 size={16} className="text-blue-500" />
          📈 Báo cáo Tiến bộ (Chăm chỉ vs Năng lực)
        </button>
      </div>


      {/* VIEW MODE 1: AI LEARNING ROADMAP PER TUTOR */}
      {mainViewMode === "roadmap" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tutor Selector Bar */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">
                  Chọn Lộ trình Gia sư:
                </span>
                {tutorBreakdowns.map((tb) => {
                  const isSelected = selectedTutorId === tb.tutorId;
                  return (
                    <button
                      key={tb.tutorId}
                      onClick={() => setSelectedTutorId(tb.tutorId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                        isSelected
                          ? "bg-foreground text-background"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      <span>
                        {tb.tutorName} ({tb.subject})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium italic">
                💡 Lộ trình tự động điều chỉnh theo tốc độ tiếp thu thực tế.
              </div>
            </div>
          </Card>

          {/* AI Overview Header Card */}
          {selectedRoadmap && (
            <Card className="p-5 border border-border bg-card space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
                {/* Tutor Info & Target */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {selectedRoadmap.tutorName}
                    </span>
                    <Badge tone="neutral" size="xs">
                      {selectedRoadmap.subject}
                    </Badge>
                    <span className="text-xs text-muted-foreground">&middot;</span>
                    <span className="text-xs text-muted-foreground">
                      Cập nhật: {selectedRoadmap.generatedAt}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Lộ trình học cá nhân hóa ({selectedRoadmap.baselineScore} ➔ {selectedRoadmap.targetScore})
                  </h3>
                </div>

                {/* Score Milestones Pills */}
                <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-blue-100 dark:border-slate-800 shadow-xs shrink-0">
                  <div className="text-center px-3 border-r border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Khởi điểm</span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {selectedRoadmap.baselineScore}
                    </span>
                  </div>
                  <div className="text-center px-3 border-r border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Hiện tại</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {selectedRoadmap.currentScore}
                    </span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[10px] text-slate-400 block font-medium">Mục tiêu</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {selectedRoadmap.targetScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Rationale Rationale Box */}
              <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-blue-100/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  <Sparkles size={16} className="text-amber-500" /> Phân tích cá nhân hóa bởi AI Assistant & Gia sư
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  &quot;{selectedRoadmap.aiRationale}&quot;
                </p>
              </div>

              {/* Phase Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" /> Tiến độ hoàn thành lộ trình:
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    Đã xong {selectedRoadmap.completedPhasesCount}/{selectedRoadmap.totalPhases} Giai đoạn ({selectedRoadmap.overallPercent}%)
                  </span>
                </div>
                <ProgressBar value={selectedRoadmap.overallPercent} size="md" />
              </div>
            </Card>
          )}

          {/* Interactive Phase Timeline List */}
          {selectedRoadmap && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Map size={18} className="text-blue-500" /> Trục Thời Gian Giai Đoạn Học Tập ({selectedRoadmap.phases.length} Phases)
              </h3>

              <div className="space-y-4">
                {selectedRoadmap.phases.map((phase) => {
                  const isCompleted = phase.status === "completed";
                  const isInProgress = phase.status === "in_progress";
                  const isUpcoming = phase.status === "upcoming";

                  return (
                    <Card
                      key={phase.id}
                      className={`p-6 border-l-4 transition-all ${
                        isCompleted
                          ? "border-l-emerald-500 bg-white dark:bg-slate-900"
                          : isInProgress
                          ? "border-l-blue-600 bg-blue-50/30 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-900/40"
                          : "border-l-slate-300 dark:border-l-slate-700 opacity-80"
                      }`}
                    >
                      {/* Phase Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? "bg-emerald-600 text-white shadow-xs"
                                : isInProgress
                                ? "bg-blue-600 text-white shadow-md animate-pulse"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isCompleted ? <Check size={18} /> : phase.phaseIndex}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                                {phase.title}
                              </h4>
                              {isCompleted && <Badge tone="emerald">✓ Đã hoàn thành</Badge>}
                              {isInProgress && (
                                <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                                  🔥 ĐANG HỌC CỦNG CỐ
                                </span>
                              )}
                              {isUpcoming && <Badge tone="slate">🔒 Sắp tới</Badge>}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Thời lượng: {phase.duration} &middot; Mục tiêu: <strong className="text-slate-800 dark:text-slate-200">{phase.targetGoal}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* AI Strategy Note */}
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">Chiến thuật AI tư vấn:</strong> {phase.aiNote}
                        </div>
                      </div>

                      {/* Sessions List in Phase */}
                      <div className="mt-4 space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          📚 Danh sách buổi học & Chặng bài tập thuộc Giai đoạn này:
                        </span>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {phase.sessions.map((sess, idx) => {
                            const isSessDone = sess.status === "completed";
                            const isSessLive = sess.status === "live";

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                                  isSessDone
                                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
                                    : isSessLive
                                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 ring-2 ring-rose-400"
                                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    Buổi #{sess.num} ({sess.date})
                                  </span>
                                  {isSessDone ? (
                                    <Badge tone="emerald" size="xs">
                                      ✓ Quiz: {sess.quizScore}
                                    </Badge>
                                  ) : isSessLive ? (
                                    <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                      LIVE
                                    </span>
                                  ) : (
                                    <Badge tone="slate" size="xs">
                                      Chờ học
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                                  {sess.topic}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: STUDENT KNOWLEDGE PROFILE (SKP) & ELO RATING (FR-38) */}
      {mainViewMode === "skp" && (
        <div className="space-y-6 animate-fadeIn">
          {/* SKP Overview Banner */}
          <Card className="p-6 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-blue-50/60 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/20 border-purple-200/80 dark:border-purple-900/60 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                  <Brain size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Student Knowledge Profile (SKP) Engine
                    </span>
                    <Badge tone="purple">Thuật toán Elo Rating</Badge>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Hồ Sơ Tri Thức Người Học & Độ Tinh Thông Micro-Skills
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Điểm số được cập nhật theo thời gian thực sau mỗi câu trả lời đúng/sai bằng công thức Elo Rating.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-purple-100 dark:border-purple-900 shadow-xs shrink-0">
                <div className="text-center px-4 border-r border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Chỉ số Tinh thông (Overall Elo)</span>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {skp?.overallElo || 74}/100
                  </span>
                </div>
                <div className="text-center px-2">
                  <span className="text-[10px] text-slate-400 block font-medium">Trạng thái</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                    Bứt phá nhanh
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Micro-skills Grid with Elo Rating Bars */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target size={18} className="text-blue-500" /> Bảng Theo Dõi Micro-Skills (Elo Rating 0 - 100)
              </h3>
              <span className="text-xs text-slate-400">8 Kỹ năng vi mô cốt lõi</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {skp?.microSkills?.map((skill) => {
                const isMastered = skill.status === "mastered";
                const isLearning = skill.status === "learning";

                return (
                  <Card key={skill.id} className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {skill.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          {skill.name}
                        </h4>
                      </div>
                      <Badge tone={isMastered ? "emerald" : isLearning ? "blue" : "rose"} size="xs">
                        {isMastered ? "Thành thạo" : isLearning ? "Đang luyện" : "Yếu"}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Elo Mastery:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {skill.masteryElo}/100
                        </span>
                      </div>
                      <ProgressBar
                        value={skill.masteryElo}
                        size="sm"
                        tone={isMastered ? "emerald" : isLearning ? "blue" : "rose"}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span>Độ tự tin:</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{skill.confidence}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Top 5 Strengths & Top 5 Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top 5 Strengths */}
            <Card className="p-5 space-y-3 border-emerald-200 dark:border-emerald-950">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Top 5 Điểm Mạnh Nhất (Strengths)</span>
              </div>
              <div className="space-y-2">
                {skp?.strengths?.map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                        <p className="text-[10px] text-slate-500">{st.category}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg shadow-xs">
                      {st.masteryElo} Elo
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top 5 Weaknesses */}
            <Card className="p-5 space-y-3 border-rose-200 dark:border-rose-950">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <AlertCircle size={18} />
                <span>Top 5 Điểm Yếu Cần Cải Thiện (Weaknesses)</span>
              </div>
              <div className="space-y-2">
                {skp?.weaknesses?.map((wk, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{wk.name}</p>
                        <p className="text-[10px] text-slate-500">{wk.suggestion}</p>
                      </div>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg shadow-xs shrink-0">
                      {wk.masteryElo} Elo
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Error Pattern Catalog (FR-38) */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" />
                  Danh Mục Dạng Lỗi Thường Gặp (Error Pattern Catalog)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động phân loại các lỗi sai trong bài tập và đề xuất giải pháp xử lý triệt để.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                4 Dạng lỗi phổ biến
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {skp?.errorPatterns?.map((ep) => (
                <div key={ep.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{ep.title}</span>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                      Mắc {ep.count} lần
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                    Ví dụ: {ep.example}
                  </p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    🎯 Giải pháp khắc phục: {ep.remedy}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW MODE 3: ORIGINAL SCORES & EFFORT METRICS REPORT (FR-15) */}
      {mainViewMode === "scores" && (
        <div className="space-y-6 animate-fadeIn">
          {/* FR-15: EFFORT METRICS CARD (Chỉ số chăm chỉ) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 border-l-4 border-l-amber-500">
              <span className="text-[11px] text-slate-500 font-medium block">Tỷ lệ nộp bài đúng hạn</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {student?.effortMetrics?.onTimeSubmissionRate || 90}%
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Đạt chuẩn chuyên cần</span>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-500">
              <span className="text-[11px] text-slate-500 font-medium block">Chuỗi Spaced Repetition</span>
              <p className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1">
                <Flame size={18} className="fill-amber-500 text-amber-500" />
                {student?.effortMetrics?.currentStreak || 5} Ngày
              </p>
              <span className="text-[10px] text-slate-500">Ôn tập 5p mỗi ngày</span>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500">
              <span className="text-[11px] text-slate-500 font-medium block">Tỷ lệ xong bài Practice</span>
              <p className="text-xl font-black text-blue-600 mt-1">
                {student?.effortMetrics?.practiceCompletionRate || 94}%
              </p>
              <span className="text-[10px] text-slate-500">18/19 bài tập</span>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <span className="text-[11px] text-slate-500 font-medium block">Thời gian học tích lũy</span>
              <p className="text-xl font-black text-purple-600 mt-1">
                {student?.effortMetrics?.totalHoursLearned || "32.5h"}
              </p>
              <span className="text-[10px] text-slate-500">Qua 18 buổi học & tự ôn</span>
            </Card>
          </div>

          {/* 1. Placement Baseline Card */}
          {placementTestResult && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/50 dark:border-blue-900/60 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-purple-950/30 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    <Sparkles size={16} className="text-amber-500" /> Baseline Placement Assessment
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">
                    Điểm khởi điểm khảo sát: {placementTestResult.score}/100 ({placementTestResult.recommendedLevel})
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Ghi nhận ngày {placementTestResult.completedAt} &middot; Lời nhắn Gia sư: <em>&quot;{placementTestResult.tutorComment}&quot;</em>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone="emerald">Lộ trình Adaptive Multi-Tutor Active</Badge>
                </div>
              </div>

              {/* Baseline skill score list */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6 border-t border-blue-100 dark:border-blue-900/50 pt-3">
                {Object.entries(placementTestResult.skillBreakdown || {}).map(([skill, score]) => (
                  <div key={skill} className="rounded-xl bg-white/90 p-2.5 text-center shadow-xs dark:bg-slate-900/80 border border-blue-100/50 dark:border-slate-800">
                    <span className="block text-[10px] font-medium text-slate-400">Baseline {skill}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{score}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}


          {/* 2. Tutor Breakdown Tabs */}
          <Card className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">Xem tiến độ theo:</span>
              <button
                onClick={() => setActiveScoreTutorTab("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeScoreTutorTab === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                🌟 Tất cả 3 Gia sư
              </button>
              {tutorBreakdowns.map((tb) => (
                <button
                  key={tb.tutorId}
                  onClick={() => setActiveScoreTutorTab(tb.tutorId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    activeScoreTutorTab === tb.tutorId
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {tb.tutorName} ({tb.subject})
                </button>
              ))}
            </div>
          </Card>

          {/* 3. Target vs Current Band Cards Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {tutorBreakdowns
              .filter((tb) => activeScoreTutorTab === "all" || tb.tutorId === activeScoreTutorTab)
              .map((tb) => (
                <Card key={tb.tutorId} className="p-4 space-y-3 border border-border bg-card hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{tb.tutorName}</h3>
                      <p className="text-xs text-muted-foreground">{tb.subject}</p>
                    </div>
                    <Badge tone="neutral" size="xs">
                      {tb.growthPercentage}
                    </Badge>
                  </div>

                  {/* Score Milestones */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Khởi điểm</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{tb.baselineScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Hiện tại</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{tb.currentScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Mục tiêu</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{tb.targetScore}</span>
                    </div>
                  </div>

                  {/* Skills Breakdown */}
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Target size={14} className="text-blue-500" /> Chi tiết các kỹ năng chính:
                    </p>
                    {tb.skills.map((sk) => (
                      <div key={sk.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">{sk.name}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{sk.current}%</span>
                        </div>
                        <ProgressBar value={sk.current} size="xs" />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
          </div>

          {/* 4. Overall Progress History Chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-500" /> Tiến trình tăng trưởng kỹ năng qua các tuần (Thang điểm 10)
                </h3>
                <p className="text-xs text-slate-500">So sánh sự bứt phá từ Tuần 1 đến Tuần 5.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl">
                <TrendingUp size={16} /> +24% Tăng trưởng tổng thể
              </div>
            </div>
            <ProgressChart data={student?.progressHistory} />
          </Card>

          {/* 5. Graded Exercises History */}
          <Card padded={false}>
            <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm flex items-center gap-2">
                <Award size={18} className="text-amber-500" /> Lịch sử điểm bài tập & kiểm tra đã chấm ({filteredGraded.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGraded.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{ex.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Gia sư {ex.tutorName} &middot; {ex.skill} &middot; Chấm ngày {ex.submittedAt}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-md">
                    {ex.score}/{ex.maxScore}
                  </span>
                </div>
              ))}
              {filteredGraded.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-400">Chưa có bài kiểm tra nào được chấm thuộc bộ lọc này.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Detail Session Modal */}
      {selectedSessionForModal && (
        <SessionDetailModal
          sessionItem={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
        />
      )}
    </div>
  );
}
