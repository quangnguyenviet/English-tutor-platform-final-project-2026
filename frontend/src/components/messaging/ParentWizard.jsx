import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import Button from "../ui/Button";
import { provincesAndDistricts } from "../../data/vietnamLocations";
import { apiSaveParentProfile, PURPOSE_OPTIONS } from "../../lib/messagingApi";

const STEPS = ["Số điện thoại", "Họ tên", "Mục đích", "Khu vực"];
const PHONE_PATTERN = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

/**
 * Wizard 4 bước của phụ huynh: SĐT, họ tên, mục đích, khu vực.
 * Không có bước chọn con: học sinh được gia sư khai trong đề xuất.
 */
export default function ParentWizard({ initial, token, onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    phone: initial?.phone || "",
    fullName: initial?.fullName || "",
    purpose: initial?.purpose || "",
    province: initial?.province || "",
    district: initial?.district || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const districts = useMemo(
    () => provincesAndDistricts.find((p) => p.province === form.province)?.districts || [],
    [form.province]
  );

  const phoneClean = form.phone.replace(/[\s.\-()]/g, "");
  const valid = [
    PHONE_PATTERN.test(phoneClean),
    form.fullName.trim().length >= 2,
    Boolean(form.purpose),
    Boolean(form.province && form.district),
  ];

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const profile = await apiSaveParentProfile({ ...form, phone: phoneClean, fullName: form.fullName.trim() }, token);
      onDone(profile);
    } catch (e) {
      setError(e.message || "Không thể lưu thông tin");
      // Lỗi SĐT hiển thị ở bước 1
      if (/số điện thoại/i.test(e.message || "")) setStep(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2" aria-label="Các bước">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                index < step && "bg-emerald-600 text-white",
                index === step && "bg-blue-600 text-white",
                index > step && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {index < step ? <Check size={14} /> : index + 1}
            </span>
            <span className={clsx("hidden text-xs sm:block", index === step ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="min-h-[132px] space-y-2">
        {step === 0 && (
          <>
            <label className="text-sm font-medium text-slate-900 dark:text-white" htmlFor="wz-phone">Số điện thoại của bạn</label>
            <input id="wz-phone" className={inputClass} inputMode="tel" placeholder="VD: 0981 234 567" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} autoFocus />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gia sư chỉ nhìn thấy số này sau khi bạn đồng ý một đề xuất lớp học.
            </p>
            {form.phone && !valid[0] && <p className="text-xs text-rose-600 dark:text-rose-400">Số điện thoại chưa đúng định dạng (10 số, đầu 03/05/07/08/09).</p>}
          </>
        )}
        {step === 1 && (
          <>
            <label className="text-sm font-medium text-slate-900 dark:text-white" htmlFor="wz-name">Họ và tên phụ huynh</label>
            <input id="wz-name" className={inputClass} placeholder="VD: Nguyễn Thị Lan" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoFocus />
          </>
        )}
        {step === 2 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-900 dark:text-white">Mục đích học của con</legend>
            {PURPOSE_OPTIONS.map((option) => (
              <label key={option.value} className={clsx(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                form.purpose === option.value
                  ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-slate-200 text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:text-slate-200"
              )}>
                <input type="radio" name="purpose" className="accent-blue-600" checked={form.purpose === option.value}
                  onChange={() => setForm({ ...form, purpose: option.value })} />
                {option.label}
              </label>
            ))}
          </fieldset>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900 dark:text-white" htmlFor="wz-province">Tỉnh / Thành phố</label>
              <select id="wz-province" className={inputClass} value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value, district: "" })}>
                <option value="">Chọn tỉnh / thành phố</option>
                {provincesAndDistricts.map((p) => <option key={p.province} value={p.province}>{p.province}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900 dark:text-white" htmlFor="wz-district">Quận / Huyện</label>
              <select id="wz-district" className={inputClass} value={form.district} disabled={!form.province}
                onChange={(e) => setForm({ ...form, district: e.target.value })}>
                <option value="">Chọn quận / huyện</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={step === 0 ? onCancel : () => setStep(step - 1)} disabled={saving} className="cursor-pointer">
          <ArrowLeft size={16} />
          {step === 0 ? "Để sau" : "Quay lại"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!valid[step]} className="cursor-pointer">
            Tiếp tục <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={finish} disabled={!valid[step] || saving} className="cursor-pointer">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Hoàn tất
          </Button>
        )}
      </div>
    </div>
  );
}
