import { Calendar } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";
import { SectionCard } from "./EditFields";

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

/**
 * AvailabilitySectionEdit — Lịch rảnh (chế độ sửa).
 * Bảng checkbox 7 ngày × 3 ca; tick = có thể dạy khung giờ đó.
 */
export function AvailabilitySectionEdit({ form, onChange }) {
  const availabilities = form.availabilities || [];

  const toggleSlot = (dayOfWeek, timeSlot) => {
    const exists = availabilities.some(
      (a) => a.dayOfWeek === dayOfWeek && a.timeSlot === timeSlot,
    );
    onChange(
      "availabilities",
      exists
        ? availabilities.filter(
            (a) => !(a.dayOfWeek === dayOfWeek && a.timeSlot === timeSlot),
          )
        : [...availabilities, { dayOfWeek, timeSlot }],
    );
  };

  return (
    <SectionCard
      icon={Calendar}
      iconClass="text-blue-600 dark:text-blue-400"
      title="Lịch rảnh"
      hint="Chọn các khung giờ bạn có thể sắp xếp dạy."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-20">
                Khung
              </th>
              {TIME_SLOTS.map((slot) => (
                <th
                  key={slot}
                  className="py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-2"
                >
                  {SLOT_LABEL[slot]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <tr
                key={day}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 pr-2">
                  {DAY_LABEL[day]}
                </td>
                {TIME_SLOTS.map((slot) => (
                  <td key={slot} className="py-2.5 px-2">
                    <label className="inline-flex items-center justify-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={availabilities.some(
                          (a) => a.dayOfWeek === day && a.timeSlot === slot,
                        )}
                        onChange={() => toggleSlot(day, slot)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {availabilities.length === 0 && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
          Chưa chọn khung giờ rảnh nào. Nên chọn ít nhất 1 khung giờ để lễ tân dễ ghép lớp.
        </p>
      )}
    </SectionCard>
  );
}
