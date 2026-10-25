import { GraduationCap, Briefcase, Building2 } from "lucide-react";
import Card from "../../../ui/Card";
import { SectionCard, Field, TextField, SelectField, LockedField } from "./EditFields";
import { universitiesList } from "../../../../data/vietnamLocations";
import { isFieldLocked } from "../../../../lib/tutorProfileModel";

const EDU_LABEL = {
  STUDENT: "Đang học",
  GRADUATED: "Đã tốt nghiệp",
  LECTURER: "Giảng viên",
};

/**
 * EducationSection — Trình độ học vấn & kinh nghiệm (chế độ xem).
 * @param {Object} data
 */
export default function EducationSection({
  university,
  educationStatus,
  experienceYears,
  address,
}) {

  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Thông tin học vấn
        </h3>
      </div>

      <div className="space-y-3">
        <DetailRow
          icon={Building2}
          label="Trường / cơ sở"
          value={university || "–"}
        />
        <DetailRow
          icon={GraduationCap}
          label="Trạng thái học vấn"
          value={EDU_LABEL[educationStatus] || educationStatus || "–"}
        />
        <DetailRow
          icon={Briefcase}
          label="Kinh nghiệm dạy"
          value={
            experienceYears != null
              ? `${experienceYears} năm`
              : "–"
          }
        />
        <DetailRow
          icon={Building2}
          label="Địa chỉ"
          value={address || "–"}
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
 * EducationSectionEdit — Trình độ học vấn & kinh nghiệm (chế độ sửa).
 * Khi hồ sơ ACTIVE: university hiển thị khóa.
 */
export function EducationSectionEdit({ form, onChange, errors = {}, profileStatus }) {
  const locked = (field) => isFieldLocked(field, profileStatus);

  return (
    <SectionCard
      icon={Building2}
      iconClass="text-blue-600 dark:text-blue-400"
      title="Thông tin học vấn"
    >
      <div className="space-y-4">
        {locked("university") ? (
          <LockedField label="Trường / cơ sở" value={form.university} />
        ) : (
          <SelectField
            fieldId="university"
            label="Trường đang học / Đã tốt nghiệp"
            required
            error={errors.university}
            value={form.university}
            onChange={(e) => onChange("university", e.target.value)}
          >
            <option value="">— Chọn trường —</option>
            {universitiesList.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </SelectField>
        )}

        <Field
          fieldId="educationStatus"
          label="Trạng thái học vấn"
          required
          error={errors.educationStatus}
        >
          <div className="flex flex-wrap items-center gap-5 pt-1.5">
            {Object.entries(EDU_LABEL).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="educationStatus"
                  value={value}
                  checked={form.educationStatus === value}
                  onChange={() => onChange("educationStatus", value)}
                  className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            fieldId="experienceYears"
            type="number"
            min="0"
            max="50"
            label="Số năm kinh nghiệm"
            required
            value={form.experienceYears}
            onChange={(e) => onChange("experienceYears", e.target.value)}
            error={errors.experienceYears}
          />
          <TextField
            fieldId="address"
            label="Địa chỉ"
            required
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
            error={errors.address}
            placeholder="VD: Cầu Giấy, Hà Nội"
          />
        </div>
      </div>
    </SectionCard>
  );
}
