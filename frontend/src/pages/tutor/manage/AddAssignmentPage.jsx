import { useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Sparkles, Check, Library } from "lucide-react";
import { skillList, exerciseBank } from "../../../data/mockData";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import { difficultyOptions } from "./manageHelpers";
import { buildMockQuestions } from "../../../lib/generateExercise";

const kindOptions = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "fill", label: "Điền từ" },
  { value: "writing", label: "Tự luận" },
  { value: "speaking", label: "Bài nói" },
];

function blankQuestion(kind) {
  if (kind === "mcq")
    return { kind: "mcq", prompt: "", options: ["A. ", "B. ", "C. ", "D. "], answer: "A" };
  if (kind === "fill") return { kind: "fill", prompt: "", sentence: "" };
  return { kind, prompt: "" };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export default function AddAssignmentPage() {
  const navigate = useNavigate();
  const { classId, pathItems, setExercisesList } = useOutletContext();
  const [searchParams] = useSearchParams();
  const presetSkill = searchParams.get("skill");

  const [step, setStep] = useState(1);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [form, setForm] = useState({
    title: "",
    skill: presetSkill && skillList.includes(presetSkill) ? presetSkill : skillList[0],
    difficulty: "Trung bình",
    sessionId: "",
  });
  const [questions, setQuestions] = useState(() => [blankQuestion("mcq")]);

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

  function generateQuestions() {
    // Dùng loại câu hỏi đầu tiên để sinh
    const firstKind = questions[0]?.kind ?? "mcq";
    const kindLabel = kindOptions.find((o) => o.value === firstKind)?.label ?? "Trắc nghiệm";
    const respectsCount = kindLabel === "Trắc nghiệm" || kindLabel === "Điền từ";
    const params = { skill: form.skill, difficulty: form.difficulty, type: kindLabel, topic: form.title || "Chủ đề chung" };
    const generated = respectsCount
      ? buildMockQuestions({ ...params, count: 5 })
      : Array.from({ length: 3 }, () => buildMockQuestions({ ...params, count: 1 })).flat();
    setQuestions(generated);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (questions.length === 0) return;

    // Tổng hợp type từ các câu hỏi
    const uniqueKinds = [...new Set(questions.map((q) => q.kind))];
    const type = uniqueKinds
      .map((k) => kindOptions.find((o) => o.value === k)?.label ?? "")
      .filter(Boolean)
      .join(" + ");

    const exercise = {
      title: form.title.trim(),
      skill: form.skill,
      difficulty: form.difficulty,
      type,
      questions,
    };

    // 1. Luôn thêm vào danh sách bài tập của học sinh
    const id = `ex-custom-${Date.now()}`;
    setExercisesList((prev) => [
      { ...exercise, id, status: "assigned", assignedDate: "Hôm nay", sessionId: form.sessionId || null },
      ...prev,
    ]);

    // 2. Nếu chọn, thêm vào kho bài tập chung
    if (saveToLibrary) {
      const bankId = `bank-${Date.now()}`;
      exerciseBank.push({
        id: bankId,
        title: exercise.title,
        skill: exercise.skill,
        difficulty: exercise.difficulty,
        type: exercise.type,
        usageCount: 0,
      });
    }

    navigate(`/tutor/classes/${classId}/exercises`);
  }

  return (
    <div>
      <Link
        to={`/tutor/classes/${classId}/exercises`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} /> Quay lại bài tập
      </Link>

      <PageHeader title="Thêm bài tập mới" description={`Bước ${step}/2: ${step === 1 ? "Thông tin bài tập" : "Nội dung câu hỏi"}`} />

      <div className="mb-6 flex gap-1">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />
      </div>

      {step === 1 && (
        <Card className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Tên bài tập <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="VD: Writing Task 2: Bài luận quan điểm"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Kỹ năng</label>
            <div className="flex flex-wrap gap-2">
              {skillList.map((sk) => (
                <button
                  type="button"
                  key={sk}
                  onClick={() => setForm((f) => ({ ...f, skill: sk }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.skill === sk
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {sk}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Độ khó</label>
              <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} className={inputClass}>
                {difficultyOptions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Gắn với buổi học</label>
              <select value={form.sessionId} onChange={(e) => setForm((f) => ({ ...f, sessionId: e.target.value }))} className={inputClass}>
                <option value="">Không gắn buổi học</option>
                {pathItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    Buổi {it.session}: {it.topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-600">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="shrink-0 accent-blue-600"
              />
              <Library size={15} className="shrink-0 text-slate-400" />
              <span>
                Lưu vào <span className="font-medium">Kho bài tập</span> để dùng lại cho các học sinh khác
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/tutor/classes/${classId}/exercises`)} type="button">
              Hủy
            </Button>
            <Button size="sm" onClick={() => setStep(2)} disabled={!form.title.trim()} type="button">
              Tiếp theo: Nội dung câu hỏi
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{questions.length} câu hỏi</p>
            <button
              onClick={generateQuestions}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              <Sparkles size={14} /> Sinh tự động
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      {i + 1}
                    </span>
                    <select
                      value={q.kind}
                      onChange={(e) => changeKind(i, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
                    >
                      {kindOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeQuestion(i)}
                    title="Xóa câu hỏi"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  <textarea
                    value={q.prompt}
                    onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                    rows={2}
                    placeholder="Nhập nội dung câu hỏi..."
                    className={inputClass}
                  />
                </div>

                {q.kind === "mcq" && (
                  <div className="space-y-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Đáp án</label>
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
                            placeholder={`Đáp án ${letter}`}
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
          </div>

          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <Plus size={14} /> Thêm câu hỏi
          </button>

          <div className="flex items-center justify-between gap-2 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setStep(1)} type="button">
              Quay lại
            </Button>
            <Button size="sm" onClick={handleSave} disabled={questions.length === 0} type="button">
              <Check size={14} /> Tạo bài tập
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}