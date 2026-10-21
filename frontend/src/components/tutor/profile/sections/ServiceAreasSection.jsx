import { MapPin, Plus, Trash2 } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";
import { SectionCard, SelectField } from "./EditFields";
import { provincesAndDistricts } from "../../../../data/vietnamLocations";

/**
 * ServiceAreasSection — Khu vực dạy (chế độ xem).
 * @param {Object[]} serviceAreas - [{ province, district }]
 */
export default function ServiceAreasSection({ serviceAreas = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Khu vực dạy
        </h3>
      </div>

      {serviceAreas.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {serviceAreas.map((area, idx) => (
            <Badge key={idx} tone="emerald" size="xs">
              {area.province}{area.district ? `, ${area.district}` : ""}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có khu vực dạy.
        </p>
      )}
    </Card>
  );
}

/**
 * ServiceAreasSectionEdit — Khu vực dạy (chế độ sửa).
 * Repeater tỉnh/thành + quận/huyện; đổi tỉnh sẽ reset quận/huyện về lựa chọn đầu.
 */
export function ServiceAreasSectionEdit({ form, onChange }) {
  const areas = form.serviceAreas || [];

  const updateArea = (idx, field, value) => {
    onChange(
      "serviceAreas",
      areas.map((area, i) => {
        if (i !== idx) return area;
        const updated = { ...area, [field]: value };
        if (field === "province") {
          updated.district =
            provincesAndDistricts.find((p) => p.province === value)?.districts[0] || "";
        }
        return updated;
      }),
    );
  };

  const addArea = () =>
    onChange("serviceAreas", [...areas, { province: "", district: "" }]);
  const removeArea = (idx) =>
    onChange("serviceAreas", areas.filter((_, i) => i !== idx));

  return (
    <SectionCard
      icon={MapPin}
      iconClass="text-emerald-600 dark:text-emerald-400"
      title="Khu vực dạy"
      hint="Thêm tỉnh/thành và quận/huyện nơi bạn có thể sắp xếp dạy."
    >
      <div className="space-y-3">
        {areas.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            Chưa có khu vực dạy.
          </p>
        )}

        {areas.map((area, idx) => {
          const districts =
            provincesAndDistricts.find((p) => p.province === area.province)?.districts || [];
          return (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Khu vực {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeArea(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Tỉnh / Thành phố"
                  required
                  value={area.province}
                  onChange={(e) => updateArea(idx, "province", e.target.value)}
                >
                  <option value="">— Chọn tỉnh/thành —</option>
                  {provincesAndDistricts.map((p) => (
                    <option key={p.province} value={p.province}>{p.province}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="Quận / Huyện"
                  value={area.district}
                  onChange={(e) => updateArea(idx, "district", e.target.value)}
                >
                  <option value="">— Chọn quận/huyện —</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </SelectField>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addArea}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors cursor-pointer w-fit active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khu vực</span>
        </button>
      </div>
    </SectionCard>
  );
}
