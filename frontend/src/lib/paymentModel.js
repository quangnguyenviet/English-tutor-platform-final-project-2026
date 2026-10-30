/**
 * Mô hình dữ liệu & tiện ích thuần cho màn hình Phí nhận lớp (không phụ thuộc React).
 */

export const PAYMENT_STATUS = {
  // Bản nháp khi ghép lớp TRIAL (chưa có số tiền) và bản nháp bị huỷ: chỉ hiện ở tab "Tất cả" của Lễ tân/Admin
  NEW: "NEW",
  CANCELLED: "CANCELLED",
  NOT_SUBMITTED: "NOT_SUBMITTED",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  RESUBMIT_REQUIRED: "RESUBMIT_REQUIRED",
};

export const PAYMENT_METHOD = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
};

/** Khớp cấu hình backend app.payment (proof-max-bytes, proof-allowed-types). */
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const MIN_FEE_PERCENTAGE = 0;
export const MAX_FEE_PERCENTAGE = 50;

/** 4 trạng thái của luồng nộp - xác nhận, dùng cho tab và thẻ thống kê. */
export const TRACKED_STATUSES = [
  PAYMENT_STATUS.NOT_SUBMITTED,
  PAYMENT_STATUS.RESUBMIT_REQUIRED,
  PAYMENT_STATUS.SUBMITTED,
  PAYMENT_STATUS.APPROVED,
];

/** Thứ tự tab dùng chung cho Gia sư, Kế toán và Admin. */
export const PAYMENT_TABS = [
  { key: PAYMENT_STATUS.NOT_SUBMITTED, label: "Chưa nộp minh chứng" },
  { key: PAYMENT_STATUS.RESUBMIT_REQUIRED, label: "Yêu cầu gửi lại" },
  { key: PAYMENT_STATUS.SUBMITTED, label: "Chờ xác nhận" },
  { key: PAYMENT_STATUS.APPROVED, label: "Đã xác nhận" },
];

export const STATUS_META = {
  [PAYMENT_STATUS.NEW]: { label: "Bản nháp", tone: "slate" },
  [PAYMENT_STATUS.CANCELLED]: { label: "Đã huỷ", tone: "rose" },
  [PAYMENT_STATUS.NOT_SUBMITTED]: { label: "Chưa nộp minh chứng", tone: "slate" },
  [PAYMENT_STATUS.SUBMITTED]: { label: "Chờ xác nhận", tone: "amber" },
  [PAYMENT_STATUS.APPROVED]: { label: "Đã xác nhận", tone: "emerald" },
  [PAYMENT_STATUS.RESUBMIT_REQUIRED]: { label: "Yêu cầu gửi lại", tone: "rose" },
};

export const METHOD_LABEL = {
  [PAYMENT_METHOD.BANK_TRANSFER]: "Chuyển khoản",
  [PAYMENT_METHOD.CASH]: "Tiền mặt",
};

/** 640000 -> "640.000 ₫". Giá trị rỗng hoặc không phải số -> "—". */
export function formatVnd(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("vi-VN")} ₫`;
}

/** Cho phép nhập "640.000", "640,000" hoặc "640000"; trả về số hoặc null nếu không hợp lệ. */
export function parseMoneyInput(text) {
  const digits = String(text ?? "").replace(/[\s.,₫đ]/gi, "");
  if (digits === "" || !/^\d+$/.test(digits)) return null;
  return Number(digits);
}

/** Trả về thông báo lỗi tiếng Việt nếu tệp biên lai không hợp lệ, ngược lại null. */
export function validateProofFile(file) {
  if (!file) return "Vui lòng chọn tệp biên lai.";
  if (!PROOF_ALLOWED_TYPES.includes(file.type)) {
    return "Chỉ chấp nhận ảnh JPG, PNG hoặc tệp PDF.";
  }
  if (file.size > PROOF_MAX_BYTES) {
    return `Tệp quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Dung lượng tối đa là 5 MB.`;
  }
  return null;
}

/** Gia sư chỉ được nộp khi chưa nộp hoặc bị yêu cầu gửi lại. */
export function canSubmitProof(payment) {
  return (
    payment?.status === PAYMENT_STATUS.NOT_SUBMITTED ||
    payment?.status === PAYMENT_STATUS.RESUBMIT_REQUIRED
  );
}

/** Lễ tân chỉ chỉnh được tỷ lệ phí khi khoản phí chưa có minh chứng. */
export function canEditFeeRate(payment) {
  return payment?.status === PAYMENT_STATUS.NOT_SUBMITTED;
}

/**
 * Kế toán xác nhận được khi khoản phí đang chờ, đã nhập số tiền hợp lệ
 * và người xác nhận không phải người đã nộp/thu hộ biên lai.
 */
export function canConfirmPayment(payment, receivedAmount, currentUserId) {
  if (payment?.status !== PAYMENT_STATUS.SUBMITTED) return false;
  if (receivedAmount === null || receivedAmount === undefined || Number.isNaN(receivedAmount)) return false;
  if (receivedAmount < 0) return false;
  return !isSameActor(payment, currentUserId);
}

/** Người đang đăng nhập chính là người đã nộp/thu hộ biên lai. */
export function isSameActor(payment, currentUserId) {
  if (currentUserId === null || currentUserId === undefined) return false;
  if (payment?.uploadedBy === null || payment?.uploadedBy === undefined) return false;
  return Number(payment.uploadedBy) === Number(currentUserId);
}

/** Đếm số khoản theo trạng thái để hiển thị trên StatCard. */
export function countByStatus(items = []) {
  const counts = {
    [PAYMENT_STATUS.NOT_SUBMITTED]: 0,
    [PAYMENT_STATUS.SUBMITTED]: 0,
    [PAYMENT_STATUS.APPROVED]: 0,
    [PAYMENT_STATUS.RESUBMIT_REQUIRED]: 0,
  };
  items.forEach((p) => {
    if (counts[p.status] !== undefined) counts[p.status] += 1;
  });
  return counts;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
