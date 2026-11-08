import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  apiAnswerReview,
  apiGetDueReviews,
  apiGetReviewStats,
  apiRateReview,
} from "../../lib/studentApi";
import { normalizeQuestion } from "../../lib/studentModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const RATINGS = [
  {
    key: "AGAIN",
    label: "Again",
    interval: "< 1 phút",
    keyHint: "1",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
  },
  {
    key: "HARD",
    label: "Hard",
    interval: "< 6 phút",
    keyHint: "2",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
  },
  {
    key: "GOOD",
    label: "Good",
    interval: "< 10 phút",
    keyHint: "3",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
  },
  {
    key: "EASY",
    label: "Easy",
    interval: "5 ngày",
    keyHint: "4",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
  },
];

function formatNextReview(value) {
  if (!value) return "Chưa có lịch tiếp theo";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function optionClass(optionKey, selected, feedback) {
  const base =
    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all";
  if (!feedback) {
    return `${base} cursor-pointer ${
      selected === optionKey
        ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/15 dark:bg-blue-950/40 dark:text-blue-200"
        : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-800"
    }`;
  }
  if (optionKey === feedback.correctAnswer) {
    return `${base} border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300`;
  }
  if (optionKey === feedback.selectedAnswer && !feedback.isCorrect) {
    return `${base} border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300`;
  }
  return `${base} border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500`;
}

export default function SpacedRepetitionSession() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratingBusy, setRatingBusy] = useState("");
  const [error, setError] = useState("");

  const current = items[0] ?? null;
  const question = useMemo(() => (current ? normalizeQuestion(current) : null), [current]);
  const completed = Math.max(0, sessionTotal - items.length);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [due, reviewStats] = await Promise.all([
        apiGetDueReviews(token, 50),
        apiGetReviewStats(token),
      ]);
      const nextItems = Array.isArray(due) ? due : [];
      setItems(nextItems);
      setSessionTotal(nextItems.length);
      setStats(reviewStats);
      setSelected(nextItems[0]?.pendingFeedback?.selectedAnswer ?? "");
      setFeedback(nextItems[0]?.pendingFeedback ?? null);
    } catch (err) {
      setError(err.message || "Không tải được phiên ôn tập");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelected(current?.pendingFeedback?.selectedAnswer ?? "");
    setFeedback(current?.pendingFeedback ?? null);
    setError("");
  }, [current?.questionId, current?.pendingFeedback]);

  async function checkAnswer() {
    if (!current || !selected || feedback || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      setFeedback(await apiAnswerReview(token, current.questionId, selected));
    } catch (err) {
      setError(err.message || "Không thể kiểm tra đáp án");
    } finally {
      setSubmitting(false);
    }
  }

  const rate = useCallback(
    async (rating) => {
      if (!current || !feedback || ratingBusy) return;
      setRatingBusy(rating);
      setError("");
      try {
        const schedule = await apiRateReview(
          token,
          current.questionId,
          feedback.reviewAttemptId,
          rating,
        );
        setItems((previous) => previous.slice(1));
        setStats((previous) => ({
          ...previous,
          dueCount: Math.max(0, (previous?.dueCount ?? items.length) - 1),
          reviewedToday: (previous?.reviewedToday ?? 0) + 1,
          nextReview:
            !previous?.nextReview || new Date(schedule.nextReview) < new Date(previous.nextReview)
              ? schedule.nextReview
              : previous.nextReview,
        }));
      } catch (err) {
        setError(err.message || "Không thể lưu lịch ôn tiếp theo");
      } finally {
        setRatingBusy("");
      }
    },
    [current, feedback, items.length, ratingBusy, token],
  );

  useEffect(() => {
    if (!feedback) return undefined;
    function onKeyDown(event) {
      const rating = RATINGS[Number(event.key) - 1];
      if (rating) rate(rating.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feedback, rate]);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-4xl space-y-5 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <Link
        to="/student/exercises"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400"
      >
        <ArrowLeft size={16} />
        Danh sách bài
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Ôn tập thông minh
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Câu hỏi cần ôn hôm nay
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Trả lời trước, sau đó đánh giá mức độ ghi nhớ để hệ thống lên lịch phù hợp.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2">
            <Badge tone="blue">{stats?.dueCount ?? items.length} câu đến hạn</Badge>
            <Badge tone="emerald">{stats?.reviewedToday ?? 0} đã ôn hôm nay</Badge>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={3} className="h-24" />
      ) : error && !current ? (
        <ErrorBox message={error} onRetry={load} />
      ) : !current ? (
        <Card className="space-y-5 p-7 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles size={25} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              {sessionTotal > 0 ? "Hoàn thành phiên ôn tập" : "Chưa có câu nào đến hạn"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {sessionTotal > 0
                ? `Bạn đã xử lý ${sessionTotal} câu trong phiên này.`
                : "Các câu trả lời sai sẽ xuất hiện tại đây theo đúng lịch ôn."}
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                {stats?.reviewedToday ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đã ôn hôm nay</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatNextReview(stats?.nextReview)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lượt kế tiếp</p>
            </div>
          </div>
          <div>
            <Button as={Link} to="/student/exercises" variant="outline">
              Quay lại danh sách bài
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tiến độ phiên</span>
              <span className="font-mono">
                {completed + 1}/{sessionTotal}
              </span>
            </div>
            <ProgressBar value={sessionTotal ? (completed / sessionTotal) * 100 : 0} />
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Brain size={17} />
                  </span>
                  {question.skillName && <Badge skill={question.skillName}>{question.skillName}</Badge>}
                  {question.cefrLevel && <Badge tone="slate">{question.cefrLevel}</Badge>}
                  {current.quizTitle && <Badge tone="neutral">{current.quizTitle}</Badge>}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <RotateCcw size={14} />
                  Đã ôn {current.reviewCount ?? 0} lần
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <p className="text-base font-semibold leading-relaxed text-slate-950 dark:text-white">
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
                    onClick={() => setSelected(option.key)}
                    className={optionClass(option.key, selected, feedback)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-semibold">
                      {option.key}
                    </span>
                    <span className="min-w-0 flex-1">{option.text}</span>
                    {feedback && option.key === feedback.correctAnswer && (
                      <CheckCircle2 size={18} className="shrink-0" />
                    )}
                    {feedback && option.key === feedback.selectedAnswer && !feedback.isCorrect && (
                      <XCircle size={18} className="shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {!feedback && (
                <div className="flex justify-end">
                  <Button disabled={!selected || submitting} onClick={checkAnswer}>
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Kiểm tra đáp án
                  </Button>
                </div>
              )}

              {feedback && (
                <div
                  className={`rounded-xl border p-4 ${
                    feedback.isCorrect
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      : "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30"
                  }`}
                >
                  <p
                    className={`flex items-center gap-2 font-semibold ${
                      feedback.isCorrect
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {feedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {feedback.isCorrect
                      ? "Chính xác"
                      : `Chưa đúng — đáp án là ${feedback.correctAnswer}`}
                  </p>
                  {feedback.explanation && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">Giải thích: </span>
                      {feedback.explanation}
                    </p>
                  )}
                </div>
              )}

              {error && <ErrorBox message={error} />}
            </div>
          </Card>

          {feedback && (
            <Card className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950 dark:text-white">Bạn nhớ câu này thế nào?</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Lựa chọn của bạn quyết định thời điểm câu hỏi xuất hiện lại.
                  </p>
                </div>
                <Clock3 size={18} className="shrink-0 text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <button
                    key={rating.key}
                    type="button"
                    disabled={Boolean(ratingBusy)}
                    onClick={() => rate(rating.key)}
                    className={`rounded-xl border px-3 py-3 text-left transition disabled:cursor-wait disabled:opacity-60 ${rating.className}`}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      {rating.label}
                      {ratingBusy === rating.key ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <kbd className="rounded border border-current/20 px-1.5 py-0.5 font-mono text-[10px] opacity-70">
                          {rating.keyHint}
                        </kbd>
                      )}
                    </span>
                    <span className="mt-1 block text-xs opacity-80">{rating.interval}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
