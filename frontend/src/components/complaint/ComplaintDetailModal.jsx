import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, Loader2, Pencil, Send, Wallet } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import ModalShell from "../payment/ModalShell";
import ProofPreview from "../payment/ProofPreview";
import { useToast } from "../../hooks/useToast";
import { apiCancelComplaint, apiGetComplaint } from "../../lib/complaintApi";
import {
  COMPLAINT_STATUS_META,
  OUTCOME_META,
  REFUND_STATUS_META,
  ROLE_LABEL,
  TYPE_META,
  canRequestRefund,
  canResolve,
  formatDateTime,
  formatVnd,
  isEditable,
  metaOf,
  windowLabel,
} from "../../lib/complaintModel";
import { ClassRequestSummary } from "./ClassRequestPicker";
import ComplaintFormModal from "./ComplaintFormModal";
import RefundRequestModal from "./RefundRequestModal";
import ResolveComplaintModal from "./ResolveComplaintModal";
import { InfoRow, Notice, Section } from "./fields";

function DetailSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}

/** Chi tiết khiếu nại (UC-REC-15) và các thao tác theo trạng thái. */
export default function ComplaintDetailModal({ complaintId, canManage = true, onClose, onChanged }) {
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [sub, setSub] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setDetail(await apiGetComplaint(complaintId));
    } catch (err) {
      setError(err.message);
    }
  }, [complaintId]);

  useEffect(() => {
    load();
  }, [load]);

  function changed(next) {
    setSub(null);
    if (next) setDetail(next);
    else load();
    onChanged?.();
  }

  async function cancelComplaint() {
    setSub(null);
    setBusy(true);
    try {
      const next = await apiCancelComplaint(complaintId);
      toast.success("Đã hủy khiếu nại, lớp giữ nguyên trạng thái.");
      changed(next);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const complaint = detail?.complaint;
  const target = detail?.target;
  const latestRefund = detail?.refunds?.[0];
  const status = complaint ? metaOf(COMPLAINT_STATUS_META, complaint.status) : null;
  const type = complaint ? metaOf(TYPE_META, complaint.complaintType) : null;
  const window = windowLabel(target);

  const footer =
    complaint && canManage && isEditable(complaint) ? (
      <>
        <Button variant="outline" onClick={() => setSub("cancel")} disabled={busy} className="cursor-pointer">
          <Ban size={16} />
          Hủy khiếu nại
        </Button>
        <Button variant="secondary" onClick={() => setSub("edit")} disabled={busy} className="cursor-pointer">
          <Pencil size={16} />
          Sửa
        </Button>
        {canResolve(complaint) && (
          <Button onClick={() => setSub("resolve")} disabled={busy} className="cursor-pointer">
            <CheckCircle2 size={16} />
            Giải quyết
          </Button>
        )}
        {canRequestRefund(complaint) && (
          <Button onClick={() => setSub("refund")} disabled={busy} className="cursor-pointer">
            <Send size={16} />
            Gửi yêu cầu hoàn tiền
          </Button>
        )}
      </>
    ) : null;

  return (
    <>
      <ModalShell
        open={!sub || sub === "cancel"}
        busy={busy}
        title={complaint ? `Khiếu nại ${complaint.complaintCode}` : "Chi tiết khiếu nại"}
        subtitle={complaint ? `Tiếp nhận ${formatDateTime(complaint.createdAt)} bởi ${complaint.receivedByName}` : undefined}
        onClose={onClose}
        footer={footer}
      >
        {error ? (
          <Notice>{error}</Notice>
        ) : !detail ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone={type.tone}>{type.label}</Badge>
              {complaint.requestOutcome && (
                <Badge tone={metaOf(OUTCOME_META, complaint.requestOutcome).tone}>
                  {metaOf(OUTCOME_META, complaint.requestOutcome).label}
                </Badge>
              )}
              {busy && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </div>

            <Section title="Người khiếu nại">
              <InfoRow label="Họ tên">{complaint.complainantName}</InfoRow>
              <InfoRow label="Vai trò">{ROLE_LABEL[complaint.complainantRole] || complaint.complainantRole}</InfoRow>
              <InfoRow label="Số điện thoại" mono>{complaint.complainantPhone}</InfoRow>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {complaint.complaintContent}
              </p>
            </Section>

            <Section
              title="Lớp bị khiếu nại"
              aside={window && isEditable(complaint) && complaint.complaintType === "NON_REFUND" && (
                <Badge tone={target.windowExpired ? "rose" : "amber"} size="xs">{window}</Badge>
              )}
            >
              <ClassRequestSummary item={target} />
            </Section>

            {complaint.complaintType === "REFUND" && (
              <Section title="Yêu cầu hoàn tiền gần nhất">
                {latestRefund ? (
                  <>
                    <div className="mb-1">
                      <Badge tone={metaOf(REFUND_STATUS_META, latestRefund.status).tone} size="xs">
                        <Wallet size={12} />
                        {metaOf(REFUND_STATUS_META, latestRefund.status).label}
                      </Badge>
                    </div>
                    <InfoRow label="Số đề xuất" mono>{formatVnd(latestRefund.requestedAmount)}</InfoRow>
                    <InfoRow label="Số đã hoàn" mono>{formatVnd(latestRefund.approvedAmount)}</InfoRow>
                    <InfoRow label="Tài khoản nhận">
                      {latestRefund.recipientName} · {latestRefund.bankName} · {latestRefund.bankAccountNumber}
                    </InfoRow>
                    {latestRefund.status === "REJECTED" && latestRefund.rejectReason && (
                      <div className="mt-2">
                        <Notice>Kế toán từ chối: {latestRefund.rejectReason}</Notice>
                      </div>
                    )}
                    {latestRefund.proofUrl && (
                      <div className="mt-2">
                        <ProofPreview url={latestRefund.proofUrl} alt="Biên lai hoàn tiền" />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa gửi yêu cầu hoàn tiền.</p>
                )}
              </Section>
            )}

            {(complaint.resolution || detail.attachments?.length > 0) && (
              <Section title="Kết quả xử lý">
                {complaint.resolution && (
                  <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{complaint.resolution}</p>
                )}
                {complaint.resolvedAt && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {complaint.resolvedByName} · {formatDateTime(complaint.resolvedAt)}
                  </p>
                )}
                {detail.attachments?.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {detail.attachments.map((a) => (
                      <ProofPreview key={a.id} url={a.fileUrl} alt={a.fileName || "Minh chứng"} />
                    ))}
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </ModalShell>

      {detail && sub === "edit" && (
        <ComplaintFormModal open complaint={complaint} onClose={() => setSub(null)} onSaved={changed} />
      )}
      {detail && sub === "resolve" && (
        <ResolveComplaintModal open detail={detail} onClose={() => setSub(null)} onResolved={changed} />
      )}
      {detail && sub === "refund" && (
        <RefundRequestModal open detail={detail} onClose={() => setSub(null)} onSent={changed} />
      )}
      <ConfirmModal
        open={sub === "cancel"}
        title="Hủy khiếu nại"
        message="Khiếu nại sẽ chuyển sang Đã hủy, lớp và gia sư giữ nguyên trạng thái. Bạn có chắc không?"
        confirmTone="rose"
        onConfirm={cancelComplaint}
        onCancel={() => setSub(null)}
      />
    </>
  );
}
