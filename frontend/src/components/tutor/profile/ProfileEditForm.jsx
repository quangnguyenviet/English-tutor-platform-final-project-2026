import { useState } from "react";
import { Info, Save, Send, X } from "lucide-react";
import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import ProfileStatusBanner from "./ProfileStatusBanner";
import { PersonalSectionEdit } from "./sections/PersonalSection";
import { EducationSectionEdit } from "./sections/EducationSection";
import { IntroSectionEdit } from "./sections/IntroSection";
import { ServiceAreasSectionEdit } from "./sections/ServiceAreasSection";
import { SpecialtiesSectionEdit } from "./sections/SpecialtiesSection";
import { PricesSectionEdit } from "./sections/PricesSection";
import { AvailabilitySectionEdit } from "./sections/AvailabilitySection";
import { CredentialsSectionEdit } from "./sections/CredentialsSection";
import {
  PROFILE_STATUS,
  getEditMode,
  mapApiToForm,
  validate,
} from "../../../lib/tutorProfileModel";

/**
 * ProfileEditForm — Chế độ chỉnh sửa / tạo mới hồ sơ gia sư.
 * - Tạo mới (profile = null): form rỗng, không hiện banner trạng thái.
 * - Full edit (INCOMPLETE / REJECTED): sửa tất cả trường, có nút "Gửi duyệt".
 * - Restricted edit (ACTIVE): trường khóa (fullName, dateOfBirth, gender,
 *   hometown, university) hiển thị read-only; Lưu trực tiếp không cần duyệt lại.
 *
 * @param {Object|null} profile - Dữ liệu hồ sơ từ backend; null = chưa có hồ sơ
 * @param {Object} [initialForm] - Form state khởi tạo (dùng cho chế độ tạo mới)
 * @param {function} onCancel - Trở về trang trước, bỏ thay đổi
 * @param {function} onSave - ({ form, avatarFile }) => Promise — lưu hồ sơ
 * @param {function} onSubmitForReview - ({ form, avatarFile }) => Promise — gửi duyệt
 */
export default function ProfileEditForm({
  profile,
  initialForm,
  onCancel,
  onSave,
  onSubmitForReview,
}) {
  const status = profile?.profileStatus || PROFILE_STATUS.INCOMPLETE;
  const editMode = getEditMode(status);
  const isFullEdit = editMode === "full";
  const isCreate = !profile;

  const [form, setForm] = useState(
    () => initialForm || mapApiToForm(profile),
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Xóa lỗi của trường vừa sửa
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  /** Validate rồi cuộn tới trường lỗi đầu tiên. Trả true nếu hợp lệ. */
  const runValidation = () => {
    const errs = validate(form, status);
    setErrors(errs);
    const firstError = Object.keys(errs).find((key) => errs[key]);
    if (firstError) {
      const el = document.getElementById(`field-${firstError}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    }
    return !firstError;
  };

  // Trả nguyên form (gồm File object trong credentials) — parent chịu trách nhiệm
  // upload file mới rồi loại bỏ trước khi build payload gửi backend.
  const handleSave = async () => {
    if (!runValidation()) return;
    setSaving(true);
    try {
      await onSave?.({ form, avatarFile });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!runValidation()) return;
    setSaving(true);
    try {
      await onSubmitForReview?.({ form, avatarFile });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hồ sơ gia sư"
        title={isCreate ? "Tạo hồ sơ gia sư" : "Chỉnh sửa hồ sơ"}
        description={
          isCreate
            ? "Điền đầy đủ thông tin bên dưới để hoàn thiện hồ sơ giảng dạy và bắt đầu nhận lớp."
            : isFullEdit
              ? "Chỉnh sửa đầy đủ thông tin, sau đó gửi duyệt để cập nhật hồ sơ."
              : "Hồ sơ đã được duyệt — chỉ sửa được các trường cho phép, lưu trực tiếp không cần duyệt lại."
        }
      />

      {!isCreate && (
        <ProfileStatusBanner
          profileStatus={status}
          rejectionReason={profile?.rejectionReason}
          reviewedAt={profile?.reviewedAt || profile?.updatedAt}
        />
      )}

      {/* Ghi chú chế độ restricted (ACTIVE) */}
      {!isFullEdit && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold">Lưu ý:</strong> Hồ sơ đã được duyệt nên các
            trường quan trọng (họ tên, ngày sinh, giới tính, quê quán, trường học) đã
            bị khóa. Các thay đổi còn lại được lưu trực tiếp, không cần duyệt lại.
          </p>
        </div>
      )}

      {/* 8 section — bố cục bất đối xứng như chế độ xem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <PersonalSectionEdit
            form={form}
            onChange={handleChange}
            errors={errors}
            profileStatus={status}
            avatarFile={avatarFile}
            onAvatarChange={setAvatarFile}
          />
          <EducationSectionEdit
            form={form}
            onChange={handleChange}
            errors={errors}
            profileStatus={status}
          />
          <IntroSectionEdit form={form} onChange={handleChange} errors={errors} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ServiceAreasSectionEdit form={form} onChange={handleChange} />
          <SpecialtiesSectionEdit form={form} onChange={handleChange} />
          <PricesSectionEdit form={form} onChange={handleChange} />
          <AvailabilitySectionEdit form={form} onChange={handleChange} />
          <CredentialsSectionEdit form={form} onChange={handleChange} />
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-30">
        <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-black/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFullEdit
                ? "Bấm Lưu hồ sơ để giữ thay đổi, hoặc Gửi duyệt để yêu cầu lễ tân xét duyệt."
                : "Thay đổi được lưu trực tiếp, không cần duyệt lại."}
            </p>
            <div className="flex items-center gap-2">
              {/* Hồ sơ chưa hoàn thiện: không cho hủy, buộc phải lưu/gửi duyệt */}
              {status !== PROFILE_STATUS.INCOMPLETE && (
                <Button variant="outline" onClick={onCancel} disabled={saving}>
                  <X size={16} /> Hủy
                </Button>
              )}
              {isFullEdit && (
                <Button
                  variant="secondary"
                  onClick={handleSubmitForReview}
                  disabled={saving}
                >
                  <Send size={16} />
                  {status === PROFILE_STATUS.REJECTED ? "Gửi duyệt lại" : "Gửi duyệt"}
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} /> Lưu hồ sơ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
