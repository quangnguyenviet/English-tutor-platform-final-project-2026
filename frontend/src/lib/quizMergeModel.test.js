import assert from "node:assert/strict";
import test from "node:test";
import {
  applyDrafts,
  buildPendingQuestions,
  draftToFormQuestion,
  eligiblePositions,
  isBlankDraft,
  resolveDraftTarget,
} from "./quizMergeModel.js";

/** Câu form mẫu. Câu rỗng thật sự (chưa nhập gì) có options toàn rỗng. */
function q(text, opts = ["a", "b", "c", "d"], extra = {}) {
  const options = text === "" && opts === undefined ? ["", "", "", ""] : [...opts];
  return {
    questionText: text,
    options,
    correctAnswer: "A",
    explanation: "",
    cefrLevel: "",
    skillCode: "",
    ...extra,
  };
}

/** Câu hoàn toàn trống (chưa gõ gì). */
function blank() {
  return {
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    explanation: "",
    cefrLevel: "",
    skillCode: "",
  };
}

/** Câu AI mẫu (shape AiDraftQuestionResponse). */
function d(text, extra = {}) {
  return {
    questionText: text,
    optionA: "w",
    optionB: "x",
    optionC: "y",
    optionD: "z",
    correctAnswer: "B",
    explanation: "giải thích",
    cefrLevel: "B1",
    skillCode: "past_simple",
    index: null,
    ...extra,
  };
}

// ── draftToFormQuestion ─────────────────────────────────────────────────────

test("draftToFormQuestion: map đủ 4 lựa chọn và metadata", () => {
  const r = draftToFormQuestion(d("She ___ to school.", { correctAnswer: "C" }));
  assert.equal(r.questionText, "She ___ to school.");
  assert.deepEqual(r.options, ["w", "x", "y", "z"]);
  assert.equal(r.correctAnswer, "C");
  assert.equal(r.cefrLevel, "B1");
  assert.equal(r.skillCode, "past_simple");
});

test("draftToFormQuestion: thiếu trường → dùng giá trị mặc định an toàn", () => {
  const r = draftToFormQuestion({ questionText: "X" });
  assert.deepEqual(r.options, ["", "", "", ""]);
  assert.equal(r.correctAnswer, "A");
  assert.equal(r.explanation, "");
});

// ── isBlankDraft ────────────────────────────────────────────────────────────

test("isBlankDraft: câu rỗng hoặc thiếu nội dung → true", () => {
  assert.equal(isBlankDraft(null), true);
  assert.equal(isBlankDraft({}), true);
  assert.equal(isBlankDraft({ questionText: "   " }), true);
});

test("isBlankDraft: câu có nội dung → false", () => {
  assert.equal(isBlankDraft({ questionText: "Hello" }), false);
});

// ── eligiblePositions ───────────────────────────────────────────────────────

test("eligiblePositions: chỉ trả về index của câu KHÔNG rỗng", () => {
  assert.deepEqual(eligiblePositions([q(""), q("A"), q(""), q("B")]), [1, 3]);
});

test("eligiblePositions: mảng rỗng → mảng rỗng", () => {
  assert.deepEqual(eligiblePositions([]), []);
  assert.deepEqual(eligiblePositions(null), []);
});

// ── resolveDraftTarget ──────────────────────────────────────────────────────

test("resolveDraftTarget: index hợp lệ → replace in-place", () => {
  const r = resolveDraftTarget({ index: 3 }, 5);
  assert.equal(r.mode, "replace");
  assert.equal(r.index, 2); // 0-based
  assert.equal(r.warning, null);
});

test("resolveDraftTarget: index null → append, không cảnh báo", () => {
  const r = resolveDraftTarget({ index: null }, 5);
  assert.equal(r.mode, "append");
  assert.equal(r.index, null);
  assert.equal(r.warning, null);
});

test("resolveDraftTarget: index vượt số câu → append + cảnh báo", () => {
  const r = resolveDraftTarget({ index: 9 }, 5);
  assert.equal(r.mode, "append");
  assert.match(r.warning, /không hợp lệ/);
});

