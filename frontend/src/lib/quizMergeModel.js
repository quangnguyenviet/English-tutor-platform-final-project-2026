/**
 * quizMergeModel.js
 * Logic gộp câu hỏi do AI đề xuất vào bài quiz của gia sư, và mapping câu hỏi
 * trên form → payload `pendingQuestions` gửi lên AI.
 *
 * Toàn bộ là pure functions — không phụ thuộc DOM, không gọi API.
 * Dùng cho trang soạn quiz (/tutor/classes/:classId/lessons/quiz/:lessonId).
 *
 * Ngữ nghĩa `index` (khớp backend AiDraftQuestionResponse + AI service
 * schemas.py): `index` là số thứ tự 1-based của câu trong bản nháp hiện tại mà
 * câu AI trả về này THAY thế (gia sư nói "sửa câu số k"). `null` = câu mới →
 * thêm vào cuối.
 *
 * LƯU Ý về cách đánh số: bản nháp gửi lên AI là `buildPendingQuestions(questions)`
 * — đã LOẠI các câu không có nội dung. LLM đánh số 1..N theo đúng thứ tự mảng
 * đó. Vì vậy `index` của AI trỏ tới "câu KHÔNG RỖNG thứ k", KHÔNG phải "vị trí
 * thứ k trong mảng form" (form luôn có 1 câu rỗng ở đầu khi mới mở soạn).
 * Hàm {@link eligiblePositions} ánh xạ giữa hai cách đánh số này.
 */

/** Shape một câu trong form soạn quiz (khớp state `questions`). */
export const BLANK_QUESTION = {
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "A",
  explanation: "",
  cefrLevel: "",
  skillCode: "",
};

/**
 * Chuyển 1 câu AI (shape `AiDraftQuestionResponse`) thành câu form A–D.
 *
 * @param {Object} d - câu AI đề xuất
 * @returns {Object} câu form
 */
export function draftToFormQuestion(d) {
  return {
    questionText: d?.questionText || "",
    options: [d?.optionA || "", d?.optionB || "", d?.optionC || "", d?.optionD || ""],
    correctAnswer: d?.correctAnswer || "A",
    explanation: d?.explanation || "",
    cefrLevel: d?.cefrLevel || "",
    skillCode: d?.skillCode || "",
  };
}

/**
 * Câu AI không có nội dung → bỏ qua (không đưa vào bài).
 * @param {Object} d
 * @returns {boolean}
 */
export function isBlankDraft(d) {
  return !d || !String(d.questionText || "").trim();
}

/**
 * Vị trí (0-based trong mảng câu hỏi) của các câu KHÔNG rỗng — đúng thứ tự
 * đánh số 1..N mà AI nhìn thấy trong `pendingQuestions`.
 *
 * @param {Array<Object>} questions
 * @returns {number[]}
 */
export function eligiblePositions(questions) {
  if (!Array.isArray(questions)) return [];
  const out = [];
  for (let i = 0; i < questions.length; i += 1) {
    if (String(questions[i]?.questionText || "").trim()) out.push(i);
  }
  return out;
}

/**
 * Xác định câu AI sẽ thay câu nào trong bài hiện tại.
 *
 * @param {Object} draft - câu AI đề xuất
 * @param {number} total - số câu KHÔNG RỖNG đang có (tức số câu AI nhìn thấy)
 * @returns {{mode: "replace"|"append", index: number, warning: string|null}}
 *   `index` là 0-based trong danh sách câu không rỗng khi mode = "replace";
 *   null khi mode = "append".
 */
export function resolveDraftTarget(draft, total) {
  const raw = draft?.index;
  if (raw === null || raw === undefined || raw === "") {
    return { mode: "append", index: null, warning: null };
  }

  const k = Number(raw);
  if (!Number.isInteger(k)) {
    return {
      mode: "append",
      index: null,
      warning: `AI trả về vị trí câu không hợp lệ ("${raw}") — đã thêm câu vào cuối bài.`,
    };
  }

  if (k < 1 || k > total) {
    return {
      mode: "append",
      index: null,
      warning: `AI trả về vị trí câu ${k} không hợp lệ (bài đang có ${total} câu) — đã thêm câu vào cuối bài.`,
    };
  }

  return { mode: "replace", index: k - 1, warning: null };
}

