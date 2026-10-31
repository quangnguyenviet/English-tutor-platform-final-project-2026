import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiAnswerQuestion, apiGetQuizResult, apiStartAttempt } from "../../lib/studentApi";
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
  const base =
    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all";
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

function ResultSummary({ result }) {
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
        {result?.title && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.title}</p>
        )}
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

  const [phase, setPhase] = useState("loading"); // loading | question | done | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(null); // { title, totalQuestions, answeredCount }
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // kết quả chấm của câu hiện tại
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadResult = useCallback(async () => {
    try {
      setResult(await apiGetQuizResult(token, quizId));
      setPhase("done");
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }, [token, quizId]);

  // Vào bài hoặc reload giữa chừng: backend trả đúng câu chưa trả lời kế tiếp.
  const start = useCallback(async () => {
    if (!token) return;
    setPhase("loading");
    setError("");
    setSelected(null);
    setFeedback(null);
    try {
      const data = await apiStartAttempt(token, quizId);
      const next = normalizeQuestion(data.nextQuestion ?? data.question);
      setAttempt({
        title: data.title ?? "",
        totalQuestions: data.totalQuestions ?? 0,
        answeredCount: data.answeredCount ?? 0,
      });
      if (data.completed || !next) {
        await loadResult();
        return;
      }
      setQuestion(next);
      setPhase("question");
    } catch (err) {
      // Quiz đã hoàn thành trước đó → xem tổng kết thay vì báo lỗi
      if (err.status === 409) {
        await loadResult();
        return;
      }
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
    // Khóa ngay sau lần chọn đầu tiên: không đổi được đáp án
    if (feedback || submitting) return;
    setSelected(optionKey);
    setSubmitting(true);
    try {
      const data = await apiAnswerQuestion(token, quizId, question.id, optionKey);
      setFeedback(data);
      setAttempt((prev) => ({ ...prev, answeredCount: (prev?.answeredCount ?? 0) + 1 }));
    } catch (err) {
      setSelected(null);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    // Bắt đầu lại để lấy câu kế tiếp từ backend (nguồn sự thật duy nhất)
    await start();
  }

  const total = attempt?.totalQuestions ?? 0;
  const answered = attempt?.answeredCount ?? 0;
  const isLast = total > 0 && answered >= total;

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

      {phase === "done" && <ResultSummary result={result} />}

      {phase === "question" && question && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-base font-semibold text-slate-900 dark:text-white">{attempt?.title}</h1>
              <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">
                {Math.min(answered + (feedback ? 0 : 1), total)}/{total} câu
              </span>
            </div>
            <ProgressBar value={quizProgressPercent(answered, total)} />
          </div>

          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {question.skillName && <Badge skill={question.skillName}>{question.skillName}</Badge>}
              {question.cefrLevel && <Badge tone="slate">{question.cefrLevel}</Badge>}
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
                  disabled={Boolean(feedback) || submitting}
                  onClick={() => handleSelect(option.key)}
                  className={optionClass({
                    locked: Boolean(feedback) || submitting,
                    selected: selected === option.key,
                    feedback,
                    optionKey: option.key,
                  })}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-semibold">
                    {option.key}
                  </span>
                  <span className="min-w-0 flex-1">{option.text}</span>
                  {submitting && selected === option.key && (
                    <Loader2 size={16} className="shrink-0 animate-spin" />
                  )}
                  {feedback && option.key === feedback.correctAnswer && (
                    <CheckCircle2 size={18} className="shrink-0" />
                  )}
                  {feedback && selected === option.key && !feedback.isCorrect && (
                    <XCircle size={18} className="shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {error && !feedback && <ErrorBox message={error} />}
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
                <Badge tone={eloChangeTone(feedback.eloChange)}>
                  Elo {formatEloChange(feedback.eloChange)}
                  {feedback.eloBefore != null && feedback.eloAfter != null && (
                    <span className="font-mono">
                      {" "}
                      ({Math.round(feedback.eloBefore)} → {Math.round(feedback.eloAfter)})
                    </span>
                  )}
                </Badge>
              </div>
              {feedback.explanation && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Giải thích: </span>
                  {feedback.explanation}
                </p>
              )}
              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  {isLast ? "Xem tổng kết" : "Câu tiếp theo"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