test("resolveDraftTarget: index <= 0 → append + cảnh báo", () => {
  const r = resolveDraftTarget({ index: 0 }, 5);
  assert.equal(r.mode, "append");
  assert.match(r.warning, /không hợp lệ/);
});

test("resolveDraftTarget: index không phải số nguyên → append + cảnh báo", () => {
  const r = resolveDraftTarget({ index: "abc" }, 5);
  assert.equal(r.mode, "append");
  assert.match(r.warning, /không hợp lệ/);
});

// ── applyDrafts ─────────────────────────────────────────────────────────────

test("applyDrafts: câu mới (index null) → thêm vào cuối", () => {
  const r = applyDrafts([q("Q1"), q("Q2")], [d("Mới")]);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[2].questionText, "Mới");
  assert.equal(r.appended, 1);
  assert.equal(r.replaced, 0);
});

test("applyDrafts: index hợp lệ → thay in-place, KHÔNG đổi thứ tự hay độ dài", () => {
  const r = applyDrafts([q("Q1"), q("Q2"), q("Q3")], [d("Sửa Q2", { index: 2 })]);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].questionText, "Q1");
  assert.equal(r.questions[1].questionText, "Sửa Q2");
  assert.equal(r.questions[2].questionText, "Q3");
  assert.equal(r.replaced, 1);
  assert.equal(r.appended, 0);
  assert.deepEqual(r.warnings, []);
});

test("applyDrafts: index lệch → append kèm cảnh báo, bài vẫn dùng được", () => {
  const r = applyDrafts([q("Q1")], [d("Lệch", { index: 7 })]);
  assert.equal(r.questions.length, 2);
  assert.equal(r.appended, 1);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /không hợp lệ/);
});

test("applyDrafts: hai câu cùng index → câu SAU thắng, câu trước bị bỏ qua + cảnh báo", () => {
  const r = applyDrafts([q("Q1"), q("Q2")], [
    d("Trước", { index: 1 }),
    d("Sau", { index: 1 }),
  ]);
  assert.equal(r.questions.length, 2);
  assert.equal(r.questions[0].questionText, "Sau");
  assert.equal(r.replaced, 1);
  assert.match(r.warnings[0], /cùng thay vị trí/);
});

test("applyDrafts: index đánh theo câu KHÔNG rỗng (khớp cách LLM đếm)", () => {
  // Form có 1 ô trống ở đầu → AI nhìn thấy 2 câu: "Q1" là câu 1, "Q2" là câu 2.
  const r = applyDrafts([blank(), q("Q1"), q("Q2")], [d("Sửa câu 2", { index: 2 })]);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].questionText, "");
  assert.equal(r.questions[1].questionText, "Q1");
  assert.equal(r.questions[2].questionText, "Sửa câu 2");
  assert.equal(r.replaced, 1);
  assert.deepEqual(r.warnings, []);
});

test("applyDrafts: index vượt số câu AI nhìn thấy → append + cảnh báo", () => {
  // AI nhìn thấy 2 câu (form: 1 ô trống + 2 câu) → index 3 là lệch.
  const r = applyDrafts([blank(), q("Q1"), q("Q2")], [d("Lệch", { index: 3 })]);
  // Câu mới lấp ô trống đầu → không tăng độ dài.
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].questionText, "Lệch");
  assert.equal(r.appended, 1);
  assert.match(r.warnings[0], /không hợp lệ/);
});

test("applyDrafts: câu mới lấp ô trống ở đầu thay vì nối thêm", () => {
  const r = applyDrafts([blank(), q("Q1")], [d("Mới")]);
  assert.equal(r.questions.length, 2);
  assert.equal(r.questions[0].questionText, "Mới");
  assert.equal(r.questions[1].questionText, "Q1");
  assert.equal(r.appended, 1);
});

test("applyDrafts: câu mới không lấp ô rỗng đã nhập dở (có lựa chọn)", () => {
  const r = applyDrafts([{ ...q(""), options: ["", "x", "", ""] }, q("Q1")], [d("Mới")]);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].options[1], "x"); // câu đang soạn dở không bị đè
  assert.equal(r.questions[2].questionText, "Mới");
});

