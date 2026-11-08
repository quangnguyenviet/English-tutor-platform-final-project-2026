import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import { PaymentListSkeleton, StatRowSkeleton } from "../../components/payment/PaymentSkeleton";
import RefundProcessModal from "../../components/complaint/RefundProcessModal";
import { useAuth } from "../../context/AuthContext";
import { apiGetRefundCounts, apiGetRefunds } from "../../lib/complaintApi";
import {
  REFUND_STATUS,
  REFUND_STATUS_META,
  REFUND_TABS,
  formatDateTime,
  formatVnd,
  metaOf,
} from "../../lib/complaintModel";

const PAGE_SIZE = 10;

/** Xử lý yêu cầu hoàn tiền, dùng cho Kế toán (/accountant/refunds) và Admin (/admin/refunds). */
export default function AccountantRefunds() {
  const { session } = useAuth();
  const [tab, setTab] = useState(REFUND_STATUS.PENDING);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [openId, setOpenId] = useState(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => setPage(0), [tab]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    apiGetRefunds({ tab, page, size: PAGE_SIZE })
      .then((r) => alive && setData(r))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    apiGetRefundCounts()
      .then((r) => alive && setCounts(r))
      .catch(() => alive && setCounts(null));
    return () => {
      alive = false;
    };
  }, [tab, page, version]);

  const items = data?.items || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tài chính"
        title="Xử lý hoàn tiền"
        description="Đối soát số tiền trung tâm đã thu, chuyển khoản ngoài hệ thống rồi nộp biên lai, hoặc từ chối kèm lý do."
      />

      {counts ? (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Clock} label="Chờ xử lý" value={counts.PENDING ?? 0} tone="amber" />
          <StatCard icon={CheckCircle} label="Đã hoàn tiền" value={counts.PAID ?? 0} tone="emerald" />
          <StatCard icon={XCircle} label="Đã từ chối" value={counts.REJECTED ?? 0} tone="rose" />
        </div>
      ) : (
        <StatRowSkeleton />
      )}

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
        {REFUND_TABS.map((t) => (
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
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Không có yêu cầu hoàn tiền nào trong mục này.</p>
        ) : (
          <div className={clsx("divide-y divide-slate-200 dark:divide-slate-800", loading && "opacity-60")}>
            {items.map((r) => {
              const status = metaOf(REFUND_STATUS_META, r.status);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOpenId(r.id)}
                  className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.complaintCode}</span>
                      <span className="font-mono text-xs text-slate-400">{r.requestCode}</span>
                    </div>
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {r.complainantName}
                      {r.studentName && <span className="font-normal text-slate-500 dark:text-slate-400"> · HS {r.studentName}</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lễ tân {r.requestedByName} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {formatVnd(r.status === REFUND_STATUS.PAID ? r.approvedAmount : r.requestedAmount)}
                    </span>
                    <Badge tone={status.tone} size="xs">{status.label}</Badge>
                  </div>
                </button>
              );
            })}
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
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {openId && (
        <RefundProcessModal
          refundId={openId}
          currentUserId={session?.userId}
          onClose={() => setOpenId(null)}
          onDone={() => {
            setOpenId(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
