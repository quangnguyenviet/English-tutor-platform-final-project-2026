import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import ProposalCard from "./ProposalCard";
import { PROPOSAL_STATUS, apiGetProposals } from "../../lib/messagingApi";

const FILTERS = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"];

/** Danh sách đề xuất đã tạo trong phòng chat, lọc theo trạng thái; thao tác được ngay trên từng thẻ. */
export default function ProposalListModal({ roomId, viewer, token, refreshTick, onAccept, onReject, onWithdraw, onClose }) {
  const [proposals, setProposals] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setProposals(await apiGetProposals(roomId, token));
    } catch (e) {
      setError(e.message);
      setProposals((previous) => previous || []);
    }
  }, [roomId, token]);

  useEffect(() => {
    load();
  }, [load, refreshTick]);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const withReload = (action) => async (...args) => {
    setError("");
    try {
      await action(...args);
    } catch (e) {
      setError(e.message);
    } finally {
      await load();
    }
  };

  const countOf = (status) => (proposals || []).filter((p) => p.status === status).length;
  const visible = (proposals || []).filter((p) => filter === "ALL" || p.status === filter);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Đề xuất trong cuộc trò chuyện" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Đề xuất trong cuộc trò chuyện</h2>
            <button type="button" onClick={onClose} aria-label="Đóng"
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Trạng thái
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="ALL">Tất cả ({proposals?.length || 0})</option>
              {FILTERS.map((status) => (
                <option key={status} value={status}>{PROPOSAL_STATUS[status].label} ({countOf(status)})</option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          {proposals === null && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang tải...</p>
          )}
          {proposals !== null && visible.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Không có đề xuất nào ở trạng thái này.</p>
          )}
          {visible.map((proposal) => (
            <div key={proposal.id} className="flex justify-center">
              <ProposalCard proposal={proposal} viewer={viewer} token={token}
                onAccept={withReload(onAccept)} onReject={withReload(onReject)} onWithdraw={withReload(onWithdraw)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
