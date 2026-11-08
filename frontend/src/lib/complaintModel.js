/**
 * Mô hình dữ liệu & tiện ích thuần cho Khiếu nại và Hoàn tiền (không phụ thuộc React).
 * Quy tắc hiển thị bám theo Plan_Khieu_Nai_Hoan_Tien mục 0 và API_DESIGN mục 3.9.
 */
import { PROOF_ALLOWED_TYPES, PROOF_MAX_BYTES } from "./paymentModel.js";

export { formatVnd, formatDateTime, parseMoneyInput } from "./paymentModel.js";

export const COMPLAINT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
};

export const COMPLAINT_TYPE = {
  REFUND: "REFUND",
  NON_REFUND: "NON_REFUND",
};

export const REQUEST_OUTCOME = {
  CANCELLED: "CANCELLED",
  REMATCH: "REMATCH",
};

export const REFUND_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  REJECTED: "REJECTED",
};

export const MAX_EVIDENCE_FILES = 5;

/** 4 tab khiếu nại (FR-36). */
export const COMPLAINT_TABS = [
  { key: COMPLAINT_STATUS.PENDING, label: "Chờ xử lý" },
  { key: COMPLAINT_STATUS.PROCESSING, label: "Chờ hoàn tiền" },
  { key: COMPLAINT_STATUS.RESOLVED, label: "Đã xử lý" },
  { key: COMPLAINT_STATUS.CANCELLED, label: "Đã hủy" },
];

/** 3 tab hoàn tiền của Kế toán (UC-ACC-04). */
export const REFUND_TABS = [
  { key: REFUND_STATUS.PENDING, label: "Chờ xử lý" },
  { key: REFUND_STATUS.PAID, label: "Đã hoàn tiền" },
  { key: REFUND_STATUS.REJECTED, label: "Đã từ chối" },
];

export const COMPLAINT_STATUS_META = {
  PENDING: { label: "Chờ xử lý", tone: "amber" },
  PROCESSING: { label: "Chờ hoàn tiền", tone: "blue" },
  RESOLVED: { label: "Đã xử lý", tone: "emerald" },
  CANCELLED: { label: "Đã hủy", tone: "slate" },
};

export const REFUND_STATUS_META = {
  PENDING: { label: "Chờ Kế toán xử lý", tone: "amber" },
  PAID: { label: "Đã hoàn tiền", tone: "emerald" },
  REJECTED: { label: "Bị từ chối", tone: "rose" },
};

export const TYPE_META = {
  REFUND: { label: "Hoàn tiền", tone: "violet" },
  NON_REFUND: { label: "Không hoàn tiền", tone: "sky" },
};

export const OUTCOME_META = {
  CANCELLED: { label: "Hủy lớp", tone: "rose" },
  REMATCH: { label: "Ghép lại", tone: "violet" },
};

export const ROLE_LABEL = {
  PARENT: "Phụ huynh",
  TUTOR: "Gia sư",
  STUDENT: "Học sinh",
};

/** Trạng thái hiển thị của lớp cần gia sư (khớp StaffClassRequestQueryRepository). */
export const CLASS_REQUEST_STATUS_META = {
  NEW: { label: "Chờ xử lý", tone: "amber" },
  OPEN: { label: "Đã đăng", tone: "blue" },
  TRIAL: { label: "Đang dạy thử", tone: "sky" },
  MATCHED: { label: "Ghép thành công", tone: "emerald" },
  REMATCH: { label: "Đang ghép lại", tone: "violet" },
  CANCELLED: { label: "Đã hủy", tone: "slate" },
};

export const TEACHING_MODE_LABEL = {
  ONLINE: "Online",
  AT_HOME: "Tại nhà",
};

export function metaOf(table, key) {
  return table[key] || { label: key || "—", tone: "neutral" };
}

/** Mã hiển thị đơn khiếu nại. */
export function complaintCode(id) {
  return id === null || id === undefined ? "—" : `KN-${id}`;
}

/** Chỉ đơn Chờ xử lý mới sửa, hủy, giải quyết được (FR-36). */
export function isEditable(complaint) {
  return complaint?.status === COMPLAINT_STATUS.PENDING;
}

export function canResolve(complaint) {
  return isEditable(complaint) && complaint?.complaintType === COMPLAINT_TYPE.NON_REFUND;
}

export function canRequestRefund(complaint) {
  return isEditable(complaint) && complaint?.complaintType === COMPLAINT_TYPE.REFUND;
}

/**
 * Lớp được chọn khi tạo đơn hay không, kèm lý do nếu không.
 * Hoàn tiền: phải là lớp Online đã có lớp học. Không hoàn tiền: không được Đã hủy,
 * lớp Ghép thành công phải còn trong 7 ngày.
 */
export function classRequestEligibility(item, complaintType) {
  if (!item) return { ok: false, reason: "Vui lòng chọn lớp bị khiếu nại." };
  if (complaintType === COMPLAINT_TYPE.REFUND) {
    if (item.teachingMode !== "ONLINE") {
      return { ok: false, reason: "Khiếu nại hoàn tiền chỉ áp dụng cho lớp Online." };
    }
    if (!item.classId) {
      return { ok: false, reason: "Lớp chưa có lớp học nên chưa phát sinh học phí." };
    }
    return { ok: true, reason: "" };
  }
  if (item.status === "CANCELLED") {
    return { ok: false, reason: "Lớp đã hủy, không tiếp nhận khiếu nại hủy lớp hoặc ghép lại." };
  }
  if (item.status === "MATCHED" && item.cancelDaysLeft !== null && item.cancelDaysLeft !== undefined
      && item.cancelDaysLeft < 0) {
    return {
      ok: false,
      reason: "Lớp đã ghép thành công quá 7 ngày, không thể tiếp nhận khiếu nại hủy lớp hoặc ghép lại.",
    };
  }
  return { ok: true, reason: "" };
}

