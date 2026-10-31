import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  ListChecks,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import clsx from "clsx";
import {
  apiAssignQuiz,
  apiCreateSessionQuiz,
  apiGetQuiz,
  apiGetSkills,
  apiUpdateQuiz,
  QUIZ_STATUS_META,
  formatDeadlineInput,
  formatDeadlineLabel,
} from "../../../lib/quizApi";

/** Câu hỏi trắc nghiệm A–D trong form (UI): 4 lựa chọn + radio đáp án đúng. */
function blankQuestion() {
  return {
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    explanation: "",
    cefrLevel: "",
    skillCode: "",
  };
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ANSWER_LETTERS = ["A", "B", "C", "D"];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950";

/** Chuyển "YYYY-MM-DDTHH:mm" (datetime-local) sang ISO UTC để gửi backend. */
function toIso(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function QuizAuthoring({ token, basePath, detail }) {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizIdParam = searchParams.get("quizId");
  const isEditing = Boolean(quizIdParam);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [skills, setSkills] = useState([]);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [showAssign, setShowAssign] = useState(false);
  const [deadline, setDeadline] = useState(formatDeadlineInput(new Date(Date.now() + 7 * 86400000)));
  const [assigning, setAssigning] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Danh sách kỹ năng chung (ô chọn cho từng câu).
  useEffect(() => {
    if (!token) return;
    apiGetSkills(token)
      .then((items) => setSkills(items || []))
      .catch(() => setSkills([]));
  }, [token]);

  // Sửa quiz có sẵn (mở bản nháp / bản đã giao để xem & sửa khi còn DRAFT).
  useEffect(() => {
    if (!token || !quizIdParam) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    apiGetQuiz(token, quizIdParam)
      .then((q) => {
        setExisting(q);
        setTitle(q.title || "");
        setQuestions(
          (q.questions || []).map((it) => ({
            questionText: it.questionText || "",
            options: [it.optionA || "", it.optionB || "", it.optionC || "", it.optionD || ""],
            correctAnswer: it.correctAnswer || "A",
            explanation: it.explanation || "",
            cefrLevel: it.cefrLevel || "",
            skillCode: it.skillCode || "",
          }))
        );
      })
      .catch((err) => setLoadError(err.message || "Không thể tải quiz."))
      .finally(() => setLoading(false));
  }, [token, quizIdParam]);

  const isDraft = !existing || existing.status === "DRAFT";

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

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  /** Tổng hợp form → payload chuẩn API (trim + null cho trường rỗng). */
  function buildPayload() {
    return {
      title: title.trim(),
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        optionA: q.options[0].trim(),
        optionB: q.options[1].trim(),
        optionC: q.options[2].trim(),
        optionD: q.options[3].trim(),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation?.trim() || null,
        cefrLevel: q.cefrLevel || null,
        skillCode: q.skillCode || null,
      })),
    };
  }

  /** Validation phía client (mềm) trước khi gọi API. */
  function clientValidate() {
    if (!title.trim()) return "Vui lòng nhập tiêu đề quiz.";
    if (questions.length === 0) return "Quiz cần ít nhất một câu hỏi.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Câu ${i + 1}: nội dung câu hỏi đang trống.`;
      if (q.options.some((o) => !o.trim()))
        return `Câu ${i + 1}: các lựa chọn A–D không được để trống.`;
    }
    return "";
  }

  /** Lưu (tạo DRAFT mới hoặc sửa). Trả về id quiz (mới hoặc hiện tại). */
  async function persist(forAssign) {
    const payload = buildPayload();
    const error = clientValidate();
    if (error) {
      setFormError(error);
      return null;
    }
    setSaving(true);
    setFormError("");
    try {
      let id = quizIdParam;
      if (isEditing) {
        await apiUpdateQuiz(token, quizIdParam, payload);
      } else {
        const created = await apiCreateSessionQuiz(token, sessionId, payload);
        id = created.quizId;
        setExisting({ ...created, status: "DRAFT" });
      }
      if (forAssign) return id;

      showToast(isEditing ? "Đã lưu chỉnh sửa quiz." : "Đã lưu quiz nháp.");
      navigate(`${basePath}/sessions`);
      return id;
    } catch (err) {
      setFormError(err.message || "Không thể lưu quiz. Vui lòng kiểm tra lại nội dung.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  const handleSave = async () => persist(false);

  /** Lưu (nếu chưa) rồi giao bài theo thời hạn đã chọn. */
  const handleConfirmAssign = async () => {
    const iso = toIso(deadline);
    if (!iso) {
      setFormError("Vui lòng chọn thời hạn làm quiz.");
      return;
    }
    setAssigning(true);
    setFormError("");
    try {
      let id = quizIdParam;
      if (!id) {
        id = await persist(true);
        if (!id) {
          setAssigning(false);
          return;
        }
      }
      await apiAssignQuiz(token, id, iso);
      showToast("Đã giao quiz cho học sinh.");
      navigate(`${basePath}/sessions`);
    } catch (err) {
      setFormError(err.message || "Không thể giao quiz. Vui lòng thử lại.");
      setAssigning(false);
    }
  };

  const previewMeta = useMemo(() => {
    const status = existing?.status;
    return status ? QUIZ_STATUS_META[status] : null;
  }, [existing]);

  const backTo = `${basePath}/sessions`;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl",
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          )}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Quay lại buổi học
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {isEditing ? "Sửa quiz" : "Soạn quiz buổi học"}
              </h2>
              {previewMeta && <Badge tone={previewMeta.tone}>{previewMeta.label}</Badge>}
              {!previewMeta && <Badge tone="amber">Nháp</Badge>}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {detail?.title ? `Buổi học: ${detail.title}` : "Nhập câu hỏi trắc nghiệm A–D cho buổi học."}
              {existing?.deadline ? ` · Hạn làm ${formatDeadlineLabel(existing.deadline)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <div className="flex-1">{formError}</div>
          <button
            type="button"
            onClick={() => setFormError("")}
            className="text-rose-400 hover:text-rose-600"
            aria-label="Đóng thông báo lỗi"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <Card className="space-y-3">
          <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </Card>
      ) : loadError ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(backTo)}>
            Quay lại
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Cột trái (3/5): form */}
          <div className="space-y-4 lg:col-span-3">
            <Card className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Tiêu đề quiz <span className="text-rose-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Quiz ôn tập Past Simple"
                  disabled={!isDraft}
                  className={inputClass}
                />
              </div>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {questions.length} câu hỏi
                </p>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={!isDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
                >
                  <Plus size={14} /> Thêm câu
                </button>
              </div>

              {questions.map((q, i) => (
                <Card key={i} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {i + 1}
                      </span>
                      <ListChecks size={15} className="text-slate-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      disabled={!isDraft}
                      title="Xóa câu"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={(e) => updateQuestion(i, { questionText: e.target.value })}
                    disabled={!isDraft}
                    placeholder="Nhập nội dung câu hỏi..."
                    className={inputClass}
                  />

                  {/* 4 lựa chọn + radio đáp án đúng */}
                  <div className="space-y-2">
                    {ANSWER_LETTERS.map((letter, optIdx) => (
                      <div key={letter} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`answer-${i}`}
                          checked={q.correctAnswer === letter}
                          onChange={() => updateQuestion(i, { correctAnswer: letter })}
                          disabled={!isDraft}
                          className="shrink-0 accent-blue-600"
                          aria-label={`Đáp án đúng là ${letter}`}
                        />
                        <input
                          value={q.options[optIdx]}
                          onChange={(e) => updateOption(i, optIdx, e.target.value)}
                          disabled={!isDraft}
                          placeholder={`Lựa chọn ${letter}`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Giải thích + CEFR + kỹ năng */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        Giải thích (tuỳ chọn)
                      </label>
                      <input
                        value={q.explanation}
                        onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                        disabled={!isDraft}
                        placeholder="Lý do đáp án đúng..."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        Mức CEFR (tuỳ chọn)
                      </label>
                      <select
                        value={q.cefrLevel}
                        onChange={(e) => updateQuestion(i, { cefrLevel: e.target.value })}
                        disabled={!isDraft}
                        className={inputClass}
                      >
                        <option value="">Không xác định</option>
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Gắn kỹ năng (tuỳ chọn)
                    </label>
                    <select
                      value={q.skillCode}
                      onChange={(e) => updateQuestion(i, { skillCode: e.target.value })}
                      disabled={!isDraft}
                      className={inputClass}
                    >
                      <option value="">Không gắn kỹ năng</option>
                      {skills.map((sk) => (
                        <option key={sk.skillCode} value={sk.skillCode}>
                          {sk.skillName}
                          {sk.category ? ` (${sk.category})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
                  Chưa có câu hỏi nào.
                </p>
              )}
            </div>
          </div>

          {/* Cột phải (2/5): preview + trạng thái */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-blue-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Xem trước</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {title.trim() || "Quiz chưa đặt tên"}
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {questions.slice(0, 3).map((q, i) => (
                  <div key={i} className="py-2 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {i + 1}. {q.questionText || "…"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Đáp án {q.correctAnswer} · {q.options[0] || "…"}
                    </p>
                  </div>
                ))}
                {questions.length > 3 && (
                  <p className="pt-2 text-[11px] text-slate-400">
                    + {questions.length - 3} câu nữa
                  </p>
                )}
              </div>
            </Card>

            {/* Trạng thái khi sửa / xem quiz đã giao */}
            {existing && (
              <Card className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Trạng thái</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {previewMeta && <Badge tone={previewMeta.tone}>{previewMeta.label}</Badge>}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {questions.length} câu
                  </span>
                </div>
                {existing.deadline && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hạn làm: {formatDeadlineLabel(existing.deadline)}
                  </p>
                )}
                {!isDraft && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quiz đã {previewMeta?.label?.toLowerCase() || "được xử lý"}, chỉ xem được —
                    không thể sửa.
                  </p>
                )}
              </Card>
            )}

            {/* Thao tác */}
            <Card className="space-y-3 p-5">
              {isDraft && (
                <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Đang lưu..." : (
                    <>
                      <Save size={14} /> Lưu nháp
                    </>
                  )}
                </Button>
              )}
              <Button
                variant={isDraft ? "outline" : "secondary"}
                size="sm"
                onClick={() => setShowAssign(true)}
                disabled={assigning}
                className={clsx("w-full", !isDraft && "opacity-50")}
              >
                <Send size={14} /> Giao bài cho học sinh
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Modal giao bài (deadline) */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Giao quiz</h4>
                <p className="text-[11px] text-slate-400">Học sinh nhận thông báo khi giao bài.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssign(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Thời hạn làm quiz
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Học sinh hoàn thành trước thời điểm này; quá hạn quiz chuyển trạng thái hết hạn.
              </p>
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setShowAssign(false)} type="button">
                Hủy
              </Button>
              <Button size="sm" onClick={handleConfirmAssign} disabled={assigning} type="button">
                {assigning ? "Đang giao..." : (
                  <>
                    <Check size={14} /> Xác nhận giao
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
