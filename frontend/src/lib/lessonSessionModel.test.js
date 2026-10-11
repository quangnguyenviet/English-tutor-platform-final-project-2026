import assert from "node:assert/strict";
import test from "node:test";
import { students } from "../data/mockData.js";
import {
  createInitialLessonSessions,
  getCompletedSessionCount,
  getParentVisibleReport,
  hydrateLessonSessions,
  LESSON_DEMO_REFERENCE_TIME,
  updateLessonSession,
} from "./lessonSessionModel.js";

const now = "2026-09-25T09:00:00.000Z";

test("mỗi lịch học mock thành một buổi có học sinh và báo cáo đúng trạng thái", () => {
  const sessions = createInitialLessonSessions();
  const studentSchedules = students.flatMap((student) => student.multiTutorSchedule ?? []);
  assert.equal(sessions.length, studentSchedules.length);
  assert.equal(
    getCompletedSessionCount(sessions, "s1"),
    studentSchedules.filter((session) => session.status === "completed").length
  );

  const completed = sessions.find((session) => session.id === "sch-prev-1");
  assert.equal(completed.studentId, "s1");
  assert.equal(completed.studentName, "Nguyễn Minh Khôi");
  assert.equal(completed.tutorId, "t1");
  assert.ok(getParentVisibleReport(completed)?.summary);
  assert.ok(getParentVisibleReport(completed)?.publishedAt);
  assert.match(getParentVisibleReport(completed)?.difficulty, /Cần tập thói quen/);
  assert.equal(completed.questions[0].reply !== null, true);

  const awaitingTutor = sessions.find((session) => session.id === "sch-2");
  assert.equal(awaitingTutor.questions[0].reply, null);

  const upcoming = sessions.find((session) => session.id === "sch-4");
  assert.equal(upcoming.report, null);
  assert.equal(getParentVisibleReport(upcoming), null);
  assert.equal(upcoming.plan.preparation, upcoming.prepNote);
});

test("gia sư có thể chốt buổi chưa bấm bắt đầu và phụ huynh mới thấy báo cáo", () => {
  const initial = createInitialLessonSessions();
  const completed = updateLessonSession(
    initial,
    "sch-4",
    "completeSession",
    { summary: "Học nối âm", achievement: "Đọc rõ hơn", nextStep: "Ôn 10 phút mỗi ngày" },
    { now }
  );

  const session = completed.find((item) => item.id === "sch-4");
  assert.equal(session.status, "completed");
  assert.equal(getParentVisibleReport(session)?.summary, "Học nối âm");
  assert.equal(session.report.publishedAt, now);
  assert.equal(getCompletedSessionCount(completed, "s1"), getCompletedSessionCount(initial, "s1") + 1);
  assert.equal(updateLessonSession(completed, "sch-4", "startSession", {}, { now }), completed);
  assert.equal(updateLessonSession(completed, "sch-4", "markException", { status: "cancelled", reason: "Sai lịch" }, { now }), completed);
  assert.equal(updateLessonSession(initial, "sch-5", "completeSession", { summary: "  " }, { now }), initial);
});

test("buổi đã học được tính hoàn thành nhưng báo cáo chỉ hiện sau khi công bố một lần", () => {
  const initial = createInitialLessonSessions();
  const taughtAt = "2026-09-25T08:00:00.000Z";
  const ended = updateLessonSession(initial, "sch-4", "endSession", {}, { now: taughtAt });
  const pending = ended.find((item) => item.id === "sch-4");

  assert.equal(pending.status, "completed");
  assert.equal(pending.completedAt, taughtAt);
  assert.equal(pending.report, null);
  assert.equal(getCompletedSessionCount(ended, "s1"), getCompletedSessionCount(initial, "s1") + 1);
  assert.equal(getParentVisibleReport(pending), null);
  assert.equal(updateLessonSession(ended, "sch-4", "endSession", {}, { now }), ended);

  const published = updateLessonSession(
    ended,
    "sch-4",
    "completeSession",
    { summary: "Luyện phát âm", difficulty: "Cần ôn nối âm" },
    { now }
  );
  const reported = published.find((item) => item.id === "sch-4");
  assert.equal(reported.completedAt, taughtAt);
  assert.equal(getParentVisibleReport(reported)?.summary, "Luyện phát âm");
  assert.equal(reported.report.publishedAt, now);
  assert.equal(
    updateLessonSession(published, "sch-4", "completeSession", { summary: "Ghi đè" }, { now }),
    published
  );
});

