import assert from "node:assert/strict";
import test from "node:test";
import {
  REQUEST_OUTCOME,
  canRequestRefund,
  canResolve,
  classRequestEligibility,
  defaultOutcome,
  isRefundRequester,
  resolveConfirmMessage,
  selectableOutcomes,
  validateRefundAmount,
  validateResolve,
  windowLabel,
} from "./complaintModel.js";

const openTarget = { status: "OPEN", allowedOutcomes: ["CANCELLED"], alreadyHandled: { CANCELLED: false, REMATCH: false } };
const trialTarget = {
  status: "TRIAL",
  allowedOutcomes: ["CANCELLED", "REMATCH"],
  alreadyHandled: { CANCELLED: false, REMATCH: false },
};
const cancelledTarget = { status: "CANCELLED", allowedOutcomes: [], alreadyHandled: { CANCELLED: true, REMATCH: false } };
const expiredTarget = {
  status: "MATCHED",
  cancelDaysLeft: -2,
  windowExpired: true,
  allowedOutcomes: [],
  alreadyHandled: { CANCELLED: false, REMATCH: false },
};

test("lớp chưa có gia sư chỉ có Hủy lớp và được chọn sẵn", () => {
  assert.deepEqual(selectableOutcomes(openTarget), ["CANCELLED"]);
  assert.equal(defaultOutcome(openTarget), "CANCELLED");
});

test("lớp đang dạy thử có hai lựa chọn và không chọn sẵn", () => {
  assert.deepEqual(selectableOutcomes(trialTarget), ["CANCELLED", "REMATCH"]);
  assert.equal(defaultOutcome(trialTarget), "");
  assert.equal(
    validateResolve({ target: trialTarget, outcome: "", resolution: "Đã xác nhận", files: [] }),
    "Vui lòng chọn Hủy lớp hoặc Ghép lại."
  );
});

test("thiếu kết quả xử lý bị chặn", () => {
  assert.equal(
    validateResolve({ target: openTarget, outcome: "CANCELLED", resolution: "  ", files: [] }),
    "Vui lòng nhập kết quả xử lý."
  );
});

test("lớp đã xử lý thủ công bắt buộc minh chứng", () => {
  assert.deepEqual(selectableOutcomes(cancelledTarget), ["CANCELLED"]);
  assert.match(
    validateResolve({ target: cancelledTarget, outcome: "CANCELLED", resolution: "Đã hủy", files: [] }),
    /minh chứng đã xử lý/
  );
  assert.equal(
    validateResolve({ target: cancelledTarget, outcome: "CANCELLED", resolution: "Đã hủy", files: [{}] }),
    null
  );
  assert.match(resolveConfirmMessage(cancelledTarget, "CANCELLED"), /đã được xử lý trước đó/);
});

test("lớp quá 7 ngày không còn lựa chọn", () => {
  assert.deepEqual(selectableOutcomes(expiredTarget), []);
  assert.match(
    validateResolve({ target: expiredTarget, outcome: "", resolution: "x", files: [] }),
    /quá 7 ngày/
  );
  assert.equal(windowLabel(expiredTarget), "Đã quá hạn 7 ngày");
  assert.equal(windowLabel({ status: "MATCHED", cancelDaysLeft: 3 }), "Còn 3 ngày được xử lý");
  assert.equal(windowLabel(trialTarget), null);
});

test("chọn lớp khi tạo đơn", () => {
  assert.equal(classRequestEligibility({ teachingMode: "AT_HOME", classId: 1 }, "REFUND").ok, false);
  assert.equal(classRequestEligibility({ teachingMode: "ONLINE", classId: null }, "REFUND").ok, false);
  assert.equal(classRequestEligibility({ teachingMode: "ONLINE", classId: 3 }, "REFUND").ok, true);
  assert.equal(classRequestEligibility({ status: "CANCELLED" }, "NON_REFUND").ok, false);
  assert.equal(classRequestEligibility({ status: "MATCHED", cancelDaysLeft: -1 }, "NON_REFUND").ok, false);
  assert.equal(classRequestEligibility({ status: "MATCHED", cancelDaysLeft: 0 }, "NON_REFUND").ok, true);
});

test("hạn mức hoàn tiền theo UC-ACC-04", () => {
  assert.equal(
    validateRefundAmount(500000, { remaining: 400000 }),
    "Số tiền hoàn (500.000₫) vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: 400.000₫)."
  );
  assert.equal(validateRefundAmount(0, { remaining: 400000 }), "Số tiền hoàn phải lớn hơn 0.");
  assert.equal(validateRefundAmount(300000, { remaining: 400000, requested: 200000 }), "Số tiền hoàn không được vượt số Lễ tân đề xuất.");
  assert.equal(validateRefundAmount(200000, { remaining: 400000, requested: 200000 }), null);
});

test("quyền thao tác theo trạng thái và người tạo", () => {
  assert.equal(canResolve({ status: "PENDING", complaintType: "NON_REFUND" }), true);
  assert.equal(canResolve({ status: "PENDING", complaintType: "REFUND" }), false);
  assert.equal(canRequestRefund({ status: "PROCESSING", complaintType: "REFUND" }), false);
  assert.equal(isRefundRequester({ requestedById: 7 }, 7), true);
  assert.equal(isRefundRequester({ requestedById: 7 }, null), false);
  assert.equal(REQUEST_OUTCOME.REMATCH, "REMATCH");
});
