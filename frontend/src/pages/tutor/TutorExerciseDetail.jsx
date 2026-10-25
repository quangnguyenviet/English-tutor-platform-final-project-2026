import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Check, ClipboardCheck, Clock, FileText, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { getStudentById, gradingQueue } from "../../data/mockData";
import { buildMockQuestions } from "../../lib/generateExercise";
import { contentKeyFor, getExerciseContent, setExerciseContent } from "../../data/exerciseContentStore";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

const exerciseStatus = {
  graded: { label: "Đã chấm", tone: "emerald" },
  submitted: { label: "Chờ chấm", tone: "amber" },
  assigned: { label: "Đã giao", tone: "neutral" },
};

const kindOptions = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "fill", label: "Điền từ" },
  { value: "writing", label: "Tự luận" },
  { value: "speaking", label: "Bài nói" },
];

function blankQuestion(kind) {
  if (kind === "mcq") return { kind: "mcq", prompt: "", options: ["A. ", "B. ", "C. ", "D. "], answer: "A" };
  if (kind === "fill") return { kind: "fill", prompt: "", sentence: "" };
  return { kind, prompt: "" };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export default function TutorExerciseDetail() {
  const { classId, exerciseId } = useParams();
  const location = useLocation();
  // Workspace lớp đang dùng dữ liệu mock của học sinh demo (id "s1") cho các tab prototype.
  const student = getStudentById("s1");
  // Bài tập vừa thêm/sửa trong phiên làm việc này (chưa có trong mockData tĩnh)
  // được truyền kèm qua router state để trang chi tiết vẫn hiển thị đúng.
  const exercise = location.state?.exercise ?? student?.exercises.find((e) => e.id === exerciseId);
  const studentName = location.state?.studentName ?? student?.name;
  const sessionLabelText =
    location.state?.sessionLabel ??
    (() => {
      const item = student?.learningPath.find((it) => it.id === exercise?.sessionId);
      return item ? `Buổi ${item.session}: ${item.topic}` : null;
    })();
  const gradingItem = gradingQueue.find((g) => g.studentId === "s1" && g.exerciseId === exerciseId);
  const contentKey = exercise ? contentKeyFor(classId, exercise.id) : null;

  function initialQuestions() {
    if (!exercise) return [];
    const stored = getExerciseContent(contentKey);
    if (stored) return stored;
    if (exercise.questions) return exercise.questions;
    return buildMockQuestions({
      skill: exercise.skill,
      difficulty: exercise.difficulty,
      type: exercise.type,
      topic: exercise.title,
      count: 5,
    });
  }

  const [questions, setQuestions] = useState(initialQuestions);
  const [editingContent, setEditingContent] = useState(false);

  const backTo = `/tutor/classes/${classId}/exercises`;

  if (!exercise) {
    return (
      <div>
        <Link to="/tutor/classes" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <p className="mt-4 text-sm text-slate-500">Không tìm thấy bài tập.</p>
      </div>
    );
  }

  function updateQuestion(idx, patch) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options };
      })
    );
  }

  function changeKind(idx, kind) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...blankQuestion(kind), prompt: q.prompt } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion("mcq")]);
  }

  function generateMore() {
    const respectsCount = exercise.type === "Trắc nghiệm" || exercise.type === "Điền từ";
    const params = { skill: exercise.skill, difficulty: exercise.difficulty, type: exercise.type, topic: exercise.title };
    // buildMockQuestions bỏ qua "count" với các dạng tự luận/bài nói (luôn trả về 1 câu),
    // nên với các dạng đó gọi lặp lại 3 lần để luôn thêm đúng 3 câu.
    const generated = respectsCount
      ? buildMockQuestions({ ...params, count: 3 })
      : Array.from({ length: 3 }, () => buildMockQuestions({ ...params, count: 1 })).flat();
    setQuestions((prev) => [...prev, ...generated]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function startEditContent() {
    setEditingContent(true);
  }

  function saveContent() {
    setExerciseContent(contentKey, questions);
    setEditingContent(false);
  }

  function cancelContent() {
    setQuestions(getExerciseContent(contentKey) ?? exercise.questions ?? initialQuestions());
    setEditingContent(false);
  }

  return (
    <div>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} /> Quay lại bài tập của {studentName}
      </Link>

      <PageHeader
        title={exercise.title}
        description={`${exercise.skill} · ${exercise.difficulty} · ${exercise.type}`}
        actions={<Badge tone={exerciseStatus[exercise.status].tone}>{exerciseStatus[exercise.status].label}</Badge>}
      />

      <Card className="mb-6">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Giao ngày</p>
            <p className="mt-0.5 text-slate-700 dark:text-slate-200">{exercise.assignedDate}</p>
          </div>
          {exercise.dueDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Hạn nộp</p>
              <p className="mt-0.5 text-slate-700 dark:text-slate-200">{exercise.dueDate}</p>
            </div>
          )}
          {exercise.submittedAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nộp ngày</p>
              <p className="mt-0.5 text-slate-700 dark:text-slate-200">{exercise.submittedAt}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Gắn với buổi học</p>
            <p className="mt-0.5">
              {sessionLabelText ? (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <FileText size={12} /> {sessionLabelText}
                </span>
              ) : (
                <span className="text-slate-400">Chưa gắn buổi học</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {exercise.status === "graded" && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              {exercise.score}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Điểm: {exercise.score}/{exercise.maxScore}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đã chấm và gửi kết quả cho học sinh</p>
            </div>
          </div>
          {exercise.feedback && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Nhận xét đã gửi</p>
              {exercise.feedback}
            </div>
          )}
        </Card>
      )}

      {exercise.status === "submitted" && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Clock size={18} className="shrink-0" />
            <p className="text-sm">Học sinh đã nộp bài, đang chờ bạn duyệt điểm.</p>
          </div>
          {gradingItem && (
            <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                <Sparkles size={14} /> AI đề xuất {gradingItem.aiSuggestedScore}/{gradingItem.aiSuggestedMax}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{gradingItem.aiFeedback}</p>
            </div>
          )}
          <Button as={Link} to="/tutor/grading" size="sm">
            <ClipboardCheck size={16} /> Đi tới trang Chấm bài
          </Button>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Nội dung bài tập</h3>
        {!editingContent && (
          <Button variant="secondary" size="sm" onClick={startEditContent}>
            <Pencil size={14} /> Chỉnh sửa nội dung
          </Button>
        )}
      </div>

      {!editingContent ? (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={i}>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                Câu {i + 1}: {q.prompt || <span className="italic text-slate-400">(chưa có nội dung)</span>}
              </p>
              {q.kind === "mcq" && (
                <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  {q.options.map((o, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <li key={idx} className={q.answer === letter ? "font-medium text-emerald-600 dark:text-emerald-400" : ""}>
                        {o}
                      </li>
                    );
                  })}
                </ul>
              )}
              {q.kind === "fill" && (
                <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">{q.sentence}</p>
              )}
              {q.kind === "writing" && (
                <p className="mt-2 text-sm italic text-slate-400">Học sinh sẽ viết câu trả lời dạng tự luận.</p>
              )}
              {q.kind === "speaking" && (
                <p className="mt-2 text-sm italic text-slate-400">Học sinh sẽ ghi âm phần trả lời.</p>
              )}
            </Card>
          ))}
          {questions.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
              Bài tập này chưa có nội dung câu hỏi. Bấm "Chỉnh sửa nội dung" để thêm.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={i} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <select
                  value={q.kind}
                  onChange={(e) => changeKind(i, e.target.value)}
                  className={`${inputClass} w-auto`}
                >
                  {kindOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeQuestion(i)}
                  title="Xóa câu hỏi"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Câu {i + 1}: Nội dung câu hỏi</label>
                <textarea
                  value={q.prompt}
                  onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                  rows={2}
                  placeholder="Nhập đề bài / câu hỏi..."
                  className={inputClass}
                />
              </div>

              {q.kind === "mcq" && (
                <div className="space-y-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Đáp án (chọn đáp án đúng)</label>
                  {q.options.map((o, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`answer-${i}`}
                          checked={q.answer === letter}
                          onChange={() => updateQuestion(i, { answer: letter })}
                          className="shrink-0 accent-blue-600"
                        />
                        <input
                          value={o}
                          onChange={(e) => updateOption(i, optIdx, e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {q.kind === "fill" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Câu có chỗ trống</label>
                  <input
                    value={q.sentence}
                    onChange={(e) => updateQuestion(i, { sentence: e.target.value })}
                    placeholder="VD: She ____ (go) to school every day."
                    className={inputClass}
                  />
                </div>
              )}
            </Card>
          ))}

          {questions.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
              Chưa có câu hỏi nào.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <button
                onClick={addQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <Plus size={14} /> Thêm câu hỏi
              </button>
              <button
                onClick={generateMore}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <Sparkles size={14} /> Sinh thêm bằng AI (+3 câu)
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={cancelContent} type="button">
                <X size={14} /> Hủy
              </Button>
              <Button size="sm" onClick={saveContent} type="button">
                <Check size={14} /> Lưu nội dung
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
