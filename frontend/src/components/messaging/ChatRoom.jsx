import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronUp, Loader2, Send } from "lucide-react";
import clsx from "clsx";
import Button from "../ui/Button";
import ProposalCard from "./ProposalCard";
import ProposalForm from "./ProposalForm";
import ProposalListModal from "./ProposalListModal";
import ChatRoomHeader from "./ChatRoomHeader";
import {
  apiAcceptProposal,
  apiCheckMessage,
  apiGetMessages,
  apiGetRoom,
  apiMarkRoomRead,
  apiRejectProposal,
  apiSendMessage,
  apiWithdrawProposal,
} from "../../lib/messagingApi";

const formatClock = (iso) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "");

/** Cắt nội dung thành các đoạn thường/vi phạm để tô đỏ phần bị chặn. */
function highlight(text, violations) {
  const spans = [...violations].sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;
  for (const v of spans) {
    if (v.start < cursor) continue;
    if (v.start > cursor) parts.push({ text: text.slice(cursor, v.start), bad: false });
    parts.push({ text: text.slice(v.start, v.end), bad: true });
    cursor = v.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), bad: false });
  return parts;
}

/**
 * Phòng chat dùng chung cho phụ huynh, gia sư và nhân viên (chỉ đọc).
 * `refreshTick` tăng lên mỗi khi backend báo có tin/đề xuất mới trong phòng này.
 */
