import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, RotateCw, AlertCircle, Check } from "lucide-react";
import clsx from "clsx";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { apiAiChatQuiz } from "../../lib/quizApi";

/**
 * Panel trò chuyện với trợ lý AI soạn quiz (FR-13, UC-T06) — gọi backend
 * thật (không mock như TutorAiAssistant cũ). Nhận xét + bộ câu đề xuất của
 * AI được hiển thị ngay trong chat (thẻ câu hỏi đầy đủ) và đẩy lên cha qua
 * {@code onDrafts} để gộp vào form.
 *
 * Chat stateless phía client: mỗi lượt gửi kèm tối đa 10 tin gần nhất.
 * Timeout/ lỗi mạng → hiện nút "Thử lại" (UC-T06 bước 4a).
 *
 * Khi nhúng trong khung tab (cột phải của trang soạn quiz), nhận thêm:
 * - {@code render}: false → ẩn bằng display:none (VẪN mount, không unmount).
 *   Chuyển tab chat ⇄ hồ sơ kỹ năng không reset tin nhắn/draft và không gọi
 *   lại API; tab hiện là CSS toggle nên khung tab cao cố định, không xê dịch.
 * - {@code keepHeader}: ẩn header "Trợ lý AI" riêng (bỏ border dưới) vì tab
 *   bar của khung đã mang tiêu đề.
 * - {@code pendingQuestions}: trọn bộ câu hỏi đang có trên form gia sư — gửi
 *   kèm để AI nhìn thấy bài đang soạn (kể cả câu vừa gộp chưa lưu) và hiểu
 *   "câu số k" khi gia sư yêu cầu sửa. Không có trong DB nếu quiz chưa lưu.
 */
const MAX_RECENT = 10;

const ANSWER_LETTERS = ["A", "B", "C", "D"];

/** Gợi ý bắt đầu nhanh khi chat trống — click là gửi luôn. */
const QUICK_PROMPTS = [
  "Tạo 5 câu B1 thì quá khứ",
  "Đa dạng thêm kỹ năng",
  "Giảm độ khó các câu đang có",
];

/**
 * Thẻ một câu hỏi AI đề xuất — hiển thị đủ 4 lựa chọn và đánh dấu đáp án đúng
 * để gia sư kiểm chứng được ngay (không cần mở form).
 */
