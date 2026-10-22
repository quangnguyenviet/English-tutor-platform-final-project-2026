import { Tag, MonitorSmartphone, Home, Plus, Trash2 } from "lucide-react";
import Card from "../../../ui/Card";
import { SectionCard, Field, TextField } from "./EditFields";

const MODE_LABEL = { ONLINE: "Online", AT_HOME: "Tại nhà" };
const MODE_ICON = { ONLINE: MonitorSmartphone, AT_HOME: Home };
const MODE_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "AT_HOME", label: "Tại nhà" },
];

/**
 * PricesSection — Học phí (chế độ xem).
 * @param {Object[]} prices - [{ teachingMode, pricePerSession, program }]
 */
export default function PricesSection({ prices = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Học phí
        </h3>
      </div>

      {prices.length > 0 ? (
        <div className="space-y-2">
          {prices.map((price, idx) => {
            const Icon = MODE_ICON[price.teachingMode] || MonitorSmartphone;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {MODE_LABEL[price.teachingMode] || price.teachingMode}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {price.pricePerSession != null
                      ? `${price.pricePerSession.toLocaleString("vi-VN")}₫ / buổi`
                      : "–"}
                  </div>
                  {price.program && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {price.program}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có thông tin học phí.
        </p>
      )}
    </Card>
  );
}

/**
 * PricesSectionEdit — Học phí (chế độ sửa).
 * Repeater hình thức dạy + học phí/buổi (VNĐ) + chương trình.
 * pricePerSession luôn được normalize về number trước khi lưu vào form state.
 */
export function PricesSectionEdit({ form, onChange }) {
  const prices = form.prices || [];

  const updatePrice = (idx, field, value) =>
    onChange(
      "prices",
      prices.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  const addPrice = () =>
    onChange("prices", [
      ...prices,
      { teachingMode: "ONLINE", pricePerSession: 200000, program: "" },
    ]);
  const removePrice = (idx) =>
    onChange("prices", prices.filter((_, i) => i !== idx));

  return (
    <SectionCard
      icon={Tag}
      iconClass="text-rose-600 dark:text-rose-400"
      title="Học phí"
      hint="Mỗi dòng là một hình thức dạy. Học phí nhập theo VNĐ mỗi buổi."
    >
      <div className="space-y-3">
        {prices.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            Chưa có thông tin học phí.
          </p>
        )}

        {prices.map((price, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Học phí {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removePrice(idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <Field label="Hình thức" required>
              <div className="flex items-center gap-5 pt-1.5">
                {MODE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`teachingMode-${idx}`}
                      value={opt.value}
                      checked={price.teachingMode === opt.value}
                      onChange={() => updatePrice(idx, "teachingMode", opt.value)}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                type="number"
                min="0"
                step="1000"
                label="Học phí mỗi buổi (VNĐ)"
                required
                value={price.pricePerSession}
                onChange={(e) =>
                  updatePrice(
                    idx,
                    "pricePerSession",
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
                placeholder="VD: 200000"
              />
              <TextField
                label="Chương trình"
                value={price.program}
                onChange={(e) => updatePrice(idx, "program", e.target.value)}
                maxLength={100}
                placeholder="VD: Luyện thi IELTS"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPrice}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-400 dark:hover:border-rose-600 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer w-fit active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm học phí</span>
        </button>
      </div>
    </SectionCard>
  );
}
