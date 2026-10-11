import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Brain,
  Award,
  Flame,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import ProgressBar from "../../components/ui/ProgressBar";

/**
 * Phiên ôn tập ngắt quãng 5 phút — UC-S04 / UC-ST-10, UC-ST-11
 * Thẻ flashcard + 4 mức tự đánh giá theo thuật toán SM-2.
 */

export default function SpacedRepetitionSession() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const student = getStudentById(session?.studentId || "s1");

  const rawDeck = student?.spacedRepetitionDeck?.items || [
    {
      id: "sr1",
      microSkill: "Mệnh đề quan hệ (Relative Clauses)",
      prompt: "The book _____ I bought yesterday has a lot of interesting grammar points.",
      type: "mcq",
      options: ["A. who", "B. which", "C. whose", "D. whom"],
      correct: "B. which",
      aiExplanation: {
        rule: "'Which' thay thế cho danh từ chỉ vật đóng vai trò làm chủ ngữ hoặc tân ngữ trong mệnh đề quan hệ.",
        whyCorrect: "'The book' là danh từ chỉ vật nên dùng đại từ 'which'.",
        distractors: "'Who/Whom' chỉ người; 'Whose' chỉ sở hữu."
      }
    },
    {
      id: "sr2",
      microSkill: "Câu điều kiện loại 3 (Third Conditional)",
      prompt: "If she had studied harder, she _____ the IELTS examination.",
      type: "mcq",
      options: ["A. would pass", "B. would have passed", "C. will pass", "D. had passed"],
      correct: "B. would have passed",
      aiExplanation: {
        rule: "Công thức câu điều kiện loại 3: If + S + had + P2, S + would/could + have + P2.",
        whyCorrect: "Diễn tả sự việc trái ngược với thực tế trong quá khứ.",
        distractors: "'would pass' là loại 2; 'will pass' là loại 1."
      }
    },
    {
      id: "sr3",
      microSkill: "Collocations Môi trường (Environmental Collocations)",
      prompt: "Điền động từ chuẩn vào chỗ trống: The committee decided to ______ measures to combat deforestation.",
      type: "fill",
      sentence: "The committee decided to ______ measures to combat deforestation.",
      correct: "take",
      aiExplanation: {
        rule: "Collocation cố định: 'take measures' = thực thi các biện pháp.",
        whyCorrect: "Từ 'measures' đi cặp cùng động từ 'take'.",
        distractors: "Không dùng 'do' hoặc 'make measures'."
      }
    },
    {
      id: "sr4",
      microSkill: "Giới từ chỉ sự quan tâm (Prepositions)",
      prompt: "Sửa lỗi sai: 'He is deeply interested on studying cultural heritage.'",
      type: "error_correction",
      sentence: "He is deeply interested on studying cultural heritage.",
      correct: "in",
      aiExplanation: {
        rule: "Cụm tính từ: 'interested IN something'.",
        whyCorrect: "Giới từ chuẩn là 'in'.",
        distractors: "Lỗi phổ biến do dùng nhầm giới từ 'on'."
      }
    },
    {
      id: "sr5",
      microSkill: "Liên từ nhượng bộ (Concessive Conjunctions)",
      prompt: "Viết lại câu bắt đầu bằng 'Although': 'Despite the bad weather, they finished the marathon.'",
      type: "sentence_transformation",
      originalSentence: "Despite the bad weather, they finished the marathon.",
      givenStart: "Although",
      correct: "Although the weather was bad, they finished the marathon.",
      aiExplanation: {
        rule: "'Despite + Noun' tương đương 'Although + S + V'.",
        whyCorrect: "Đổi 'the bad weather' thành mệnh đề 'the weather was bad'.",
        distractors: "Tránh nhầm lẫn 'Although of' hoặc thiếu vị ngữ."
      }
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userFillInput, setUserFillInput] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentItem = rawDeck[currentIndex];
  const progressPercent = Math.round((currentIndex / (rawDeck.length || 1)) * 100);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleRate = (qualityName, intervalGain, qualityScore) => {
    const isCorrect = qualityScore >= 3;
    const newResult = {
      itemId: currentItem.id,
      prompt: currentItem.prompt,
      microSkill: currentItem.microSkill,
      quality: qualityName,
      intervalGain,
      isCorrect
    };

    const nextResults = [...sessionResults, newResult];
    setSessionResults(nextResults);

    if (currentIndex + 1 < rawDeck.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
      setUserFillInput("");
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  // Màn hình hoàn tất phiên ôn tập
  if (isCompleted) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const retentionRate = Math.round((correctCount / (sessionResults.length || 1)) * 100);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 animate-fade-in">
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Award size={34} strokeWidth={1.75} />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-900">
              <Sparkles size={14} />
              <span>Hoàn tất phiên ôn tập ngắt quãng 5 phút</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
              Ghi Nhớ Xuất Sắc!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Bạn đã ôn luyện {sessionResults.length} câu hỏi theo đường cong quên lãng Ebbinghaus.
            </p>
          </div>

          {/* Quick Metrics Row */}
          <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="text-[11px] text-slate-400 block font-medium">Số câu đã ôn</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {sessionResults.length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="text-[11px] text-slate-400 block font-medium">Tỷ lệ nhớ tốt</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {retentionRate}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="text-[11px] text-slate-400 block font-medium">Chuỗi Streak</span>
              <span className="text-xl font-black text-amber-500 flex items-center justify-center gap-1 font-mono">
                <Flame size={18} /> +1 ngày
              </span>
            </div>
          </div>

          {/* Danh sách micro-skills đã gia hạn */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Các kỹ năng đã được gia hạn mốc ôn tập tiếp theo:
            </h4>
            <div className="space-y-2">
              {sessionResults.map((res, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${res.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {res.microSkill}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      res.isCorrect ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {res.quality}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {res.intervalGain}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Về Bảng điều khiển Học sinh
            </button>
            <button
              type="button"
              onClick={() => navigate("/student/progress")}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Xem Hồ sơ Tri thức (SKP)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
      {/* ══════════════════════════════════════════════════
          TOP BAR: TIẾN TRÌNH & THOÁT
      ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Thoát phiên ôn tập</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
          <Flame size={14} />
          <span>Chuỗi {student?.spacedRepetitionDeck?.streakDays || 5} Ngày liên tục</span>
        </div>
      </div>

      {/* Thanh tiến trình */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Brain size={14} className="text-blue-600" />
            <span>Câu hỏi {currentIndex + 1} / {rawDeck.length}</span>
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{progressPercent}% hoàn thành</span>
        </div>
        <ProgressBar value={progressPercent} size="sm" />
      </div>

      {/* ══════════════════════════════════════════════════
          THẺ FLASHCARD ÔN TẬP
      ══════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
        {/* Header thẻ */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-900">
            <Sparkles size={13} className="text-amber-500" />
            <span>Micro-skill: {currentItem.microSkill}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono font-medium">
            Thuật toán SM-2
          </span>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentItem.prompt}
          </h2>

          {/* Dạng MCQ */}
          {currentItem.type === "mcq" && currentItem.options && (
            <div className="space-y-2 pt-2">
              {currentItem.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isRevealed}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 font-bold ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Dạng Điền từ */}
          {currentItem.type === "fill" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {currentItem.sentence}
              </p>
              <input
                type="text"
                disabled={isRevealed}
                value={userFillInput}
                onChange={(e) => setUserFillInput(e.target.value)}
                placeholder="Nhập từ chính xác trước khi lật đáp án..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Dạng Sửa lỗi */}
          {currentItem.type === "error_correction" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                &quot;{currentItem.sentence}&quot;
              </p>
              <p className="text-xs text-slate-500">
                Hãy suy nghĩ từ cần sửa trước khi nhấn lật thẻ đáp án.
              </p>
            </div>
          )}

          {/* Dạng Viết lại câu */}
          {currentItem.type === "sentence_transformation" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                &quot;{currentItem.originalSentence}&quot;
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                Bắt đầu bằng: {currentItem.givenStart} ...
              </p>
            </div>
          )}
        </div>

        {/* NÚT LẬT THẺ ĐÁP ÁN */}
        {!isRevealed ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReveal}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles size={16} strokeWidth={1.75} />
              <span>Hiện Đáp Án & Lời Giải Thích AI</span>
            </button>
          </div>
        ) : (
          /* PHẦN LẬT MỞ: ĐÁP ÁN & ĐÁNH GIÁ 4 NÚT SM-2 */
          <div className="space-y-5 pt-2 animate-fade-in border-t border-slate-100 dark:border-slate-800">
            {/* Hộp thoại đáp án & giải thích AI */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                <CheckCircle2 size={18} />
                <span>Đáp án chính xác: <strong className="underline">{currentItem.correct}</strong></span>
              </div>

              {currentItem.aiExplanation && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <BookOpen size={13} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" strokeWidth={1.75} />
                    <p>
                      <strong className="text-emerald-900 dark:text-emerald-200">Quy tắc:</strong>{" "}
                      {currentItem.aiExplanation.rule}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" strokeWidth={1.75} />
                    <p>
                      <strong className="text-emerald-900 dark:text-emerald-200">Vì sao đúng:</strong>{" "}
                      {currentItem.aiExplanation.whyCorrect}
                    </p>
                  </div>
                  {currentItem.aiExplanation.distractors && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                      <p className="text-slate-500 dark:text-slate-400">
                        <strong className="text-amber-700 dark:text-amber-400">Lưu ý bẫy sai:</strong>{" "}
                        {currentItem.aiExplanation.distractors}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chỉ số SM-2 hiện tại của thẻ */}
            {(currentItem.intervalDays != null || currentItem.easeFactor != null) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <span>
                  Chu kỳ hiện tại: <strong className="font-bold">{currentItem.intervalDays ?? 0} ngày</strong>
                </span>
                <span>
                  Hệ số dễ: <strong className="font-bold">{currentItem.easeFactor ?? 2.5}</strong>
                </span>
                <span>
                  Số lần nhớ đúng: <strong className="font-bold">{currentItem.repetitions ?? 0}</strong>
                </span>
              </div>
            )}

            {/* 4 NÚT ĐÁNH GIÁ SM-2 CHUẨN */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center uppercase tracking-wider">
                Đánh giá mức độ ghi nhớ của bạn (Thuật toán SM-2)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Quên hẳn (Again) */}
                <button
                  type="button"
                  onClick={() => handleRate("Quên hẳn", "Ôn lại sau 1 ngày", 1)}
                  className="p-3 rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-800 dark:text-rose-200 text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <span className="block text-xs font-black">Quên hẳn</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                    Ôn lại sau 1 ngày
                  </span>
                </button>

                {/* 2. Khó nhớ (Hard) */}
                <button
                  type="button"
                  onClick={() => handleRate("Khó nhớ", "Ôn lại sau 2 ngày", 2)}
                  className="p-3 rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-200 text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <span className="block text-xs font-black">Khó nhớ</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                    Ôn lại sau 2 ngày
                  </span>
                </button>

                {/* 3. Nhớ tốt (Good) */}
                <button
                  type="button"
                  onClick={() => handleRate("Nhớ tốt", "Ôn lại sau 4 ngày", 4)}
                  className="p-3 rounded-2xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <span className="block text-xs font-black">Nhớ tốt</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Ôn lại sau 4 ngày
                  </span>
                </button>

                {/* 4. Rất dễ (Easy) */}
                <button
                  type="button"
                  onClick={() => handleRate("Rất dễ", "Ôn lại sau 7 ngày", 5)}
                  className="p-3 rounded-2xl border border-blue-300 dark:border-blue-900 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-800 dark:text-blue-200 text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <span className="block text-xs font-black">Rất dễ</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">
                    Ôn lại sau 7 ngày
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
