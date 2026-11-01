import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, FileWarning, Upload } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import PaymentRow from "../../components/payment/PaymentRow";
import PaymentTabs from "../../components/payment/PaymentTabs";
import { PaymentListSkeleton, StatRowSkeleton } from "../../components/payment/PaymentSkeleton";
import { usePaymentList, useStatusCounts } from "../../components/payment/usePaymentData";
import { apiGetMyPayments } from "../../lib/paymentApi";
import { PAYMENT_STATUS } from "../../lib/paymentModel";

export default function TutorPayments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(PAYMENT_STATUS.NOT_SUBMITTED);

  const list = usePaymentList(() => apiGetMyPayments({ tab }), [tab]);
  const counts = useStatusCounts((status) => apiGetMyPayments({ tab: status, size: 1 }));

  const openDetail = (payment) => navigate(`/tutor/payments/${payment.id}`);

  const emptyText = {
    [PAYMENT_STATUS.NOT_SUBMITTED]: "Bạn không có khoản phí nào đang chờ nộp minh chứng.",
    [PAYMENT_STATUS.RESUBMIT_REQUIRED]: "Không có khoản phí nào bị yêu cầu gửi lại.",
    [PAYMENT_STATUS.SUBMITTED]: "Không có khoản phí nào đang chờ xác nhận.",
    [PAYMENT_STATUS.APPROVED]: "Chưa có khoản phí nào được xác nhận.",
  }[tab];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tài chính"
        title="Phí nhận lớp"
        description="Theo dõi và nộp minh chứng phí nhận lớp cho từng lớp đã ghép."
      />

      {counts ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Upload} label="Chưa nộp minh chứng" value={counts.NOT_SUBMITTED} tone="slate" />
          <StatCard icon={FileWarning} label="Yêu cầu gửi lại" value={counts.RESUBMIT_REQUIRED} tone="rose" />
          <StatCard icon={Clock} label="Chờ xác nhận" value={counts.SUBMITTED} tone="amber" />
          <StatCard icon={CheckCircle} label="Đã xác nhận" value={counts.APPROVED} tone="emerald" />
        </div>
      ) : (
        <StatRowSkeleton />
      )}

      <PaymentTabs active={tab} onChange={setTab} counts={counts || undefined} />

      <Card padded={false}>
        {list.loading ? (
          <PaymentListSkeleton />
        ) : list.error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle size={20} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{list.error}</p>
            <Button variant="outline" size="sm" onClick={list.reload} className="cursor-pointer">
              Thử lại
            </Button>
          </div>
        ) : list.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.items.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                showTutor={false}
                onOpen={openDetail}
                footer={
                  payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && payment.rejectReason ? (
                    <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
                      <FileWarning size={16} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="font-medium">Lý do cần gửi lại: </span>
                        {payment.rejectReason}
                      </span>
                    </p>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
