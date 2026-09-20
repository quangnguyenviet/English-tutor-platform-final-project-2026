import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Award,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Brain,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import { useStudentMatching } from "../../context/StudentMatchingContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import clsx from "clsx";

export default function ExerciseTaking() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { submitPlacementTest } = useStudentMatching();

  const isPlacementTest = exerciseId === "placement-test";
  const student = getStudentById(session?.studentId || "s1");

  const exercise = isPlacementTest
    ? {
        id: "placement-test",
        title: "Bài Quiz Placement Test - Đánh giá Năng lực Đầu vào",
        skill: "Tổng hợp (Nghe, Đọc, Viết, Từ vựng, Ngữ pháp)",
        difficulty: "Phân loại trình độ",
        mode: "assessment",
        type: "4 Dạng Chuẩn PRD",
        status: "assigned",
      }
    : student?.exercises?.find((e) => e.id === exerciseId) || student?.exercises?.[0];

  const mode = exercise?.mode || "practice"; // "practice" (per-question) vs "assessment" (submit-all)

  // Question bank fallback if not directly in exercise object
  const questions = useMemo(() => {
    if (exercise?.questions && exercise.questions.length > 0) {
      return exercise.questions;
    }

    // Default 4 standard questions
    return [
      {
        id: "q1",
        kind: "mcq",
        prompt: "The scientist ______ invented the new clean energy technology was awarded the Nobel Prize.",
        options: ["A. who", "B. which", "C. whose", "D. whom"],
        correct: "A. who",
        aiExplanation: {
          rule: "Đại từ quan hệ 'who' thay thế cho danh từ chỉ người đóng vai trò chủ ngữ trong mệnh đề quan hệ.",
          whyCorrect: "'The scientist' là người, phía sau là động từ 'invented' cần chủ ngữ ➔ Dùng 'who'.",
          distractors: "'Which' dùng cho vật; 'Whose' chỉ sở hữu; 'Whom' chỉ làm tân ngữ."
        }
      },
      {
        id: "q2",
        kind: "fill",
        prompt: "Điền từ thích hợp vào chỗ trống để tạo collocation chuẩn:",
        sentence: "The municipal government decided to ______ measures to tackle air pollution.",
        correct: "take",
        aiExplanation: {
          rule: "Collocation học thuật cố định: 'take measures' = thực hiện các biện pháp.",
          whyCorrect: "Trong văn cảnh giải quyết vấn đề, động từ đi với 'measures' bắt buộc là 'take'.",
          distractors: "Không dùng 'make' hay 'do' vì không tự nhiên trong văn phong Anh ngữ."
        }
      },
      {
        id: "q3",
        kind: "error_correction",
        prompt: "Tìm và sửa 1 từ bị dùng sai trong câu:",
        sentence: "She was deeply interested on exploring modern Vietnamese literature.",
        wrongPart: "on",
        correct: "in",
        aiExplanation: {
          rule: "Cụm tính từ đi với giới từ cố định: 'interested IN something'.",
          whyCorrect: "'interested on' là lỗi dịch thô từ tiếng Việt. Đúng phải là 'interested in'.",
          distractors: "Không kết hợp với 'on', 'at' hay 'for'."
        }
      },
      {
        id: "q4",
        kind: "sentence_transformation",
        prompt: "Viết lại câu sau với từ gợi ý 'Although':",
        originalSentence: "Despite the heavy rain, the football match continued.",
        givenStart: "Although",
        correct: "Although it rained heavily, the football match continued.",
        aiExplanation: {
          rule: "'Despite + Noun phrase' tương đương với 'Although + S + V'.",
          whyCorrect: "'heavy rain' chuyển thành mệnh đề 'it rained heavily' hoặc 'it was raining heavily'.",
          distractors: "Không dùng 'Although the heavy rain' vì Although phải đi cùng mệnh đề có động từ vị ngữ."
        }
      }
    ];
  }, [exercise]);

  // State management
  const [answers, setAnswers] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState({}); // For practice mode
  const [expandedExplanation, setExpandedExplanation] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(mode === "assessment" ? 15 * 60 : 0);

  const backUrl = exercise?.tutorId ? `/student/exercises?tutor=${exercise.tutorId}` : "/student/exercises";

  // Timer for assessment mode
  useEffect(() => {
    if (mode !== "assessment" || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, isSubmitted]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Check single question in PRACTICE mode (Per-question mode)
  const handleCheckQuestion = (index) => {
    const currentAns = (answers[index] || "").trim().toLowerCase();
    const q = questions[index];
    let isRight = false;

    if (q.kind === "mcq") {
      isRight = answers[index] === q.correct;
    } else if (q.kind === "fill" || q.kind === "error_correction") {
      isRight = currentAns === q.correct.toLowerCase();
    } else if (q.kind === "sentence_transformation") {
      isRight = currentAns.length > 10; // Lenient checking for prototype
    }

    setCheckedQuestions((prev) => ({
      ...prev,
      [index]: { checked: true, isRight }
    }));

    // Auto expand AI explanation when checked
    setExpandedExplanation((prev) => ({
      ...prev,
      [index]: true
    }));
  };

  // Submit all in ASSESSMENT mode
  const handleSubmitAll = () => {
    setIsSubmitted(true);
    // Auto check all
    const allChecked = {};
    const allExpanded = {};
    questions.forEach((q, i) => {
      const currentAns = (answers[i] || "").trim().toLowerCase();
      let isRight = false;
      if (q.kind === "mcq") {
        isRight = answers[i] === q.correct;
      } else if (q.kind === "fill" || q.kind === "error_correction") {
        isRight = currentAns === q.correct.toLowerCase();
      } else {
        isRight = currentAns.length > 5;
      }
      allChecked[i] = { checked: true, isRight };
      allExpanded[i] = true;
    });
    setCheckedQuestions(allChecked);
    setExpandedExplanation(allExpanded);

    if (isPlacementTest) {
      setTimeout(() => {
        submitPlacementTest({
          score: 85,
          totalScore: 100,
          skillBreakdown: { Nghe: 85, Đọc: 90, Viết: 75, "Từ vựng": 88, "Ngữ pháp": 82 },
          recommendedLevel: "B1+ (Foundation IELTS)",
          tutorComment: "Nền tảng tốt. Cần rèn kỹ năng viết lại câu và bẫy nghe Section 3."
        });
        navigate("/student/chat");
      }, 2000);
    }
  };

  // Calculate score in assessment mode
  const correctCount = Object.values(checkedQuestions).filter((c) => c.isRight).length;
  const scoreOver10 = Math.round((correctCount / (questions.length || 1)) * 10);

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <Link
        to={backUrl}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại danh sách bài tập {exercise?.tutorName ? `của ${exercise.tutorName}` : ""}
      </Link>

      {/* Tutor Attribution Banner - Clean, Minimal, No Photo */}
      {exercise?.tutorName && (
        <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">
                Gia sư phụ trách: <strong>{exercise.tutorName}</strong>
              </span>
              <span>&middot;</span>
              <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-[11px]">
                {exercise.subject}
              </span>
            </div>
            {exercise.tutorNote && (
              <p className="text-muted-foreground italic pt-0.5">
                💡 Dặn dò: &ldquo;{exercise.tutorNote}&rdquo;
              </p>
            )}
          </div>
          <Link
            to={backUrl}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            Quay lại bài tập của {exercise.tutorName} →
          </Link>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={exercise?.title || "Luyện tập"}
        description={`${exercise?.skill || "Kỹ năng"} · ${exercise?.difficulty || "Cơ bản"} · Chế độ: ${
          mode === "practice" ? "Luyện tập (Xem giải thích AI tức thì)" : "Kiểm tra (Nộp toàn bài)"
        }`}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold",
                mode === "practice"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              )}
            >
              {mode === "practice" ? "PRACTICE MODE" : "ASSESSMENT MODE"}
            </span>
            {mode === "assessment" && !isSubmitted && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                <Clock size={14} />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            )}
          </div>
        }
      />

      {/* Practice Mode Banner */}
      {mode === "practice" && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
          <Sparkles size={18} className="text-amber-500 shrink-0" />
          <span>
            <strong>Chế độ Luyện tập (Per-question mode):</strong> Bạn có thể kiểm tra từng câu hỏi ngay lập tức và xem <strong>Lời giải thích chi tiết AI</strong> để nắm vững kiến thức trước khi sang câu tiếp theo.
          </span>
        </div>
      )}

      {/* Assessment Mode Result Card (When submitted) */}
      {mode === "assessment" && isSubmitted && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-900 space-y-4 shadow-md animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-black shadow-md">
                {scoreOver10}/10
              </div>
              <div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Kết quả Kiểm tra Năng lực
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Đúng {correctCount}/{questions.length} câu ({Math.round((correctCount / questions.length) * 100)}%)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Cập nhật Elo Rating</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 justify-center">
                  <TrendingUp size={14} /> +6 Điểm Elo
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 border-t border-purple-100 dark:border-purple-900/60 pt-3">
            💡 Dưới đây là phân tích chi tiết và Lời giải thích AI cho từng câu hỏi trong bài kiểm tra của bạn.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-purple-200 dark:border-purple-900/60">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Đã gửi kết quả bài làm đến {exercise?.tutorName || "Gia sư"} để theo dõi sự tiến bộ.
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={backUrl}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Về bài tập của {exercise?.tutorName || "Gia sư"}
              </Link>
              <Link
                to="/student/progress"
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                Xem Hồ sơ Tri thức (SKP)
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Questions Stream */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const checkStatus = checkedQuestions[idx];
          const hasChecked = !!checkStatus?.checked;
          const isRight = checkStatus?.isRight;
          const isExp = !!expandedExplanation[idx];

          return (
            <Card
              key={idx}
              className={clsx(
                "p-6 transition-all space-y-4 border",
                hasChecked
                  ? isRight
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/20"
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {q.kind === "mcq" && "Trắc nghiệm"}
                    {q.kind === "fill" && "Điền từ vào chỗ trống"}
                    {q.kind === "error_correction" && "Tìm & Sửa lỗi sai"}
                    {q.kind === "sentence_transformation" && "Viết lại câu"}
                  </span>
                </div>

                {hasChecked && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                      isRight
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    )}
                  >
                    {isRight ? (
                      <>
                        <CheckCircle2 size={14} /> Chính xác
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> Chưa chính xác
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Question Body */}
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed">
                {q.prompt}
              </p>

              {/* 1. MCQ */}
              {q.kind === "mcq" && q.options && (
                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[idx] === opt;
                    return (
                      <label
                        key={opt}
                        className={clsx(
                          "flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer",
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 ring-2 ring-blue-400"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <input
                          type="radio"
                          name={`mcq-${idx}`}
                          checked={isSelected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [idx]: opt }))}
                          className="accent-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2. FILL */}
              {q.kind === "fill" && (
                <div className="space-y-2 pt-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 italic p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    &quot;{q.sentence}&quot;
                  </p>
                  <input
                    type="text"
                    placeholder="Nhập từ chính xác vào đây..."
                    value={answers[idx] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* 3. ERROR CORRECTION */}
              {q.kind === "error_correction" && (
                <div className="space-y-2 pt-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 italic p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    &quot;{q.sentence}&quot;
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nhập từ sửa đúng (Correct word)..."
                      value={answers[idx] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* 4. SENTENCE TRANSFORMATION */}
              {q.kind === "sentence_transformation" && (
                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                    <p className="text-slate-500">Câu gốc:</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      &quot;{q.originalSentence}&quot;
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold pt-1">
                      Bắt đầu bằng: {q.givenStart} ...
                    </p>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Viết lại câu hoàn chỉnh..."
                    value={answers[idx] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              )}

              {/* Action Button for PRACTICE MODE */}
              {mode === "practice" && !hasChecked && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCheckQuestion(idx)}
                    disabled={!answers[idx]}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-amber-300" />
                    Kiểm tra câu này & Xem giải thích AI
                  </button>
                </div>
              )}

              {/* AI EXPLANATION BOX (FR-13) */}
              {hasChecked && q.aiExplanation && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <button
                    type="button"
                    onClick={() => setExpandedExplanation((prev) => ({ ...prev, [idx]: !isExp }))}
                    className="flex items-center justify-between w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span className="flex items-center gap-1.5">
                      <Brain size={14} className="text-purple-500" />
                      Lời Giải Thích Chi Tiết AI (AI Explanation)
                    </span>
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExp && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2.5 animate-fade-in">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <strong className="text-emerald-700 dark:text-emerald-400">Đáp án chuẩn:</strong>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-300">
                          {q.correct}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          💡 Quy tắc ngữ pháp / Kiến thức trọng tâm:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {q.aiExplanation.rule}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          🎯 Vì sao đáp án này đúng:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {q.aiExplanation.whyCorrect}
                        </p>
                      </div>

                      {q.aiExplanation.distractors && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-0.5">
                          <span className="font-bold block">⚠️ Phân tích bẫy sai học sinh hay mắc:</span>
                          <p>{q.aiExplanation.distractors}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Submit Bar for ASSESSMENT MODE or Overall Practice Done */}
      {mode === "assessment" && !isSubmitted && (
        <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Đã làm <strong className="text-slate-900 dark:text-white">{Object.keys(answers).length}/{questions.length}</strong> câu
          </div>
          <Button
            variant="primary"
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md bg-purple-600 hover:bg-purple-700"
          >
            <Send size={15} /> Nộp Toàn Bộ Bài Kiểm Tra
          </Button>
        </div>
      )}

      {/* Confirmation Modal before Submit All */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in border-slate-300 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center">
              <Send size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận nộp toàn bộ bài kiểm tra?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bạn đã hoàn thành <strong>{Object.keys(answers).length}/{questions.length}</strong> câu hỏi. Sau khi nộp, hệ thống sẽ tự động chấm điểm tức thì và cập nhật chỉ số biến động năng lực Elo Rating của bạn.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
              >
                Tiếp tục làm bài
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmitAll();
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Nộp bài ngay
              </Button>
            </div>
          </Card>
        </div>
      )}

      {mode === "practice" && (
        <div className="text-center pt-4">
          <Link
            to={backUrl}
            className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-all inline-flex items-center gap-1.5"
          >
            Hoàn tất buổi luyện tập & Trở về {exercise?.tutorName ? `bài tập của ${exercise.tutorName}` : ""} <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
