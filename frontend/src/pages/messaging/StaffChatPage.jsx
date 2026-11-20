import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, Loader2, ShieldAlert, X } from "lucide-react";
import clsx from "clsx";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import ChatRoom from "../../components/messaging/ChatRoom";
import { useAuth } from "../../context/AuthContext";
import {
  CLASS_TYPE_LABEL,
  apiAdminAddFeePolicy,
  apiStaffApprovePosting,
  apiStaffCancelTrialClass,
  apiStaffCompleteClass,
  apiStaffGetFeePolicies,
  apiStaffGetPiiEvents,
  apiStaffGetPostings,
  apiStaffGetRooms,
  apiStaffGetTrialClasses,
  apiStaffRejectPosting,
  apiStaffReviewPiiEvent,
  purposeLabel,
} from "../../lib/messagingApi";

const TABS = [
  { key: "postings", label: "Tin đăng" },
  { key: "rooms", label: "Phòng chat" },
  { key: "pii", label: "Kiểm duyệt" },
  { key: "trials", label: "Lớp dạy thử" },
  { key: "fees", label: "Bảng phí" },
];

const dateTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour12: false }) : "");
const POSTING_STATUS = { NEW: { label: "Chờ duyệt", tone: "amber" }, OPEN: { label: "Đang nhận ứng tuyển", tone: "blue" } };

function useLoader(fetcher, deps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetcher());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, error, reload };
}

function Empty({ loading, error, count, text }) {
  if (loading) return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>;
  if (error) return <p role="alert" className="p-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (count === 0) return <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{text}</p>;
  return null;
}

function PostingsTab({ token }) {
  const { data, loading, error, reload } = useLoader(() => apiStaffGetPostings(token), [token]);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  async function act(fn, id) {
    setBusy(id);
    setMsg("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card padded={false}>
      <Empty loading={loading} error={error} count={data.length} text="Không có tin đăng nào cần xử lý." />
      {msg && <p role="alert" className="p-4 text-sm text-rose-600 dark:text-rose-400">{msg}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500">#{p.id}</span>
                <Badge tone={POSTING_STATUS[p.status]?.tone}>{POSTING_STATUS[p.status]?.label || p.status}</Badge>
                {p.status === "OPEN" && <span className="text-xs text-slate-500">{p.applicantCount} ứng viên</span>}
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.parentName} · <span className="font-mono font-normal">{p.parentPhone}</span></p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{purposeLabel(p.purpose)} · {[p.district, p.province].filter(Boolean).join(", ")} · {dateTime(p.createdAt)}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{p.note}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {p.status === "NEW" && (
                <Button size="sm" className="cursor-pointer" disabled={busy === p.id} onClick={() => act(() => apiStaffApprovePosting(p.id, token), p.id)}>
                  <CheckCircle2 size={15} /> Duyệt
                </Button>
              )}
              <Button size="sm" variant="outline" className="cursor-pointer" disabled={busy === p.id} onClick={() => {
                const reason = window.prompt("Lý do hủy tin (phụ huynh sẽ nhận được thông báo):");
                if (reason && reason.trim()) act(() => apiStaffRejectPosting(p.id, reason.trim(), token), p.id);
              }}>
                <X size={15} /> {p.status === "NEW" ? "Từ chối" : "Đóng tin"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RoomsTab({ token }) {
  const [roomType, setRoomType] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const { data, loading, error } = useLoader(() => apiStaffGetRooms(token, { roomType, hasPending: pendingOnly }), [token, roomType, pendingOnly]);
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} aria-label="Loại phòng"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Tất cả loại phòng</option>
          <option value="DIRECT">Nhắn tin trực tiếp</option>
          <option value="APPLICATION">Từ tin đăng</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" className="accent-blue-600" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} /> Có đề xuất đang chờ
        </label>
      </div>
      <Card padded={false}>
        <Empty loading={loading} error={error} count={data.length} text="Chưa có phòng chat nào." />
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.parentName} ↔ {r.tutorName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {r.roomType === "APPLICATION" ? `Từ tin #${r.classRequestId}` : "Trực tiếp"} · Tin cuối {dateTime(r.lastMessageAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.pendingProposals > 0 && <Badge tone="amber">{r.pendingProposals} đề xuất chờ</Badge>}
                {r.acceptedProposals > 0 && <Badge tone="emerald">{r.acceptedProposals} đã đồng ý</Badge>}
                {r.piiBlockedCount > 0 && <Badge tone="rose">{r.piiBlockedCount} tin bị chặn</Badge>}
                <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setOpen(r)}><Eye size={15} /> Xem hội thoại</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button type="button" onClick={() => setOpen(null)} aria-label="Đóng" className="absolute right-3 top-3 z-10 cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            <ChatRoom roomId={open.id} viewer="STAFF" token={token} />
          </div>
        </div>
      )}
    </div>
  );
}

