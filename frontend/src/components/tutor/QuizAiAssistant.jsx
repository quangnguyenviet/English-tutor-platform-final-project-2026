import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, RotateCw, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import { apiAiChatQuiz } from "../../lib/quizApi";

/**
 * Panel trò chuyện với trợ lý AI soạn quiz (FR-13, UC-T06) — gọi backend
 * thật (không mock như TutorAiAssistant cũ). Nhận xét + bộ câu đề xuất của
 * AI được đẩy lên cha qua {@code onDrafts} để gộp vào form.
 *
 * Chat stateless phía client: mỗi lượt gửi kèm tối đa 10 tin gần nhất.
 * Timeout/ lỗi mạng → hiện nút "Thử lại" (UC-T06 bước 4a).
 */
const MAX_RECENT = 10;

export default function QuizAiAssistant({ token, lessonId, quizId, onDrafts }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

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
      const res = await apiAiChatQuiz(token, lessonId, {
        message: trimmed,
        ...(quizId ? { quizId } : {}),
        ...(recentMessages.length ? { recentMessages } : {}),
      });
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: res?.reply || "Đã tạo bộ câu hỏi theo yêu cầu.",
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (Array.isArray(res?.draftQuestions) && res.draftQuestions.length > 0) {
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
    <div className="flex h-full flex-col">
      {/* Header */}
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

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-400 dark:border-slate-700">
            Mô tả yêu cầu để AI soạn câu hỏi, ví dụ "Tạo 5 câu tập trung thì quá khứ, độ khó
            B1". AI bám theo hồ sơ kỹ năng của học sinh.
          </p>
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
      <div className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
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
          className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
        />
        <Button size="sm" onClick={handleSend} disabled={thinking || !draft.trim()} className="shrink-0">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
