import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Loader2, MapPin, MessageCircle, Plus, Users, X } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import {
  CLASS_MODE_LABEL,
  PURPOSE_OPTIONS,
  apiCancelPosting,
  apiCreatePosting,
  apiGetMyPostings,
  apiGetPostingApplicants,
  apiOpenApplicationRoom,
  formatVnd,
  purposeLabel,
} from "../../lib/messagingApi";

const STATUS = {
  NEW: { label: "Chờ duyệt", tone: "amber" },
  OPEN: { label: "Đang nhận ứng tuyển", tone: "blue" },
  MATCHED: { label: "Đã có lớp", tone: "emerald" },
  REMATCH: { label: "Đang ghép lại", tone: "amber" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

const GENDER_OPTIONS = [
  { value: "ANY", label: "Không yêu cầu" },
  { value: "FEMALE", label: "Nữ" },
  { value: "MALE", label: "Nam" },
];
const TUTOR_OPTIONS = [
  { value: "ANY", label: "Không yêu cầu" },
  { value: "STUDENT", label: "Sinh viên" },
  { value: "TEACHER", label: "Giáo viên" },
];
const DURATION_OPTIONS = [
  { value: "SHORT_TERM", label: "Lớp ngắn hạn (dưới 3 tháng)" },
  { value: "REGULAR", label: "Lớp thông thường (trên 3 tháng)" },
];
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const SHIFTS = ["Sáng", "Chiều", "Tối"];
const labelOf = (options, value) => options.find((o) => o.value === value)?.label;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none " +
  "focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function availableTimeText(days, shift) {
  if (days.length === 0 && !shift) return null;
  const dayText = days.length ? days.join(", ").toLowerCase().replace("chủ nhật", "Chủ nhật") : "";
  return [shift, dayText].filter(Boolean).join(" ");
}

function NewPostingModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ purpose: "", sessionsPerWeek: "", referencePrice: "", teachingMode: "", note: "",
    address: "", genderRequirement: "", tutorRequirement: "", durationType: "", days: [], shift: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiCreatePosting({
        purpose: form.purpose || null,
        sessionsPerWeek: form.sessionsPerWeek ? Number(form.sessionsPerWeek) : null,
        referencePrice: form.referencePrice ? Number(form.referencePrice) : null,
        teachingMode: form.teachingMode || null,
        note: form.note.trim() || null,
        address: form.address.trim() || null,
        genderRequirement: form.genderRequirement || null,
        tutorRequirement: form.tutorRequirement || null,
        durationType: form.durationType || null,
        availableTime: availableTimeText(form.days, form.shift),
      }, token);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Đăng tin tìm gia sư</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Mục đích và khu vực lấy từ hồ sơ của bạn nếu để trống. Trung tâm duyệt tin trong 24 giờ.</p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Mục đích học
          <select className={inputClass} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
            <option value="">Theo hồ sơ của tôi</option>
            {PURPOSE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Số buổi/tuần
            <select className={inputClass} value={form.sessionsPerWeek} onChange={(e) => setForm({ ...form, sessionsPerWeek: e.target.value })}>
              <option value="">Chưa rõ</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Hình thức
            <select className={inputClass} value={form.teachingMode} onChange={(e) => setForm({ ...form, teachingMode: e.target.value })}>
              <option value="">Chưa rõ</option>
              {Object.entries(CLASS_MODE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Phí tham khảo/buổi
            <input className={inputClass} inputMode="numeric" placeholder="VD: 250000" value={form.referencePrice}
              onChange={(e) => setForm({ ...form, referencePrice: e.target.value.replace(/\D/g, "") })} />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Địa chỉ học
          <input className={inputClass} maxLength={255} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Số nhà, đường, quận/huyện (không ghi số điện thoại)" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Yêu cầu giới tính
            <select className={inputClass} value={form.genderRequirement} onChange={(e) => setForm({ ...form, genderRequirement: e.target.value })}>
              <option value="">Chọn</option>
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Yêu cầu gia sư
            <select className={inputClass} value={form.tutorRequirement} onChange={(e) => setForm({ ...form, tutorRequirement: e.target.value })}>
              <option value="">Chọn</option>
              {TUTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Loại lớp học
            <select className={inputClass} value={form.durationType} onChange={(e) => setForm({ ...form, durationType: e.target.value })}>
              <option value="">Chọn</option>
              {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-900 dark:text-white">Thời gian có thể học</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = form.days.includes(d);
              return (
                <button key={d} type="button" aria-pressed={on}
                  onClick={() => setForm({ ...form, days: on ? form.days.filter((x) => x !== d) : [...form.days, d] })}
                  className={"cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors " + (on
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300")}>
                  {d}
                </button>
              );
            })}
          </div>
          <select className={inputClass} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} aria-label="Buổi trong ngày">
            <option value="">Buổi trong ngày</option>
            {SHIFTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </fieldset>
        <label className="block space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">Mô tả yêu cầu
          <textarea rows={4} maxLength={1000} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Thời gian mong muốn, tình trạng của con, kỳ vọng... Không ghi số điện thoại hoặc Zalo." />
        </label>
        {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="cursor-pointer" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" className="cursor-pointer" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Gửi tin</Button>
        </div>
      </form>
    </div>
  );
}

function ApplicantsModal({ posting, token, onClose }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    apiGetPostingApplicants(posting.id, token).then(setData).catch((e) => setError(e.message));
  }, [posting.id, token]);

  async function chat(applicant) {
    setBusyId(applicant.applicationId);
    try {
      const roomId = applicant.roomId || (await apiOpenApplicationRoom(applicant.applicationId, token)).roomId;
      navigate(`/parent/messages/${roomId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        <h2 className="pr-8 text-lg font-semibold text-slate-900 dark:text-white">Gia sư ứng tuyển</h2>
        {!data && !error && <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>}
        {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        {data?.applicants.length === 0 && <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có gia sư nào ứng tuyển. Chúng tôi sẽ báo cho bạn khi có ứng viên.</p>}
        <ul className="space-y-3">
          {data?.applicants.map((a) => (
            <li key={a.applicationId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">{a.tutorName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {[a.university, a.experienceYears != null ? `${a.experienceYears} năm kinh nghiệm` : null].filter(Boolean).join(" · ")}
                  </p>
                  {a.bio && <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{a.bio}</p>}
                  {a.message && <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">“{a.message}”</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {a.status === "SELECTED" && <Badge tone="emerald">Đã chọn</Badge>}
                  <Button size="sm" className="cursor-pointer" onClick={() => chat(a)} disabled={busyId === a.applicationId}>
                    {busyId === a.applicationId ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />} Nhắn tin
                  </Button>
                  <Link to={`/tutors/${a.tutorId}`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">Xem hồ sơ</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Trang "Tin của tôi": các tin đăng tìm gia sư, ứng viên và nút nhắn tin theo từng ứng viên. */
export default function ParentPostings() {
  const { token, session } = useAuth();
  const authToken = token || session?.token;
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(params.get("new") === "1");
  const [applicantsOf, setApplicantsOf] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      setItems(await apiGetMyPostings(authToken));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  function closeForm() {
    setShowForm(false);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  async function close(posting) {
    if (!window.confirm("Đóng tin này? Các gia sư đang ứng tuyển sẽ được thông báo.")) return;
    setClosingId(posting.id);
    try {
      await apiCancelPosting(posting.id, null, authToken);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tin của tôi"
        title="Tin tìm gia sư"
        description="Theo dõi tin đã đăng, xem gia sư ứng tuyển và nhắn tin với từng ứng viên."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button className="cursor-pointer" onClick={() => setShowForm(true)}><Plus size={16} /> Đăng tin mới</Button>
          </div>
        )}
      />
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>}
      {!loading && items.length === 0 && (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">Bạn chưa đăng tin nào. Bấm “Đăng tin mới” để bắt đầu.</Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((p) => {
          const status = STATUS[p.status] || { label: p.status, tone: "neutral" };
          return (
            <Card key={p.id} className="space-y-3 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tin #{p.id}</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{purposeLabel(p.purpose)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{[p.district, p.province].filter(Boolean).join(", ")}</p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <dl className="grid gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                {p.address && <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" /><dd>{p.address}</dd></div>}
                {p.durationType && <div className="flex items-start gap-2"><Clock size={15} className="mt-0.5 shrink-0 text-slate-400" /><dd>{labelOf(DURATION_OPTIONS, p.durationType)}</dd></div>}
              </dl>
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{p.note}</p>
              {expandedId === p.id && (
                <dl className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                  {[["Yêu cầu giới tính", labelOf(GENDER_OPTIONS, p.genderRequirement)],
                    ["Yêu cầu gia sư", labelOf(TUTOR_OPTIONS, p.tutorRequirement)],
                    ["Thời gian có thể học", p.availableTime],
                    ["Mục đích", purposeLabel(p.purpose)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-white">{v || "Chưa cung cấp"}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {[p.sessionsPerWeek ? `${p.sessionsPerWeek} buổi/tuần` : null, p.teachingMode ? CLASS_MODE_LABEL[p.teachingMode] : null,
                  p.referencePrice ? `Phí tham khảo ${formatVnd(p.referencePrice)}/buổi` : null].filter(Boolean).join(" · ")}
              </p>
              {p.status === "CANCELLED" && p.cancelReason && <p className="text-xs text-rose-600 dark:text-rose-400">Lý do hủy: {p.cancelReason}</p>}
              {p.status === "MATCHED" && <p className="text-xs text-emerald-700 dark:text-emerald-400">Lớp dạy thử đã được tạo từ tin này, tin đã đóng.</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                  {expandedId === p.id ? "Thu gọn" : "Xem chi tiết"}
                </Button>
                {(p.status === "OPEN" || p.status === "REMATCH" || p.status === "MATCHED") && (
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setApplicantsOf(p)}>
                    <Users size={15} /> Xem ứng viên ({p.applicantCount})
                  </Button>
                )}
                {(p.status === "NEW" || p.status === "OPEN") && (
                  <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => close(p)} disabled={closingId === p.id}>
                    {p.status === "NEW" ? "Hủy tin" : "Đóng tin"}
                  </Button>
                )}
                {p.status === "CANCELLED" && <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setShowForm(true)}>Tạo tin mới</Button>}
              </div>
            </Card>
          );
        })}
      </div>
      {showForm && <NewPostingModal token={authToken} onClose={closeForm} onCreated={() => { closeForm(); load(); }} />}
      {applicantsOf && <ApplicantsModal posting={applicantsOf} token={authToken} onClose={() => { setApplicantsOf(null); load(); }} />}
    </div>
  );
}
