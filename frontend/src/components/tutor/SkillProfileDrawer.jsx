import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Clock, Inbox, BarChart3, TrendingDown } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

/**
 * Ngăn kéo "Bảng thống kê hồ sơ học sinh" (FR-13, UC-T06 bước 2). Hiển thị
 * kỹ năng của học sinh kèm tỷ lệ sai + thời gian chưa ôn, mặc định sắp theo
 * tỷ lệ sai giảm rồi lâu chưa ôn (trùng thứ tự backend). Rỗng thì hiện
 * trạng thái thân thiện (chưa có dữ liệu trả lời quiz). Trạng thái mở do
 * prop `defaultOpen` điều khiển (mặc định true); khi đóng, tiêu đề kèm
 * chip tóm tắt số kỹ năng có thống kê để mở lại nhanh.
 */

/** Cách đọc "đã ôn N ngày trước" cho cột thời gian. */
function daysSince(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  return days;
}

export default function SkillProfileDrawer({ items, loading, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [sortKey, setSortKey] = useState("error");

  const sorted = useMemo(() => {
    const list = [...(items || [])];
    if (sortKey === "alpha") {
      list.sort((a, b) => (a.skillName || a.skillCode).localeCompare(b.skillName || b.skillCode, "vi"));
    } else if (sortKey === "category") {
      list.sort((a, b) => (a.category || "Z").localeCompare(b.category || "Z", "vi"));
    } else {
      // error: tỷ lệ sai giảm, null cuối; rồi lâu chưa ôn tăng.
      list.sort((a, b) => {
        const ra = a.errorRate ?? -1;
        const rb = b.errorRate ?? -1;
        if (rb !== ra) return rb - ra;
        return (daysSince(a.lastPracticedAt) ?? 0) - (daysSince(b.lastPracticedAt) ?? 0);
      });
    }
    return list;
  }, [items, sortKey]);

  const hasData = !loading && (items || []).length > 0;

  useEffect(() => {
    if (!hasData) setSortKey("error");
  }, [hasData]);

  const categories = useMemo(() => {
    const map = new Map();
    for (const it of items || []) {
      const key = it.category || "Khác";
      if (!map.has(key)) map.set(key, 0);
      map.set(key, map.get(key) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [items]);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
            <BarChart3 size={16} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Hồ sơ kỹ năng học sinh
              </h4>
              {!open && !loading && hasData && (
                <Badge tone="slate" size="xs">
                  {items.length} kỹ năng
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tham khảo khi chọn trọng tâm câu hỏi
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={open ? "Đóng bảng" : "Mở bảng"}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : hasData ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Sắp xếp:
                </label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="error">Tỷ lệ sai giảm</option>
                  <option value="alpha">Bảng chữ cái A–Z</option>
                  <option value="category">Nhóm chủ điểm</option>
                </select>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {sorted.map((it) => {
                  const days = daysSince(it.lastPracticedAt);
                  const rate = it.errorRate;
                  return (
                    <div
                      key={it.skillCode}
                      className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {it.skillName || it.skillCode}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {it.category && <Badge tone="violet">{it.category}</Badge>}
                            {rate != null && (
                              <Badge tone={rate >= 0.5 ? "rose" : "amber"}>
                                <TrendingDown size={11} /> {Math.round(rate * 100)}% sai
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-slate-400">
                          <p>
                            {it.totalCorrect ?? 0}/{it.totalAttempts ?? 0} đúng
                          </p>
                          <p className="mt-1 flex items-center justify-end gap-1">
                            <Clock size={11} />
                            {days == null
                              ? "chưa ôn"
                              : days === 0
                                ? "hôm nay"
                                : `${days} ngày trước`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {categories.length > 1 && (
                <p className="text-xs text-slate-400">
                  {categories.length} nhóm chủ điểm · {items.length} kỹ năng có thống kê
                </p>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
              <Inbox size={20} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Chưa có dữ liệu trả lời quiz
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Học sinh chưa làm quiz nào. Bảng sẽ cập nhật sau khi có câu trả lời.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
