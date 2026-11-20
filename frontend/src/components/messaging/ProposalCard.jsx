import { useState } from "react";
import { AlertTriangle, CalendarDays, Check, ChevronDown, KeyRound, Loader2, Undo2, X } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import {
  CLASS_MODE_LABEL,
  CLASS_TYPE_LABEL,
  DAY_LABEL,
  PROPOSAL_STATUS,
  apiGetStudentAccount,
  formatTime,
  formatVnd,
} from "../../lib/messagingApi";

const formatDate = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "");

/**
 * Thẻ đề xuất lớp học trong khung chat. Dòng "Cho học sinh" nổi bật vì là điểm xác thực của phụ huynh
 * trước khi bấm Đồng ý.
 */
export default function ProposalCard({ proposal, viewer, token, onAccept, onReject, onWithdraw }) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [accountError, setAccountError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // "reject" | "withdraw"
  const [reason, setReason] = useState("");
  const status = PROPOSAL_STATUS[proposal.status] || { label: proposal.status, tone: "neutral" };
  const student = proposal.student;
  const pending = proposal.status === "PENDING";

  async function toggleDetails() {
    const next = !open;
    setOpen(next);
    if (next && viewer === "PARENT" && proposal.status === "ACCEPTED" && !account) {
      try {
        setAccount(await apiGetStudentAccount(proposal.id, token));
      } catch (e) {
        setAccountError(e.message);
      }
    }
  }

  async function run(action, ...args) {
    setBusy(true);
    try {
      await action(...args);
      setMode(null);
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-800/40 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">Đề xuất lớp học #{proposal.version}</p>
          <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
            Cho học sinh: {student.name}
            {student.grade ? <span className="font-normal text-slate-500 dark:text-slate-400"> ({student.grade})</span> : null}
          </p>
          {student.isNew && <p className="text-xs text-slate-500 dark:text-slate-400">Học sinh mới, hồ sơ sẽ được tạo khi bạn đồng ý</p>}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Học phí mỗi buổi</dt>
          <dd className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{formatVnd(proposal.pricePerSession)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Loại lớp</dt>
          <dd className="font-medium text-slate-900 dark:text-white">{CLASS_TYPE_LABEL[proposal.classType]}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Lịch học cố định</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5">
            {proposal.scheduleDays.map((day) => (
              <Badge key={day} tone="blue">{DAY_LABEL[day]}</Badge>
            ))}
            <span className="font-mono text-sm text-slate-700 dark:text-slate-200">
              {formatTime(proposal.scheduleTimeFrom)} – {formatTime(proposal.scheduleTimeTo)}
            </span>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Buổi dạy thử</dt>
          <dd className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <CalendarDays size={14} className="text-slate-400" />
            {formatDate(proposal.trialDate)}, {formatTime(proposal.trialTimeFrom)} – {formatTime(proposal.trialTimeTo)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Hình thức</dt>
          <dd className="text-slate-900 dark:text-white">{CLASS_MODE_LABEL[proposal.classMode]}</dd>
        </div>
        {proposal.note && (
          <div className="col-span-2">
            <dt className="text-xs text-slate-500 dark:text-slate-400">Ghi chú</dt>
            <dd className="text-slate-700 dark:text-slate-200">{proposal.note}</dd>
          </div>
        )}
      </dl>

      <button type="button" onClick={toggleDetails} aria-expanded={open}
        className="mt-3 flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
        {open ? "Ẩn chi tiết" : "Xem chi tiết"} <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <dl className="space-y-1.5">
            {[["Học sinh", student.name], ["Lớp", student.grade], ["Trường", student.school], ["Mục tiêu học", student.learningGoal],
              ["Gửi lúc", new Date(proposal.createdAt).toLocaleString("vi-VN")],
              ["Hết hạn", new Date(proposal.expiresAt).toLocaleString("vi-VN")],
              ...(proposal.decidedAt ? [["Phản hồi lúc", new Date(proposal.decidedAt).toLocaleString("vi-VN")]] : [])].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">{v || "Chưa cung cấp"}</dd>
              </div>
            ))}
          </dl>
          {viewer === "PARENT" && proposal.status === "ACCEPTED" && (
            <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <KeyRound size={14} /> Tài khoản đăng nhập của con
              </p>
              {accountError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{accountError}</p>}
              {!account && !accountError && <p className="text-xs text-slate-500">Đang tải...</p>}
              {account && (
                <dl className="space-y-1">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Tên đăng nhập</dt><dd className="font-mono font-medium text-slate-900 dark:text-white">{account.username}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Mật khẩu ban đầu</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-white">{account.passwordChanged ? "Con đã đổi mật khẩu" : account.initialPassword}</dd></div>
                  {!account.passwordChanged && <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">Con sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.</p>}
                </dl>
              )}
            </div>
          )}
        </div>
      )}

      {pending && proposal.studentConflict && viewer === "PARENT" && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Khung giờ này trùng lịch học hiện có của con.
        </p>
      )}
      {proposal.status === "REJECTED" && proposal.rejectionReason && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Lý do từ chối: {proposal.rejectionReason}</p>
      )}
      {proposal.status === "CANCELLED" && proposal.rejectionReason && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Lý do rút: {proposal.rejectionReason}</p>
      )}
      {proposal.status === "ACCEPTED" && (
        <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">Lớp học thử đã được tạo từ đề xuất này.</p>
      )}

      {pending && viewer === "PARENT" && mode === null && (
        <div className="mt-4 flex gap-2">
          <Button className="flex-1 cursor-pointer" disabled={busy} onClick={() => run(onAccept, proposal)}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Đồng ý
          </Button>
          <Button variant="outline" className="flex-1 cursor-pointer" disabled={busy} onClick={() => setMode("reject")}>
            <X size={16} /> Từ chối
          </Button>
        </div>
      )}
      {pending && viewer === "TUTOR" && mode === null && (
        <div className="mt-4">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setMode("withdraw")}>
            <Undo2 size={15} /> Rút đề xuất
          </Button>
        </div>
      )}
      {mode && (
        <div className="mt-4 space-y-2">
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={mode === "reject" ? "Lý do từ chối (không bắt buộc)" : "Lý do rút đề xuất (ít nhất 5 ký tự)"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setMode(null)} disabled={busy}>Hủy</Button>
            <Button
              variant="danger"
              size="sm"
              className="cursor-pointer"
              disabled={busy || (mode === "withdraw" && reason.trim().length < 5)}
              onClick={() => run(mode === "reject" ? onReject : onWithdraw, proposal, reason.trim())}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === "reject" ? "Xác nhận từ chối" : "Xác nhận rút"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
