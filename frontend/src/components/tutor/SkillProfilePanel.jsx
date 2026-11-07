import { useEffect, useMemo, useState } from "react";
import { Clock, Inbox, TrendingDown } from "lucide-react";
import clsx from "clsx";
import Badge from "../ui/Badge";

/**
 * Nội dung tab "Hồ sơ kỹ năng" trong cột điều khiển (SKP, FR-13 / UC-T06
 * bước 2) — hiển thị kỹ năng của học sinh kèm tỷ lệ sai + thời gian chưa ôn,
 * mặc định sắp theo tỷ lệ sai giảm rồi lâu chưa ôn (trùng thứ tự backend).
 * Rỗng thì hiện trạng thái thân thiện (chưa có dữ liệu trả lời quiz).
 *
 * Là THÂN TAB (không có nút trigger/đóng mở riêng): việc chọn tab do cha
 * điều khiển, nên khi chuyển qua lại với tab chat AI, component giữ nguyên
 * state sort và KHÔNG xê dịch khung chat.
 */

/** Cách đọc "đã ôn N ngày trước" cho cột thời gian. */
function daysSince(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

export default function SkillProfilePanel({ items, loading }) {
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Thanh công cụ: sắp xếp — luôn hiện, cao cố định. */}
      {hasData && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sắp xếp:</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="error">Tỷ lệ sai giảm</option>
              <option value="alpha">Bảng chữ cái A–Z</option>
              <option value="category">Nhóm chủ điểm</option>
            </select>
          </div>
          {categories.length > 1 && (
            <p className="text-xs text-slate-400">
              {categories.length} nhóm chủ điểm · {items.length} kỹ năng
            </p>
          )}
        </div>
      )}

      {/* Danh sách — cuộn nội bộ trong khung tab. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : hasData ? (
          <div className="space-y-2">
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
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-xs rounded-lg border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
              <Inbox size={20} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Chưa có dữ liệu trả lời quiz
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Học sinh chưa làm quiz nào. Bảng sẽ cập nhật sau khi có câu trả lời.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer — chỉ hiện khi có nhiều nhóm, không thay đổi chiều cao tab. */}
      {hasData && categories.length > 1 && (
        <div className={clsx("shrink-0 border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-800/60")}>
          Tham khảo khi chọn trọng tâm câu hỏi cho bài giảng này.
        </div>
      )}
    </div>
  );
}
