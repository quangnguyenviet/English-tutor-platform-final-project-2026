import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Zap,
  TrendingUp,
  Brain,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  Flame
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";

export default function SpacedRepetitionSession() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const student = getStudentById(session?.studentId || "s1");

  const rawDeck = student?.spacedRepetitionDeck?.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userFillInput, setUserFillInput] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [reviewedCount, setReviewedCount] = useState(0);
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
    setReviewedCount((prev) => prev + 1);

    if (currentIndex + 1 < rawDeck.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
      setUserFillInput("");
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  if (!currentItem && !isCompleted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tuyệt vời! Bạn đã hoàn thành tất cả câu ôn tập hôm nay!</h2>
        <p className="text-sm text-slate-500">Các kiến thức đã được lập lịch theo thuật toán SM-2.</p>
        <Link to="/student" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const retentionRate = Math.round((correctCount / sessionResults.length) * 100);

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-6 animate-fade-in">
        <Card className="p-8 text-center space-y-5 border-emerald-200 dark:border-emerald-900 shadow-xl bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <Award size={36} />
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Zap size={14} /> Hoàn tất phiên ôn tập ngắt quãng 5 phút
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Ghi nhớ Xuất sắc!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Bạn đã củng cố {sessionResults.length} câu hỏi theo đường cong quên lãng Ebbinghaus.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 py-2 border-y border-emerald-100 dark:border-slate-800">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Số câu ôn tập</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{sessionResults.length} câu</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Độ ghi nhớ (Recall)</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{retentionRate}%</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Chuỗi Streak</span>
              <span className="text-xl font-black text-amber-500 flex items-center justify-center gap-1">
                <Flame size={18} /> 6 Ngày
              </span>
            </div>
          </div>

          {/* Micro-skills updated */}
          <div className="text-left space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kỹ năng đã được cập nhật lịch SM-2:
            </h4>
            <div className="space-y-2">
              {sessionResults.map((res, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${res.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="font-semibold text-slate-900 dark:text-white">{res.microSkill}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={res.isCorrect ? "emerald" : "rose"}>{res.quality}</Badge>
                    <span className="text-[11px] text-slate-500">Ôn lại sau: {res.intervalGain}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-3 justify-center">
            <Button variant="primary" onClick={() => navigate("/student")}>
              Về Bảng điều khiển Học sinh
            </Button>
            <Button variant="outline" onClick={() => navigate("/student/progress")}>
              Xem Hồ sơ Tri thức (SKP)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Thoát phiên ôn tập
        </Link>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
          <Flame size={14} /> Chuỗi 5 Ngày liên tiếp
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Brain size={14} className="text-blue-500" />
            Câu {currentIndex + 1} / {rawDeck.length}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{progressPercent}% hoàn thành</span>
        </div>
        <ProgressBar value={progressPercent} size="sm" />
      </div>

      {/* Main Flashcard Card */}
      <Card className="p-6 sm:p-8 space-y-6 shadow-lg border-blue-100 dark:border-slate-800 relative overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" /> Micro-skill: {currentItem.microSkill}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Mốc ôn: {currentItem.nextReview}
          </span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
            {currentItem.prompt}
          </h2>

          {/* Render question based on type */}
          {currentItem.type === "mcq" && currentItem.options && (
            <div className="space-y-2 pt-2">
              {currentItem.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 ring-2 ring-blue-400"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {currentItem.type === "fill" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentItem.sentence}</p>
              <input
                type="text"
                value={userFillInput}
                onChange={(e) => setUserFillInput(e.target.value)}
                placeholder="Nhập từ chính xác..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {currentItem.type === "error_correction" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200 italic">&quot;{currentItem.sentence}&quot;</p>
              <p className="text-xs text-slate-500">Hãy tìm từ sai và nghĩ cách sửa trước khi lật đáp án.</p>
            </div>
          )}

          {currentItem.type === "sentence_transformation" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200 italic">&quot;{currentItem.originalSentence}&quot;</p>
              <p className="text-xs text-blue-600 font-bold">Bắt đầu bằng: {currentItem.givenStart} ...</p>
            </div>
          )}
        </div>

        {/* Reveal Answer Button */}
        {!isRevealed ? (
          <div className="pt-4">
            <button
              type="button"
              onClick={handleReveal}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-300" />
              Hiện Đáp Án & Lời Giải Thích AI
            </button>
          </div>
        ) : (
          /* Revealed AI Explanation & Recall Quality Feedback */
          <div className="space-y-5 pt-2 animate-fade-in">
            {/* Answer Display */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                <CheckCircle2 size={18} />
                <span>Đáp án chính xác: <strong className="underline">{currentItem.correct}</strong></span>
              </div>

              {/* Rich AI Explanation */}
              {currentItem.aiExplanation && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <p>
                    <strong className="text-emerald-900 dark:text-emerald-200">💡 Quy tắc ngữ pháp:</strong> {currentItem.aiExplanation.rule}
                  </p>
                  <p>
                    <strong className="text-emerald-900 dark:text-emerald-200">🎯 Vì sao đúng:</strong> {currentItem.aiExplanation.whyCorrect}
                  </p>
                  {currentItem.aiExplanation.distractors && (
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      ⚠️ Phân tích bẫy sai: {currentItem.aiExplanation.distractors}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* SM-2 Recall Rating Buttons */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center uppercase tracking-wider">
                Đánh giá mức độ ghi nhớ của bạn (Thuật toán SM-2)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRate("Quên hẳn", "1 ngày", 1)}
                  className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black">🔴 Quên hẳn</span>
                  <span className="text-[10px] text-rose-500 font-medium">Ôn lại: 1 ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate("Khó nhớ", "2 ngày", 2)}
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black">🟠 Khó nhớ</span>
                  <span className="text-[10px] text-amber-500 font-medium">Ôn lại: 2 ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate("Nhớ tốt", "4 ngày", 4)}
                  className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black">🟢 Nhớ tốt</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Ôn lại: 4 ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate("Rất dễ", "7 ngày", 5)}
                  className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black">🔵 Rất dễ</span>
                  <span className="text-[10px] text-blue-500 font-medium">Ôn lại: 7 ngày</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
