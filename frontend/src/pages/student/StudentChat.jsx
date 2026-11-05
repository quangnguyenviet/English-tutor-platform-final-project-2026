import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Send, User, Wifi } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetMyTutors } from "../../lib/studentApi";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const CARD = "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const DIVIDE = "border-slate-200 dark:border-slate-800";

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "GS"
  );
}

export default function StudentChat() {
  const { token, session } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTutorId, setActiveTutorId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  const loadTutors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetMyTutors(token);
      const list = Array.isArray(data) ? data : data?.content ?? [];
      setTutors(list);
      if (list.length > 0) {
        setActiveTutorId((prev) => prev ?? list[0].tutorId);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách gia sư.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTutors();
  }, [loadTutors]);

  const activeTutor = tutors.find((t) => t.tutorId === activeTutorId) || tutors[0] || null;

  // Key lưu trữ tin nhắn theo học sinh và gia sư
  const storageKey = activeTutor
    ? `ep_chat_messages_${session?.id || session?.studentId || "student"}_${activeTutor.tutorId}`
    : null;

  // Load tin nhắn từ localStorage khi đổi activeTutor
  useEffect(() => {
    if (!storageKey || !activeTutor) {
      setMessages([]);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        const welcome = [
          {
            id: `sys-${Date.now()}`,
            sender: "system",
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            text: `Cuộc trò chuyện với Gia sư ${activeTutor.tutorName} (${activeTutor.className}).`,
          },
        ];
        setMessages(welcome);
        localStorage.setItem(storageKey, JSON.stringify(welcome));
      }
    } catch {
      setMessages([]);
    }
  }, [storageKey, activeTutor]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || !storageKey) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "student",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: inputMessage.trim(),
    };

    const nextList = [...messages, newMsg];
    setMessages(nextList);
    setInputMessage("");

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch {
      // Ignored
    }
  }

  return (
    <div className="space-y-4 pb-12">
      <PageHeader
        className="mb-0"
        eyebrow="Giao tiếp"
        title="Hộp thư"
        description="Trao đổi nhanh với gia sư của các lớp bạn đang theo học."
      />

      <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Hộp thư trao đổi nhanh với gia sư. Các ghi nhận bài giảng và bài tập được lưu trữ chính thức tại Lịch học.
        </p>
        <Link
          to="/student/schedule"
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-700 hover:underline dark:text-blue-300"
        >
          Đến lịch & nhật ký buổi học <ArrowRight size={13} />
        </Link>
      </div>

      {loading && <SkeletonRows rows={4} className="h-28" />}
      {!loading && error && <ErrorBox message={error} onRetry={loadTutors} />}

      {!loading && !error && tutors.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có cuộc trò chuyện nào"
          description="Khi bạn đăng ký và tham gia lớp học cùng gia sư, danh sách trao đổi sẽ xuất hiện tại đây."
          action={
            <Button as={Link} to="/student/marketplace" size="sm">
              Khám phá Gia sư
            </Button>
          }
        />
      )}

      {!loading && !error && tutors.length > 0 && (
        <div className={`flex h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden rounded-2xl border shadow-sm ${CARD}`}>
          {/* Cột trái: Danh sách gia sư của tôi */}
          <div className={`flex w-64 shrink-0 flex-col border-r md:w-72 ${DIVIDE}`}>
            <div className={`flex items-center justify-between border-b p-4 ${DIVIDE}`}>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gia sư của tôi</h2>
              <span className="font-mono text-xs text-slate-400">{tutors.length}</span>
            </div>

            <div className={`flex-1 divide-y overflow-y-auto ${DIVIDE}`}>
              {tutors.map((tutor) => {
                const isActive = tutor.tutorId === activeTutorId;
                return (
                  <button
                    key={tutor.classId || tutor.tutorId}
                    type="button"
                    onClick={() => setActiveTutorId(tutor.tutorId)}
                    className={`flex w-full cursor-pointer items-start gap-3 p-3.5 text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {getInitials(tutor.tutorName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {tutor.tutorName}
                        </p>
                      </div>

                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {tutor.className}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge tone={tutor.classStatus === "ACTIVE" ? "emerald" : "blue"} size="xs">
                          {tutor.classStatus === "ACTIVE" ? "Đang học" : tutor.classStatus || "Lớp học"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Cửa sổ chat */}
          <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
            {/* Thanh tiêu đề gia sư đang chat */}
            <div className={`flex items-center justify-between border-b px-4 py-3 ${CARD}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {getInitials(activeTutor?.tutorName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {activeTutor?.tutorName}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <Wifi size={10} strokeWidth={2} />
                      Sẵn sàng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lớp: {activeTutor?.className}
                  </p>
                </div>
              </div>

              <Button as={Link} to="/student/schedule" variant="outline" size="sm">
                Xem lịch lớp
                <ArrowRight size={13} />
              </Button>
            </div>

            {/* Luồng tin nhắn */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="mx-auto max-w-2xl space-y-3">
                {messages.map((msg) => {
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
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isStudent
                            ? "rounded-tr-sm bg-blue-600 text-white"
                            : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-0.5 px-1 font-mono text-[10px] text-slate-400">
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
              className={`flex items-center gap-2 border-t p-3 ${CARD}`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Nhắn cho Gia sư ${activeTutor?.tutorName || ""}...`}
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
      )}
    </div>
  );
}