function AiQuestionCard({ question }) {
  const correct = question.correctAnswer || "A";
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {question.questionText || "…"}
      </p>

      <ul className="space-y-1">
        {ANSWER_LETTERS.map((letter) => {
          const text = question[`option${letter}`] || "";
          const isCorrect = letter === correct;
          return (
            <li
              key={letter}
              className={clsx(
                "flex items-start gap-2 rounded-lg border px-2 py-1 text-xs",
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"
              )}
            >
              <span className="mt-px shrink-0 font-semibold">{letter}.</span>
              <span className="min-w-0 flex-1 break-words">{text || "—"}</span>
              {isCorrect && (
                <span className="flex shrink-0 items-center gap-1 font-medium">
                  <Check size={12} /> Đúng
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="emerald">Đáp án {correct}</Badge>
        {question.cefrLevel && <Badge tone="blue">{question.cefrLevel}</Badge>}
        {question.skillCode && <Badge tone="violet">{question.skillCode}</Badge>}
        {question.index != null && (
          <Badge tone="amber">Thay câu {question.index}</Badge>
        )}
      </div>

      {question.explanation && (
        <p className="border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

export default function QuizAiAssistant({
  token,
  lessonId,
  quizId,
  pendingQuestions,
  onDrafts,
  render = true,
  keepHeader = false,
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Ref giữ bản `pendingQuestions` mới nhất — tránh re-render mỗi lần gia sư
  // gõ vào form, nhưng vẫn gửi được trạng thái form tại thời điểm bấm Gửi.
  const pendingRef = useRef(pendingQuestions);
  useEffect(() => {
    pendingRef.current = pendingQuestions;
  }, [pendingQuestions]);

  const recentMessages = useMemo(
    () =>
      messages
        .filter((m) => !m.error && m.text)
        .slice(-MAX_RECENT)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
    [messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text) {
    const trimmed = (text ?? "").trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setError("");
    setThinking(true);

    try {
      const pending = pendingRef.current;
      const res = await apiAiChatQuiz(token, lessonId, {
        message: trimmed,
        ...(quizId ? { quizId } : {}),
        ...(recentMessages.length ? { recentMessages } : {}),
        // Gửi kèm bài đang soạn để AI hiểu "câu số k" và không sinh câu trùng.
        ...(pending?.length ? { pendingQuestions: pending } : {}),
      });
      const hasDrafts = Array.isArray(res?.draftQuestions) && res.draftQuestions.length > 0;
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text:
          res?.reply ||
          (hasDrafts
            ? "Đã tạo bộ câu hỏi theo yêu cầu."
            : "AI chưa đề xuất câu mới — hãy mô tả cụ thể hơn (chủ điểm, độ khó, số câu)."),
        // Lưu lại để render thẻ câu hỏi đầy đủ ngay trong chat.
        questions: hasDrafts ? res.draftQuestions : [],
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (hasDrafts) {
        onDrafts?.(res.draftQuestions);
      }
    } catch (err) {
      // Timeout 60s / lỗi mạng / AI không khả dụng → cho phép thử lại (4a).
      setError(err?.message || "Dịch vụ AI đang không khả dụng.");
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: "",
          error: err?.message || "Dịch vụ AI đang không khả dụng. Vui lòng thử lại sau ít phút.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function handleSend() {
    send(draft);
  }

  function retry() {
    // Nhắn lại tin user gần nhất.
    const lastUser = [...messages].reverse().find((m) => m.role === "user" && !m.error);
    if (lastUser) send(lastUser.text);
    else setError("");
  }

  return (
    <div className={clsx("flex h-full min-h-0 flex-col", !render && "hidden")}>
      {/* Header */}
      {keepHeader ? null : (
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Bot size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Trợ lý AI</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Soạn &amp; sửa câu hỏi trắc nghiệm
            </p>
          </div>
        </div>
      )}

      {/* Message list */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-400 dark:border-slate-700">
              Mô tả yêu cầu để AI soạn câu hỏi. AI bám theo hồ sơ kỹ năng của học sinh.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.error ? (
            <div
              key={m.id}
              className="ml-auto max-w-[95%] rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm dark:border-rose-900/60 dark:bg-rose-950/40"
            >
              <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{m.error}</span>
              </div>
            </div>
          ) : (
            <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[92%]" : "max-w-[95%]"}>
              <div
                className={
                  m.role === "user"
                    ? "ml-auto rounded-xl bg-blue-600 px-3 py-2 text-sm text-white"
                    : "rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }
              >
                {m.text}
              </div>
              {/* Thẻ câu hỏi AI đề xuất — đủ 4 lựa chọn + đáp án đúng để
                  gia sư kiểm chứng ngay. Câu đã được gộp vào form (nếu quiz
                  còn nháp) nên không cần nút "Thêm vào bài" ở đây. */}
              {m.role === "assistant" && m.questions?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {m.questions.map((question, qi) => (
                    <AiQuestionCard key={qi} question={question} />
                  ))}
                </div>
              )}
            </div>
          )
        )}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" /> AI đang soạn (tối đa 60s)...
          </div>
        )}
        {error && !thinking && (
          <Button variant="secondary" size="sm" onClick={retry} className="mt-1">
            <RotateCw size={14} /> Thử lại
          </Button>
        )}
      </div>

      {/* Input */}
      <div className="space-y-1.5 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ví dụ: Nâng câu 3 lên B2..."
            rows={2}
            aria-label="Nhập yêu cầu cho trợ lý AI"
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
          />
          <Button size="sm" onClick={handleSend} disabled={thinking || !draft.trim()} className="shrink-0">
            <Send size={14} /> Gửi
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Enter để gửi · Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