export default function ChatRoom({ roomId, viewer, token, refreshTick = 0, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [violations, setViolations] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showProposalList, setShowProposalList] = useState(false);
  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  const readOnly = viewer === "STAFF";
  const room = detail?.room;
  const writable = !readOnly && room?.writable;

  const mergeLatest = useCallback((items) => {
    setMessages((previous) => {
      const byId = new Map(previous.map((m) => [m.id, m]));
      items.forEach((m) => byId.set(m.id, m));
      return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [roomDetail, page] = await Promise.all([apiGetRoom(roomId, token), apiGetMessages(roomId, { token })]);
      setDetail(roomDetail);
      setMessages(page.items);
      setNextCursor(page.nextCursor);
      setError("");
      if (!readOnly) apiMarkRoomRead(roomId, token).then(() => onChanged?.()).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [roomId, token, readOnly, onChanged]);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setMessages([]);
    loadAll();
  }, [loadAll]);

  // Có sự kiện realtime hoặc vừa kết nối lại: kéo tin mới nhất bằng REST để bắt kịp.
  useEffect(() => {
    if (refreshTick === 0) return;
    Promise.all([apiGetRoom(roomId, token), apiGetMessages(roomId, { token })])
      .then(([roomDetail, page]) => {
        setDetail(roomDetail);
        mergeLatest(page.items);
        if (!readOnly) apiMarkRoomRead(roomId, token).then(() => onChanged?.()).catch(() => {});
      })
      .catch(() => {});
  }, [refreshTick, roomId, token, mergeLatest, readOnly, onChanged]);

  // Chỉ cuộn khung tin nhắn; scrollIntoView sẽ kéo theo cả trang làm trôi phần đầu phòng chat.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Kiểm tra PII khi đang gõ để tô đỏ phần vi phạm trước khi gửi.
  useEffect(() => {
    if (!writable || !draft.trim()) {
      setViolations([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      apiCheckMessage(roomId, draft, token)
        .then((result) => setViolations(result.violations || []))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, roomId, token, writable]);

  async function loadOlder() {
    if (!nextCursor) return;
    setLoadingOlder(true);
    stickToBottom.current = false;
    try {
      const page = await apiGetMessages(roomId, { before: nextCursor, token });
      mergeLatest(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!draft.trim() || sending || violations.length > 0) return;
    setSending(true);
    setSendError("");
    try {
      const item = await apiSendMessage(roomId, draft.trim(), token);
      stickToBottom.current = true;
      mergeLatest([item]);
      setDraft("");
      setViolations([]);
      onChanged?.();
    } catch (err) {
      if (err.status === 422 && Array.isArray(err.result)) setViolations(err.result);
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(proposal) {
    try {
      await apiAcceptProposal(proposal.id, token);
      await loadAll();
      onChanged?.();
    } catch (err) {
      setError(err.message);
      await loadAll();
      throw err;
    }
  }

  async function handleReject(proposal, reason) {
    await apiRejectProposal(proposal.id, reason || null, token);
    await loadAll();
  }

  async function handleWithdraw(proposal, reason) {
    await apiWithdrawProposal(proposal.id, reason, token);
    await loadAll();
  }

  const parts = useMemo(() => highlight(draft, violations), [draft, violations]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" /> Đang tải cuộc trò chuyện...</div>;
  }
  if (!detail) {
    return <div className="p-6 text-sm text-rose-600 dark:text-rose-400" role="alert">{error || "Không tìm thấy phòng chat."}</div>;
  }

  const parentInfo = detail.parent;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatRoomHeader detail={detail} viewer={viewer}
        onCreateProposal={() => setShowProposalForm(true)} onShowProposals={() => setShowProposalList(true)} />

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}>
        {/* Luôn cao hơn khung 1px để overscroll-contain có tác dụng cả khi ít tin nhắn. */}
        <div className="min-h-[calc(100%+1px)] space-y-3">
        {nextCursor && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? <Loader2 size={14} className="animate-spin" /> : <ChevronUp size={14} />} Xem tin cũ hơn
            </Button>
          </div>
        )}
        {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>}
        {messages.map((m) => {
          if (m.type === "SYSTEM") {
            return <p key={m.id} className="text-center text-xs text-slate-500 dark:text-slate-400">{m.text}</p>;
          }
          const fromTutor = m.senderRole === "TUTOR";
          if (m.type === "PROPOSAL" && m.proposal) {
            return (
              <div key={m.id} className="flex justify-end">
                <ProposalCard proposal={m.proposal} viewer={viewer} token={token} onAccept={handleAccept} onReject={handleReject} onWithdraw={handleWithdraw} />
              </div>
            );
          }
          return (
            <div key={m.id} className={clsx("flex", fromTutor ? "justify-end" : "justify-start")}>
              <div className={clsx("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                fromTutor
                  ? "bg-blue-50 text-slate-900 dark:bg-blue-950/40 dark:text-slate-100"
                  : "border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100")}>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className="mt-1 text-right font-mono text-[10px] text-slate-400">{formatClock(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {error && <p role="alert" className="px-4 pb-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {writable && (
        <form onSubmit={send} className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          {violations.length > 0 && (
            <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-sm dark:border-rose-800/40 dark:bg-rose-950/40" role="alert">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                <AlertTriangle size={13} /> Bị chặn theo chính sách bảo mật: không chia sẻ số điện thoại, email hoặc liên kết mạng xã hội.
              </p>
              <p className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                {parts.map((part, i) => part.bad
                  ? <mark key={i} className="rounded bg-rose-200 px-0.5 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">{part.text}</mark>
                  : <span key={i}>{part.text}</span>)}
              </p>
            </div>
          )}
          {sendError && violations.length === 0 && <p className="mb-2 text-xs text-rose-600 dark:text-rose-400" role="alert">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <Button type="submit" className="cursor-pointer" disabled={!draft.trim() || sending || violations.length > 0} aria-label="Gửi tin nhắn">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </form>
      )}

      {showProposalList && (
        <ProposalListModal roomId={roomId} viewer={viewer} token={token} refreshTick={refreshTick}
          onAccept={handleAccept} onReject={handleReject} onWithdraw={handleWithdraw}
          onClose={() => setShowProposalList(false)} />
      )}

      {showProposalForm && (
        <ProposalForm
          roomId={roomId}
          token={token}
          childrenOfParent={parentInfo?.children || []}
          onClose={() => setShowProposalForm(false)}
          onCreated={() => {
            setShowProposalForm(false);
            loadAll();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
