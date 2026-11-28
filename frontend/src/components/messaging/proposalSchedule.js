/** Quy tắc lịch học của đề xuất, khớp với TrialSessionPlanner ở backend. Thứ: 1 = T2 … 7 = CN. */

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const DEFAULT_SLOT_TIME = { startTime: "19:00", endTime: "20:30" };

/** Ngày hôm nay theo giờ Việt Nam, dạng yyyy-MM-dd. */
export const todayInVietnam = () => new Date().toLocaleDateString("en-CA", { timeZone: VN_TIME_ZONE });

const isoDay = (date) => date.getUTCDay() || 7;

const parseDate = (value) => new Date(`${value}T00:00:00Z`);

export const isSlotValid = (slot) => Boolean(slot.startTime && slot.endTime) && slot.startTime < slot.endTime;

/** Thông báo lỗi của ngày bắt đầu học, chuỗi rỗng nếu hợp lệ hoặc chưa chọn. */
export function startDateError(startDate) {
  return startDate && startDate < todayInVietnam() ? "Ngày bắt đầu học không được ở trong quá khứ." : "";
}

/** Buổi học thử: buổi đầu tiên trong lịch tính từ ngày bắt đầu, bỏ qua buổi hôm nay đã bắt đầu. */
export function firstSession(startDate, slots) {
  if (!startDate || slots.length === 0 || !slots.every(isSlotValid)) return null;
  const now = Date.now();
  const date = parseDate(startDate);
  // Hai tuần là đủ để gặp một buổi chưa diễn ra.
  for (let i = 0; i < 14; i++) {
    const value = date.toISOString().slice(0, 10);
    const slot = slots.find((s) => s.dayOfWeek === isoDay(date));
    if (slot && new Date(`${value}T${slot.startTime}:00+07:00`).getTime() > now) {
      return { date: value, ...slot };
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return null;
}
