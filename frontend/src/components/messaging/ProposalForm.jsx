import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import clsx from "clsx";
import Button from "../ui/Button";
import { CLASS_MODE_LABEL, CLASS_TYPE_LABEL, DAY_LABEL, apiCreateProposal } from "../../lib/messagingApi";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none " +
  "focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

/** Form tạo đề xuất của gia sư: học sinh (có sẵn hoặc mới), loại lớp, giá và lịch học (buổi đầu tiên là buổi học thử). */
export default function ProposalForm({ roomId, childrenOfParent = [], parentArea, token, onClose, onCreated }) {
  const [studentMode, setStudentMode] = useState(childrenOfParent.length > 0 ? "existing" : "new");
  const [form, setForm] = useState({
    studentId: childrenOfParent[0]?.studentId ?? "",
    studentName: "",
    studentGrade: "",
    classType: "REGULAR",
    pricePerSession: "",
    scheduleDays: [],
    scheduleTimeFrom: "19:00",
    scheduleTimeTo: "20:30",
    classMode: "ONLINE",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const studentValid = studentMode === "existing" ? Boolean(form.studentId) : form.studentName.trim().length >= 2;
  const valid = useMemo(
    () => studentValid && Number(form.pricePerSession) >= 10000 && form.scheduleDays.length > 0,
    [studentValid, form]
  );

  const toggleDay = (day) =>
    setForm((f) => ({ ...f, scheduleDays: f.scheduleDays.includes(day) ? f.scheduleDays.filter((d) => d !== day) : [...f.scheduleDays, day].sort() }));

  async function submit(e) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        studentId: studentMode === "existing" ? Number(form.studentId) : null,
        studentName: studentMode === "new" ? form.studentName.trim() : null,
        studentGrade: studentMode === "new" ? form.studentGrade.trim() || null : null,
        classType: form.classType,
        pricePerSession: Number(form.pricePerSession),
        scheduleDays: form.scheduleDays,
        scheduleTimeFrom: form.scheduleTimeFrom,
        scheduleTimeTo: form.scheduleTimeTo,
        classMode: form.classMode,
        note: form.note.trim() || null,
      };
      const created = await apiCreateProposal(roomId, payload, token);
      onCreated(created);
    } catch (err) {
      setError(err.message || "Không thể gửi đề xuất");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={18} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tạo đề xuất lớp học</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Phụ huynh đồng ý thì lớp dạy thử được tạo ngay.</p>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Học sinh</h3>
          <div className="flex gap-2">
            {childrenOfParent.length > 0 && (
              <Button type="button" size="sm" variant={studentMode === "existing" ? "primary" : "outline"} className="cursor-pointer" onClick={() => setStudentMode("existing")}>Con đã có hồ sơ</Button>
            )}
            <Button type="button" size="sm" variant={studentMode === "new" ? "primary" : "outline"} className="cursor-pointer" onClick={() => setStudentMode("new")}>Học sinh mới</Button>
          </div>
          {studentMode === "existing" ? (
            <select className={inputClass} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              {childrenOfParent.map((c) => (
                <option key={c.studentId} value={c.studentId}>{c.fullName}{c.grade ? ` (${c.grade})` : ""}</option>
              ))}
            </select>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Họ tên học sinh" value={form.studentName} maxLength={50} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
              <input className={inputClass} placeholder="Khối lớp (không bắt buộc)" value={form.studentGrade} maxLength={20} onChange={(e) => setForm({ ...form, studentGrade: e.target.value })} />
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">
            Loại lớp
            <select className={inputClass} value={form.classType} onChange={(e) => setForm({ ...form, classType: e.target.value })}>
              {Object.entries(CLASS_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">
            Học phí mỗi buổi (đ)
            <input className={clsx(inputClass, "font-mono")} inputMode="numeric" placeholder="VD: 300000" value={form.pricePerSession}
              onChange={(e) => setForm({ ...form, pricePerSession: e.target.value.replace(/\D/g, "") })} />
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lịch học hằng tuần</h3>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DAY_LABEL).map(([day, label]) => {
              const value = Number(day);
              const active = form.scheduleDays.includes(value);
              return (
                <button key={day} type="button" onClick={() => toggleDay(value)} aria-pressed={active}
                  className={clsx("h-9 min-w-[44px] cursor-pointer rounded-lg border text-sm font-medium transition-colors",
                    active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:text-slate-200")}>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-slate-500 dark:text-slate-400">Giờ bắt đầu
              <input type="time" className={inputClass} value={form.scheduleTimeFrom} onChange={(e) => setForm({ ...form, scheduleTimeFrom: e.target.value })} />
            </label>
            <label className="space-y-1 text-xs text-slate-500 dark:text-slate-400">Giờ kết thúc
              <input type="time" className={inputClass} value={form.scheduleTimeTo} onChange={(e) => setForm({ ...form, scheduleTimeTo: e.target.value })} />
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Buổi đầu tiên trong lịch học là buổi học thử. Bạn có thể đổi thời gian buổi này ở trang lớp học sau khi phụ huynh đồng ý.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">
            Hình thức dạy
            <select className={inputClass} value={form.classMode} onChange={(e) => setForm({ ...form, classMode: e.target.value })}>
              {Object.entries(CLASS_MODE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {form.classMode === "AT_HOME" && (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 sm:col-span-2">
              Học tại địa chỉ nhà mặc định của phụ huynh{parentArea ? ` (${parentArea})` : ""}. Địa chỉ chi tiết không hiển thị cho gia sư.
            </p>
          )}
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white sm:col-span-2">
            Ghi chú (không bắt buộc)
            <textarea rows={2} maxLength={1000} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>
        </section>

        {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="cursor-pointer" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" className="cursor-pointer" disabled={!valid || saving}>
            {saving && <Loader2 size={16} className="animate-spin" />} Gửi đề xuất
          </Button>
        </div>
      </form>
    </div>
  );
}
