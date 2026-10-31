import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  filterAndSortExercises,
  getExerciseSummary,
  getProgressSummary,
} from "./studentLearningViewModel.js";

const exercises = [
  { id: "done", status: "graded", tutorId: "t1", skill: "Viết", difficulty: "Cơ bản", score: 8, maxScore: 10 },
  { id: "later", status: "assigned", tutorId: "t1", skill: "Nghe", difficulty: "Trung bình", dueDate: "2026-10-12" },
  { id: "waiting", status: "submitted", tutorId: "t2", skill: "Nói", difficulty: "Nâng cao" },
  { id: "sooner", status: "assigned", tutorId: "t2", skill: "Viết", difficulty: "Trung bình", dueDate: "2026-10-10" },
];

test("tóm tắt và sắp bài chưa làm theo hạn gần nhất", () => {
  const summary = getExerciseSummary(exercises);
  assert.deepEqual(
    { total: summary.total, assigned: summary.assigned, submitted: summary.submitted, graded: summary.graded },
    { total: 4, assigned: 2, submitted: 1, graded: 1 }
  );
  assert.equal(summary.priorityExercise.id, "sooner");
  assert.deepEqual(
    filterAndSortExercises(exercises).map((exercise) => exercise.id),
    ["sooner", "later", "waiting", "done"]
  );
});

test("lọc theo gia sư và trạng thái, trả mảng rỗng khi không khớp", () => {
  assert.deepEqual(
    filterAndSortExercises(exercises, "t1", "assigned").map((exercise) => exercise.id),
    ["later"]
  );
  assert.deepEqual(filterAndSortExercises(exercises, "missing", "assigned"), []);
});

test("lọc bài tập theo kỹ năng và độ khó", () => {
  assert.deepEqual(
    filterAndSortExercises(exercises, "all", "assigned", "Viết", "Trung bình").map((exercise) => exercise.id),
    ["sooner"]
  );
});

test("tóm tắt tiến bộ từ dữ liệu hiện có", () => {
  const summary = getProgressSummary({
    exercises,
    studentKnowledgeProfile: {
      overallElo: 74,
      weaknesses: [{ name: "Nghe" }],
      strengths: [{ name: "Đọc" }],
    },
    effortMetrics: { onTimeSubmissionRate: 90, currentStreak: 5 },
  });

  assert.equal(summary.averageScore, 80);
  assert.equal(summary.overallElo, 74);
  assert.equal(summary.focusSkill.name, "Nghe");
  assert.equal(summary.strongestSkill.name, "Đọc");
});

test("dữ liệu tiến bộ thiếu dùng fallback an toàn", () => {
  assert.deepEqual(getProgressSummary(null), {
    gradedExercises: [],
    averageScore: 0,
    overallElo: 0,
    focusSkill: null,
    strongestSkill: null,
    onTimeSubmissionRate: 0,
    currentStreak: 0,
  });
});

test("hai trang giữ contract responsive không dùng chiều rộng filter cố định", () => {
  const exercisePage = readFileSync(
    new URL("../pages/student/StudentExercises.jsx", import.meta.url),
    "utf8"
  );
  const progressPage = readFileSync(
    new URL("../pages/student/StudentProgress.jsx", import.meta.url),
    "utf8"
  );

  // Trang bài tập đã chuyển sang dạng tab + thẻ (không còn bộ lọc): chỉ cần không có chiều rộng cố định
  assert.doesNotMatch(exercisePage, /min-w-\[220px\]/);
  assert.match(progressPage, /grid-cols-1/);
  assert.match(progressPage, /w-full sm:w-auto/);
  assert.doesNotMatch(progressPage, /min-w-\[220px\]/);
});