/** "Còn 3 ngày được khiếu nại", hoặc null khi không áp hạn. */
export function windowLabel(target) {
  if (!target || target.status !== "MATCHED") return null;
  const days = target.cancelDaysLeft;
  if (days === null || days === undefined) return null;
  if (days < 0) return "Đã quá hạn 7 ngày";
  if (days === 0) return "Hôm nay là ngày cuối được xử lý";
  return `Còn ${days} ngày được xử lý`;
}

/**
 * Các lựa chọn hiển thị trong modal Giải quyết: lựa chọn hệ thống tự làm được
 * cộng với lựa chọn đã được xử lý thủ công (đóng đơn bằng minh chứng).
 */
export function selectableOutcomes(target) {
  if (!target) return [];
  const result = [];
  [REQUEST_OUTCOME.CANCELLED, REQUEST_OUTCOME.REMATCH].forEach((outcome) => {
    const allowed = (target.allowedOutcomes || []).includes(outcome);
    const handled = Boolean(target.alreadyHandled?.[outcome]);
    if (allowed || handled) result.push(outcome);
  });
  return result;
}

/** Lựa chọn chọn sẵn: chỉ khi có đúng một lựa chọn. */
export function defaultOutcome(target) {
  const options = selectableOutcomes(target);
  return options.length === 1 ? options[0] : "";
}

export function isHandled(target, outcome) {
  return Boolean(outcome && target?.alreadyHandled?.[outcome]);
}

/** Lỗi phía client trước khi gửi Giải quyết, khớp thông điệp UC-REC-16. */
export function validateResolve({ target, outcome, resolution, files }) {
  if (!resolution || !resolution.trim()) return "Vui lòng nhập kết quả xử lý.";
  const options = selectableOutcomes(target);
  if (options.length === 0) {
    return target?.windowExpired
      ? "Lớp đã ghép thành công quá 7 ngày, không thể hủy lớp hoặc ghép lại."
      : "Lớp không còn ở trạng thái có thể xử lý.";
  }
  if (!outcome) return "Vui lòng chọn Hủy lớp hoặc Ghép lại.";
  if (!options.includes(outcome)) return "Lựa chọn không hợp lệ với trạng thái hiện tại của lớp.";
  if (isHandled(target, outcome) && (!files || files.length === 0)) {
    return "Lớp đã được xử lý trước đó. Vui lòng đính kèm minh chứng đã xử lý.";
  }
  if (files && files.length > MAX_EVIDENCE_FILES) return `Chỉ được đính kèm tối đa ${MAX_EVIDENCE_FILES} tệp minh chứng.`;
  return null;
}

/** Nội dung popup xác nhận theo trường hợp. */
export function resolveConfirmMessage(target, outcome) {
  if (isHandled(target, outcome)) {
    return "Lớp đã được xử lý trước đó. Khiếu nại sẽ được đóng kèm minh chứng đã tải lên.";
  }
  if (outcome === REQUEST_OUTCOME.REMATCH) {
    return "Lớp học hiện tại sẽ kết thúc, gia sư hiện tại bị loại và trung tâm tìm gia sư mới. Bạn đã xác nhận với bên còn lại chưa?";
  }
  return "Lớp này sẽ bị hủy và các bên sẽ được thông báo. Bạn đã xác nhận với bên còn lại chưa?";
}

/** Kiểm tra tệp minh chứng; trả thông báo lỗi hoặc null. */
export function validateEvidenceFile(file) {
  if (!PROOF_ALLOWED_TYPES.includes(file?.type)) return `"${file?.name}": chỉ chấp nhận ảnh JPG, PNG hoặc tệp PDF.`;
  if (file.size > PROOF_MAX_BYTES) return `"${file.name}": tệp quá lớn, dung lượng tối đa là 5 MB.`;
  return null;
}

/** Thông điệp vượt hạn mức theo UC-ACC-04. */
export function refundLimitMessage(amount, remaining) {
  const fmt = (v) => `${Math.round(Number(v) || 0).toLocaleString("vi-VN")}₫`;
  return `Số tiền hoàn (${fmt(amount)}) vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: ${fmt(remaining)}).`;
}

/** Kiểm tra số tiền đề xuất / duyệt hoàn; trả lỗi hoặc null. */
export function validateRefundAmount(amount, { remaining, requested } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "Vui lòng nhập số tiền hợp lệ.";
  if (amount <= 0) return "Số tiền hoàn phải lớn hơn 0.";
  if (remaining !== undefined && remaining !== null && amount > Number(remaining)) {
    return refundLimitMessage(amount, remaining);
  }
  if (requested !== undefined && requested !== null && amount > Number(requested)) {
    return "Số tiền hoàn không được vượt số Lễ tân đề xuất.";
  }
  return null;
}

/** Người đang đăng nhập là người tạo yêu cầu hoàn tiền (không được tự xử lý). */
export function isRefundRequester(refund, currentUserId) {
  if (currentUserId === null || currentUserId === undefined) return false;
  return Number(refund?.requestedById) === Number(currentUserId);
}
