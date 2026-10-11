import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  PencilLine,
  Info,
  BookOpen,
  FileCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import { useStudentMatching } from "../../context/StudentMatchingContext";

/**
 * Giao diện làm bài trực tuyến — UC-S02 / UC-S03
 * UC-ST-04 (làm bài), UC-ST-05 (nộp bài), UC-ST-06 (xem kết quả), UC-ST-07 (giải thích AI)
 *
 * Hai chế độ:
 *   practice   → kiểm tra & giải thích từng câu (Per-question mode)
 *   assessment → đồng hồ đếm ngược, nộp toàn bài (Submit-all mode)
 */

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
        title: "Bài Kiểm Tra Khảo Sát Năng Lực Đầu Vào (Placement Test)",
        skill: "Đánh giá tổng hợp 5 kỹ năng",
        difficulty: "Phân loại trình độ",
        mode: "assessment",
        type: "4 Dạng Chuẩn PRD",
        status: "assigned",
      }
    : student?.exercises?.find((e) => e.id === exerciseId) || student?.exercises?.[0];

  const mode = exercise?.mode || "practice"; // "practice" | "assessment"

  // Ngân hàng 4 câu hỏi đại diện cho 4 định dạng chuẩn
  const questions = useMemo(() => {
    if (exercise?.questions && exercise.questions.length > 0) {
      return exercise.questions;
    }

    return [
      {
        id: "q1",
        kind: "mcq",
        title: "Câu 1: Trắc nghiệm khách quan (MCQ)",
        prompt: "The scientist ______ invented the new clean energy technology was awarded the prestigious prize.",
        options: ["A. who", "B. which", "C. whose", "D. whom"],
        correct: "A. who",
        aiExplanation: {
          rule: "Đại từ quan hệ 'who' thay thế cho danh từ chỉ người làm chủ ngữ trong mệnh đề quan hệ.",
          whyCorrect: "'The scientist' là danh từ chỉ người, phía sau là động từ vị ngữ 'invented' nên cần đại từ làm chủ ngữ 'who'.",
          distractors: "'Which' dùng cho vật; 'Whose' chỉ quyền sở hữu; 'Whom' chỉ đóng vai trò tân ngữ."
        }
      },
      {
        id: "q2",
        kind: "fill",
        title: "Câu 2: Điền từ vào chỗ trống (Fill-in the blank)",
        prompt: "Điền một động từ thích hợp vào chỗ trống để tạo cụm collocation học thuật chuẩn:",
        sentence: "The municipal government decided to ______ measures to tackle air pollution in urban areas.",
        correct: "take",
        aiExplanation: {
          rule: "Collocation học thuật cố định: 'take measures' = thực hiện các biện pháp quyết liệt.",
          whyCorrect: "Trong ngữ cảnh xử lý vấn đề, động từ chuẩn đi cùng với 'measures' bắt buộc là 'take'.",
          distractors: "Không sử dụng 'make' hay 'do' vì vi phạm quy ước tự nhiên của văn phong Anh ngữ."
        }
      },
      {
        id: "q3",
        kind: "error_correction",
        title: "Câu 3: Sửa lỗi sai trong câu (Error Correction)",
        prompt: "Tìm và gõ từ thay thế chính xác cho giới từ bị dùng sai trong câu dưới đây:",
        sentence: "She was deeply interested on exploring modern Vietnamese literature and poetry.",
        wrongPart: "on",
        correct: "in",
        aiExplanation: {
          rule: "Cụm tính từ đi kèm giới từ cố định: 'interested IN something / doing something'.",
          whyCorrect: "'interested on' là lỗi sai phổ biến do dịch nghĩa thô từ tiếng Việt. Giới từ chuẩn xác duy nhất là 'in'.",
          distractors: "Không kết hợp tính từ 'interested' với giới từ 'on', 'at' hoặc 'for'."
        }
      },
      {
        id: "q4",
        kind: "sentence_transformation",
        title: "Câu 4: Viết lại câu không đổi nghĩa (Sentence Transformation)",
        prompt: "Viết lại câu sau sử dụng từ liên từ gợi ý 'Although':",
        originalSentence: "Despite the heavy rain, the outdoor football match continued until sunset.",
        givenStart: "Although",
        correct: "Although it rained heavily, the outdoor football match continued until sunset.",
        aiExplanation: {
          rule: "Cấu trúc chuyển đổi tương đương: 'Despite + Noun Phrase' → 'Although + Mệnh đề (S + V)'.",
          whyCorrect: "Cụm danh từ 'the heavy rain' chuyển thành mệnh đề có vị ngữ 'it rained heavily' giữ nguyên thì quá khứ đơn.",
          distractors: "Không viết 'Although the heavy rain' vì liên từ 'Although' bắt buộc phải đi cùng một mệnh đề hoàn chỉnh."
        }
      }
    ];
  }, [exercise]);

  // State
  const [answers, setAnswers] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState({}); // Dùng cho Practice mode
  const [expandedExplanation, setExpandedExplanation] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(mode === "assessment" ? 15 * 60 : 0);
  const [answerWarning, setAnswerWarning] = useState(null);

  const backUrl = exercise?.tutorId ? `/student/exercises?tutor=${exercise.tutorId}` : "/student/exercises";

  // Đồng hồ đếm ngược cho Assessment Mode
  useEffect(() => {
    if (mode !== "assessment" || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAll(); // Tự động nộp khi hết giờ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, isSubmitted]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Kiểm tra câu đơn lẻ trong PRACTICE MODE (Per-question mode)
  const handleCheckQuestion = (index) => {
    const q = questions[index];
    const userAns = (answers[index] || "").trim().toLowerCase();

    if (!userAns) {
      setAnswerWarning(index);
      return;
    }
    setAnswerWarning(null);

    let isRight = false;
    if (q.kind === "mcq") {
      isRight = answers[index] === q.correct;
    } else if (q.kind === "fill" || q.kind === "error_correction") {
      isRight = userAns === q.correct.toLowerCase();
    } else if (q.kind === "sentence_transformation") {
      isRight = userAns.length > 10;
    }

    setCheckedQuestions((prev) => ({
      ...prev,
      [index]: { checked: true, isRight }
    }));

    // Tự động bung Lời giải thích AI khi vừa kiểm tra
    setExpandedExplanation((prev) => ({
      ...prev,
      [index]: true
    }));
  };

  // Nộp toàn bài trong ASSESSMENT MODE (Submit-all mode)
  const handleSubmitAll = () => {
    setShowConfirmModal(false);
    setIsSubmitted(true);

    const allChecked = {};
    const allExpanded = {};

    questions.forEach((q, i) => {
      const userAns = (answers[i] || "").trim().toLowerCase();
      let isRight = false;
      if (q.kind === "mcq") {
        isRight = answers[i] === q.correct;
      } else if (q.kind === "fill" || q.kind === "error_correction") {
        isRight = userAns === q.correct.toLowerCase();
      } else {
        isRight = userAns.length > 5;
      }
      allChecked[i] = { checked: true, isRight };
      allExpanded[i] = true;
    });

    setCheckedQuestions(allChecked);
    setExpandedExplanation(allExpanded);

    // Xử lý Placement test đầu vào
    if (isPlacementTest) {
      setTimeout(() => {
        submitPlacementTest?.({
          score: 85,
          totalScore: 100,
          skillBreakdown: { Nghe: 85, Đọc: 90, Viết: 75, "Từ vựng": 88, "Ngữ pháp": 82 },
          recommendedLevel: "B1+ (Foundation IELTS)",
          tutorComment: "Nền tảng khá tốt. Cần rèn thêm kỹ năng viết lại câu và khắc phục bẫy ngữ pháp collocation."
        });
        navigate("/student/chat");
      }, 3000);
    }
  };

  // Tính điểm tổng kết
  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || "").trim().length > 0).length;
  const correctCount = Object.values(checkedQuestions).filter((c) => c.isRight).length;
  const scoreOver10 = Math.round((correctCount / (questions.length || 1)) * 10);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* ══════════════════════════════════════════════════
          TOP NAVIGATION
      ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách bài tập</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {mode === "practice" ? (
              <>
                <PencilLine size={13} strokeWidth={1.75} /> Chế độ Luyện tập
              </>
            ) : (
              <>
                <FileCheck size={13} strokeWidth={1.75} /> Chế độ Kiểm tra
              </>
            )}
          </span>

          {mode === "assessment" && !isSubmitted && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono">
              <Clock size={14} />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin bài tập */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {exercise?.title || "Bài luyện tập"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Kỹ năng: <strong>{exercise?.skill || "Ngữ pháp & Từ vựng"}</strong></span>
            <span>•</span>
            <span>Gia sư giao: <strong>{exercise?.tutorName || "Nguyễn Lan Anh"}</strong></span>
            <span>•</span>
            <span>Độ khó: <strong>{exercise?.difficulty || "Cơ bản"}</strong></span>
          </p>
        </div>

        {mode === "practice" && (
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" strokeWidth={1.75} />
            <span>
              <strong className="font-semibold">Chế độ Luyện tập:</strong> Làm từng câu và nhận lời giải thích AI tức thì.
            </span>
          </div>
        )}
      </div>

      {/* Thanh tiến độ làm bài — học sinh luôn biết mình đang ở đâu */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-1.5">
          {questions.map((q, i) => {
            const done = (answers[i] || "").trim().length > 0;
            const checked = !!checkedQuestions[i]?.checked;
            return (
              <span
                key={q.id || i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  checked
                    ? checkedQuestions[i].isRight
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                    : done
                    ? "bg-blue-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            );
          })}
        </div>
        <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {answeredCount}/{questions.length}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════
          ASSESSMENT SCORECARD (Khi đã nộp bài kiểm tra)
      ══════════════════════════════════════════════════ */}
      {mode === "assessment" && isSubmitted && (
        <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 dark:border-blue-900/60 dark:bg-blue-950/20 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-sm font-mono">
                {scoreOver10}/10
              </div>
              <div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Bảng kết quả đánh giá năng lực
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Đúng {correctCount}/{questions.length} câu ({Math.round((correctCount / questions.length) * 100)}%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thời gian hoàn thành: {formatTimer(15 * 60 - timeLeftSeconds)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold">Biến động Elo Rating</span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center mt-0.5">
                <TrendingUp size={15} strokeWidth={1.75} /> +6 điểm
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 border-t border-blue-100 dark:border-blue-900/60 pt-3">
            Dưới đây là bảng phân tích chi tiết từng câu hỏi kèm <strong>lời giải thích chi tiết AI</strong>.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-200 dark:border-blue-900/60">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={15} strokeWidth={1.75} />
              <span>Đã tự động gửi kết quả đến gia sư {exercise?.tutorName || "phụ trách"}.</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={backUrl}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all active:scale-[0.98]"
              >
                Về danh sách bài tập
              </Link>
              <Link
                to="/student/progress"
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Xem hồ sơ năng lực
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          DANH SÁCH CÂU HỎI
      ══════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const checkStatus = checkedQuestions[idx];
          const hasChecked = !!checkStatus?.checked;
          const isRight = checkStatus?.isRight;
          const isExp = !!expandedExplanation[idx];

          return (
            <div
              key={q.id || idx}
              className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                hasChecked
                  ? isRight
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {q.title}
                </span>

                {hasChecked && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isRight ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={16} /> Chính xác
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle size={16} /> Chưa chính xác
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {q.prompt}
                </p>

                {/* DẠNG 1: MCQ */}
                {q.kind === "mcq" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt) => {
                      const isSelected = answers[idx] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={hasChecked && mode === "practice"}
                          onClick={() => setAnswers({ ...answers, [idx]: opt })}
                          className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 font-bold ring-2 ring-blue-500/20"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                          } ${hasChecked && opt === q.correct ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold" : ""}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* DẠNG 2: FILL-IN */}
                {q.kind === "fill" && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      {q.sentence}
                    </p>
                    <input
                      type="text"
                      disabled={hasChecked && mode === "practice"}
                      value={answers[idx] || ""}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      placeholder="Nhập từ chính xác vào đây..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* DẠNG 3: ERROR CORRECTION */}
                {q.kind === "error_correction" && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm italic p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium">
                      &quot;{q.sentence}&quot;
                    </p>
                    <input
                      type="text"
                      disabled={hasChecked && mode === "practice"}
                      value={answers[idx] || ""}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      placeholder="Gõ từ sửa lại đúng (thay thế cho từ bị sai)..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* DẠNG 4: SENTENCE TRANSFORMATION */}
                {q.kind === "sentence_transformation" && (
                  <div className="space-y-2 pt-2">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <p className="text-xs text-slate-500">Câu gốc:</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {q.originalSentence}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold pt-1">
                        Từ gợi ý bắt đầu: {q.givenStart} ...
                      </p>
                    </div>
                    <textarea
                      rows={2}
                      disabled={hasChecked && mode === "practice"}
                      value={answers[idx] || ""}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      placeholder="Gõ lại câu hoàn chỉnh bắt đầu bằng từ gợi ý..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Nút Kiểm tra câu này trong Chế độ Luyện tập */}
              {mode === "practice" && !hasChecked && (
                <div className="pt-2 space-y-2">
                  {answerWarning === idx && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                      <AlertTriangle size={13} strokeWidth={1.75} />
                      Vui lòng chọn hoặc nhập câu trả lời trước khi kiểm tra.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCheckQuestion(idx)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles size={14} strokeWidth={1.75} />
                      <span>Kiểm tra câu này &amp; xem giải thích AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* HỘP THOẠI LỜI GIẢI THÍCH CHI TIẾT AI (AI EXPLANATION ACCORDION) */}
              {hasChecked && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedExplanation((prev) => ({
                        ...prev,
                        [idx]: !prev[idx]
                      }))
                    }
                    className="w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={15} className="text-amber-500" />
                      <span>Lời Giải Thích Chi Tiết AI (AI Explanation)</span>
                    </span>
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExp && q.aiExplanation && (
                    <div className="mt-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 text-xs space-y-3 text-slate-700 dark:text-slate-300 animate-fade-in leading-relaxed">
                      <div className="flex items-start gap-2">
                        <BookOpen size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                        <div>
                          <strong className="text-blue-900 dark:text-blue-300 block mb-0.5">
                            Quy tắc ngữ pháp / Kiến thức trọng tâm
                          </strong>
                          <p>{q.aiExplanation.rule}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                        <div>
                          <strong className="text-emerald-800 dark:text-emerald-300 block mb-0.5">
                            Vì sao đáp án này đúng
                          </strong>
                          <p>{q.aiExplanation.whyCorrect}</p>
                        </div>
                      </div>

                      {q.aiExplanation.distractors && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                          <div>
                            <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">
                              Phân tích bẫy sai thường gặp
                            </strong>
                            <p className="text-slate-500 dark:text-slate-400">{q.aiExplanation.distractors}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          THANH ĐIỀU KHIỂN GHIM ĐÁY (BOTTOM BAR)
      ══════════════════════════════════════════════════ */}
      {mode === "assessment" && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Tiến độ bài làm: </span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {answeredCount}/{questions.length} câu đã trả lời
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Nộp toàn bộ bài kiểm tra
            </button>

            {answeredCount < questions.length && (
              <span className="hidden items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 sm:flex">
                <AlertTriangle size={12} /> Còn {questions.length - answeredCount} câu chưa trả lời
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nút Hoàn tất buổi luyện tập trong Practice Mode */}
      {mode === "practice" && (
        <div className="pt-6 flex justify-center">
          <Link
            to={backUrl}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            <span>Hoàn tất buổi luyện tập & Trở về</span>
          </Link>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI KIỂM TRA */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl text-slate-900 dark:text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCheck size={24} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Xác nhận nộp bài kiểm tra?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn đã làm <strong>{answeredCount}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tự động chấm điểm tức thì và cập nhật điểm Elo Rating của bạn.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitAll}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Xác nhận nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
