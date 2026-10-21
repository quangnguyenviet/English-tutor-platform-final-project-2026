import { Tag, MonitorSmartphone, Home } from "lucide-react";
import Card from "../../../ui/Card";

const MODE_LABEL = { ONLINE: "Online", AT_HOME: "Tại nhà" };
const MODE_ICON = { ONLINE: MonitorSmartphone, AT_HOME: Home };

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
