import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, RotateCcw, XCircle } from "lucide-react";
import { apiGetReviewList } from "../../lib/studentApi";
import { normalizeQuestion } from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

function ReviewItem({ item }) {
  const [open, setOpen] = useState(false);
  const question = normalizeQuestion(item);
  const selected = item.selectedAnswer;
  const correct = item.correctAnswer;

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {question.skillName && <Badge skill={question.skillName}>{question.skillName}</Badge>}
            {item.quizTitle && <Badge tone="slate">{item.quizTitle}</Badge>}
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{question.content}</p>
        </div>
        <ChevronDown
          size={18}
          className={`mt-1 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
          {question.options.map((option) => {
            const isCorrect = option.key === correct;
            const isWrongPick = option.key === selected && !isCorrect;
            return (
              <div
                key={option.key}
                className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : isWrongPick
                      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400"
                      : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-semibold">
                  {option.key}
                </span>
                <span className="min-w-0 flex-1">{option.text}</span>
                {isCorrect && <CheckCircle2 size={16} className="shrink-0" />}
                {isWrongPick && <XCircle size={16} className="shrink-0" />}
              </div>
            );
          })}
          {item.explanation && (
            <p className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Giải thích: </span>
              {item.explanation}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** Danh sách ôn tập: các câu đã trả lời sai (API_DESIGN 3.7 — review-list). */
export default function SpacedRepetitionSession() {
  const { data, loading, error, retry } = useStudentData((token) => apiGetReviewList(token), []);
  const items = useMemo(() => (Array.isArray(data) ? data : (data?.content ?? [])), [data]);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-3xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <Link
        to="/student/exercises"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400"
      >
        <ArrowLeft size={16} />
        Danh sách bài
      </Link>
      <PageHeader
        className="mb-0"
        eyebrow="Ôn tập"
        title="Ôn lại câu đã sai"
        description={
          loading ? "Đang tải..." : `${items.length} câu cần xem lại. Bấm vào từng câu để xem đáp án và giải thích.`
        }
      />

      {loading ? (
        <SkeletonRows rows={4} className="h-16" />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="Chưa có câu nào cần ôn"
          description="Các câu bạn trả lời sai trong quiz sẽ được lưu tại đây."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ReviewItem key={item.questionId ?? item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
