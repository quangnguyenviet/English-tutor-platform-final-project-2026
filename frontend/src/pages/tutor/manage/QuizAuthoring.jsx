import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bot,
  Check,
  ListChecks,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import clsx from "clsx";
import { useToast } from "../../../hooks/useToast";
import QuizAiAssistant from "../../../components/tutor/QuizAiAssistant";
import SkillProfilePanel from "../../../components/tutor/SkillProfilePanel";
import { applyDrafts, buildPendingQuestions } from "../../../lib/quizMergeModel";
import {
  apiAssignQuiz,
  apiCreateLessonQuiz,
  apiGetQuiz,
  apiGetSkillProfile,
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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20";

/** Chuyển "YYYY-MM-DDTHH:mm" (datetime-local) sang ISO UTC để gửi backend. */
function toIso(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Câu đã "đủ": có nội dung câu hỏi + cả 4 lựa chọn A–D (vì validate bắt buộc). */
function isQuestionComplete(q) {
  return Boolean(q.questionText?.trim()) && q.options.every((o) => o?.trim());
}

export default function QuizAuthoring({ token, classId, basePath, detail }) {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
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
  // Lỗi validate ở cấp câu (map index → thông điệp), hiện hint inline trong thẻ câu hỏi.
  const [questionErrors, setQuestionErrors] = useState({});

  const [showAssign, setShowAssign] = useState(false);
  const [deadline, setDeadline] = useState(formatDeadlineInput(new Date(Date.now() + 7 * 86400000)));
  const [assigning, setAssigning] = useState(false);
  const deadlineInputRef = useRef(null);
  // Nút "Nhảy tới câu": popover danh sách chip — đặt ở footer cột phải
  // (desktop) và trong thanh hành động dưới (mobile) → luôn thấy khi cuộn.
  const [navOpen, setNavOpen] = useState(false);
  const [navPos, setNavPos] = useState(null);
  const navFabRef = useRef(null);
  const navBarRef = useRef(null);
  const navPopRef = useRef(null);
  const navFabBtnRef = useRef(null);
  const navBarBtnRef = useRef(null);

  // Trợ lý AI: hồ sơ kỹ năng (SKP). Câu hỏi AI trả về được GỘP THẲNG vào
  // form (không còn bước xem trước) — xem handleAiDrafts.
  const [skillProfile, setSkillProfile] = useState([]);
  const [skillProfileLoading, setSkillProfileLoading] = useState(true);
  // Tab hiện trong cột điều khiển phải: "assistant" (chat AI, mặc định) hoặc
  // "skills" (hồ sơ kỹ năng). Hai panel VẪN mount (ẩn bằng CSS) nên chat giữ
  // nguyên state khi chuyển tab, và khung không xê dịch.
  const [skillTab, setSkillTab] = useState("assistant");
  // Cờ "quiz này có câu do AI sinh" → ghi quizzes.source = AI_DIRECT lúc tạo mới.
  const [hasAiContent, setHasAiContent] = useState(false);
  // Nắp undo cho thao tác gộp câu AI (mỗi bước = snapshot câu hỏi trước khi gộp).
  const [undoStack, setUndoStack] = useState([]);

  // Đồng bộ `questions` để handler onDrafts đọc được giá trị mới nhất (tránh closure).
  const questionsRef = useRef(questions);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const pendingQuestions = useMemo(() => buildPendingQuestions(questions), [questions]);

  // Danh sách kỹ năng chung (ô chọn cho từng câu).
  useEffect(() => {
    if (!token) return;
    apiGetSkills(token)
      .then((items) => setSkills(items || []))
      .catch(() => setSkills([]));
  }, [token]);

  // --- Split-pane: chiều cao khả dụng cho vùng nội dung ---
  // Trên desktop, trang soạn quiz dùng mô hình 2 cột độc lập: cột trái tự
  // cuộn, cột phải (panel chat AI) đứng yên. Để trang KHÔNG còn cuộn được
  // (kể cả ở đầu/cuối), chiều cao trang phải khớp chính xác chiều cao vùng
  // cuộn. Tính bằng: clientHeight(vùng cuộn) - vị trí đầu trang - padding
  // đáy của lớp bọc. Nếu dư/chênh, vùng cuộn sẽ cuộn được và mọi khối bên
  // trong trôi theo ở hai đầu — đây là lý do phải đo chứ không hardcode theo vh.
  const pageRef = useRef(null);
  const [pageHeight, setPageHeight] = useState(null);

  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const measure = () => {
      // Chỉ áp dụng split-pane ở desktop; mobile dùng luồng cuộn của trang.
      if (window.innerWidth < 1024) {
        setPageHeight(null);
        return;
      }
      // Vùng cuộn thật là <main> của AppShell (không phải window).
      const scroller = el.closest("main");
      if (!scroller) {
        setPageHeight(null);
        return;
      }
      const scrollerRect = scroller.getBoundingClientRect();

      // Lớp bọc có padding của AppShell (px-4 py-6 lg:py-8) — cần trừ
      // padding đáy vì nó nằm SAU trang trong luồng, nếu quên thì vùng cuộn
      // dư đúng bằng padding và trang cuộn được.
      let padBottom = 0;
      for (let n = el.parentElement; n && n !== scroller; n = n.parentElement) {
        const pb = parseFloat(getComputedStyle(n).paddingBottom) || 0;
        if (pb > 0) {
          padBottom = pb;
          break;
        }
      }

      // Vị trí đầu trang tính từ mép trên nội dung của vùng cuộn (cộng lại
      // scrollTop để không phụ thuộc vị trí cuộn hiện tại).
      const offsetTop = el.getBoundingClientRect().top - scrollerRect.top + scroller.scrollTop;
      const h = scroller.clientHeight - offsetTop - padBottom;
      setPageHeight(h > 320 ? Math.floor(h) : null);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const scroller = el.closest("main");
    if (scroller) ro.observe(scroller);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [loading, loadError]);

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

  // Hồ sơ kỹ năng học sinh (drawer SKP, FR-13). Rỗng nếu chưa có dữ liệu.
  useEffect(() => {
    if (!token || !classId) {
      setSkillProfileLoading(false);
      return;
    }
    setSkillProfileLoading(true);
    apiGetSkillProfile(token, classId)
      .then((items) => setSkillProfile(items || []))
      .catch(() => setSkillProfile([]))
      .finally(() => setSkillProfileLoading(false));
  }, [token, classId]);

  const isDraft = !existing || existing.status === "DRAFT";

  /**
   * AI trả về câu hỏi → GỘP THẲNG vào form (không có bước xem trước).
   *
   * - `index` hợp lệ → thay in-place câu tương ứng (ngữ nghĩa "sửa câu số k").
   * - `index` lệch / null → thêm vào cuối bài (kèm cảnh báo nếu lệch).
   * - Mỗi lần gộp đều có thể Hoàn tác (nút ở footer hành động).
   */
  function handleAiDrafts(drafts) {
    if (!Array.isArray(drafts) || drafts.length === 0) return;
    if (!isDraft) {
      toast.warning("Quiz này đã giao — không thể thêm câu từ AI.");
      return;
    }

    const before = questionsRef.current;
    const result = applyDrafts(before, drafts);
    const merged = result.replaced + result.appended;
    if (merged === 0) {
      result.warnings.forEach((w) => toast.warning(w));
      return;
    }

    // Lưu snapshot để Hoàn tác (cờ aiFromAi gắn trên từng câu nên restore đúng).
    setUndoStack((prev) => [...prev.slice(-9), before]);
    const marked = result.questions.map((question, qi) =>
      result.touched.includes(qi) ? { ...question, aiFromAi: true } : question
    );
    // Đồng bộ ref NGAY (không chờ useEffect) để lượt AI kế tiếp đọc đúng
    // trạng thái vừa cập nhật, kể cả khi hai lượt về liền nhau.
    questionsRef.current = marked;
    setQuestions(marked);
    setHasAiContent(true);

    const parts = [];
    if (result.replaced) parts.push(`${result.replaced} câu được thay`);
    if (result.appended) parts.push(`${result.appended} câu được thêm`);
    toast.success(`AI đã cập nhật bài: ${parts.join(", ")}.`, { duration: 7000 });
    result.warnings.forEach((w) => toast.warning(w));
  }

  /** Hoàn tác thao tác gộp câu AI gần nhất. */
  function handleUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    questionsRef.current = last;
    setQuestions(last);
    setUndoStack((prev) => prev.slice(0, -1));
    toast.info("Đã hoàn tác thay đổi của AI.");
  }

  function updateQuestion(idx, patch) {
    // Gia sư tự sửa câu → bỏ dấu "do AI" (nội dung đã khác bản AI).
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch, aiFromAi: false } : q))
    );
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options, aiFromAi: false };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  /** Tổng hợp form → payload chuẩn API (trim + null cho trường rỗng).
   *  Khi có câu do AI gộp, ghi source = AI_DIRECT (chỉ ảnh hưởng khi TẠO mới;
   *  sửa quiz có sẵn giữ nguyên source đã lưu). */
  function buildPayload() {
    return {
      title: title.trim(),
      ...(hasAiContent ? { source: "AI_DIRECT" } : {}),
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

  /** Validation phía client (mềm) trước khi gọi API.
   *  Trả về "" (đủ) hoặc { message, index, questionErrors } (thiếu):
   *  index -1 = lỗi cấp tiêu đề; index >= 0 = câu lỗi, kèm map hint inline
   *  cho mỗi câu chưa đủ để "Nhảy tới câu" + tô chip đỏ. */
  function clientValidate() {
    if (!title.trim()) return { message: "Vui lòng nhập tiêu đề quiz.", index: -1, questionErrors: {} };
    if (questions.length === 0)
      return { message: "Quiz cần ít nhất một câu hỏi.", index: -1, questionErrors: {} };
    const perQuestion = {};
    let firstBad = -1;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        perQuestion[i] = "Nội dung câu hỏi đang trống.";
        if (firstBad === -1) firstBad = i;
      }
      if (q.options.some((o) => !o.trim())) {
        perQuestion[i] = perQuestion[i] || "Lựa chọn A–D chưa đủ.";
        if (firstBad === -1) firstBad = i;
      }
    }
    if (firstBad !== -1) {
      return {
        message: `Câu ${firstBad + 1}: ${perQuestion[firstBad]}`,
        index: firstBad,
        questionErrors: perQuestion,
      };
    }
    return "";
  }

  function scrollToQuestion(index) {
    document.getElementById(`q-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Lưu (tạo DRAFT mới hoặc sửa). Trả về id quiz (mới hoặc hiện tại). */
  async function persist(forAssign) {
    const payload = buildPayload();
    const validation = clientValidate();
    if (validation) {
      setFormError(validation.message);
      setQuestionErrors(validation.questionErrors);
      if (validation.index >= 0) scrollToQuestion(validation.index);
      return null;
    }
    setQuestionErrors({});
    setSaving(true);
    setFormError("");
    try {
      let id = quizIdParam;
      if (isEditing) {
        await apiUpdateQuiz(token, quizIdParam, payload);
      } else {
        const created = await apiCreateLessonQuiz(token, lessonId, payload);
        id = created.quizId;
        setExisting({ ...created, status: "DRAFT" });
      }
      if (forAssign) return id;

      toast.success(isEditing ? "Đã lưu chỉnh sửa quiz." : "Đã lưu quiz nháp.");
      navigate(`${basePath}/lessons`);
      return id;
    } catch (err) {
      setFormError(err.message || "Không thể lưu quiz. Vui lòng kiểm tra lại nội dung.");
      setSaving(false);
      return null;
    }
    // finally không dùng: case forAssign trả id về cho handleConfirmAssign tự tắt `saving`.
  }

  const handleSave = () => persist(false);

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
        setSaving(true);
        id = await persist(true);
        if (!id) {
          setAssigning(false);
          return;
        }
      }
      await apiAssignQuiz(token, id, iso);
      setShowAssign(false);
      toast.success("Đã giao quiz cho học sinh.");
      navigate(`${basePath}/lessons`);
    } catch (err) {
      setFormError(err.message || "Không thể giao quiz. Vui lòng thử lại.");
      setAssigning(false);
      setSaving(false);
    }
  };

  const previewMeta = useMemo(() => {
    const status = existing?.status;
    return status ? QUIZ_STATUS_META[status] : null;
  }, [existing]);

  const backTo = `${basePath}/lessons`;

  // Popover "Nhảy tới câu": đo vị trí nút để đặt popover ngay phía trên,
  // luôn nằm trong khung nhìn (đẩy sát mép khi sát cạnh).
  useLayoutEffect(() => {
    if (!navOpen) {
      setNavPos(null);
      return;
    }
    const place = () => {
      // Cả hai bản nút (desktop footer cột phải / mobile thanh đáy) đều
      // được mount, nhưng một bản bị ẩn theo breakpoint → chọn bản đang
      // hiện (rect có kích thước khác 0).
      const candidates = [navFabBtnRef.current, navBarBtnRef.current].filter(Boolean);
      const btn = candidates.find((el) => el.getBoundingClientRect().width > 0);
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const width = 256; // w-64 của popover
      const margin = 8;
      let left = r.left;
      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - width - margin;
      }
      if (left < margin) left = margin;
      setNavPos({
        left: `${Math.round(left)}px`,
        bottom: `${Math.round(window.innerHeight - r.top + margin)}px`,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [navOpen]);

  // Popover "Nhảy tới câu": đóng bằng Esc + click ra ngoài (đúng pattern
  // modal giao bài ở trên).
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onDown = (e) => {
      if (navPopRef.current?.contains(e.target)) return;
      if (navFabRef.current?.contains(e.target)) return;
      if (navBarRef.current?.contains(e.target)) return;
      setNavOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [navOpen]);

  // Nhiều hơn 1 câu mới có ý nghĩa điều hướng → tự đóng khi về ≤ 1.
  useEffect(() => {
    if (questions.length <= 1) setNavOpen(false);
  }, [questions.length]);

  /** Nút "Nhảy tới câu" — mở popover lưới chip.
      - Desktop: đặt ở footer cột phải (cột đứng yên → nút luôn trong khung nhìn).
      - Mobile: đặt trong thanh hành động dính đáy → cũng luôn thấy khi cuộn.
      Hai bản dùng chung state `navOpen`; popover render 1 lần ở cấp trang
      (renderNavPopover) qua portal vì khung tab phải có overflow-hidden. */
  function renderNavWidget(innerRef, btnRef) {
    const count = questions.length;
    if (count <= 1) return null;
    const errCount = Object.keys(questionErrors).length;
    return (
      <div ref={innerRef} className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-haspopup="true"
          title="Nhảy tới câu hỏi"
          aria-label={`Nhảy tới câu hỏi (${count} câu${errCount ? `, ${errCount} câu lỗi` : ""})`}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition active:scale-[0.98]",
            navOpen
              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          <ListChecks size={14} />
          Nhảy tới câu
          {errCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {errCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  /** Popover lưới chip số câu (render 1 lần ở cấp trang, qua portal). */
  function renderNavPopover() {
    const count = questions.length;
    if (!navOpen || !navPos || count <= 1) return null;
    const errCount = Object.keys(questionErrors).length;
    return createPortal(
      <div
        ref={navPopRef}
        role="dialog"
        aria-label="Đi tới câu hỏi"
        style={{ bottom: navPos.bottom, left: navPos.left }}
        className="fixed z-[60] w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Câu hỏi ({count})
          </p>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Đóng (Esc)"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={12} />
          </button>
        </div>
        <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto">
          {questions.map((q, i) => {
            const hasErr = Boolean(questionErrors[i]);
            const complete = isQuestionComplete(q);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  scrollToQuestion(i);
                  setNavOpen(false);
                }}
                title={`Câu ${i + 1}`}
                aria-label={`Câu ${i + 1}${hasErr ? " (chưa đủ)" : complete ? " (đã đủ)" : ""}`}
                className={clsx(
                  "flex h-7 items-center justify-center gap-1 rounded-full text-xs font-semibold transition active:scale-[0.96]",
                  hasErr
                    ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800"
                    : complete
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {hasErr ? <AlertCircle size={12} /> : complete ? <Check size={12} /> : i + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {errCount > 0
            ? "Xanh lá = đã đủ · đỏ = chưa đủ (lỗi validate)"
            : "Xanh lá = đã đủ · xám = chưa đủ"}
        </p>
      </div>,
      document.body
    );
  }

  function renderActions() {
    return (
      <>
        {undoStack.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            title="Hoàn tác thay đổi của AI vừa áp dụng"
            className="w-full sm:w-auto"
          >
            <Undo2 size={14} /> Hoàn tác
          </Button>
        )}
        {isDraft && (
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving || assigning} className="w-full sm:w-auto">
            {saving ? "Đang lưu..." : (
              <>
                <Save size={14} /> Lưu nháp
              </>
            )}
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => setShowAssign(true)}
          disabled={!isDraft || assigning || saving}
          title={!isDraft ? "Chỉ bản nháp mới có thể giao bài" : "Giao quiz cho học sinh"}
          className="w-full sm:w-auto"
        >
          <Send size={14} /> Giao bài cho học sinh
        </Button>
      </>
    );
  }

  // Modal giao bài: đóng bằng phím Escape + focus ô thời hạn khi mở.
  useEffect(() => {
    if (!showAssign) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowAssign(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAssign]);

  useEffect(() => {
    if (showAssign) deadlineInputRef.current?.focus();
  }, [showAssign]);

  return (
    <div
      ref={pageRef}
      className={clsx(
        // Desktop: chiều cao cố định = khung nhìn → 2 khối flex (dải meta
        // slim / vùng nội dung cuộn nội bộ). Nút hành động nằm trong footer
        // khung tab phải (cột đứng yên). Mobile: luồng cuộn bình thường.
        pageHeight ? "flex flex-col gap-4" : "space-y-5"
      )}
      style={pageHeight ? { height: pageHeight } : undefined}
    >
      {formError && (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <div className="flex-1">
            {formError}
            {Object.keys(questionErrors).length > 0 && (
              <button
                type="button"
                onClick={() => scrollToQuestion(Math.min(...Object.keys(questionErrors).map(Number)))}
                className="ml-2 font-semibold underline decoration-rose-300 underline-offset-2 hover:text-rose-800 dark:hover:text-rose-200"
              >
                Nhảy tới câu
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setQuestionErrors({});
            }}
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
          <div className="h-9 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </Card>
      ) : loadError ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(backTo)}>
            Quay lại
          </Button>
        </Card>
      ) : (
        <div
          className={clsx(
            "grid gap-5 lg:grid-cols-5",
            // Split-pane: vùng nội dung chiếm phần dư chiều cao, 2 cột cao
            // bằng nhau; cột trái cuộn nội bộ, cột phải đứng yên.
            // Split-pane: vùng nội dung chiếm phần dư chiều cao, 2 cột cao
            // bằng nhau; cột trái cuộn nội bộ, cột phải đứng yên.
            pageHeight && "min-h-0 flex-1 grid-rows-1"
          )}
        >
          {/* Cột trái (3/5): form. Khi split-pane bật (desktop), cột này cuộn
              nội bộ theo chiều cao đã đo; trang ngoài không cuộn ở desktop. */}
          <div
            className={clsx(
              "space-y-4 lg:col-span-3",
              pageHeight && "min-h-0 lg:overflow-y-auto lg:pr-2"
            )}
          >
            {/* Dải meta slim (thay cho header cũ): link quay lại + tiêu đề +
                badge trạng thái ở dòng 1; ngữ cảnh (tên bài giảng / hạn làm)
                ở dòng 2 chỉ khi có; cảnh báo "chỉ xem" ở dòng 3 khi quiz
                không còn nháp. Tất cả giữ nguyên nội dung header cũ, chỉ nén
                chiều cao. */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft size={14} /> Quay lại
                </Link>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {isEditing ? "Sửa quiz" : "Soạn quiz"}
                </span>
                {previewMeta ? (
                  <Badge tone={previewMeta.tone}>{previewMeta.label}</Badge>
                ) : (
                  <Badge tone="amber">Nháp</Badge>
                )}
                {hasAiContent && (
                  <Badge tone="violet">
                    <Wand2 size={11} /> AI gộp
                  </Badge>
                )}
              </div>
              {(detail?.title || existing?.deadline) && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {detail?.title ? `Bài giảng: ${detail.title}` : ""}
                  {detail?.title && existing?.deadline ? " · " : ""}
                  {existing?.deadline ? `Hạn làm ${formatDeadlineLabel(existing.deadline)}` : ""}
                </p>
              )}
              {!isDraft && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Quiz đã {previewMeta?.label?.toLowerCase() || "được xử lý"} — chỉ xem được, không sửa/giao lại.
                </p>
              )}
            </div>

            <Card className="space-y-3 p-5">
              <div>
                <label
                  htmlFor="quiz-title"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Tiêu đề quiz <span className="text-rose-500">*</span>
                </label>
                <input
                  id="quiz-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Quiz ôn tập Past Simple"
                  disabled={!isDraft}
                  className={inputClass}
                />
              </div>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
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

              {/* Điều hướng nhanh tới câu hỏi: chuyển sang nút "Nhảy tới câu"
                  (popover) ở footer cột phải / thanh hành động dưới → không
                  phải lướt lên đầu form mỗi lần muốn nhảy câu. */}

              {questions.map((q, i) => (
                <Card
                  key={i}
                  id={`q-${i}`}
                  className={clsx(
                    "space-y-3 scroll-mt-24 p-4",
                    // Viền violet nhạt cho câu do AI vừa gộp — gia sư nhận ra
                    // câu nào mới đến từ AI để kiểm tra kỹ hơn.
                    q.aiFromAi &&
                      "border-violet-300 bg-violet-50/40 dark:border-violet-800 dark:bg-violet-950/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {i + 1}
                      </span>
                      <ListChecks size={15} className="text-slate-400" />
                      {q.aiFromAi && (
                        <Badge tone="violet" size="xs">
                          <Wand2 size={10} /> AI
                        </Badge>
                      )}
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
                    aria-label={`Nội dung câu hỏi ${i + 1}`}
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
                          className="shrink-0 accent-blue-600 dark:accent-cyan-400"
                          aria-label={`Đáp án đúng là ${letter}`}
                        />
                        <input
                          value={q.options[optIdx]}
                          onChange={(e) => updateOption(i, optIdx, e.target.value)}
                          disabled={!isDraft}
                          placeholder={`Lựa chọn ${letter}`}
                          aria-label={`Lựa chọn ${letter} — câu ${i + 1}`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Lỗi validate của câu (hiện khi lưu thất bại) */}
                  {questionErrors[i] && (
                    <p role="alert" className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {questionErrors[i]}
                    </p>
                  )}

                  {/* Giải thích + CEFR + kỹ năng */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`q-${i}-explanation`}
                        className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                      >
                        Giải thích (tuỳ chọn)
                      </label>
                      <input
                        id={`q-${i}-explanation`}
                        value={q.explanation}
                        onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                        disabled={!isDraft}
                        placeholder="Lý do đáp án đúng..."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`q-${i}-cefr`}
                        className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                      >
                        Mức CEFR (tuỳ chọn)
                      </label>
                      <select
                        id={`q-${i}-cefr`}
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
                    <label
                      htmlFor={`q-${i}-skill`}
                      className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      Gắn kỹ năng (tuỳ chọn)
                    </label>
                    <select
                      id={`q-${i}-skill`}
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

          {/* Cột phải (2/5): "bảng điều khiển" cao bằng cột trái.
              - Split-pane bật: cột cao đúng chiều cao vùng nội dung, KHÔNG
                sticky → đứng yên hoàn toàn, không di chuyển khi cuộn.
              - flex-col + flex-1 cho chat → chat chiếm phần dư, tự cuộn nội bộ.
              - Ngoài split-pane (mobile): theo luồng trang, chat cao cố định. */}
          <div
            className={clsx(
              "flex flex-col gap-4 lg:col-span-2",
              // Split-pane: cột cao đúng vùng nội dung, đứng yên.
              pageHeight && "min-h-0 lg:h-full"
            )}
          >
            {/* Khung tab duy nhất của cột phải: "Trợ lý AI" | "Hồ sơ kỹ năng".
                Cả hai panel cùng nằm trong MỘT khung cao cố định, chuyển tab
                bằng CSS toggle → không có gì xê dịch, chat không bị reset. */}
            <div className="flex h-[520px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-auto lg:min-h-0 lg:flex-1">
              {/* Tab bar — cao cố định, không đổi theo tab đang chọn. */}
              <div
                role="tablist"
                aria-label="Cột điều khiển phải"
                className="flex shrink-0 items-center gap-1 border-b border-slate-200 px-2 pt-2 dark:border-slate-800"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={skillTab === "assistant"}
                  onClick={() => setSkillTab("assistant")}
                  className={clsx(
                    "flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition",
                    "cursor-pointer active:scale-[0.98]",
                    skillTab === "assistant"
                      ? "border-blue-600 text-blue-700 dark:border-cyan-400 dark:text-cyan-300"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Bot size={15} />
                  Trợ lý AI
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={skillTab === "skills"}
                  onClick={() => setSkillTab("skills")}
                  className={clsx(
                    "flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition",
                    "cursor-pointer active:scale-[0.98]",
                    skillTab === "skills"
                      ? "border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <BarChart3 size={15} />
                  Hồ sơ kỹ năng
                  {skillProfileLoading ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                  ) : skillProfile.length > 0 ? (
                    <Badge tone="violet" size="xs">{skillProfile.length}</Badge>
                  ) : null}
                </button>
              </div>

              {/* Thân tab: cả hai panel luôn mount, ẩn/hiện bằng CSS. */}
              <div className="min-h-0 flex-1">
                <QuizAiAssistant
                  token={token}
                  lessonId={lessonId}
                  quizId={isEditing ? Number(quizIdParam) : undefined}
                  pendingQuestions={pendingQuestions}
                  onDrafts={handleAiDrafts}
                  render={skillTab === "assistant"}
                  keepHeader
                />
                <div className={clsx("h-full", skillTab === "skills" ? "block" : "hidden")}>
                  <SkillProfilePanel items={skillProfile} loading={skillProfileLoading} />
                </div>
              </div>

              {/* Footer hành động (desktop): lưu nháp + giao bài — cột phải
                  đứng yên (split-pane) nên nút luôn ở khung nhìn, không cần
                  sticky. Mobile: dùng thanh sticky đáy ngoài trang.
                  Bên trái footer là nút "Nhảy tới câu" (popover lưới chip) —
                  luôn trong khung nhìn, không phải lướt lên đầu form. */}
              <div className="hidden shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-slate-800 lg:flex">
                {renderNavWidget(navFabRef, navFabBtnRef)}
                {renderActions()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Thanh hành động: lưu nháp + giao bài.
          - Split-pane (desktop): khối flex cố định ở đáy, không cần sticky.
          - Mobile: sticky đáy trong luồng cuộn của trang. */}
      <div
        className={clsx(
          "z-40 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:-mx-6 sm:px-6 lg:-mx-6 lg:px-6",
          pageHeight ? "shrink-0" : "sticky bottom-0 mt-2",
          // Desktop: nút hành động đã nằm trong footer khung tab phải
          // (cột phải đứng yên) → ẩn thanh đáy, chỉ hiện trên mobile.
          "lg:hidden"
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
            <p>
              {questions.length} câu hỏi
              {hasAiContent ? " · có câu do AI gộp" : ""}
            </p>
            {formError ? (
              <p className="mt-0.5 truncate font-medium text-rose-600 dark:text-rose-400">{formError}</p>
            ) : (
              !isDraft && (
                <p className="mt-0.5 text-slate-400 dark:text-slate-500">
                  Quiz không còn nháp — chỉ xem được.
                </p>
              )
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:hidden">
            <div className="flex items-center gap-2">
              {renderNavWidget(navBarRef, navBarBtnRef)}
            </div>
            {renderActions()}
          </div>
        </div>
      </div>

      {/* Popover "Nhảy tới câu" — render 1 lần ở cấp trang (portal). */}
      {renderNavPopover()}

      {/* Modal giao bài (deadline) */}
      {showAssign && (        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
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
                aria-label="Đóng (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label
                htmlFor="assign-deadline"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Thời hạn làm quiz
              </label>
              <input
                ref={deadlineInputRef}
                id="assign-deadline"
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
