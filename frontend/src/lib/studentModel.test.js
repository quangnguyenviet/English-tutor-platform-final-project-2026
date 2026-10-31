import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  buildWeekDays,
  deadlineInfo,
  eloChangeTone,
  formatEloChange,
  materialAction,
  quizProgressPercent,
  sessionLogState,
  sortQuizzesByDeadline,
  sortSessionsDesc,
  validateNewPassword,
  weekRangeLabel,
  weekStartOf,
} from "./studentModel.js";

test("validateNewPassword: các trường hợp lỗi và hợp lệ", () => {
  assert.match(validateNewPassword({ oldPassword: "", newPassword: "Abcdef12", confirm: "Abcdef12" }), /hiện tại/);
  assert.match(validateNewPassword({ oldPassword: "x", newPassword: "Ab1", confirm: "Ab1" }), /8 ký tự/);
  assert.match(validateNewPassword({ oldPassword: "x", newPassword: "abcdefgh1", confirm: "abcdefgh1" }), /chữ hoa/);
  assert.match(validateNewPassword({ oldPassword: "Abcdef12", newPassword: "Abcdef12", confirm: "Abcdef12" }), /trùng/);
  assert.match(validateNewPassword({ oldPassword: "x", newPassword: "Abcdef12", confirm: "Abcdef13" }), /không khớp/);
  assert.equal(validateNewPassword({ oldPassword: "x", newPassword: "Abcdef12", confirm: "Abcdef12" }), "");
});

test("weekStartOf: luôn về thứ 2, Chủ nhật thuộc tuần trước", () => {
  assert.equal(weekStartOf("2026-10-28"), "2026-10-26"); // thứ 4
  assert.equal(weekStartOf("2026-10-26"), "2026-10-26"); // thứ 2
  assert.equal(weekStartOf("2026-11-01"), "2026-10-26"); // chủ nhật
  assert.equal(addDays("2026-10-26", 7), "2026-11-02");
});

test("buildWeekDays: đủ 7 cột và xếp buổi theo giờ", () => {
  const days = buildWeekDays("2026-10-26", [
    { date: "2026-10-28", startTime: "19:00", id: 2 },
    { date: "2026-10-28", startTime: "08:00", id: 1 },
  ]);
  assert.equal(days.length, 7);
  assert.equal(days[0].label, "Thứ 2");
  assert.equal(days[6].date, "2026-11-01");
  assert.deepEqual(days[2].sessions.map((s) => s.id), [1, 2]);
  assert.equal(days[3].sessions.length, 0);
  assert.equal(weekRangeLabel("2026-10-26"), "26/10 – 01/11/2026");
});

test("sessionLogState: Chưa có / Gia sư chưa gửi nhật ký / đã có", () => {
  assert.equal(sessionLogState({ status: "SCHEDULED" }).label, "Chưa có");
  assert.equal(sessionLogState({ status: "ABSENT" }).label, "Chưa có");
  assert.equal(sessionLogState({ status: "COMPLETED" }).label, "Gia sư chưa gửi nhật ký");
  assert.equal(sessionLogState({ status: "COMPLETED", logKnowledge: "Thì hiện tại đơn" }).kind, "ready");
});

test("sortSessionsDesc: mới nhất trước", () => {
  const sorted = sortSessionsDesc([
    { id: 1, sessionDate: "2026-10-20", startTime: "19:00" },
    { id: 2, sessionDate: "2026-10-27", startTime: "08:00" },
    { id: 3, sessionDate: "2026-10-27", startTime: "19:00" },
  ]);
  assert.deepEqual(sorted.map((s) => s.id), [3, 2, 1]);
});

test("materialAction: xem được / chỉ tải / không còn khả dụng", () => {
  assert.equal(materialAction({}, { previewable: true }), "preview");
  assert.equal(materialAction({}, { previewable: false }), "download");
  assert.equal(materialAction({}, null), "download");
  assert.equal(materialAction({ removed: true }, null), "unavailable");
  assert.equal(materialAction({}, { unavailable: true }), "unavailable");
});

test("Elo và tiến độ quiz", () => {
  assert.equal(formatEloChange(12.4), "+12");
  assert.equal(formatEloChange(-7.6), "−8");
  assert.equal(formatEloChange(0), "0");
  assert.equal(eloChangeTone(5), "emerald");
  assert.equal(eloChangeTone(-5), "rose");
  assert.equal(quizProgressPercent(3, 10), 30);
  assert.equal(quizProgressPercent(0, 0), 0);
  assert.equal(quizProgressPercent(12, 10), 100);
});

test("deadlineInfo và sortQuizzesByDeadline", () => {
  const now = Date.parse("2026-10-30T12:00:00Z");
  assert.equal(deadlineInfo(null, now).label, "Không có hạn nộp");
  assert.equal(deadlineInfo("2026-10-30T11:00:00Z", now).overdue, true);
  assert.equal(deadlineInfo("2026-10-30T12:30:00Z", now).label, "Còn dưới 1 giờ");
  assert.equal(deadlineInfo("2026-10-30T20:00:00Z", now).label, "Còn 8 giờ");
  assert.equal(deadlineInfo("2026-11-02T12:00:00Z", now).label, "Còn 3 ngày");
  const sorted = sortQuizzesByDeadline([
    { id: "a", deadline: null },
    { id: "b", deadline: "2026-11-05T00:00:00Z" },
    { id: "c", deadline: "2026-11-01T00:00:00Z" },
  ]);
  assert.deepEqual(sorted.map((q) => q.id), ["c", "b", "a"]);
});