test("kế hoạch, bắt đầu và ghi vắng học đi theo đúng vòng đời buổi", () => {
  const initial = createInitialLessonSessions();
  const planned = updateLessonSession(
    initial,
    "sch-4",
    "savePlan",
    { objective: "  Luyện phát âm ", preparation: "  Đọc trước bài mẫu " },
    { now }
  );
  const started = updateLessonSession(planned, "sch-4", "startSession", {}, { now });
  const absent = updateLessonSession(
    started,
    "sch-4",
    "markException",
    { status: "student_absent", reason: "  Báo ốm  " },
    { now }
  );

  const session = absent.find((item) => item.id === "sch-4");
  assert.deepEqual(session.plan, { objective: "Luyện phát âm", preparation: "Đọc trước bài mẫu" });
  assert.equal(session.startedAt, now);
  assert.equal(session.status, "student_absent");
  assert.equal(session.exceptionReason, "Báo ốm");
  assert.equal(getParentVisibleReport(session), null);
  assert.equal(updateLessonSession(absent, "sch-4", "completeSession", { summary: "Học xong" }, { now }), absent);
});

test("câu hỏi và câu trả lời được giữ khi nạp lại dữ liệu của các vai trò", () => {
  const initial = createInitialLessonSessions();
  const asked = updateLessonSession(initial, "sch-prev-1", "addStudentQuestion", { text: "  Em cần ôn gì? " }, { now, questionId: "q1" });
  const answered = updateLessonSession(asked, "sch-prev-1", "addTutorReply", { questionId: "q1", text: "  Ôn từ vựng Part 1. " }, { now });
  const restored = hydrateLessonSessions(initial, { version: 1, sessions: answered });
  const session = restored.find((item) => item.id === "sch-prev-1");

  assert.deepEqual(session.questions.find((question) => question.id === "q1"), {
    id: "q1",
    text: "Em cần ôn gì?",
    createdAt: now,
    reply: "Ôn từ vựng Part 1.",
    repliedAt: now,
  });
  assert.equal(updateLessonSession(answered, "sch-prev-1", "addTutorReply", { questionId: "q1", text: "Ghi đè" }, { now }), answered);

  const oldSaved = hydrateLessonSessions(initial, {
    sessions: [{ ...initial.find((item) => item.id === "sch-2"), questions: [] }],
  });
  assert.equal(oldSaved.find((item) => item.id === "sch-2").questions.length, 1);
});

test("dời lịch lưu lý do, chặn chuyển trạng thái sai và dữ liệu lưu không đổi danh tính học sinh", () => {
  const initial = createInitialLessonSessions();
  const withQuestion = updateLessonSession(
    initial,
    "sch-5",
    "addStudentQuestion",
    { text: "Em cần chuẩn bị gì?" },
    { now, questionId: "q-before-reschedule" }
  );
  const requested = updateLessonSession(
    withQuestion,
    "sch-5",
    "requestReschedule",
    { reason: "Bận thi", proposedSlots: [" 2026-09-27 19:00 ", ""] },
    { now }
  );
  const changed = requested.find((session) => session.id === "sch-5");
  assert.equal(changed.status, "reschedule_requested");
  assert.equal(changed.exceptionReason, "Bận thi");
  assert.deepEqual(changed.proposedSlots, ["2026-09-27 19:00"]);
  assert.equal(getParentVisibleReport(changed), null);
  assert.equal(updateLessonSession(requested, "sch-5", "completeSession", { summary: "Không được chốt" }, { now }), requested);
  assert.equal(updateLessonSession(requested, "sch-5", "savePlan", { objective: "Đổi mục tiêu" }, { now }), requested);
  assert.equal(updateLessonSession(requested, "sch-5", "addStudentQuestion", { text: "Câu mới" }, { now }), requested);
  assert.equal(updateLessonSession(requested, "sch-5", "addTutorReply", { questionId: "q-before-reschedule", text: "Trả lời" }, { now }), requested);

  const tampered = requested.map((session) =>
    session.id === "sch-5" ? { ...session, studentId: "s2", studentName: "Sai người", tutorId: "t99" } : session
  );
  const restored = hydrateLessonSessions(initial, { sessions: tampered });
  const unchanged = restored.find((session) => session.id === "sch-5");
  assert.equal(unchanged.studentId, "s1");
  assert.notEqual(unchanged.tutorId, "t99");
});