function PiiTab({ token }) {
  const [type, setType] = useState("");
  const { data, loading, error, reload } = useLoader(() => apiStaffGetPiiEvents(token, { type }), [token, type]);
  const [busy, setBusy] = useState(null);

  async function review(event) {
    const note = window.prompt("Ghi chú xem xét (tin bị chặn sẽ không được công khai lại):", "");
    if (note === null) return;
    setBusy(event.id);
    try {
      await apiStaffReviewPiiEvent(event.id, note, token);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Loại sự kiện"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Tất cả sự kiện</option>
        <option value="PII_BLOCKED">Tin bị chặn</option>
        <option value="PHONE_UNLOCKED">Mở khóa số điện thoại</option>
      </select>
      <Card padded={false}>
        <Empty loading={loading} error={error} count={data.length} text="Chưa có sự kiện kiểm duyệt nào." />
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {e.type === "PII_BLOCKED" ? <Badge tone="rose"><ShieldAlert size={12} /> Tin bị chặn</Badge> : <Badge tone="emerald">Mở khóa SĐT</Badge>}
                  <span className="text-xs text-slate-500">Phòng #{e.roomId} · {e.senderName || "Hệ thống"} · {dateTime(e.createdAt)}</span>
                </div>
                {e.blockedText && <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">{e.blockedText}</p>}
                {e.reviewedAt && <p className="text-xs text-slate-500">Đã xem xét bởi {e.reviewedByName}: {e.reviewNote || "không có ghi chú"}</p>}
              </div>
              {e.type === "PII_BLOCKED" && !e.reviewedAt && (
                <Button size="sm" variant="outline" className="cursor-pointer" disabled={busy === e.id} onClick={() => review(e)}>Đã xem xét</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function TrialsTab({ token }) {
  const { data, loading, error, reload } = useLoader(() => apiStaffGetTrialClasses(token), [token]);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  async function run(id, fn) {
    setBusy(id);
    setMsg("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card padded={false}>
      <Empty loading={loading} error={error} count={data.length} text="Không có lớp dạy thử nào từ chat đang chờ xác nhận." />
      {msg && <p role="alert" className="p-4 text-sm text-rose-600 dark:text-rose-400">{msg}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((c) => (
          <li key={c.classId} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.studentName} · Gia sư {c.tutorName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phụ huynh {c.parentName} · {CLASS_TYPE_LABEL[c.classType]} · Dạy thử {c.trialDate} · {c.classRequestId ? `Từ tin #${c.classRequestId}` : "Nhắn tin trực tiếp"}
              </p>
            </div>
            {!c.classRequestId ? (
              <div className="flex gap-2">
                <Button size="sm" className="cursor-pointer" disabled={busy === c.classId} onClick={() => run(c.classId, () => apiStaffCompleteClass(c.classId, token))}>
                  <CheckCircle2 size={15} /> Xác nhận chính thức
                </Button>
                <Button size="sm" variant="outline" className="cursor-pointer" disabled={busy === c.classId} onClick={() => {
                  const reason = window.prompt("Lý do dạy thử không thành công:");
                  if (reason && reason.trim()) run(c.classId, () => apiStaffCancelTrialClass(c.classId, reason.trim(), token));
                }}>Hủy dạy thử</Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Xử lý tại mục Lớp cần gia sư</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FeesTab({ token, isAdmin }) {
  const { data, loading, error, reload } = useLoader(() => apiStaffGetFeePolicies(token), [token]);
  const [classType, setClassType] = useState("SHORT_TERM");
  const [percent, setPercent] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await apiAdminAddFeePolicy(classType, Number(percent), token);
      setPercent("");
      await reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm font-medium text-slate-900 dark:text-white">Loại lớp
              <select value={classType} onChange={(e) => setClassType(e.target.value)} className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                {Object.entries(CLASS_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-900 dark:text-white">Tỷ lệ phí (%)
              <input value={percent} onChange={(e) => setPercent(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="0 – 50"
                className="block w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <Button type="submit" className="cursor-pointer" disabled={!percent || saving}>{saving && <Loader2 size={15} className="animate-spin" />} Thêm cấu hình mới</Button>
          </form>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Cấu hình mới có hiệu lực ngay cho các đề xuất tạo sau đó; dòng cũ được giữ làm lịch sử.</p>
          {msg && <p role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">{msg}</p>}
        </Card>
      )}
      <Card padded={false}>
        <Empty loading={loading} error={error} count={data.length} text="Chưa có cấu hình phí." />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
            <tr><th className="p-4">Loại lớp</th><th className="p-4">Tỷ lệ</th><th className="p-4">Hiệu lực từ</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((p, i) => (
              <tr key={p.id} className={clsx(i === data.findIndex((x) => x.classType === p.classType) && "font-semibold")}>
                <td className="p-4 text-slate-900 dark:text-white">{CLASS_TYPE_LABEL[p.classType]}</td>
                <td className="p-4 font-mono text-slate-900 dark:text-white">{p.feePercentage}%</td>
                <td className="p-4 font-mono text-xs text-slate-500">{dateTime(p.effectiveFrom)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** Màn Lễ tân/Admin: duyệt tin đăng, xem hội thoại chỉ đọc, log kiểm duyệt, lớp dạy thử từ chat, bảng phí. */
export default function StaffChatPage() {
  const { token, session } = useAuth();
  const authToken = token || session?.token;
  const [tab, setTab] = useState("postings");
  const isAdmin = session?.role === "admin";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader eyebrow="Nhắn tin" title="Tin nhắn & tin đăng" description="Duyệt tin tìm gia sư, theo dõi hội thoại phụ huynh - gia sư và xử lý kiểm duyệt. Hội thoại chỉ được xem, không thể gửi tin." />
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={clsx("cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white")}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "postings" && <PostingsTab token={authToken} />}
      {tab === "rooms" && <RoomsTab token={authToken} />}
      {tab === "pii" && <PiiTab token={authToken} />}
      {tab === "trials" && <TrialsTab token={authToken} />}
      {tab === "fees" && <FeesTab token={authToken} isAdmin={isAdmin} />}
    </div>
  );
}
