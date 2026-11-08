import { useState } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import ModalShell from "../payment/ModalShell";
import { useToast } from "../../hooks/useToast";
import { apiCreateComplaint, apiUpdateComplaint } from "../../lib/complaintApi";
import { COMPLAINT_TYPE, ROLE_LABEL, classRequestEligibility } from "../../lib/complaintModel";
import ClassRequestPicker from "./ClassRequestPicker";
import { Field, Notice, inputClass } from "./fields";

const PHONE_PATTERN = /^(0|\+84)[0-9]{9,10}$/;

function initialForm(complaint) {
  return {
    complainantName: complaint?.complainantName || "",
    complainantPhone: complaint?.complainantPhone || "",
    complainantRole: complaint?.complainantRole || "PARENT",
    complaintType: complaint?.complaintType || COMPLAINT_TYPE.NON_REFUND,
    complaintContent: complaint?.complaintContent || "",
  };
}

/**
 * Tạo (UC-REC-14) hoặc sửa (UC-REC-15) đơn khiếu nại. Khi sửa chỉ đổi được người khiếu nại và nội dung,
 * loại và lớp bị khiếu nại giữ nguyên.
 */
export default function ComplaintFormModal({ open, complaint, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(complaint);
  const [form, setForm] = useState(() => initialForm(complaint));
  const [classRequest, setClassRequest] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!form.complainantName.trim()) next.complainantName = "Vui lòng nhập họ tên người khiếu nại.";
    if (!PHONE_PATTERN.test(form.complainantPhone.trim())) next.complainantPhone = "Số điện thoại không hợp lệ.";
    if (!form.complaintContent.trim()) next.complaintContent = "Vui lòng nhập nội dung khiếu nại.";
    if (!editing) {
      const eligibility = classRequestEligibility(classRequest, form.complaintType);
      if (!eligibility.ok) next.classRequest = eligibility.reason;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    setConfirm(null);
    setBusy(true);
    setServerError("");
    try {
      const payload = {
        complainantName: form.complainantName.trim(),
        complainantPhone: form.complainantPhone.trim(),
        complainantRole: form.complainantRole,
        complaintContent: form.complaintContent.trim(),
      };
      const result = editing
        ? await apiUpdateComplaint(complaint.id, payload)
        : await apiCreateComplaint({
            ...payload,
            complaintType: form.complaintType,
            classRequestId: classRequest.id,
          });
      toast.success(editing ? "Đã lưu thay đổi đơn khiếu nại." : "Đã tạo đơn khiếu nại thành công.");
      onSaved?.(result);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!validate()) return;
    if (editing) setConfirm("save");
    else save();
  }

  return (
    <>
      <ModalShell
        open={open}
        busy={busy}
        title={editing ? `Sửa đơn khiếu nại KN-${complaint.id}` : "Tạo đơn khiếu nại"}
        subtitle={editing ? "Chỉ sửa được thông tin người khiếu nại và nội dung." : "Đơn được tạo ở trạng thái Chờ xử lý, lớp chưa đổi trạng thái."}
        onClose={() => setConfirm("cancel")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm("cancel")} disabled={busy} className="cursor-pointer">
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy} className="cursor-pointer">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {editing ? "Lưu" : "Tạo khiếu nại"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ tên người khiếu nại" required error={errors.complainantName}>
            <input value={form.complainantName} onChange={set("complainantName")} className={inputClass} maxLength={100} />
          </Field>
          <Field label="Số điện thoại" required error={errors.complainantPhone}>
            <input
              value={form.complainantPhone}
              onChange={set("complainantPhone")}
              inputMode="tel"
              className={clsx(inputClass, "font-mono")}
              maxLength={15}
            />
          </Field>
        </div>

        <Field label="Vai trò" required>
          <div className="flex gap-2">
            {["PARENT", "TUTOR"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((f) => ({ ...f, complainantRole: role }))}
                className={clsx(
                  "flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-[0.98]",
                  form.complainantRole === role
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {ROLE_LABEL[role]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Loại khiếu nại" required hint={editing ? "Không đổi được loại khiếu nại sau khi tạo." : undefined}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: COMPLAINT_TYPE.NON_REFUND, label: "Không hoàn tiền", hint: "Hủy lớp hoặc ghép lại gia sư" },
              { key: COMPLAINT_TYPE.REFUND, label: "Hoàn tiền", hint: "Chỉ lớp Online" },
            ].map((type) => (
              <button
                key={type.key}
                type="button"
                disabled={editing}
                onClick={() => setForm((f) => ({ ...f, complaintType: type.key }))}
                className={clsx(
                  "cursor-pointer rounded-xl border px-3 py-2 text-left transition active:scale-[0.98] disabled:cursor-not-allowed",
                  form.complaintType === type.key
                    ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40"
                    : "border-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
                )}
              >
                <span className="block text-sm font-medium text-slate-900 dark:text-white">{type.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{type.hint}</span>
              </button>
            ))}
          </div>
        </Field>

        {!editing && (
          <Field label="Lớp cần khiếu nại" required>
            <ClassRequestPicker
              value={classRequest}
              onChange={setClassRequest}
              complaintType={form.complaintType}
              error={errors.classRequest}
            />
          </Field>
        )}

        <Field label="Lý do khiếu nại" required error={errors.complaintContent}>
          <textarea
            value={form.complaintContent}
            onChange={set("complaintContent")}
            rows={4}
            className={inputClass}
            placeholder="Ghi rõ nội dung phản ánh của người khiếu nại"
          />
        </Field>

        {serverError && <Notice>{serverError}</Notice>}
      </ModalShell>

      <ConfirmModal
        open={confirm === "cancel"}
        title={editing ? "Hủy chỉnh sửa" : "Hủy tạo đơn"}
        message={editing ? "Các thay đổi chưa lưu sẽ bị bỏ. Bạn có chắc không?" : "Bạn xác nhận hủy đi đơn khiếu nại này chứ?"}
        confirmTone="rose"
        onConfirm={() => {
          setConfirm(null);
          onClose();
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === "save"}
        title="Lưu thay đổi"
        message="Bạn có chắc muốn lưu thay đổi đơn khiếu nại này?"
        onConfirm={save}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
