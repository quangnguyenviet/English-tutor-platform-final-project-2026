import { students } from "../data/mockData.js";

export const LESSON_SESSION_STORAGE_KEY = "ep_lesson_sessions_v1";
export const LESSON_DEMO_REFERENCE_TIME = new Date("2026-08-04T12:00:00+07:00").getTime();

const SESSION_STATUSES = new Set([
  "upcoming",
  "live",
  "completed",
  "reschedule_requested",
  "rescheduled",
  "student_absent",
  "tutor_absent",
  "cancelled",
]);

const EXCEPTION_STATUSES = new Set([
  "student_absent",
  "tutor_absent",
  "cancelled",
]);

const INTERACTIVE_STATUSES = new Set(["upcoming", "live", "completed"]);
const REPORT_FIELDS = ["summary", "achievement", "difficulty", "nextStep", "homework"];
const DEMO_WEEK_START_UTC = Date.UTC(2026, 7, 3);

// The demo starts with one answered question and one awaiting a tutor reply so
// the shared lesson thread is visible before anyone edits local prototype data.
const DEMO_QUESTIONS = {
  "sch-prev-1": [
    {
      id: "demo-q-speaking-part-1",
      text: "Em nên trả lời Speaking Part 1 dài bao nhiêu câu?",
      createdAt: "2026-07-27T14:10:00.000Z",
      reply: "Khoảng 2–3 câu: trả lời trực tiếp, rồi thêm lý do hoặc ví dụ ngắn.",
      repliedAt: "2026-07-27T14:25:00.000Z",
    },
  ],
  "sch-2": [
    {
      id: "demo-q-speaking-part-2",
      text: "Khi chỉ có một phút chuẩn bị Cue Card, em nên ghi ý theo thứ tự nào?",
      createdAt: "2026-08-03T14:40:00.000Z",
      reply: null,
      repliedAt: null,
    },
  ],
};

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

function scheduleFields(fullDate, startTime, endTime) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fullDate)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) return null;
  if (endTime <= startTime) return null;

  const [year, month, day] = fullDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  const dayIndex = date.getUTCDay();
  return {
    fullDate,
    startTime,
    endTime,
    dateStr: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    dayIndex,
    dayOfWeek: dayIndex === 0 ? "Chủ nhật" : `Thứ ${dayIndex + 1}`,
    weekOffset: Math.floor((date.getTime() - DEMO_WEEK_START_UTC) / (7 * 24 * 60 * 60 * 1000)),
  };
}

function mockPublishedAt(session) {
  const date = cleanText(session.fullDate);
  const time = /^\d{2}:\d{2}$/.test(session.endTime) ? session.endTime : "00:00";
  const parsed = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function reportFromMock(session) {
  if (session.status !== "completed") return null;

  const takeaways = Array.isArray(session.lessonSummary?.takeaways)
    ? session.lessonSummary.takeaways.filter((item) => typeof item === "string" && item.trim())
    : [];
  const feedback = cleanText(session.tutorEvaluation?.comment);
  const feedbackSentences = feedback.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const difficulty = feedbackSentences.filter((sentence) => /^(Cần|Chú ý|Còn|Nên)\s/u.test(sentence));
  const achievement = feedbackSentences.filter((sentence) => !difficulty.includes(sentence));

  return {
    summary: takeaways.slice(0, 2).join(" ") || cleanText(session.topic),
    achievement: achievement.join(" "),
    difficulty: difficulty.join(" "),
    nextStep: cleanText(session.tutorEvaluation?.focusPoints),
    homework: "",
    publishedAt: mockPublishedAt(session),
  };
}

function normalizeReport(value, fallback = null) {
  if (!isObject(value)) return fallback;
  const report = Object.fromEntries(REPORT_FIELDS.map((field) => [field, cleanText(value[field])]));
  report.publishedAt = typeof value.publishedAt === "string" ? value.publishedAt : null;
  return report;
}

function normalizeQuestions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((question) => isObject(question) && question.id != null && cleanText(question.text))
    .map((question) => ({
      id: String(question.id),
      text: cleanText(question.text),
      createdAt: typeof question.createdAt === "string" ? question.createdAt : null,
      reply: cleanText(question.reply) || null,
      repliedAt: typeof question.repliedAt === "string" ? question.repliedAt : null,
    }));
}

