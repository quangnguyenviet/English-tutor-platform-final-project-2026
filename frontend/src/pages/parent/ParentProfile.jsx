import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mail, MapPin, Pencil, Phone, Target, User, Users } from "lucide-react";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import ParentWizard from "../../components/messaging/ParentWizard";
import { useAuth } from "../../context/AuthContext";
import { apiGetParentProfile, initialsOf, purposeLabel } from "../../lib/messagingApi";

function Field({ icon: Icon, label, value, className }) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Icon size={14} /> {label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-white">{value || "Chưa cập nhật"}</dd>
    </div>
  );
}

/** Trang cá nhân của phụ huynh: xem và chỉnh sửa hồ sơ, xem danh sách con. */
export default function ParentProfile() {
  const { token, session, updateSessionProfile } = useAuth();
  const authToken = token || session?.token;
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setProfile(await apiGetParentProfile(authToken));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(result) {
    setProfile(result);
    setEditing(false);
    setSaved(true);
    updateSessionProfile({ name: result.fullName });
  }

  return (
    <div className="mx-auto min-h-[60dvh] max-w-3xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader className="!mb-0" eyebrow="Tài khoản" title="Trang cá nhân" description="Xem và chỉnh sửa thông tin của bạn." />
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {saved && !editing && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={15} /> Đã lưu thông tin.</p>
      )}
      {!profile && !error && <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}

      {profile && editing && (
        <Card>
          <ParentWizard initial={profile} token={authToken} submitLabel="Lưu thay đổi" cancelLabel="Hủy"
            onCancel={() => setEditing(false)} onDone={handleSaved} />
        </Card>
      )}

      {profile && !editing && (
        <>
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar initials={initialsOf(profile.fullName)} src={session?.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{profile.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phụ huynh</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setSaved(false); setEditing(true); }}>
                <Pencil size={15} /> Chỉnh sửa
              </Button>
            </div>
            <dl className="grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 sm:grid-cols-2">
              <Field icon={Mail} label="Email đăng nhập Google" value={session?.email} />
              <Field icon={Phone} label="Số điện thoại" value={profile.phone} />
              <Field icon={Target} label="Mục đích học của con" value={profile.purpose ? purposeLabel(profile.purpose) : null} />
              <Field icon={MapPin} label="Khu vực" value={[profile.ward, profile.province].filter(Boolean).join(", ")} />
              <Field icon={MapPin} label="Địa chỉ chi tiết (gia sư không nhìn thấy)" value={profile.address} className="sm:col-span-2" />
            </dl>
          </Card>

          <Card className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white"><Users size={16} /> Con của bạn</h2>
            {profile.children.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có hồ sơ học sinh. Hồ sơ được tạo khi bạn đồng ý một đề xuất lớp học.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {profile.children.map((child) => (
                  <li key={child.studentId} className="flex items-center gap-3 py-2.5 text-sm">
                    <User size={15} className="text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">{child.fullName}</span>
                    {child.grade && <span className="text-slate-500 dark:text-slate-400">{child.grade}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
