import { Banknote, ChevronRight } from "lucide-react";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { formatVnd } from "../../lib/paymentModel";

/**
 * Một khoản phí nhận lớp. `actions` là các nút thao tác theo từng vai trò.
 * `showTutor` bật hiển thị gia sư và SĐT phụ huynh cho Lễ tân/Kế toán.
 * `onOpen` (tuỳ chọn): làm cả dòng bấm được để mở trang chi tiết, kèm nhãn "Xem chi tiết".
 */
export default function PaymentRow({ payment, actions, showTutor = true, footer, onOpen }) {
  const percent =
    payment.feePercentage !== undefined && payment.feePercentage !== null
      ? `${Number(payment.feePercentage)}%`
      : null;
  const navigable = typeof onOpen === "function";

  return (
    <div
      role={navigable ? "link" : undefined}
      tabIndex={navigable ? 0 : undefined}
      onClick={navigable ? () => onOpen(payment) : undefined}
      onKeyDown={
        navigable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(payment);
              }
            }
          : undefined
      }
      className={
        navigable
          ? "cursor-pointer space-y-3 p-4 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-blue-50/40 dark:hover:bg-slate-800/40"
          : "space-y-3 p-4"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Banknote size={18} className="text-blue-600 dark:text-blue-400" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {payment.className || `Lớp #${payment.classId}`}
              </p>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
              Mã lớp #{payment.classId} · Khoản phí #{payment.id}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {payment.studentName ? `Học viên: ${payment.studentName}` : null}
              {showTutor && payment.tutorName ? ` · Gia sư: ${payment.tutorName}` : null}
              {showTutor && payment.parentPhone ? ` · SĐT phụ huynh: ${payment.parentPhone}` : null}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="font-mono text-base font-semibold text-slate-900 dark:text-white">
              {formatVnd(payment.amount)}
            </p>
            {percent && <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ phí {percent}</p>}
          </div>
          {navigable ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              Xem chi tiết
              <ChevronRight size={16} />
            </span>
          ) : actions ? (
            <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      {footer}
    </div>
  );
}