export function createInitialLessonSessions(sourceStudents = students) {
  if (!Array.isArray(sourceStudents)) return [];

  const usedIds = new Set();
  return sourceStudents.flatMap((student) => {
    if (!Array.isArray(student?.multiTutorSchedule)) return [];

    return student.multiTutorSchedule.map((session, index) => {
      const sourceId = String(session.id ?? `${student.id}-lesson-${index + 1}`);
      let id = sourceId;
      if (usedIds.has(id)) {
        id = `${student.id}:${sourceId}`;
        let suffix = 2;
        while (usedIds.has(id)) id = `${student.id}:${sourceId}:${suffix++}`;
      }
      usedIds.add(id);
      const status = SESSION_STATUSES.has(session.status) ? session.status : "upcoming";

      return {
        ...session,
        id,
        studentId: student.id,
        studentName: student.name,
        status,
        plan: {
          objective: cleanText(session.plan?.objective),
          preparation: cleanText(session.plan?.preparation ?? session.prepNote),
        },
        report: normalizeReport(session.report, reportFromMock({ ...session, status })),
        questions: Array.isArray(session.questions)
          ? normalizeQuestions(session.questions)
          : normalizeQuestions(student.id === "s1" ? DEMO_QUESTIONS[sourceId] : []),
        exceptionReason: cleanText(session.exceptionReason),
        exceptionAt: typeof session.exceptionAt === "string" ? session.exceptionAt : null,
        proposedSlots: Array.isArray(session.proposedSlots)
          ? session.proposedSlots.map(cleanText).filter(Boolean)
          : [],
      };
    });
  });
}

// Only editable fields are restored. Schedule, tutor and student identities still come
// from the current mock source if it changes between prototype revisions.
export function hydrateLessonSessions(initialSessions, storedValue) {
  const stored = Array.isArray(storedValue) ? storedValue : storedValue?.sessions;
  if (!Array.isArray(stored)) return initialSessions;

  const savedById = new Map(
    stored.filter((session) => isObject(session) && typeof session.id === "string")
      .map((session) => [session.id, session])
  );

  return initialSessions.map((initial) => {
    const saved = savedById.get(initial.id);
    if (!saved || (saved.studentId && saved.studentId !== initial.studentId)) return initial;

    const status = SESSION_STATUSES.has(saved.status) ? saved.status : initial.status;
    const plan = isObject(saved.plan)
      ? {
          objective: cleanText(saved.plan.objective),
          preparation: cleanText(saved.plan.preparation),
        }
      : initial.plan;
    const savedQuestions = Array.isArray(saved.questions)
      ? normalizeQuestions(saved.questions)
      : [];
    const savedQuestionIds = new Set(savedQuestions.map((question) => question.id));
    const restoredSchedule = saved.rescheduledAt
      ? scheduleFields(saved.fullDate, saved.startTime, saved.endTime)
      : null;

    return {
      ...initial,
      ...(restoredSchedule ?? {}),
      status,
      plan,
      prepNote: plan.preparation,
      report: normalizeReport(saved.report, initial.report),
      questions: [
        ...initial.questions.filter((question) => !savedQuestionIds.has(question.id)),
        ...savedQuestions,
      ],
      exceptionReason: cleanText(saved.exceptionReason),
      exceptionAt: typeof saved.exceptionAt === "string" ? saved.exceptionAt : initial.exceptionAt,
      proposedSlots: Array.isArray(saved.proposedSlots)
        ? saved.proposedSlots.map(cleanText).filter(Boolean)
        : initial.proposedSlots,
      startedAt: typeof saved.startedAt === "string" ? saved.startedAt : initial.startedAt,
      completedAt: typeof saved.completedAt === "string" ? saved.completedAt : initial.completedAt,
      rescheduledFrom: isObject(saved.rescheduledFrom) ? saved.rescheduledFrom : initial.rescheduledFrom,
      rescheduledAt: typeof saved.rescheduledAt === "string" ? saved.rescheduledAt : initial.rescheduledAt,
    };
  });
}

export function getCompletedSessionCount(sessions, studentId) {
  if (!Array.isArray(sessions)) return 0;
  return sessions.filter(
    (session) => session.status === "completed" && (!studentId || session.studentId === studentId)
  ).length;
}

export function getParentVisibleReport(session) {
  return session?.status === "completed" && session.report?.publishedAt ? session.report : null;
}

