import { Mail, Phone, Calendar, User, MapPin } from "lucide-react";
import Card from "../../../ui/Card";

function formatDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * PersonalSection — Thông tin cá nhân & liên hệ (chế độ xem).
 * @param {Object} data
 */
export default function PersonalSection({
  fullName,
  email,
  phone,
  dateOfBirth,
  gender,
  hometown,
  avatarUrl,
}) {
  const GENDER_LABEL = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex flex-col items-center text-center mb-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Ảnh đại diện"
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md mb-3"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <User size={28} />
          </div>
        )}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {fullName || "–"}
        </h3>
      </div>

      <div className="space-y-3">
        <DetailRow icon={Mail} label="Email" value={email || "–"} />
        <DetailRow icon={Phone} label="Số điện thoại" value={phone || "–"} />
        <DetailRow
          icon={Calendar}
          label="Ngày sinh"
          value={dateOfBirth ? formatDate(dateOfBirth) : "–"}
        />
        <DetailRow
          icon={User}
          label="Giới tính"
          value={GENDER_LABEL[gender] || gender || "–"}
        />
        <DetailRow
          icon={MapPin}
          label="Quê quán"
          value={hometown || "–"}
        />
      </div>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-5 h-5 text-slate-400">
        <Icon size={16} />
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>
    </div>
  );
}
