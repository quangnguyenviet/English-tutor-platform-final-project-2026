import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  File,
  FileCheck,
  Image as ImageIcon,
  ListChecks,
  Music,
  NotebookText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import clsx from "clsx";
import {
  apiCreateLesson,
  apiDeleteLesson,
  apiDeleteLessonMaterial,
  apiGetClassLessons,
  apiGetLesson,
  apiGetMaterialAccessUrl,
  apiUploadLessonMaterial,
  apiUpdateLesson,
  LESSON_STATUS_META,
  mapLessonDetail,
  mapLessonListItem,
} from "../../../lib/classroomApi";
import {
  apiGetLessonQuizzes,
  formatDeadlineLabel,
  QUIZ_STATUS_META,
} from "../../../lib/quizApi";

/** Tài liệu bài giảng tối đa 20 MB (giới hạn backend, kiểm nhanh phía client). */
const MATERIAL_MAX_SIZE = 20 * 1024 * 1024;

const MATERIAL_ACCEPT =
  ".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp,.mp3,.wav,.ogg,.m4a";
const MATERIAL_ALLOWED_EXT = [
  "pdf",
  "docx",
  "doc",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "mp3",
  "wav",
  "ogg",
  "m4a",
];

function materialIcon(fileType) {
  switch (fileType) {
    case "PDF":
      return <FileCheck size={18} className="shrink-0 text-rose-500" />;
    case "DOCX":
      return <File size={18} className="shrink-0 text-blue-500" />;
    case "IMAGE":
      return <ImageIcon size={18} className="shrink-0 text-emerald-500" />;
    case "AUDIO":
      return <Music size={18} className="shrink-0 text-purple-500" />;
    default:
      return <File size={18} className="shrink-0 text-slate-500" />;
  }
}

/**
 * Tab "Bài giảng" của workspace lớp (V16) — nối API thật:
 * danh sách bài giảng của lớp, chi tiết (tiêu đề + hiện/ẩn + xóa),
 * tài liệu đính kèm (upload / tải / gỡ) và quiz bài giảng (FR-13).
 * Nhật ký dạy học hiện nằm trên lưới lịch (tab "Lịch dạy"), không ở đây.
 */
