import assert from "node:assert/strict";
import test from "node:test";
import {
  PAYMENT_STATUS,
  canConfirmPayment,
  canEditFeeRate,
  canSubmitProof,
  countByStatus,
  formatVnd,
  isSameActor,
  parseMoneyInput,
  validateProofFile,
} from "./paymentModel.js";

test("formatVnd: định dạng 640.000 ₫", () => {
  assert.equal(formatVnd(640000).replace(/\s/g, " "), "640.000 ₫");
  assert.equal(formatVnd("1280000.00").replace(/\s/g, " "), "1.280.000 ₫");
});

test("formatVnd: rỗng hoặc không phải số -> —", () => {
  assert.equal(formatVnd(null), "—");
  assert.equal(formatVnd(""), "—");
  assert.equal(formatVnd("abc"), "—");
});

test("parseMoneyInput: bỏ dấu phân cách, từ chối ký tự lạ", () => {
  assert.equal(parseMoneyInput("640.000"), 640000);
  assert.equal(parseMoneyInput("640,000 ₫"), 640000);
  assert.equal(parseMoneyInput(""), null);
  assert.equal(parseMoneyInput("12a"), null);
  assert.equal(parseMoneyInput("-5"), null);
});

test("validateProofFile: sai loại và quá dung lượng", () => {
  assert.match(validateProofFile({ type: "image/gif", size: 10 }), /JPG, PNG hoặc tệp PDF/);
  assert.match(validateProofFile({ type: "image/png", size: 6 * 1024 * 1024 }), /5 MB/);
  assert.equal(validateProofFile({ type: "image/jpeg", size: 1024 }), null);
  assert.equal(validateProofFile({ type: "application/pdf", size: 5 * 1024 * 1024 }), null);
  assert.ok(validateProofFile(null));
});

test("canSubmitProof / canEditFeeRate theo trạng thái", () => {
  assert.equal(canSubmitProof({ status: PAYMENT_STATUS.NOT_SUBMITTED }), true);
  assert.equal(canSubmitProof({ status: PAYMENT_STATUS.RESUBMIT_REQUIRED }), true);
  assert.equal(canSubmitProof({ status: PAYMENT_STATUS.SUBMITTED }), false);
  assert.equal(canSubmitProof({ status: PAYMENT_STATUS.APPROVED }), false);
  assert.equal(canEditFeeRate({ status: PAYMENT_STATUS.NOT_SUBMITTED }), true);
  assert.equal(canEditFeeRate({ status: PAYMENT_STATUS.SUBMITTED }), false);
});

test("isSameActor: so sánh uploadedBy với người đăng nhập", () => {
  assert.equal(isSameActor({ uploadedBy: 7 }, 7), true);
  assert.equal(isSameActor({ uploadedBy: "7" }, 7), true);
  assert.equal(isSameActor({ uploadedBy: 7 }, 8), false);
  assert.equal(isSameActor({ uploadedBy: null }, 7), false);
  assert.equal(isSameActor({ uploadedBy: 7 }, null), false);
});

test("canConfirmPayment: cần số tiền và không phải người thu hộ", () => {
  const p = { status: PAYMENT_STATUS.SUBMITTED, uploadedBy: 5 };
  assert.equal(canConfirmPayment(p, null, 9), false);
  assert.equal(canConfirmPayment(p, Number.NaN, 9), false);
  assert.equal(canConfirmPayment(p, 640000, 5), false);
  assert.equal(canConfirmPayment(p, 640000, 9), true);
  assert.equal(canConfirmPayment(p, 0, 9), true);
  assert.equal(canConfirmPayment({ ...p, status: PAYMENT_STATUS.APPROVED }, 640000, 9), false);
});

test("countByStatus: đếm theo trạng thái", () => {
  const counts = countByStatus([
    { status: PAYMENT_STATUS.SUBMITTED },
    { status: PAYMENT_STATUS.SUBMITTED },
    { status: PAYMENT_STATUS.APPROVED },
  ]);
  assert.equal(counts.SUBMITTED, 2);
  assert.equal(counts.APPROVED, 1);
  assert.equal(counts.NOT_SUBMITTED, 0);
});