test("trung tâm xác nhận ngày mới, giữ lịch cũ để đối chiếu và đồng bộ qua lần nạp lại", () => {
  assert.equal(LESSON_DEMO_REFERENCE_TIME, Date.parse("2026-08-04T12:00:00+07:00"));
  const initial = createInitialLessonSessions();
  const requested = updateLessonSession(
    initial,
    "sch-5",
    "requestReschedule",
    { reason: "Bận thi", proposedSlots: ["2026-08-16 19:30"] },
    { now }
  );
  const confirmed = updateLessonSession(
    requested,
    "sch-5",
    "confirmReschedule",
    { fullDate: "2026-08-16", startTime: "19:30", endTime: "21:00" },
    { now }
  );
  const changed = confirmed.find((session) => session.id === "sch-5");

  assert.equal(changed.status, "upcoming");
  assert.deepEqual(
    [changed.fullDate, changed.dateStr, changed.dayOfWeek, changed.dayIndex, changed.weekOffset],
    ["2026-08-16", "16/08", "Chủ nhật", 0, 1]
  );
  assert.equal(changed.rescheduledFrom.fullDate, "2026-08-06");
  assert.equal(changed.rescheduledAt, now);
  assert.equal(changed.exceptionReason, "Bận thi");
  assert.deepEqual(changed.proposedSlots, ["2026-08-16 19:30"]);
  assert.equal(updateLessonSession(confirmed, "sch-5", "confirmReschedule", { fullDate: "2026-08-17", startTime: "19:00", endTime: "20:30" }, { now }), confirmed);

  const restored = hydrateLessonSessions(initial, { sessions: confirmed });
  assert.equal(restored.find((session) => session.id === "sch-5").fullDate, "2026-08-16");
  assert.equal(restored.find((session) => session.id === "sch-5").rescheduledFrom.fullDate, "2026-08-06");
});

test("ngày giờ không hợp lệ bị từ chối, buổi dời lịch mock cũ vẫn xác nhận được", () => {
  const initial = createInitialLessonSessions();
  const oldRescheduled = initial.find((session) => session.id === "sch-6");
  assert.equal(oldRescheduled.status, "rescheduled");

  for (const schedule of [
    { fullDate: "2026-02-30", startTime: "19:00", endTime: "20:30" },
    { fullDate: "2026-08-14", startTime: "24:00", endTime: "20:30" },
    { fullDate: "2026-08-14", startTime: "20:30", endTime: "19:00" },
    { fullDate: oldRescheduled.fullDate, startTime: oldRescheduled.startTime, endTime: oldRescheduled.endTime },
  ]) {
    assert.equal(updateLessonSession(initial, "sch-6", "confirmReschedule", schedule, { now }), initial);
  }

  const confirmed = updateLessonSession(
    initial,
    "sch-6",
    "confirmReschedule",
    { fullDate: "2026-08-14", startTime: "20:00", endTime: "21:30" },
    { now }
  );
  assert.equal(confirmed.find((session) => session.id === "sch-6").status, "upcoming");
});
