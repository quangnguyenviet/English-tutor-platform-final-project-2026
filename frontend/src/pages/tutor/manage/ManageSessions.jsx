import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  File,
  FileCheck,
  Image as ImageIcon,
  MapPin,
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
  apiDeleteSessionMaterial,
  apiGetClassSessions,
  apiGetMaterialAccessUrl,
  apiGetSession,
  apiUpdateSession,
  apiUpdateSessionLog,
  apiUploadSessionMaterial,
  mapSessionDetail,
  mapSessionListItem,
  TEACHING_MODE_LABELS,
} from "../../../lib/classroomApi";

/** Tài liệu buổi học tối đa 20 MB (giới hạn backend, kiểm nhanh phía client). */
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
 * Tab "Buổi học" của workspace lớp (UC-T05 bước 4) — nối API thật:
 * danh sách buổi học của lớp, chi tiết + nhật ký dạy học (2 nội dung),
 * đính kèm / tải / gỡ tài liệu buổi học. Không dùng dữ liệu mock.
 *
 * Tạo buổi học chỉ theo ca: CTA "Tạo buổi học" trỏ sang tab "Lịch dạy"
 * (chip ca trống → modal "Tạo bài giảng").
 */
export default function ManageSessions({ token, classId, basePath, classDetail }) {
  // ---------------- Danh sách buổi học
  const [sessions, setSessions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadList = useCallback(async () => {
    if (!token || !classId) return;
    setListLoading(true);
    setListError("");
    try {
      const items = await apiGetClassSessions(token, classId, { order: "asc" });
      const mapped = (items || []).map(mapSessionListItem);
      setSessions(mapped);
      // Chọn buổi đầu (khi chưa chọn hoặc buổi cũ không còn trong danh sách).
      setSelectedSessionId((current) =>
        current && mapped.some((s) => s.sessionId === current)
          ? current
          : (mapped[0]?.sessionId ?? null)
      );
    } catch (err) {
      setListError(err.message || "Không thể tải danh sách buổi học.");
    } finally {
      setListLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    loadList();
  }, [loadList, refreshKey]);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        String(s.title || "")
          .toLowerCase()
          .includes(q) || `buổi ${s.sessionNumber}`.includes(q),
    );
  }, [sessions, searchQuery]);

  // ---------------- Chi tiết buổi học + nhật ký
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!token || !selectedSessionId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setDetailError("");
    try {
      const raw = await apiGetSession(token, selectedSessionId);
      const mapped = mapSessionDetail(raw);
      setDetail(mapped);
      setLogForm({
        logKnowledge: mapped?.logKnowledge || "",
        logHomework: mapped?.logHomework || "",
      });
    } catch (err) {
      setDetail(null);
      setDetailError(err.message || "Không thể tải chi tiết buổi học.");
    } finally {
      setDetailLoading(false);
    }
  }, [token, selectedSessionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail, refreshKey]);

  // ---------------- Nhật ký (2 nội dung: kiến thức + dặn dò)
  const [logForm, setLogForm] = useState({ logKnowledge: "", logHomework: "" });
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState("");

  const handleSaveLog = async () => {
    if (!token || !detail || savingLog) return;
    const payload = {
      logKnowledge: logForm.logKnowledge.trim(),
      logHomework: logForm.logHomework.trim(),
    };
    if (!payload.logKnowledge && !payload.logHomework) {
      setLogError("Vui lòng nhập ít nhất một nội dung nhật ký (kiến thức hoặc dặn dò).");
      return;
    }
    setSavingLog(true);
    setLogError("");
    try {
      await apiUpdateSessionLog(token, detail.sessionId, payload);
      showToast("Đã lưu nhật ký buổi học.", "success");
      bumpRefresh();
    } catch (err) {
      setLogError(err.message || "Không thể lưu nhật ký buổi học.");
    } finally {
      setSavingLog(false);
    }
  };

  // ---------------- Sửa / dời buổi học (modal, dùng API thật)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditModal = () => {
    if (!detail) return;
    setEditForm({
      title: detail.title || "",
      sessionDate: detail.sessionDate || "",
      startTime: (detail.startTime || "").slice(0, 5),
      endTime: (detail.endTime || "").slice(0, 5),
      teachingMode: detail.teachingMode || "ONLINE",
      meetingUrl: detail.meetingUrl || "",
      location: detail.location || "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!token || !detail || !editForm || savingEdit) return;
    const payload = {
      title: editForm.title.trim() || null,
      sessionDate: editForm.sessionDate,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      teachingMode: editForm.teachingMode,
      meetingUrl:
        editForm.teachingMode === "ONLINE" ? editForm.meetingUrl.trim() || null : null,
      location:
        editForm.teachingMode === "AT_HOME" ? editForm.location.trim() || null : null,
    };
    if (!payload.sessionDate || !payload.startTime || !payload.endTime) {
      setEditError("Vui lòng nhập đủ ngày và giờ bắt đầu / kết thúc.");
      return;
    }
    if (payload.teachingMode === "ONLINE" && !payload.meetingUrl) {
      setEditError("Vui lòng nhập liên kết phòng học (buổi học online).");
      return;
    }
    if (payload.teachingMode === "AT_HOME" && !payload.location) {
      setEditError("Vui lòng nhập địa chỉ học (buổi học tại nhà).");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      await apiUpdateSession(token, detail.sessionId, payload);
      showToast("Đã cập nhật buổi học.", "success");
      closeEditModal();
      bumpRefresh();
    } catch (err) {
      // Lỗi trùng ca / trùng lịch / ngày quá khứ... trả thông điệp tiếng Việt từ backend.
      setEditError(err.message || "Không thể cập nhật buổi học.");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------- Tài liệu buổi học (upload / tải / gỡ)
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
      await apiUploadSessionMaterial(token, detail.sessionId, file);
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
      await apiDeleteSessionMaterial(token, detail.sessionId, confirmDeleteMaterial.materialId);
      showToast("Đã gỡ tài liệu buổi học.", "success");
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
              Quản lý Buổi học &amp; Nhật ký dạy học
            </h2>
            <Badge tone="indigo">UC-T05</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {classDetail?.className
              ? `Nhật ký bài học, tài liệu giảng dạy và điều chỉnh lịch cho ${classDetail.studentName}.`
              : "Nhật ký bài học, tài liệu giảng dạy và điều chỉnh lịch buổi học."}
          </p>
        </div>
        <Link
          to={`${basePath}/schedule`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={15} /> Tạo buổi học (theo ca dạy)
        </Link>
      </div>

      {/* Layout: danh sách buổi học (4 cột) + chi tiết (8 cột) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột trái: danh sách + tìm kiếm */}
        <div className="space-y-3 lg:col-span-4">
          <Card padded={false} className="space-y-3 p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm buổi học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {listLoading ? (
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
                      className="mt-1.5 inline-flex items-center gap-1 font-semibold underline"
                    >
                      <RefreshCw size={12} /> Thử lại
                    </button>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Chưa có buổi học nào.
                  </p>
                  <Link
                    to={`${basePath}/schedule`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Plus size={12} /> Tạo buổi học từ ca dạy
                  </Link>
                </div>
              ) : filteredSessions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Không tìm thấy buổi học phù hợp.
                </p>
              ) : (
                filteredSessions.map((session) => {
                  const isSelected = selectedSessionId === session.sessionId;
                  return (
                    <button
                      key={session.sessionId}
                      type="button"
                      onClick={() => setSelectedSessionId(session.sessionId)}
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
                            {session.sessionNumber}
                          </span>
                          Buổi {session.sessionNumber}
                        </span>
                        {session.isTrial ? (
                          <Badge tone="rose" size="xs">
                            Buổi dạy thử
                          </Badge>
                        ) : session.hasLog ? (
                          <span className="text-emerald-600 dark:text-emerald-400" title="Đã có nhật ký">
                            <NotebookText size={13} />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {session.title || "Buổi học chưa đặt tên"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {session.dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {session.timeLabel}
                        </span>
                        <span>{session.modeLabel}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Cột phải: chi tiết buổi học */}
        <div className="lg:col-span-8">
          {!selectedSessionId ? (
            <Card className="py-12 text-center text-sm text-slate-400">
              Chưa chọn buổi học nào. Vui lòng chọn một buổi học từ danh sách bên trái.
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
          ) : detailLoading || !detail ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header buổi học */}
              <Card className="space-y-3 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      Buổi học {detail.sessionNumber}
                    </span>
                    {detail.isTrial && (
                      <Badge tone="rose">Buổi dạy thử</Badge>
                    )}
                    {detail.hasLog ? (
                      <Badge tone="emerald">Đã có nhật ký</Badge>
                    ) : (
                      <Badge tone="slate">Chưa có nhật ký</Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={openEditModal}>
                    <Pencil size={13} /> Sửa / dời buổi học
                  </Button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {detail.title || "Buổi học chưa đặt tên"}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} /> {detail.dateLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} /> {detail.timeLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {detail.modeLabel}
                      {detail.teachingMode === "ONLINE" && detail.meetingUrl ? (
                        <a
                          href={detail.meetingUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Vào phòng học
                        </a>
                      ) : detail.teachingMode === "AT_HOME" && detail.location ? (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {detail.location}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Nhật ký dạy học (2 nội dung) */}
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <NotebookText size={15} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Nhật ký dạy học
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Học sinh và phụ huynh xem được nội dung này sau khi lưu.
                    </p>
                  </div>
                </div>

                {logError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                    <div className="flex-1">{logError}</div>
                    <button
                      type="button"
                      onClick={() => setLogError("")}
                      className="text-rose-400 hover:text-rose-600"
                      aria-label="Đóng thông báo lỗi"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Kiến thức đã hoàn thành trong buổi học
                  </label>
                  <textarea
                    rows={3}
                    value={logForm.logKnowledge}
                    onChange={(e) =>
                      setLogForm((f) => ({ ...f, logKnowledge: e.target.value }))
                    }
                    placeholder="Nhập chi tiết ngữ pháp, từ vựng và bài tập đã giảng trong buổi..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Dặn dò về nhà &amp; bài tập cần nộp
                  </label>
                  <textarea
                    rows={3}
                    value={logForm.logHomework}
                    onChange={(e) =>
                      setLogForm((f) => ({ ...f, logHomework: e.target.value }))
                    }
                    placeholder="Ghi rõ bài tập cần làm, thời hạn nộp và yêu cầu luyện tập..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveLog}
                    disabled={savingLog}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingLog ? "Đang lưu..." : "Lưu nhật ký"}
                  </Button>
                </div>
              </Card>

              {/* Tài liệu buổi học */}
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <UploadCloud size={15} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Tài liệu buổi học
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
                      className="text-rose-400 hover:text-rose-600"
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
                    aria-label="Chọn tài liệu buổi học"
                  />
                  <UploadCloud size={24} className="mb-1 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Nhấp để đính kèm tài liệu buổi học
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
                    Chưa có tài liệu nào được đính kèm cho buổi học này.
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
                              {material.uploadedBy ? ` · ${material.uploadedBy}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadMaterial(material)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          >
                            <Download size={12} /> Tải về
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMaterial(material)}
                            disabled={deletingMaterialId === material.materialId}
                            className="inline-flex items-center gap-1 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950"
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

              {/* Quiz — placeholder chờ tính năng tạo quiz */}
              <Card className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <NotebookText size={15} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Quiz buổi học
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chưa có quiz cho buổi học này — tính năng soạn quiz sẽ được bổ sung
                      sau.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Sửa / dời buổi học */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Sửa / dời buổi học {detail.sessionNumber}
                </h4>
                <p className="text-[11px] text-slate-400">{classDetail?.className}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tiêu đề buổi học
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Buổi 5: Task 2: Cấu trúc câu phức"
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={editForm.sessionDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, sessionDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Hình thức
                </label>
                <div className="flex gap-2">
                  {Object.entries(TEACHING_MODE_LABELS).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, teachingMode: mode }))}
                      className={clsx(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                        editForm.teachingMode === mode
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {editForm.teachingMode === "ONLINE" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Liên kết phòng học
                  </label>
                  <input
                    type="url"
                    value={editForm.meetingUrl}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, meetingUrl: e.target.value }))
                    }
                    placeholder="https://meet.google.com/..."
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Địa chỉ học
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="VD: 12 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh"
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={closeEditModal}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal: gỡ tài liệu */}
      <ConfirmModal
        open={confirmDeleteMaterial != null}
        title="Gỡ tài liệu buổi học"
        message={
          <span>
            Bạn có chắc muốn gỡ tệp{" "}
            <strong>{confirmDeleteMaterial?.fileName}</strong> khỏi buổi học{" "}
            {detail?.sessionNumber}? Tệp cũng sẽ bị xóa khỏi hệ thống.
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
