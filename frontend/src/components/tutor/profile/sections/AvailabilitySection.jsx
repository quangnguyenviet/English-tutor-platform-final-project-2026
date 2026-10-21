import { Calendar } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";

const DAY_LABEL = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};
const SLOT_LABEL = { MORNING: "Sáng", AFTERNOON: "Chiều", EVENING: "Tối" };
const TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING"];

/**
 * AvailabilitySection — Lịch rảnh (chế độ xem).
 * @param {Object[]} availabilities - [{ dayOfWeek 1-7, timeSlot }]
 */
export default function AvailabilitySection({ availabilities = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Lịch rảnh
        </h3>
      </div>

      {availabilities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th
                  className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                >
                  Thứ / Ca
                </th>
                <th
                  className="px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                >
                  Sáng
                </th>
                <th
                  className="px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                >
                  Chiều
                </th>
                <th
                  className="px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                >
                  Tối
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-600 dark:text-slate-300">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <tr key={day} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-2 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {DAY_LABEL[day]}
                  </td>
                  {TIME_SLOTS.map((slot) => (
                    <td
                      key={slot}
                      className="px-2 py-2 text-center text-xs"
                    >
                      {availabilities.some(
                        (a) => a.dayOfWeek === day && a.timeSlot === slot
                      ) ? (
                        <Badge tone="emerald" size="xs" className="w-full">
                          {SLOT_LABEL[slot]}
                        </Badge>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">
                          –
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có lịch rảnh.
        </p>
      )}
    </Card>
  );
}
