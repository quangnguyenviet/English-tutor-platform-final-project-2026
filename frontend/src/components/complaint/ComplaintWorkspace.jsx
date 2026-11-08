import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Clock, Plus, Search, Wallet, XCircle } from "lucide-react";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import StatCard from "../ui/StatCard";
import { PaymentListSkeleton, StatRowSkeleton } from "../payment/PaymentSkeleton";
import { apiGetComplaintCounts, apiGetComplaints } from "../../lib/complaintApi";
import {
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_META,
  COMPLAINT_TABS,
  OUTCOME_META,
  ROLE_LABEL,
  TYPE_META,
  formatDateTime,
  metaOf,
} from "../../lib/complaintModel";
import ComplaintDetailModal from "./ComplaintDetailModal";
import ComplaintFormModal from "./ComplaintFormModal";

const PAGE_SIZE = 10;

function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ComplaintRow({ complaint, onOpen }) {
  const status = metaOf(COMPLAINT_STATUS_META, complaint.status);
  const type = metaOf(TYPE_META, complaint.complaintType);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{complaint.complaintCode}</span>
          <Badge tone={type.tone} size="xs">{type.label}</Badge>
          {complaint.requestOutcome && (
            <Badge tone={metaOf(OUTCOME_META, complaint.requestOutcome).tone} size="xs">
              {metaOf(OUTCOME_META, complaint.requestOutcome).label}
            </Badge>
          )}
          {complaint.status === COMPLAINT_STATUS.PENDING && complaint.latestRefundStatus === "REJECTED" && (
            <Badge tone="rose" size="xs">Kế toán từ chối</Badge>
          )}
        </div>
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {complaint.complainantName}
          <span className="font-normal text-slate-500 dark:text-slate-400">
            {" "}· {ROLE_LABEL[complaint.complainantRole] || complaint.complainantRole}
          </span>
        </p>
        <p className="line-clamp-1 text-sm text-slate-600 dark:text-slate-300">{complaint.complaintContent}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">{complaint.requestCode}</span>
          {complaint.studentName ? ` · HS ${complaint.studentName}` : ""}
          {" · "}
          {formatDateTime(complaint.createdAt)} · {complaint.receivedByName}
        </p>
      </div>
      <Badge tone={status.tone} className="self-start sm:self-center">{status.label}</Badge>
    </button>
  );
}

/**
 * Trang xử lý khiếu nại dùng chung cho Lễ tân và Admin (UC-REC-14/15/16, UC-ADM-13/14/15).
 * Tải lại khi quay lại tab trình duyệt để thấy trạng thái Kế toán vừa cập nhật.
 */
export default function ComplaintWorkspace({ eyebrow = "Vận hành", canManage = true }) {
  const [tab, setTab] = useState(COMPLAINT_STATUS.PENDING);
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounced(keyword);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    setPage(0);
  }, [tab, type, debouncedKeyword]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    apiGetComplaints({ status: tab, type: type || undefined, keyword: debouncedKeyword, page, size: PAGE_SIZE })
      .then((result) => alive && setData(result))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, type, debouncedKeyword, page, version]);

  useEffect(() => {
    let alive = true;
    apiGetComplaintCounts()
      .then((result) => alive && setCounts(result))
      .catch(() => alive && setCounts(null));
    return () => {
      alive = false;
    };
  }, [version]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const items = data?.items || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow={eyebrow}
        title="Xử lý khiếu nại"
        description="Tiếp nhận khiếu nại tại quầy, giải quyết hủy lớp hoặc ghép lại, chuyển yêu cầu hoàn tiền cho Kế toán."
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)} className="cursor-pointer">
              <Plus size={16} />
              Tạo đơn
            </Button>
          )
        }
      />

      {counts ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Clock} label="Chờ xử lý" value={counts.PENDING ?? 0} tone="amber" />
          <StatCard icon={Wallet} label="Chờ hoàn tiền" value={counts.PROCESSING ?? 0} tone="blue" />
          <StatCard icon={CheckCircle} label="Đã xử lý" value={counts.RESOLVED ?? 0} tone="emerald" />
          <StatCard icon={XCircle} label="Đã hủy" value={counts.CANCELLED ?? 0} tone="slate" />
        </div>
      ) : (
        <StatRowSkeleton />
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
          {COMPLAINT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98]",
                tab === t.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {t.label}
              {counts && (
                <span
                  className={clsx(
                    "rounded-full px-1.5 font-mono text-xs",
                    tab === t.key ? "bg-white/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {counts[t.key] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Tất cả loại</option>
            <option value="NON_REFUND">Không hoàn tiền</option>
            <option value="REFUND">Hoàn tiền</option>
          </select>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Mã KN, người khiếu nại, học sinh, mã lớp"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <Card padded={false}>
        {loading && !data ? (
          <PaymentListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle size={20} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
            <Button variant="outline" size="sm" onClick={reload} className="cursor-pointer">
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có khiếu nại nào.</p>
        ) : (
          <div className={clsx("divide-y divide-slate-200 dark:divide-slate-800", loading && "opacity-60")}>
            {items.map((complaint) => (
              <ComplaintRow key={complaint.id} complaint={complaint} onOpen={() => setOpenId(complaint.id)} />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Trang <span className="font-mono">{page + 1}</span>/<span className="font-mono">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="cursor-pointer">
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {openId && (
        <ComplaintDetailModal
          complaintId={openId}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onChanged={reload}
        />
      )}
      {creating && (
        <ComplaintFormModal
          open
          onClose={() => setCreating(false)}
          onSaved={(result) => {
            setCreating(false);
            setTab(COMPLAINT_STATUS.PENDING);
            reload();
            if (result?.complaint?.id) setOpenId(result.complaint.id);
          }}
        />
      )}
    </div>
  );
}
