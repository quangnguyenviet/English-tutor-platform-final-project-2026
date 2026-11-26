import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { apiGetMyProfile, apiUpdateMyProfile } from "../../lib/studentApi";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none " +
  "focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 " +
  "dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-400";

const EDITABLE = ["fullName", "dateOfBirth", "gender", "email", "phone", "school", "grade", "learningGoal"];
const toForm = (profile) => Object.fromEntries(EDITABLE.map((key) => [key, profile[key] || ""]));
const todayIso = () => new Date().toLocaleDateString("en-CA");

function Input({ label, children, className = "" }) {
  return (
    <label className={`block space-y-1.5 text-sm font-medium text-slate-900 dark:text-white ${className}`}>
      {label}
      {children}
    </label>
  );
}

/** Trang cá nhân của học sinh: xem và chỉnh sửa thông tin; tên đăng nhập và phụ huynh chỉ đọc. */
export default function StudentProfile() {
  const { token, updateSessionProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGetMyProfile(token)
      .then((result) => {
        setProfile(result);
        setForm(toForm(result));
      })
      .catch((e) => setError(e.message));
  }, [token]);

  const dirty = Boolean(profile && form) && EDITABLE.some((key) => form[key] !== (profile[key] || ""));
  const bind = (key) => ({
    className: inputClass,
    value: form[key],
    onChange: (e) => {
      setSaved(false);
      setForm({ ...form, [key]: e.target.value });
    },
  });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(EDITABLE.map((key) => [key, form[key].trim() || null]));
      const result = await apiUpdateMyProfile(token, payload);
      setProfile(result);
      setForm(toForm(result));
      setSaved(true);
      updateSessionProfile({ name: result.fullName });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader className="!mb-0" eyebrow="Tài khoản" title="Trang cá nhân" description="Xem và chỉnh sửa thông tin của bạn." />
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {!form && !error && <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}

      {form && (
        <form onSubmit={submit} className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Thông tin cá nhân</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Họ và tên"><input {...bind("fullName")} required minLength={2} maxLength={100} /></Input>
              <Input label="Tên đăng nhập"><input className={inputClass} value={profile.username} disabled /></Input>
              <Input label="Ngày sinh"><input type="date" max={todayIso()} {...bind("dateOfBirth")} /></Input>
              <Input label="Giới tính">
                <select {...bind("gender")}>
                  <option value="">Chưa chọn</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </Input>
              <Input label="Email"><input type="email" maxLength={255} {...bind("email")} /></Input>
              <Input label="Số điện thoại"><input inputMode="tel" maxLength={15} {...bind("phone")} /></Input>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Học tập</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Trường"><input maxLength={200} {...bind("school")} /></Input>
              <Input label="Khối lớp"><input maxLength={20} placeholder="VD: Lớp 8" {...bind("grade")} /></Input>
              <Input label="Mục tiêu học tập" className="sm:col-span-2"><textarea rows={3} maxLength={1000} {...bind("learningGoal")} /></Input>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Phụ huynh</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Họ tên phụ huynh"><input className={inputClass} value={profile.parentName || ""} disabled /></Input>
              <Input label="Số điện thoại phụ huynh"><input className={inputClass} value={profile.parentPhone || ""} disabled /></Input>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="cursor-pointer" disabled={!dirty || saving}>
              {saving && <Loader2 size={16} className="animate-spin" />} Lưu thay đổi
            </Button>
            {dirty && !saving && (
              <Button type="button" variant="ghost" className="cursor-pointer" onClick={() => setForm(toForm(profile))}>Hoàn tác</Button>
            )}
            {saved && (
              <span role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={15} /> Đã lưu</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
