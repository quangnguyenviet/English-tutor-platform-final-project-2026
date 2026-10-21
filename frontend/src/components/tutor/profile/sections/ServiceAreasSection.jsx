import { MapPin } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";

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
