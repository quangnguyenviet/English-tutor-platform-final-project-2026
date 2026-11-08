import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  apiAnswerQuestion,
  apiGetQuizDetail,
  apiGetQuizResult,
  apiStartAttempt,
} from "../../lib/studentApi";
import {
  eloChangeTone,
  formatEloChange,
  normalizeQuestion,
  quizProgressPercent,
} from "../../lib/studentModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

function optionClass({ locked, selected, feedback, optionKey }) {
  const base = "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all";
  if (!locked) {
    return `${base} cursor-pointer border-slate-200 bg-white text-slate-900 hover:border-blue-300 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800`;
  }
  if (feedback && optionKey === feedback.correctAnswer) {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400`;
  }
  if (selected && feedback && !feedback.isCorrect) {
    return `${base} border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400`;
  }
  return `${base} cursor-not-allowed border-slate-200 bg-white text-slate-500 opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400`;
}

function toNavigableQuestion(raw) {
  const question = normalizeQuestion(raw);
  if (!question) return null;
  const answered = Boolean(raw?.answered);
  return {
    ...question,
    answered,
    selectedAnswer: answered ? raw.selectedAnswer : null,
    feedback: answered
      ? {
          isCorrect: Boolean(raw.isCorrect),
          selectedAnswer: raw.selectedAnswer,
          correctAnswer: raw.correctAnswer,
          explanation: raw.explanation,
        }
      : null,
  };
}

function ResultSummary({ result, onReview }) {
  const correct = result?.correctCount ?? 0;
  const total = result?.totalQuestions ?? 0;
  const wrong = result?.wrongCount ?? Math.max(0, total - correct);
  const eloChange = result?.totalEloChange ?? result?.eloChange ?? 0;

  return (
    <Card className="space-y-5 p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <Trophy size={22} />
      </span>
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hoàn thành bài quiz</h1>
        {result?.title && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.title}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">{correct}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Câu đúng</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/40">
          <p className="font-mono text-2xl font-bold text-rose-700 dark:text-rose-400">{wrong}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Câu sai</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/40">
          <p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-400">
            {formatEloChange(eloChange)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Elo thay đổi</p>
        </div>
      </div>
      {result?.currentElo != null && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Elo hiện tại: <span className="font-mono font-semibold">{Math.round(result.currentElo)}</span>
        </p>
      )}
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        {total > 0 && (
          <Button type="button" variant="outline" onClick={onReview}>
            <ListChecks size={16} />
            Xem lại từng câu
          </Button>
        )}
        {wrong > 0 && (
          <Button as={Link} to="/student/spaced-repetition" variant="outline">
            <RotateCcw size={16} />
            Ôn câu sai
          </Button>
        )}
        <Button as={Link} to="/student/exercises">
          Về danh sách bài
          <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

export default function ExerciseTaking() {
  const { exerciseId: quizId } = useParams();
  const { token } = useAuth();

  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittingQuestionId, setSubmittingQuestionId] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [result, setResult] = useState(null);

  const loadResult = useCallback(async () => {
    const summary = await apiGetQuizResult(token, quizId);
    setResult(summary);
    return summary;
  }, [token, quizId]);

  const start = useCallback(async () => {
    if (!token) return;
    setPhase("loading");
    setError("");
    setAnswerError("");
    setPendingSelection(null);
    try {
      const state = await apiStartAttempt(token, quizId);
      const detail = await apiGetQuizDetail(token, quizId);
      const nextQuestions = (detail?.questions || []).map(toNavigableQuestion).filter(Boolean);
      const answeredCount = detail?.answeredCount ?? state?.answeredCount ?? 0;
      const completed = Boolean(state?.completed || detail?.status === "COMPLETED");

      setQuestions(nextQuestions);
      setAttempt({
        title: detail?.title ?? state?.title ?? "",
        totalQuestions: detail?.totalQuestions ?? state?.totalQuestions ?? nextQuestions.length,
        answeredCount,
        completed,
      });

      if (completed) {
        await loadResult();
        setCurrentIndex(0);
        setPhase("summary");
        return;
      }

      const nextId = state?.nextQuestion?.id ?? state?.question?.id;
      const nextIndex = nextQuestions.findIndex((item) => item.id === nextId);
      const firstUnanswered = nextQuestions.findIndex((item) => !item.answered);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : Math.max(0, firstUnanswered));
      setPhase("question");
    } catch (err) {
      setError(
        err.code === 1410 || err.status === 410
          ? "Bài quiz này đã quá hạn nên không thể làm tiếp."
          : err.message,
      );
      setPhase("error");
    }
  }, [token, quizId, loadResult]);

  useEffect(() => {
    start();
  }, [start]);

  async function handleSelect(optionKey) {
    const current = questions[currentIndex];
    if (!current || current.answered || submittingQuestionId != null) return;
    setPendingSelection(optionKey);
    setSubmittingQuestionId(current.id);
    setAnswerError("");
    try {
      const feedback = await apiAnswerQuestion(token, quizId, current.id, optionKey);
      setQuestions((items) =>
        items.map((item) =>
          item.id === current.id
            ? { ...item, answered: true, selectedAnswer: feedback.selectedAnswer ?? optionKey, feedback }
            : item,
        ),
      );
      setAttempt((previous) => ({
        ...previous,
        answeredCount:
          feedback.answeredCount
          ?? Math.min((previous?.answeredCount ?? 0) + 1, previous?.totalQuestions ?? 0),
        completed: Boolean(feedback.completed),
      }));
      if (feedback.completed) {
        try {
          await loadResult();
        } catch {
          setAnswerError("Câu trả lời đã được lưu nhưng chưa tải được phần tổng kết.");
        }
      }
    } catch (err) {
      setAnswerError(err.message || "Không thể lưu câu trả lời. Vui lòng thử lại.");
    } finally {
      setSubmittingQuestionId(null);
      setPendingSelection(null);
    }
  }

  function moveQuestion(offset) {
    setCurrentIndex((index) => Math.max(0, Math.min(questions.length - 1, index + offset)));
    setAnswerError("");
    setPendingSelection(null);
  }

  async function showSummary() {
    try {
      if (!result) await loadResult();
      setPhase("summary");
    } catch (err) {
      setAnswerError(err.message || "Không thể tải kết quả bài làm.");
    }
  }

  const question = questions[currentIndex] ?? null;
  const feedback = question?.feedback ?? null;
  const selected = question?.selectedAnswer
    ?? (submittingQuestionId === question?.id ? pendingSelection : null);
  const total = attempt?.totalQuestions ?? questions.length;
  const answered = attempt?.answeredCount ?? 0;
  const isSubmitting = submittingQuestionId === question?.id;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-3xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
      <Link
        to="/student/exercises"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400"
      >
        <ArrowLeft size={16} />
        Danh sách bài
      </Link>

      {phase === "loading" && <SkeletonRows rows={3} className="h-24" />}
      {phase === "error" && <ErrorBox message={error} onRetry={start} />}
      {phase === "summary" && (
        <ResultSummary
          result={result}
          onReview={() => {
            setCurrentIndex(0);
            setPhase("question");
          }}
        />
      )}

      {phase === "question" && question && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-base font-semibold text-slate-900 dark:text-white">{attempt?.title}</h1>
              <Badge tone={attempt?.completed ? "emerald" : "blue"}>
                {attempt?.completed ? "Đã hoàn thành" : `${answered}/${total} câu đã làm`}
              </Badge>
            </div>
            <ProgressBar value={quizProgressPercent(answered, total)} />
          </div>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {question.skillName && <Badge skill={question.skillName}>{question.skillName}</Badge>}
                {question.cefrLevel && <Badge tone="slate">{question.cefrLevel}</Badge>}
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                Câu {currentIndex + 1}/{questions.length}
              </span>
            </div>
            <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-white">
              {question.content}
            </p>

            <div className="space-y-2.5" role="radiogroup" aria-label="Các đáp án">
              {question.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={selected === option.key}
                  disabled={question.answered || isSubmitting}
                  onClick={() => handleSelect(option.key)}
                  className={optionClass({
                    locked: question.answered || isSubmitting,
                    selected: selected === option.key,
                    feedback,
                    optionKey: option.key,
                  })}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-semibold">
                    {option.key}
                  </span>
                  <span className="min-w-0 flex-1">{option.text}</span>
                  {isSubmitting && selected === option.key && <Loader2 size={16} className="shrink-0 animate-spin" />}
                  {feedback && option.key === feedback.correctAnswer && <CheckCircle2 size={18} className="shrink-0" />}
                  {feedback && selected === option.key && !feedback.isCorrect && <XCircle size={18} className="shrink-0" />}
                </button>
              ))}
            </div>

            {answerError && <ErrorBox message={answerError} />}
          </Card>

          {feedback && (
            <Card
              className={`space-y-3 p-5 ${
                feedback.isCorrect
                  ? "border-emerald-200 dark:border-emerald-800/40"
                  : "border-rose-200 dark:border-rose-800/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={`flex items-center gap-2 text-base font-semibold ${
                    feedback.isCorrect
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {feedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {feedback.isCorrect ? "Chính xác" : `Chưa đúng — đáp án đúng là ${feedback.correctAnswer}`}
                </p>
                {feedback.eloChange != null && (
                  <Badge tone={eloChangeTone(feedback.eloChange)}>
                    Elo {formatEloChange(feedback.eloChange)}
                    {feedback.eloBefore != null && feedback.eloAfter != null && (
                      <span className="font-mono">
                        {" "}({Math.round(feedback.eloBefore)} → {Math.round(feedback.eloAfter)})
                      </span>
                    )}
                  </Badge>
                )}
              </div>
              {feedback.explanation && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Giải thích: </span>
                  {feedback.explanation}
                </p>
              )}
            </Card>
          )}

          <Card className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => moveQuestion(-1)}
                aria-label="Câu trước"
                title="Câu trước"
              >
                <ArrowLeft size={17} />
              </Button>
              <div className="text-center">
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  {currentIndex + 1} / {questions.length}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex >= questions.length - 1}
                onClick={() => moveQuestion(1)}
                aria-label="Câu tiếp theo"
                title="Câu tiếp theo"
              >
                <ArrowRight size={17} />
              </Button>
            </div>
            {attempt?.completed && (
              <div className="mt-3 flex justify-center border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button type="button" size="sm" onClick={showSummary}>
                  <Trophy size={16} />
                  Xem tổng kết
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