export function updateLessonSession(sessions, id, type, payload = {}, options = {}) {
  if (!Array.isArray(sessions)) return sessions;
  const index = sessions.findIndex((session) => session.id === id);
  if (index < 0) return sessions;

  const session = sessions[index];
  const input = isObject(payload) ? payload : {};
  const now = options.now ?? new Date().toISOString();
  let updated = null;

  switch (type) {
    case "savePlan": {
      if (!["upcoming", "live"].includes(session.status)) break;
      const objective = Object.hasOwn(input, "objective")
        ? cleanText(input.objective)
        : session.plan.objective;
      const preparation = Object.hasOwn(input, "preparation")
        ? cleanText(input.preparation)
        : session.plan.preparation;
      if (objective === session.plan.objective && preparation === session.plan.preparation) break;
      updated = {
        ...session,
        plan: { objective, preparation },
        prepNote: preparation,
      };
      break;
    }
    case "startSession":
      if (session.status === "upcoming") {
        updated = { ...session, status: "live", startedAt: now };
      }
      break;
    case "endSession":
      if (["upcoming", "live"].includes(session.status)) {
        updated = { ...session, status: "completed", completedAt: now, report: null };
      }
      break;
    case "completeSession": {
      const canPublish = ["upcoming", "live"].includes(session.status)
        || (session.status === "completed" && !session.report?.publishedAt);
      if (!canPublish || !cleanText(input.summary)) break;
      const report = Object.fromEntries(REPORT_FIELDS.map((field) => [field, cleanText(input[field])]));
      updated = {
        ...session,
        status: "completed",
        completedAt: session.completedAt ?? now,
        report: { ...report, publishedAt: now },
      };
      break;
    }
    case "markException": {
      if (!["upcoming", "live"].includes(session.status)) break;
      if (!EXCEPTION_STATUSES.has(input.status) || !cleanText(input.reason)) break;
      updated = {
        ...session,
        status: input.status,
        exceptionReason: cleanText(input.reason),
        exceptionAt: now,
      };
      break;
    }
    case "requestReschedule": {
      if (!["upcoming", "live"].includes(session.status) || !cleanText(input.reason)) break;
      const proposedSlots = Array.isArray(input.proposedSlots)
        ? input.proposedSlots.map(cleanText).filter(Boolean)
        : [];
      updated = {
        ...session,
        status: "reschedule_requested",
        exceptionReason: cleanText(input.reason),
        exceptionAt: now,
        proposedSlots,
      };
      break;
    }
    case "confirmReschedule": {
      if (!["reschedule_requested", "rescheduled"].includes(session.status)) break;
      const schedule = scheduleFields(input.fullDate, input.startTime, input.endTime);
      if (!schedule) break;
      if (
        schedule.fullDate === session.fullDate &&
        schedule.startTime === session.startTime &&
        schedule.endTime === session.endTime
      ) break;
      updated = {
        ...session,
        ...schedule,
        status: "upcoming",
        rescheduledFrom: {
          fullDate: session.fullDate,
          startTime: session.startTime,
          endTime: session.endTime,
          dateStr: session.dateStr,
          dayOfWeek: session.dayOfWeek,
          dayIndex: session.dayIndex,
          weekOffset: session.weekOffset,
        },
        rescheduledAt: now,
      };
      break;
    }
    case "addStudentQuestion": {
      if (!INTERACTIVE_STATUSES.has(session.status) || !cleanText(input.text)) break;
      updated = {
        ...session,
        questions: [
          ...session.questions,
          {
            id: options.questionId ?? globalThis.crypto?.randomUUID?.() ?? `q-${Date.now()}-${Math.random()}`,
            text: cleanText(input.text),
            createdAt: now,
            reply: null,
            repliedAt: null,
          },
        ],
      };
      break;
    }
    case "addTutorReply": {
      if (!INTERACTIVE_STATUSES.has(session.status) || !cleanText(input.text)) break;
      const question = session.questions.find((item) => item.id === input.questionId);
      if (!question || question.reply) break;
      updated = {
        ...session,
        questions: session.questions.map((item) =>
          item.id === input.questionId
            ? { ...item, reply: cleanText(input.text), repliedAt: now }
            : item
        ),
      };
      break;
    }
    default:
      break;
  }

  if (!updated) return sessions;
  const next = [...sessions];
  next[index] = updated;
  return next;
}
