import { BookOpen } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";

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
