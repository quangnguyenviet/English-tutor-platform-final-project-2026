import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Send, Wifi } from "lucide-react";
import { useStudentMatching } from "../../context/StudentMatchingContext";

/**
 * Hộp thư trao đổi với gia sư — liên kết từ Tổng quan và Lịch học.
 * Quy ước màu: học sinh gửi = blue-600, gia sư trả lời = slate trung tính.
 */

const CARD = "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const DIVIDE = "border-slate-200 dark:border-slate-800";

export default function StudentChat() {
  const {
    threadsList,
    activeTutorId,
    setActiveTutorId,
    selectedTutor,
    chatMessages,
    setChatMessages,
  } = useStudentMatching();

  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTutorId]);

  function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "student",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: inputMessage.trim(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <p>Hộp thư này là dữ liệu minh họa cho giai đoạn kết nối. Câu hỏi học tập và câu trả lời thật trong prototype được lưu theo từng buổi học.</p>
        <Link to="/student/schedule" className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-700 hover:underline dark:text-blue-300">Đến nhật ký buổi học <ArrowRight size={13} /></Link>
      </div>
    <div className={`flex h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border shadow-sm ${CARD}`}>
      {/* Cột trái: Danh sách cuộc trò chuyện với gia sư */}
      <div className={`flex w-64 shrink-0 flex-col border-r md:w-72 ${DIVIDE}`}>
        {/* Tiêu đề */}
        <div className={`flex items-center justify-between border-b p-4 ${DIVIDE}`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Hộp thư</h2>
          <span className="font-mono text-xs text-slate-400">{threadsList.length} cuộc trò chuyện</span>
        </div>

        {/* Danh sách gia sư */}
        <div className={`flex-1 divide-y overflow-y-auto ${DIVIDE}`}>
          {threadsList.map((thread) => {
            const isActive = thread.id === activeTutorId;
            const msgs = thread.chatMessages || [];
            const lastMsg = msgs[msgs.length - 1];

            return (
              <button
                key={thread.id}
                onClick={() => setActiveTutorId(thread.id)}
                className={`flex w-full cursor-pointer items-start gap-3 p-3.5 text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Initials Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {thread.tutor?.initials || "GS"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {thread.tutor?.name}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {lastMsg?.timestamp || ""}
                    </span>
                  </div>

                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {thread.tutor?.subject || thread.tutor?.specialization?.[0] || "Gia sư"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {lastMsg?.text || "Chưa có tin nhắn"}
                  </p>
                </div>
              </button>
            );
          })}

          {threadsList.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">Chưa có cuộc trò chuyện nào.</div>
          )}
        </div>
      </div>

      {/* Cột phải: Cửa sổ chat */}
      <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        {/* Thanh tiêu đề gia sư đang chat */}
        <div className={`flex items-center justify-between border-b px-4 py-3 ${CARD}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              {selectedTutor?.initials || "GS"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">{selectedTutor?.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <Wifi size={10} strokeWidth={2} />
                  Trực tuyến
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedTutor?.subject || selectedTutor?.specialization?.join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {/* Luồng tin nhắn */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {chatMessages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="py-1 text-center">
                    <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isStudent = msg.sender === "student";

              return (
                <div key={msg.id} className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isStudent
                        ? "rounded-tr-sm bg-blue-600 text-white"
                        : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-0.5 px-1 font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Khung soạn tin nhắn */}
        <form
          onSubmit={handleSendMessage}
          className={`flex items-center gap-2 border-t p-3 ${CARD}`}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Nhắn cho ${selectedTutor?.name || "gia sư"}...`}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Gửi</span>
            <Send size={13} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