export default function ManageSessions({ token, classId, basePath, classDetail }) {
  const navigate = useNavigate();

  // ---------------- Danh sách bài giảng
  const [lessons, setLessons] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Bài giảng được trỏ đến từ URL (?lessonId=...) — ưu tiên khi tải danh sách lần đầu,
  // dùng cho việc chuyển tab từ lưới "Lịch dạy" (nút "Tạo bài giảng").
  const [searchParams] = useSearchParams();
  const urlLessonId = searchParams.get("lessonId");

  const loadList = useCallback(async () => {
    if (!token || !classId) return;
    setListLoading(true);
    setListError("");
    try {
      const items = await apiGetClassLessons(token, classId);
      const mapped = (items || []).map(mapLessonListItem);
      setLessons(mapped);
      // Ưu tiên: bài giảng đang chọn → bài giảng từ URL → bài giảng đầu tiên.
      const firstId = mapped[0]?.lessonId ?? null;
      setSelectedLessonId((current) => {
        if (current && mapped.some((l) => l.lessonId === current)) return current;
        if (urlLessonId && mapped.some((l) => String(l.lessonId) === urlLessonId)) {
          return urlLessonId;
        }
        return firstId;
      });
    } catch (err) {
      setListError(err.message || "Không thể tải danh sách bài giảng.");
    } finally {
      setListLoading(false);
    }
  }, [token, classId, urlLessonId]);

  useEffect(() => {
    loadList();
  }, [loadList, refreshKey]);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter(
      (l) =>
        String(l.title || "")
          .toLowerCase()
          .includes(q) || `bài ${l.lessonNumber}`.toLowerCase().includes(q),
    );
  }, [lessons, searchQuery]);

  // ---------------- Chi tiết bài giảng (tiêu đề + hiện/ẩn)
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!token || !selectedLessonId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setDetailError("");
    try {
      const raw = await apiGetLesson(token, selectedLessonId);
      setDetail(mapLessonDetail(mapLessonListItem(raw)));
    } catch (err) {
      setDetail(null);
      setDetailError(err.message || "Không thể tải chi tiết bài giảng.");
    } finally {
      setDetailLoading(false);
    }
  }, [token, selectedLessonId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail, refreshKey]);

  const openTitleEdit = () => {
    if (!detail) return;
    setTitleInput(detail.title || "");
    setTitleError("");
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!token || !detail || savingTitle) return;
    const title = titleInput.trim();
    if (!title) {
      setTitleError("Vui lòng nhập tiêu đề bài giảng.");
      return;
    }
    setSavingTitle(true);
    setTitleError("");
    try {
      await apiUpdateLesson(token, detail.lessonId, { title });
      setEditingTitle(false);
      showToast("Đã cập nhật tiêu đề bài giảng.", "success");
      bumpRefresh();
    } catch (err) {
      setTitleError(err.message || "Không thể lưu tiêu đề.");
    } finally {
      setSavingTitle(false);
    }
  };

  const toggleVisibility = async () => {
    if (!token || !detail) return;
    const nextStatus = detail.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    try {
      await apiUpdateLesson(token, detail.lessonId, { status: nextStatus });
      showToast(
        nextStatus === "HIDDEN" ? "Đã ẩn bài giảng." : "Đã hiển thị bài giảng.",
        "success",
      );
      bumpRefresh();
    } catch (err) {
      showToast(err.message || "Không thể đổi trạng thái bài giảng.", "error");
    }
  };

  // ---------------- Xóa bài giảng (xác nhận + cascade tài liệu/quiz)
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const handleConfirmDeleteLesson = async () => {
    if (!token || !detail || deletingLesson) return;
    setDeletingLesson(true);
    try {
      await apiDeleteLesson(token, detail.lessonId);
      setConfirmDeleteLesson(false);
      showToast("Đã xóa bài giảng (kèm tài liệu và quiz).", "success");
      // Chọn bài giảng kế tiếp (hoặc bỏ chọn nếu hết).
      const rest = lessons.filter((l) => l.lessonId !== detail.lessonId);
      setSelectedLessonId(rest[0]?.lessonId ?? null);
      bumpRefresh();
    } catch (err) {
      showToast(err.message || "Không thể xóa bài giảng.", "error");
    } finally {
      setDeletingLesson(false);
    }
  };

  // ---------------- Modal "Tạo bài giảng"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const openCreateModal = () => {
    setNewTitle("");
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateLesson = async () => {
    if (!token || !classId || creating) return;
    const title = newTitle.trim();
    if (!title) {
      setCreateError("Vui lòng nhập tiêu đề bài giảng.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const created = await apiCreateLesson(token, classId, { title });
      setShowCreateModal(false);
      setSelectedLessonId(created?.lessonId ?? null);
      showToast("Đã tạo bài giảng.", "success");
      bumpRefresh();
    } catch (err) {
      setCreateError(err.message || "Không thể tạo bài giảng.");
    } finally {
      setCreating(false);
    }
  };

  // ---------------- Quiz bài giảng (danh sách, FR-13)
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);

  const loadQuizzes = useCallback(async () => {
    if (!token || !selectedLessonId) {
      setQuizzes([]);
      return;
    }
    setQuizzesLoading(true);
    try {
      const items = await apiGetLessonQuizzes(token, selectedLessonId);
      setQuizzes(items || []);
    } catch {
      setQuizzes([]);
    } finally {
      setQuizzesLoading(false);
    }
  }, [token, selectedLessonId]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes, refreshKey]);

  // ---------------- Tài liệu bài giảng (upload / tải / gỡ)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [confirmDeleteMaterial, setConfirmDeleteMaterial] = useState(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !detail || !token) return;

    setUploadError("");
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!MATERIAL_ALLOWED_EXT.includes(ext)) {
      setUploadError(
        "Định dạng không hợp lệ. Chỉ nhận PDF, DOCX, ảnh (PNG/JPG/GIF/WEBP) hoặc âm thanh (MP3/WAV/OGG).",
      );
      return;
    }
    if (file.size > MATERIAL_MAX_SIZE) {
      setUploadError(
        `Tệp vượt quá dung lượng tối đa 20 MB (tệp của bạn ${
          Math.round((file.size / (1024 * 1024)) * 10) / 10
        } MB).`,
      );
      return;
    }

    setIsUploading(true);
    try {
      await apiUploadLessonMaterial(token, detail.lessonId, file);
      showToast(`Đã đính kèm tệp "${file.name}".`, "success");
      bumpRefresh();
    } catch (err) {
      setUploadError(err.message || "Không thể tải tệp lên hệ thống.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadMaterial = async (material) => {
    if (!token || !material) return;
    try {
      const { url } = await apiGetMaterialAccessUrl(token, material.materialId);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      showToast(err.message || "Không thể tải tệp. Vui lòng thử lại.", "error");
    }
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!token || !detail || !confirmDeleteMaterial) return;
    setDeletingMaterialId(confirmDeleteMaterial.materialId);
    setConfirmDeleteMaterial(null);
    try {
      await apiDeleteLessonMaterial(
        token,
        detail.lessonId,
        confirmDeleteMaterial.materialId,
      );
      showToast("Đã gỡ tài liệu bài giảng.", "success");
      bumpRefresh();
    } catch (err) {
      showToast(err.message || "Không thể gỡ tài liệu. Vui lòng thử lại.", "error");
    } finally {
      setDeletingMaterialId(null);
    }
  };

  // ---------------- Toast (tiếng Việt, tự tắt sau 5s)
  const [toast, setToast] = useState(null);
  const showToast = (text, type = "success") => setToast({ text, type });
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const materials = detail?.materials || [];
  const statusMeta = detail ? LESSON_STATUS_META[detail.status] || LESSON_STATUS_META.PUBLISHED : null;
  // LessonDetailResponse không có lessonNumber — lấy từ item danh sách (ROW_NUMBER backend).
  const lessonNumber =
    detail?.lessonNumber ?? lessons.find((l) => l.lessonId === detail?.lessonId)?.lessonNumber;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl",
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600",
          )}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0" />
          )}
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 opacity-80 hover:opacity-100"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Bài giảng &amp; Tài liệu
            </h2>
            <Badge tone="indigo">V16</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {classDetail?.className
              ? `Bài giảng, tài liệu và quiz cho ${classDetail.studentName}.`
              : "Bài giảng, tài liệu giảng dạy và quiz cho lớp học."}
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal} className="shrink-0 cursor-pointer text-xs font-bold">
          <Plus size={15} /> Tạo bài giảng
        </Button>
      </div>

      {/* Layout: danh sách bài giảng (4 cột) + chi tiết (8 cột) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột trái: danh sách + tìm kiếm */}
        <div className="space-y-3 lg:col-span-4">
          <Card padded={false} className="space-y-3 p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài giảng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {listLoading && lessons.length === 0 ? (
                Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                ))
              ) : listError ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                  <div className="flex-1">
                    <p>{listError}</p>
                    <button
                      type="button"
                      onClick={loadList}
                      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 font-semibold underline"
                    >
                      <RefreshCw size={12} /> Thử lại
                    </button>
                  </div>
                </div>
              ) : lessons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Chưa có bài giảng nào.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Plus size={12} /> Tạo bài giảng đầu tiên
                  </button>
                </div>
              ) : filteredLessons.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Không tìm thấy bài giảng phù hợp.
                </p>
              ) : (
                filteredLessons.map((lesson) => {
                  const isSelected = String(lesson.lessonId) === String(selectedLessonId);
                  const meta = LESSON_STATUS_META[lesson.status] || LESSON_STATUS_META.PUBLISHED;
                  return (
                    <button
                      key={lesson.lessonId}
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.lessonId)}
                      className={clsx(
                        "w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-blue-500 bg-blue-50/70 shadow-sm dark:border-blue-700 dark:bg-blue-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold dark:bg-blue-900/60">
                            {lesson.lessonNumber}
                          </span>
                          Bài {lesson.lessonNumber}
                        </span>
                        <Badge tone={meta.tone} size="xs">
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {lesson.title || "Bài giảng chưa đặt tên"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <UploadCloud size={12} /> {lesson.materialCount ?? 0} tài liệu
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ListChecks size={12} /> {lesson.quizCount ?? 0} quiz
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {lesson.createdAtLabel}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Cột phải: chi tiết bài giảng */}
        <div className="lg:col-span-8">
          {!selectedLessonId ? (
            <Card className="py-12 text-center text-sm text-slate-400">
              Chưa chọn bài giảng nào. Vui lòng chọn một bài giảng từ danh sách bên trái hoặc tạo
              bài giảng mới.
            </Card>
          ) : detailError ? (
            <Card className="py-12 text-center">
              <AlertCircle size={28} className="mx-auto text-rose-400" />
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                {detailError}
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={loadDetail}>
                  <RefreshCw size={14} /> Thử lại
                </Button>
              </div>
            </Card>
          ) : !detail || detailLoading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header bài giảng */}
              <Card className="space-y-3 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      Bài giảng {lessonNumber != null ? lessonNumber : ""}
                    </span>
                    {statusMeta && <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} /> {detail.createdAtLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={toggleVisibility}>
                      {detail.status === "PUBLISHED" ? (
                        "Ẩn bài giảng"
                      ) : (
                        "Hiển thị bài giảng"
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteLesson(true)}>
                      <Trash2 size={13} /> Xóa
                    </Button>
                  </div>
                </div>

                {/* Tiêu đề (quick edit: gõ + Enter hoặc nút Lưu) */}
                {editingTitle ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setEditingTitle(false);
                      }}
                      maxLength={200}
                      autoFocus
                      className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold outline-none ring-2 ring-blue-100 dark:border-blue-800 dark:bg-slate-900 dark:ring-blue-950"
                    />
                    {titleError && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        {titleError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingTitle(false)}
                        type="button"
                      >
                        Hủy
                      </Button>
                      <Button size="sm" onClick={handleSaveTitle} disabled={savingTitle}>
                        {savingTitle ? "Đang lưu..." : "Lưu tiêu đề"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                      {detail.title || "Bài giảng chưa đặt tên"}
                    </h3>
                    <button
                      type="button"
                      onClick={openTitleEdit}
                      className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      aria-label="Sửa tiêu đề bài giảng"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {/* Bài giảng là tài liệu driver nhúng trong lớp — học sinh và phụ huynh xem được khi
                  trạng thái "Đang hiển thị". */}
                </p>
              </Card>

              {/* Tài liệu bài giảng */}
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <UploadCloud size={15} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Tài liệu bài giảng
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      PDF, Word, ảnh hoặc âm thanh — mỗi tệp tối đa 20 MB.
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                    <div className="flex-1">{uploadError}</div>
                    <button
                      type="button"
                      onClick={() => setUploadError("")}
                      className="cursor-pointer text-rose-400 hover:text-rose-600"
                      aria-label="Đóng thông báo lỗi"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-5 text-center transition hover:bg-slate-100/50 dark:border-slate-700 dark:bg-slate-900/30">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept={MATERIAL_ACCEPT}
                    disabled={isUploading}
                    aria-label="Chọn tài liệu bài giảng"
                  />
                  <UploadCloud size={24} className="mb-1 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Nhấp để đính kèm tài liệu bài giảng
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    PDF, Word, ảnh, âm thanh &middot; tối đa 20 MB
                  </p>
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-600">
                      <RefreshCw size={14} className="animate-spin" /> Đang tải tệp lên...
                    </div>
                  )}
                </div>

                {materials.length === 0 ? (
                  <p className="py-1 text-center text-xs text-slate-400">
                    Chưa có tài liệu nào được đính kèm cho bài giảng này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {materials.map((material) => (
                      <div
                        key={material.materialId}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          {materialIcon(material.fileType)}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {material.fileName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {material.typeLabel}
                              {material.sizeLabel ? ` · ${material.sizeLabel}` : ""}
                              {material.uploadedByName ? ` · ${material.uploadedByName}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadMaterial(material)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          >
                            <Download size={12} /> Tải về
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMaterial(material)}
                            disabled={deletingMaterialId === material.materialId}
                            className="cursor-pointer rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950"
                            title="Gỡ tài liệu"
                          >
                            {deletingMaterialId === material.materialId ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Quiz bài giảng (FR-13: danh sách thật + CTA soạn / sửa) */}
              <Card className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <NotebookText size={15} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        Quiz bài giảng
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Soạn quiz trắc nghiệm cho bài giảng này và giao cho học sinh.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    as={Link}
                    to={`${basePath}/lessons/quiz/${detail.lessonId}`}
                  >
                    <Plus size={13} /> Soạn Quiz
                  </Button>
                </div>

                {quizzesLoading ? (
                  <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                ) : quizzes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
                    Chưa có quiz cho bài giảng này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map((quiz) => {
                      const meta = QUIZ_STATUS_META[quiz.status] || {
                        label: quiz.status,
                        tone: "slate",
                      };
                      const editable = quiz.status === "DRAFT";
                      return (
                        <div
                          key={quiz.quizId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {quiz.title}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {quiz.deadline && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock size={11} /> {formatDeadlineLabel(quiz.deadline)}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {quiz.totalQuestions ?? 0} câu
                            </span>
                            {editable && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `${basePath}/lessons/quiz/${detail.lessonId}?quizId=${quiz.quizId}`,
                                  )
                                }
                                className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                              >
                                <Pencil size={11} /> Sửa
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal: tạo bài giảng mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Tạo bài giảng mới
                </h4>
                <p className="text-[11px] text-slate-400">
                  Bài giảng nhúng vào lớp, dùng để đính kèm tài liệu và giao quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Tiêu đề bài giảng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateLesson();
                }}
                placeholder="VD: Bài 5: Past Simple và Travel Vocabulary"
                maxLength={200}
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {createError && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {createError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreateLesson} disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo bài giảng"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal: xóa bài giảng */}
      <ConfirmModal
        open={confirmDeleteLesson}
        title="Xóa bài giảng?"
        message={
          <span>
            Bạn có chắc muốn xóa bài giảng{" "}
            <strong>{detail?.title || "chưa đặt tên"}</strong>? Toàn bộ tài liệu đính kèm và quiz
            của bài giảng cũng sẽ bị xóa khỏi hệ thống.
          </span>
        }
        confirmLabel="Xóa bài giảng"
        confirmTone="rose"
        icon={Trash2}
        onConfirm={handleConfirmDeleteLesson}
        onCancel={() => setConfirmDeleteLesson(false)}
      />

      {/* Confirm modal: gỡ tài liệu */}
      <ConfirmModal
        open={confirmDeleteMaterial != null}
        title="Gỡ tài liệu bài giảng"
        message={
          <span>
            Bạn có chắc muốn gỡ tệp <strong>{confirmDeleteMaterial?.fileName}</strong> khỏi bài
            giảng? Tệp cũng sẽ bị xóa khỏi hệ thống.
          </span>
        }
        confirmLabel="Gỡ tài liệu"
        confirmTone="rose"
        icon={Trash2}
        onConfirm={handleConfirmDeleteMaterial}
        onCancel={() => setConfirmDeleteMaterial(null)}
      />
    </div>
  );
}
