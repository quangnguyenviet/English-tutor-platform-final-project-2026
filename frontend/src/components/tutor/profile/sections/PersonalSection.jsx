import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Card from "../../../ui/Card";
import { SectionCard, Field, TextField, LockedField } from "./EditFields";
import { isFieldLocked } from "../../../../lib/tutorProfileModel";

function formatDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const GENDER_LABEL = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

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
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;

  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex flex-col items-center text-center mb-5">
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt="Ảnh đại diện"
            onError={() => setAvatarFailed(true)}
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

/**
 * PersonalSectionEdit — Thông tin cá nhân & liên hệ (chế độ sửa).
 * Khi hồ sơ ACTIVE: fullName, dateOfBirth, gender, hometown hiển thị khóa.
 *
 * @param {Object} form - form state (mapApiToForm)
 * @param {function} onChange - (field, value) => void
 * @param {Object} errors - { fieldName: message }
 * @param {string} profileStatus
 * @param {File|null} avatarFile - ảnh mới chọn (chưa upload — task 7)
 * @param {function} onAvatarChange - (File|null) => void
 */
export function PersonalSectionEdit({
  form,
  onChange,
  errors = {},
  profileStatus,
  avatarFile,
  onAvatarChange,
}) {
  const locked = (field) => isFieldLocked(field, profileStatus);

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const avatarInputRef = useRef(null);

  // Dọn object URL khi đổi ảnh hoặc unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setAvatarFailed(false);
    onAvatarChange(file);
  };

  const handleRemoveNewAvatar = () => {
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAvatarFailed(false);
    onAvatarChange(null);
  };

  const showPreview = Boolean(previewUrl) || (Boolean(form.avatarUrl) && !avatarFailed);

  return (
    <SectionCard
      icon={User}
      iconClass="text-blue-600 dark:text-blue-400"
      title="Thông tin cá nhân & liên hệ"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {locked("fullName") ? (
          <LockedField label="Họ và tên" value={form.fullName} />
        ) : (
          <TextField
            fieldId="fullName"
            label="Họ và tên"
            required
            value={form.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            error={errors.fullName}
            placeholder="VD: Phạm Công Minh"
          />
        )}

        {locked("dateOfBirth") ? (
          <LockedField label="Ngày sinh" value={formatDate(form.dateOfBirth)} />
        ) : (
          <TextField
            fieldId="dateOfBirth"
            type="date"
            label="Ngày sinh"
            required
            value={form.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            error={errors.dateOfBirth}
            max={new Date().toISOString().split("T")[0]}
          />
        )}

        {locked("gender") ? (
          <LockedField
            label="Giới tính"
            value={GENDER_LABEL[form.gender] || form.gender}
          />
        ) : (
          <Field fieldId="gender" label="Giới tính" required error={errors.gender}>
            <div className="flex items-center gap-5 pt-1.5">
              {GENDER_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={form.gender === opt.value}
                    onChange={() => onChange("gender", opt.value)}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        <TextField
          fieldId="phone"
          type="tel"
          label="Số điện thoại"
          required
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          error={errors.phone}
          placeholder="Số điện thoại chính"
        />

        {locked("hometown") ? (
          <LockedField label="Quê quán" value={form.hometown} />
        ) : (
          <TextField
            fieldId="hometown"
            label="Quê quán"
            value={form.hometown}
            onChange={(e) => onChange("hometown", e.target.value)}
            error={errors.hometown}
            maxLength={100}
            placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
            hint="Tối đa 100 ký tự"
          />
        )}
      </div>

      {/* Ảnh đại diện — chỉ upload khi bấm Lưu (task 7) */}
      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Ảnh đại diện
        </span>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            {showPreview ? (
              <img
                src={previewUrl || form.avatarUrl}
                alt="Ảnh đại diện"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm transition-all active:scale-[0.98]">
                <Upload className="w-3.5 h-3.5" />
                <span>{avatarFile ? "Đổi ảnh" : "Chọn ảnh"}</span>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {avatarFile && (
                <button
                  type="button"
                  onClick={handleRemoveNewAvatar}
                  className="text-xs font-medium text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
                >
                  Gỡ ảnh mới
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {avatarFile
                ? avatarFile.name
                : "Kích thước khuyên dùng: 300×400px, dưới 5MB"}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