/**
 * Gộp một loạt câu AI vào danh sách câu hiện tại.
 *
 * Quy tắc:
 *  - Câu không có nội dung → bỏ qua.
 *  - `index` hợp lệ → thay in-place tại đúng câu (giữ nguyên thứ tự, độ dài).
 *  - `index` lệch → thêm vào cuối kèm cảnh báo.
 *  - Nhiều câu cùng nhắm một vị trí → câu SAU thắng, câu trước bị bỏ qua kèm cảnh báo.
 *  - Câu mới ưu tiên lấp ô trống trước (form mới mở luôn có 1 câu rỗng ở đầu).
 *
 * @param {Array<Object>} questions - câu hỏi hiện tại trên form
 * @param {Array<Object>} drafts - câu AI đề xuất
 * @returns {{questions: Array<Object>, replaced: number, appended: number,
 *            skipped: number, warnings: string[], touched: number[]}}
 *   `touched` là các index (0-based trong mảng câu hỏi MỚI) vừa bị AI ghi
 *   (câu thay in-place + câu mới — kể cả câu mới lấp ô trống).
 */
export function applyDrafts(questions, drafts) {
  const base = Array.isArray(questions) ? questions : [];
  const list = Array.isArray(drafts) ? drafts : [];

  const next = base.map((q) => ({ ...q, options: [...(q.options || ["", "", "", ""])] }));
  const warnings = [];
  let replaced = 0;
  let appended = 0;
  let skipped = 0;

  // Mọi index của AI được hiểu theo danh sách câu KHÔNG rỗng (như AI thấy).
  const positions = eligiblePositions(base);
  const total = positions.length;

  // Gom các câu "thay" theo vị trí — câu sau ghi đè câu trước.
  const replaceAt = new Map();
  const appends = [];

  for (const draft of list) {
    if (isBlankDraft(draft)) {
      skipped += 1;
      continue;
    }

    const target = resolveDraftTarget(draft, total);
    if (target.mode === "replace") {
      if (replaceAt.has(target.index)) {
        warnings.push(
          `AI trả về 2 câu cùng thay vị trí câu ${target.index + 1} — chỉ giữ câu sau.`
        );
      }
      replaceAt.set(target.index, draft);
      continue;
    }

    if (target.warning) warnings.push(target.warning);
    appends.push(draft);
  }

  // Áp các câu "thay" vào đúng vị trí trên form.
  const touched = [];
  for (const [eligibleIdx, draft] of replaceAt) {
    const pos = positions[eligibleIdx];
    if (pos === undefined) continue;
    next[pos] = draftToFormQuestion(draft);
    touched.push(pos);
    replaced += 1;
  }

  // Các câu mới: lấp ô trống trước, không có thì thêm vào cuối.
  for (const draft of appends) {
    const blankPos = next.findIndex(
      (q) => !String(q.questionText || "").trim() && q.options.every((o) => !String(o || "").trim())
    );
    const item = draftToFormQuestion(draft);
    if (blankPos >= 0) {
      next[blankPos] = item;
      touched.push(blankPos);
    } else {
      next.push(item);
      touched.push(next.length - 1);
    }
    appended += 1;
  }

  return {
    questions: next,
    replaced,
    appended,
    skipped,
    warnings,
    touched: touched.sort((a, b) => a - b),
  };
}

/**
 * Mapping câu hỏi trên form → payload `pendingQuestions` gửi lên AI.
 *
 * Câu không có nội dung bị LOẠI bỏ (backend cũng filter vậy) — quan trọng vì
 * LLM đánh số bản nháp 1..N theo đúng thứ tự mảng để hiểu "câu số k"; giữ
 * câu rỗng sẽ làm lệch số thứ tự đó.
 *
 * @param {Array<Object>} questions - câu hỏi hiện tại trên form
 * @returns {Array<Object>} mảng PendingQuestion
 */
export function buildPendingQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .filter((q) => q && String(q.questionText || "").trim())
    .map((q) => ({
      questionText: q.questionText.trim(),
      optionA: (q.options?.[0] || "").trim(),
      optionB: (q.options?.[1] || "").trim(),
      optionC: (q.options?.[2] || "").trim(),
      optionD: (q.options?.[3] || "").trim(),
      correctAnswer: q.correctAnswer || "A",
      explanation: (q.explanation || "").trim() || null,
      cefrLevel: q.cefrLevel || null,
      skillCode: q.skillCode || null,
    }));
}
