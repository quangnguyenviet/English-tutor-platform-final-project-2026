import { useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import ModalShell from "../payment/ModalShell";
import { useToast } from "../../hooks/useToast";
import { apiResolveComplaint } from "../../lib/complaintApi";
import {
  OUTCOME_META,
  REQUEST_OUTCOME,
  defaultOutcome,
  isHandled,
  resolveConfirmMessage,
  selectableOutcomes,
  validateResolve,
  windowLabel,
} from "../../lib/complaintModel";
import { ClassRequestSummary } from "./ClassRequestPicker";
import EvidencePicker from "./EvidencePicker";
import { Field, Notice, Section, inputClass } from "./fields";

const OUTCOME_HINT = {
  [REQUEST_OUTCOME.CANCELLED]: "Lớp cần gia sư và lớp đang học (nếu có) bị hủy, gia sư đang dạy bị loại.",
  [REQUEST_OUTCOME.REMATCH]: "Lớp học hiện tại kết thúc, gia sư cũ bị loại, lớp chuyển Đang ghép lại.",
};

/** Giải quyết khiếu nại không hoàn tiền (UC-REC-16, UC-ADM-15). */
export default function ResolveComplaintModal({ open, detail, onClose, onResolved }) {
  const toast = useToast();
  const { complaint, target } = detail;
  const options = selectableOutcomes(target);
  const [outcome, setOutcome] = useState(() => defaultOutcome(target));
  const [resolution, setResolution] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handled = isHandled(target, outcome);
  const window = windowLabel(target);
  const blocked = options.length === 0;

  function submit() {
    const problem = validateResolve({ target, outcome, resolution, files });
    setError(problem || "");
    if (!problem) setConfirming(true);
  }

  async function resolve() {
    setConfirming(false);
    setBusy(true);
    setProgress(0);
    try {
      const result = await apiResolveComplaint(
        complaint.id,
        { requestOutcome: outcome, resolution: resolution.trim(), files },
        setProgress
      );
      toast.success("Đã giải quyết khiếu nại.");
      onResolved?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ModalShell
        open={open}
        busy={busy}
        title={`Giải quyết khiếu nại KN-${complaint.id}`}
        subtitle="Liên hệ bên còn lại để xác nhận yêu cầu trước khi giải quyết."
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy} className="cursor-pointer">
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy || blocked} className="cursor-pointer">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy && files.length > 0 ? `Đang tải lên ${progress}%` : "Xác nhận"}
            </Button>
          </>
        }
      >
        <Section
          title="Lớp bị khiếu nại"
          aside={
            window && (
              <Badge tone={target.windowExpired ? "rose" : "amber"} size="xs">
                <Clock size={12} />
                {window}
              </Badge>
            )
          }
        >
          <ClassRequestSummary item={target} />
        </Section>

        {blocked ? (
          <Notice>
            {target.windowExpired
              ? "Lớp đã ghép thành công quá 7 ngày, không thể hủy lớp hoặc ghép lại. Vui lòng hủy khiếu nại và giải thích với người khiếu nại."
              : "Lớp không còn ở trạng thái có thể xử lý. Vui lòng kiểm tra lại ở trang Lớp cần gia sư."}
          </Notice>
        ) : (
          <Field label="Kết quả với lớp" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((key) => {
                const meta = OUTCOME_META[key];
                const done = isHandled(target, key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOutcome(key)}
                    className={clsx(
                      "cursor-pointer rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]",
                      outcome === key
                        ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      {meta.label}
                      {done && (
                        <Badge tone="emerald" size="xs">
                          <CheckCircle2 size={12} />
                          Đã xử lý thủ công
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {done ? "Không thao tác lại trên lớp, cần minh chứng đã xử lý." : OUTCOME_HINT[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Kết quả xử lý & Ghi chú" required>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
            disabled={busy || blocked}
            className={inputClass}
            placeholder="Ví dụ: Đã gọi gia sư xác nhận, hai bên đồng ý dừng lớp."
          />
        </Field>

        <Field label={handled ? "Minh chứng đã xử lý" : "Đính kèm minh chứng"} required={handled}>
          <EvidencePicker files={files} onChange={setFiles} disabled={busy || blocked} required={handled} />
        </Field>

        {error && <Notice>{error}</Notice>}
      </ModalShell>

      <ConfirmModal
        open={confirming}
        title={handled ? "Đóng khiếu nại" : outcome === REQUEST_OUTCOME.REMATCH ? "Ghép lại gia sư" : "Hủy lớp"}
        message={resolveConfirmMessage(target, outcome)}
        confirmTone={handled ? "emerald" : outcome === REQUEST_OUTCOME.REMATCH ? "amber" : "rose"}
        onConfirm={resolve}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