test("applyDrafts: câu rỗng bị bỏ qua, không vào bài", () => {
  const r = applyDrafts([q("Q1")], [d(""), { questionText: "  " }]);
  assert.equal(r.questions.length, 1);
  assert.equal(r.skipped, 2);
  assert.equal(r.appended, 0);
});

test("applyDrafts: mix thay + thêm trong cùng lượt", () => {
  const r = applyDrafts([q("Q1"), q("Q2")], [
    d("Thay Q1", { index: 1 }),
    d("Thêm mới", { index: null }),
  ]);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].questionText, "Thay Q1");
  assert.equal(r.questions[1].questionText, "Q2");
  assert.equal(r.questions[2].questionText, "Thêm mới");
  assert.equal(r.replaced, 1);
  assert.equal(r.appended, 1);
});

test("applyDrafts: không mutate mảng câu hỏi gốc", () => {
  const original = [q("Q1")];
  const r = applyDrafts(original, [d("Mới")]);
  assert.equal(original.length, 1);
  assert.equal(original[0].questionText, "Q1");
  assert.equal(r.questions.length, 2);
});

test("applyDrafts: mảng options của câu gốc không bị chia sẻ tham chiếu", () => {
  const original = [q("Q1")];
  const r = applyDrafts(original, []);
  r.questions[0].options[0] = "đã sửa";
  assert.equal(original[0].options[0], "a");
});

test("applyDrafts: drafts rỗng → không đổi gì", () => {
  const r = applyDrafts([q("Q1")], []);
  assert.equal(r.questions.length, 1);
  assert.equal(r.replaced, 0);
  assert.equal(r.appended, 0);
});

test("applyDrafts: touched trả về index 0-based của câu vừa bị thay", () => {
  const r = applyDrafts([q("Q1"), q("Q2")], [d("X", { index: 2 })]);
  assert.deepEqual(r.touched, [1]);
});

// ── buildPendingQuestions ──────────────────────────────────────────────────

test("buildPendingQuestions: loại câu không có nội dung", () => {
  const r = buildPendingQuestions([
    q("Câu 1"),
    { ...q(""), options: ["", "", "", ""] },
    q("Câu 3"),
  ]);
  assert.equal(r.length, 2);
  assert.equal(r[0].questionText, "Câu 1");
  assert.equal(r[1].questionText, "Câu 3");
});

test("buildPendingQuestions: giữ nguyên thứ tự (quan trọng cho đánh số 1..N của LLM)", () => {
  const r = buildPendingQuestions([q("A"), q("B"), q("C")]);
  assert.deepEqual(
    r.map((it) => it.questionText),
    ["A", "B", "C"]
  );
});

test("buildPendingQuestions: map đúng shape PendingQuestion của backend", () => {
  const r = buildPendingQuestions([
    q("Hỏi?", ["A1", "B2", "C3", "D4"], {
      correctAnswer: "B",
      explanation: "  vì sao  ",
      cefrLevel: "B1",
      skillCode: "past_simple",
    }),
  ]);
  assert.deepEqual(r[0], {
    questionText: "Hỏi?",
    optionA: "A1",
    optionB: "B2",
    optionC: "C3",
    optionD: "D4",
    correctAnswer: "B",
    explanation: "vì sao",
    cefrLevel: "B1",
    skillCode: "past_simple",
  });
});

test("buildPendingQuestions: trường rỗng → null (backend có @Pattern/@Size)", () => {
  const r = buildPendingQuestions([q("Hỏi?", ["A1", "B2", "C3", "D4"])]);
  assert.equal(r[0].explanation, null);
  assert.equal(r[0].cefrLevel, null);
  assert.equal(r[0].skillCode, null);
});

test("buildPendingQuestions: input rỗng → mảng rỗng", () => {
  assert.deepEqual(buildPendingQuestions([]), []);
  assert.deepEqual(buildPendingQuestions(null), []);
});
