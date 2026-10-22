import { BookOpen, Plus, Trash2 } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";
import { SectionCard, SelectField } from "./EditFields";
import { subjectList, gradeList } from "../../../../data/vietnamLocations";

/**
 * SpecialtiesSection — Chuyên môn (chế độ xem).
 * @param {Object[]} specialties - [{ specialty, gradeLevel }]
 */
export default function SpecialtiesSection({ specialties = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Chuyên môn
        </h3>
      </div>

      {specialties.length > 0 ? (
        <div className="space-y-2">
          {specialties.map((spec, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            >
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {spec.specialty}
                </div>
                {spec.gradeLevel && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {spec.gradeLevel}
                  </div>
                )}
              </div>
              <Badge tone="violet" size="xs">
                Chuyên môn
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có chuyên môn.
        </p>
      )}
    </Card>
  );
}

/**
 * SpecialtiesSectionEdit — Chuyên môn (chế độ sửa).
 * Repeater môn học + cấp lớp.
 */
export function SpecialtiesSectionEdit({ form, onChange }) {
  const specialties = form.specialties || [];

  const updateSpecialty = (idx, field, value) =>
    onChange(
      "specialties",
      specialties.map((sp, i) => (i === idx ? { ...sp, [field]: value } : sp)),
    );
  const addSpecialty = () =>
    onChange("specialties", [
      ...specialties,
      { specialty: subjectList[0] || "", gradeLevel: gradeList[0] || "" },
    ]);
  const removeSpecialty = (idx) =>
    onChange("specialties", specialties.filter((_, i) => i !== idx));

  return (
    <SectionCard
      icon={BookOpen}
      iconClass="text-violet-600 dark:text-violet-400"
      title="Chuyên môn"
      hint="Liệt kê môn học và cấp lớp bạn có thể dạy."
    >
      <div className="space-y-3">
        {specialties.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            Chưa có chuyên môn.
          </p>
        )}

        {specialties.map((sp, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Chuyên môn {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSpecialty(idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                label="Môn học"
                required
                value={sp.specialty}
                onChange={(e) => updateSpecialty(idx, "specialty", e.target.value)}
              >
                {subjectList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectField>
              <SelectField
                label="Cấp lớp"
                value={sp.gradeLevel}
                onChange={(e) => updateSpecialty(idx, "gradeLevel", e.target.value)}
              >
                {gradeList.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </SelectField>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSpecialty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 text-xs font-semibold transition-colors cursor-pointer w-fit active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm chuyên môn</span>
        </button>
      </div>
    </SectionCard>
  );
}
