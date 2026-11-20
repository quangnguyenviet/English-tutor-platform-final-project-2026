import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import clsx from "clsx";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import ChatRoom from "../../components/messaging/ChatRoom";
import { useAuth } from "../../context/AuthContext";
import { apiGetRooms, subscribeChatEvents } from "../../lib/messagingApi";

const initialsOf = (name) =>
  (name || "?").trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();

const formatWhen = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

/**
 * Danh sách phòng chat + khung hội thoại cho phụ huynh và gia sư.
 * Một kết nối SSE duy nhất nhận sự kiện; mỗi lần mất kết nối rồi nối lại sẽ kéo lại bằng REST để bắt kịp.
 */
export default function MessagesPage({ viewer, basePath }) {
  const { token, session } = useAuth();
  const authToken = token || session?.token;
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState({ roomId: null, count: 0 });

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await apiGetRooms(authToken));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!authToken) return undefined;
    return subscribeChatEvents(authToken, {
      onEvent: (event) => {
        const changedRoom = event.data?.roomId ?? null;
        loadRooms();
        setTick((t) => ({ roomId: changedRoom, count: t.count + 1 }));
      },
      onReconnect: () => {
        loadRooms();
        setTick((t) => ({ roomId: null, count: t.count + 1 }));
      },
    });
  }, [authToken, loadRooms]);

  const activeId = roomId ? Number(roomId) : null;
  const refreshTick = tick.roomId === null || tick.roomId === activeId ? tick.count : 0;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tin nhắn"
        title="Trò chuyện"
        description={viewer === "PARENT"
          ? "Trao đổi với gia sư trên hệ thống. Thông tin liên hệ cá nhân được bảo vệ cho đến khi bạn đồng ý một đề xuất."
          : "Trao đổi với phụ huynh và gửi đề xuất lớp học."}
        actions={viewer === "PARENT" ? <Link to="/"><Button variant="outline" className="cursor-pointer"><ArrowLeft size={16} /> Quay lại</Button></Link> : undefined}
      />

      <div className="grid min-h-[560px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-[calc(100dvh-14rem)] lg:grid-cols-[320px_1fr]">
        <aside className={clsx("min-h-0 overflow-y-auto border-slate-200 dark:border-slate-800 lg:border-r", activeId && "hidden lg:block")}>
          {loading && <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>}
          {error && <p role="alert" className="p-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          {!loading && rooms.length === 0 && !error && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <MessageCircle className="mx-auto mb-2 text-slate-300" size={28} />
              {viewer === "PARENT" ? "Bạn chưa có cuộc trò chuyện nào. Hãy chọn một gia sư và bấm Nhắn tin." : "Chưa có phụ huynh nhắn tin cho bạn."}
            </div>
          )}
          <ul>
            {rooms.map((room) => (
              <li key={room.id}>
                <NavLink to={`${basePath}/${room.id}`}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors dark:border-slate-800",
                    isActive ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                  <Avatar initials={initialsOf(room.counterpart.fullName)} src={room.counterpart.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{room.counterpart.fullName}</p>
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">{formatWhen(room.lastMessageAt)}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{room.roomType === "APPLICATION" ? "Ứng viên từ tin đăng" : "Trực tiếp"}</span>
                      {room.pendingProposals > 0 && <Badge tone="amber" size="xs">Có đề xuất chờ</Badge>}
                      {!room.writable && <Badge tone="slate" size="xs">Đã khóa</Badge>}
                    </div>
                  </div>
                  {room.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white" aria-label={`${room.unread} tin chưa đọc`}>
                      {room.unread}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <section className={clsx("min-h-0", !activeId && "hidden lg:flex lg:items-center lg:justify-center")}>
          {activeId ? (
            <div className="flex h-full min-h-0 flex-col">
              <button type="button" onClick={() => navigate(basePath)} className="flex cursor-pointer items-center gap-1.5 border-b border-slate-200 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 lg:hidden">
                <ArrowLeft size={15} /> Danh sách trò chuyện
              </button>
              <div className="min-h-0 flex-1">
                <ChatRoom key={activeId} roomId={activeId} viewer={viewer} token={authToken} refreshTick={refreshTick} onChanged={loadRooms} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chọn một cuộc trò chuyện để bắt đầu.</p>
          )}
        </section>
      </div>
    </div>
  );
}
