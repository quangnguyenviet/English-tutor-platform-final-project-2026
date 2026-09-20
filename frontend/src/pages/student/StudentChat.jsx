import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useStudentMatching } from "../../context/StudentMatchingContext";

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

    // Giả lập gia sư phản hồi tự động
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: "tutor",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          text: `Gia sư ${selectedTutor?.name || ""} đã nhận được tin nhắn và sẽ phản hồi sớm nhé!`,
        },
      ]);
    }, 1200);
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Cột trái: Danh sách cuộc trò chuyện với gia sư */}
      <div className="flex w-64 md:w-72 flex-col border-r border-border bg-card shrink-0">
        {/* Tiêu đề */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Hộp thư</h2>
          <span className="text-xs text-muted-foreground">{threadsList.length} cuộc trò chuyện</span>
        </div>

        {/* Danh sách gia sư */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {threadsList.map((thread) => {
            const isActive = thread.id === activeTutorId;
            const msgs = thread.chatMessages || [];
            const lastMsg = msgs[msgs.length - 1];

            return (
              <button
                key={thread.id}
                onClick={() => setActiveTutorId(thread.id)}
                className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                  isActive ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                {/* Initials Avatar đơn giản */}
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center font-medium text-xs text-foreground shrink-0">
                  {thread.tutor?.initials || "GS"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`truncate text-xs font-semibold ${isActive ? "text-foreground" : "text-foreground/90"}`}>
                      {thread.tutor?.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {lastMsg?.timestamp || ""}
                    </span>
                  </div>

                  <p className="truncate text-[11px] text-muted-foreground">
                    {thread.tutor?.subject || thread.tutor?.specialization?.[0] || "Gia sư"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
                    {lastMsg?.text || "Chưa có tin nhắn"}
                  </p>
                </div>
              </button>
            );
          })}

          {threadsList.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Chưa có cuộc trò chuyện nào.
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Cửa sổ chat */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Thanh tiêu đề gia sư đang chat */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-medium text-xs text-foreground shrink-0">
              {selectedTutor?.initials || "GS"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-foreground">{selectedTutor?.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Trực tuyến
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedTutor?.subject || selectedTutor?.specialization?.join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {/* Luồng tin nhắn */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="max-w-2xl mx-auto space-y-3">
            {chatMessages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="py-1 text-center">
                    <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isStudent = msg.sender === "student";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isStudent
                        ? "bg-foreground text-background rounded-tr-xs"
                        : "bg-muted text-foreground border border-border/70 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Khung soạn tin nhắn */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Nhắn cho ${selectedTutor?.name || "gia sư"}...`}
            className="flex-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>Gửi</span>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
