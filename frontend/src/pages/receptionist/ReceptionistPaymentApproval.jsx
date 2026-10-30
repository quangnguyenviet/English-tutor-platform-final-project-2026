import { useEffect, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useToast } from "../../hooks/useToast";
import PaymentRow from "../../components/payment/PaymentRow";
import PaymentTabs from "../../components/payment/PaymentTabs";
import ModalShell from "../../components/payment/ModalShell";
import FeeRateModal from "../../components/payment/FeeRateModal";
import ProofUploader from "../../components/payment/ProofUploader";
import { PaymentListSkeleton } from "../../components/payment/PaymentSkeleton";
import { usePaymentList, useStatusCounts } from "../../components/payment/usePaymentData";
import { apiCollectProof, apiSearchPayments } from "../../lib/paymentApi";
import {
  METHOD_LABEL,
  PAYMENT_METHOD,
  canEditFeeRate,
  canSubmitProof,
  formatVnd,
} from "../../lib/paymentModel";

export default function ReceptionistPaymentApproval() {
  const toast = useToast();
  const [tab, setTab] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [version, setVersion] = useState(0);
  const [collecting, setCollecting] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [method, setMethod] = useState(PAYMENT_METHOD.CASH);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const list = usePaymentList(
    () => apiSearchPayments({ status: tab === "ALL" ? undefined : tab, keyword: debounced }),
    [tab, debounced, version]
  );
  const counts = useStatusCounts((status) => apiSearchPayments({ status, size: 1 }), version);

  async function handleCollect(file, onProgress) {
    await apiCollectProof(collecting.id, file, method, onProgress);
    toast.success("Đã thu hộ và gửi biên lai cho Kế toán đối chiếu.");
    setCollecting(null);
    setVersion((v) => v + 1);
  }

  function openCollect(payment) {
    setMethod(PAYMENT_METHOD.CASH);
    setCollecting(payment);
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Vận hành"
        title="Phí nhận lớp"
        description="Tìm khoản phí theo mã lớp, tên gia sư hoặc SĐT phụ huynh; thu hộ tại quầy và chỉnh tỷ lệ phí khi cần."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PaymentTabs includeAll active={tab} onChange={setTab} counts={counts || undefined} />
        <div className="relative w-full lg:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mã lớp, tên gia sư, SĐT phụ huynh"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

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
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Không tìm thấy khoản phí nào phù hợp.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.items.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                actions={
                  <>
                    {canEditFeeRate(payment) && (
                      <Button variant="outline" size="sm" onClick={() => setEditingRate(payment)} className="cursor-pointer">
                        Chỉnh tỷ lệ
                      </Button>
                    )}
                    {canSubmitProof(payment) && (
                      <Button size="sm" onClick={() => openCollect(payment)} className="cursor-pointer">
                        Thu hộ
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </Card>

      {editingRate && (
        <FeeRateModal
          payment={editingRate}
          onClose={() => setEditingRate(null)}
          onSaved={() => {
            setEditingRate(null);
            setVersion((v) => v + 1);
          }}
        />
      )}

      <ModalShell
        open={Boolean(collecting)}
        busy={busy}
        title="Thu hộ tại quầy"
        subtitle={
          collecting
            ? `${collecting.className || `Lớp #${collecting.classId}`} · Gia sư ${collecting.tutorName || "—"} · ${formatVnd(collecting.amount)}`
            : ""
        }
        onClose={() => setCollecting(null)}
      >
        <fieldset disabled={busy} className="space-y-2">
          <legend className="text-sm font-medium text-slate-900 dark:text-white">Hình thức thu</legend>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PAYMENT_METHOD).map((m) => (
              <label
                key={m}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors ${
                  method === m
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800"
                }`}
              >
                <input
                  type="radio"
                  name="collect-method"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="sr-only"
                />
                {METHOD_LABEL[m]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tải ảnh phiếu thu hoặc biên lai chuyển khoản. Bạn sẽ không thể tự xác nhận khoản phí mình đã thu hộ.
        </p>
        <ProofUploader submitLabel="Xác nhận thu hộ" onSubmit={handleCollect} onBusyChange={setBusy} />
      </ModalShell>
    </div>
  );
}
