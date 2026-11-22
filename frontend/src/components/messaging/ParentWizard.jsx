import { useMemo, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import { provincesAndDistricts } from "../../data/vietnamLocations";
import { apiSaveParentProfile, PURPOSE_OPTIONS } from "../../lib/messagingApi";

const PHONE_PATTERN = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

/**
 * Form hồ sơ phụ huynh (một màn hình, đủ 4 nhóm thông tin): họ tên (mặc định theo tài khoản Google, bấm Sửa để đổi),
 * SĐT, mục đích học, khu vực + địa chỉ nhà (địa chỉ mặc định khi học tại nhà).
 * Không có bước chọn con: học sinh được gia sư khai trong đề xuất.
 */
export default function ParentWizard({ initial, token, onDone, onCancel }) {
  const { session } = useAuth();
  const defaultName = initial?.fullName || session?.name || "";
  const [form, setForm] = useState({
    phone: initial?.phone || "",
    fullName: defaultName,
    purpose: initial?.purpose || "",
    province: initial?.province || "",
    district: initial?.district || "",
    address: initial?.address || "",
  });
  const [editingName, setEditingName] = useState(!defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const districts = useMemo(
    () => provincesAndDistricts.find((p) => p.province === form.province)?.districts || [],
    [form.province]
  );

  const phoneClean = form.phone.replace(/[\s.\-()]/g, "");
  const phoneValid = PHONE_PATTERN.test(phoneClean);
  const allValid =
    phoneValid &&
    form.fullName.trim().length >= 2 &&
    Boolean(form.purpose) &&
    Boolean(form.province && form.district) &&
    form.address.trim().length >= 5;

  async function finish(event) {
    event.preventDefault();
    if (!allValid) return;
    setSaving(true);
    setError("");
    try {
      const profile = await apiSaveParentProfile(
        { ...form, phone: phoneClean, fullName: form.fullName.trim(), address: form.address.trim() }, token);
      onDone(profile);
    } catch (e) {
      setError(e.message || "Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "text-sm font-medium text-slate-900 dark:text-white";

  return (
    <form onSubmit={finish} className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="wz-name">Họ và tên phụ huynh</label>
        {editingName ? (
          <input id="wz-name" className={inputClass} placeholder="VD: Nguyễn Thị Lan" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoFocus />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800/50">
            <span className="min-w-0 truncate text-slate-900 dark:text-white">{form.fullName}</span>
            <button type="button" onClick={() => setEditingName(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              <Pencil size={13} /> Sửa
            </button>
          </div>
        )}
        {!editingName && <p className="text-xs text-slate-500 dark:text-slate-400">Lấy theo tài khoản Google của bạn.</p>}
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="wz-phone">Số điện thoại</label>
        <input id="wz-phone" className={inputClass} inputMode="tel" placeholder="VD: 0981 234 567" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <p className="text-xs text-slate-500 dark:text-slate-400">Gia sư chỉ nhìn thấy số này sau khi bạn đồng ý một đề xuất lớp học.</p>
        {form.phone && !phoneValid && <p className="text-xs text-rose-600 dark:text-rose-400">Số điện thoại chưa đúng định dạng (10 số, đầu 03/05/07/08/09).</p>}
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="wz-purpose">Mục đích học của con</label>
        <select id="wz-purpose" className={inputClass} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
          <option value="">Chọn mục đích học</option>
          {PURPOSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="wz-province">Tỉnh / Thành phố</label>
          <select id="wz-province" className={inputClass} value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value, district: "" })}>
            <option value="">Chọn tỉnh / thành phố</option>
            {provincesAndDistricts.map((p) => <option key={p.province} value={p.province}>{p.province}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="wz-district">Quận / Huyện</label>
          <select id="wz-district" className={inputClass} value={form.district} disabled={!form.province}
            onChange={(e) => setForm({ ...form, district: e.target.value })}>
            <option value="">Chọn quận / huyện</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="wz-address">Địa chỉ nhà (số nhà, đường, phường/xã)</label>
        <input id="wz-address" className={inputClass} maxLength={500} placeholder="VD: 25 Nguyễn Trãi, phường Thanh Xuân Trung" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dùng làm địa chỉ học mặc định khi gia sư đề xuất dạy tại nhà. Gia sư chỉ thấy địa chỉ trong đề xuất.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} className="cursor-pointer">Để sau</Button>
        <Button type="submit" disabled={!allValid || saving} className="cursor-pointer">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Lưu và tiếp tục
        </Button>
      </div>
    </form>
  );
}
