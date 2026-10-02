import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Pencil,
  Trash2,
  UploadCloud,
  Globe,
  Lock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  File,
  FileCheck,
  Music,
  Image as ImageIcon,
  Send,
  X,
  Search,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import clsx from "clsx";

export default function ManageSessions({
  student,
  dailySessions = [],
  setDailySessions,
  exercisesList = [],
}) {
  const navigate = useNavigate();

  // State
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => dailySessions[0]?.id ?? null
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast / Banner alert
  const [toastMessage, setToastMessage] = useState(null);

  // File upload state & network error simulation
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [simulatedNetworkFail, setSimulatedNetworkFail] = useState(false);

  // New session modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    duration: "90 phút",
    skills: ["Ngữ pháp", "Từ vựng"],
  });

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return dailySessions.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `buổi ${s.sessionNumber}`.includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [dailySessions, searchQuery, statusFilter]);

  // Selected session object
  const selectedSession = useMemo(
    () => dailySessions.find((s) => s.id === selectedSessionId) ?? dailySessions[0] ?? null,
    [dailySessions, selectedSessionId]
  );

  // Form state for editing selected session
  const [editForm, setEditForm] = useState(() => {
    if (!selectedSession) return null;
    return {
      title: selectedSession.title || "",
      date: selectedSession.date || "",
      duration: selectedSession.duration || "90 phút",
      status: selectedSession.status || "draft",
      knowledgeTaught: selectedSession.publicLogWork?.knowledgeTaught || "",
      homeworkAssigned: selectedSession.publicLogWork?.homeworkAssigned || "",
      parentNote: selectedSession.publicLogWork?.parentNote || "",
    };
  });

  // Keep editForm synced when selectedSession changes
  const handleSelectSession = (session) => {
    setSelectedSessionId(session.id);
    setEditForm({
      title: session.title || "",
      date: session.date || "",
      duration: session.duration || "90 phút",
      status: session.status || "draft",
      knowledgeTaught: session.publicLogWork?.knowledgeTaught || "",
      homeworkAssigned: session.publicLogWork?.homeworkAssigned || "",
      parentNote: session.publicLogWork?.parentNote || "",
    });
    setUploadError(null);
  };

  // Toast notification helper
  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to save session changes
  const saveSession = (targetStatus) => {
    if (!selectedSession) return;
    const nowStr = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated = dailySessions.map((s) => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          title: editForm.title.trim() || s.title,
          date: editForm.date || s.date,
          duration: editForm.duration || s.duration,
          status: targetStatus,
          publicLogWork: {
            knowledgeTaught: editForm.knowledgeTaught,
            homeworkAssigned: editForm.homeworkAssigned,
            parentNote: editForm.parentNote,
            publishedAt: targetStatus === "published" ? (s.publicLogWork?.publishedAt || nowStr) : null,
          },
        };
      }
      return s;
    });

    setDailySessions(updated);
    setEditForm((prev) => ({ ...prev, status: targetStatus }));

    if (targetStatus === "published") {
      showToast(
        `Đã lưu & xuất bản nhật ký Buổi học ${selectedSession.sessionNumber}. Phụ huynh và Học sinh đã có thể xem báo cáo này!`,
        "success"
      );
    } else {
      showToast(
        `Đã lưu bản nháp nhật ký Buổi học ${selectedSession.sessionNumber}. Nội dung này chỉ gia sư mới xem được.`,
        "info"
      );
    }
  };

  // File Upload handler with validation & UC-T05 exception flow 6a/6a1/6a2
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSession) return;

    setUploadError(null);

    // Validate size (< 5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError({
        code: "OVERSIZE",
        message: "Vui lòng chọn file hình ảnh / tài liệu dung lượng không quá 5MB.",
      });
      return;
    }

    // Validate extension
    const allowedExts = ["pdf", "docx", "doc", "png", "jpg", "jpeg", "mp3"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext)) {
      setUploadError({
        code: "INVALID_FORMAT",
        message: "Vui lòng chọn tệp tài liệu hợp lệ (PDF, DOCX, PNG, JPG, MP3).",
      });
      return;
    }

    // Check simulated network failure toggle
    if (simulatedNetworkFail) {
      setUploadError({
        code: "NETWORK_ERROR",
        message: "Không thể tải file lên hệ thống. Vui lòng kiểm tra lại kết nối mạng và thử lại.",
        file,
      });
      return;
    }

    // Simulate file upload progress
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newAtt = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: ext,
        uploadedAt: new Date().toISOString().slice(0, 10),
      };

      const updated = dailySessions.map((s) => {
        if (s.id === selectedSession.id) {
          return {
            ...s,
            attachments: [...(s.attachments || []), newAtt],
          };
        }
        return s;
      });

      setDailySessions(updated);
      showToast(`Đã đính kèm tệp "${file.name}" vào Buổi học ${selectedSession.sessionNumber}!`);
    }, 600);
  };

  // Retry upload for flow 6a2
  const handleRetryUpload = () => {
    setSimulatedNetworkFail(false);
    setUploadError(null);
    showToast("Đã làm mới kết nối. Vui lòng chọn lại tệp để tải lên.", "info");
  };

  // Remove attachment
  const handleRemoveAttachment = (attId) => {
    if (!selectedSession) return;
    const updated = dailySessions.map((s) => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          attachments: (s.attachments || []).filter((a) => a.id !== attId),
        };
      }
      return s;
    });
    setDailySessions(updated);
    showToast("Đã xóa tệp đính kèm.");
  };

  // Add New Session
  const handleCreateSession = () => {
    if (!newSessionForm.title.trim()) return;
    const nextNum = dailySessions.reduce((max, s) => Math.max(max, s.sessionNumber || 0), 0) + 1;
    const newSession = {
      id: `ds-${Date.now()}`,
      sessionNumber: nextNum,
      title: newSessionForm.title.trim(),
      date: newSessionForm.date,
      duration: newSessionForm.duration,
      status: "draft",
      skills: newSessionForm.skills,
      publicLogWork: {
        knowledgeTaught: "",
        homeworkAssigned: "",
        parentNote: "",
        publishedAt: null,
      },
      attachments: [],
      quizzes: [],
    };

    setDailySessions([...dailySessions, newSession]);
    setSelectedSessionId(newSession.id);
    setEditForm({
      title: newSession.title,
      date: newSession.date,
      duration: newSession.duration,
      status: "draft",
      knowledgeTaught: "",
      homeworkAssigned: "",
      parentNote: "",
    });
    setShowAddModal(false);
    setNewSessionForm({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      duration: "90 phút",
      skills: ["Ngữ pháp", "Từ vựng"],
    });
    showToast(`Đã khởi tạo Buổi học ${nextNum} mới!`);
  };

  // Get quizzes associated with selected session
  const sessionQuizzes = useMemo(() => {
    if (!selectedSession) return [];
    return exercisesList.filter((e) => e.sessionId === selectedSession.id || e.sessionId === `lp${selectedSession.sessionNumber}`);
  }, [selectedSession, exercisesList]);

  // Statistics
  const totalCount = dailySessions.length;
  const publishedCount = dailySessions.filter((s) => s.status === "published").length;
  const draftCount = dailySessions.filter((s) => s.status === "draft").length;
  const totalAttachments = dailySessions.reduce((acc, s) => acc + (s.attachments?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
            toastMessage.type === "success" && "bg-emerald-600 text-white",
            toastMessage.type === "info" && "bg-blue-600 text-white",
            toastMessage.type === "warning" && "bg-amber-600 text-white"
          )}
        >
          {toastMessage.type === "success" && <CheckCircle2 size={18} />}
          {toastMessage.type === "info" && <Globe size={18} />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Quản lý Buổi học thực tế & Nhật ký dạy học
            </h2>
            <Badge tone="indigo">UC-T05</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nhật ký bài học 3 bên (Gia sư, Học sinh, Phụ huynh) & đính kèm tài liệu giảng dạy cho {student?.name}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="shrink-0 gap-2">
          <Plus size={16} /> Thêm buổi học mới
        </Button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng buổi học</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalCount} buổi</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Đã xuất bản 3 bên</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{publishedCount} nhật ký</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Bản nháp (Gia sư)</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{draftCount} bản nháp</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Tài liệu đính kèm</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalAttachments} tệp</p>
          </div>
        </Card>
      </div>

      {/* Workspace Grid Layout: Left Session List (35%) & Right Session Workspace (65%) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Session List & Filter */}
        <div className="space-y-3 lg:col-span-4">
          <Card padded={false} className="p-3 space-y-3">
            {/* Search Input */}
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

            {/* Status Filters */}
            <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
              {[
                { id: "all", label: "Tất cả" },
                { id: "published", label: "Đã xuất bản" },
                { id: "draft", label: "Bản nháp" },
                { id: "upcoming", label: "Sắp tới" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={clsx(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    statusFilter === f.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Session Cards List */}
            <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
              {filteredSessions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Không tìm thấy buổi học phù hợp.</p>
              ) : (
                filteredSessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  const isPublished = session.status === "published";
                  const isDraft = session.status === "draft";

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={clsx(
                        "group flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-all duration-150",
                        isSelected
                          ? "border-blue-500 bg-blue-50/70 shadow-sm dark:border-blue-700 dark:bg-blue-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold dark:bg-blue-900/60">
                            {session.sessionNumber}
                          </span>
                          Buổi {session.sessionNumber}
                        </span>
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                            <Globe size={11} /> Đã xuất bản
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            <Lock size={11} /> Bản nháp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Clock size={11} /> Chưa học
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {session.title}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} /> {session.date || "Chưa chọn ngày"}
                        </span>
                        <div className="flex items-center gap-2">
                          {(session.attachments?.length || 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                              <FileText size={11} /> {session.attachments.length} file
                            </span>
                          )}
                          {(session.quizzes?.length || 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                              <Sparkles size={11} /> Quiz
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Selected Session Detail & Public Log Work Workspace */}
        <div className="space-y-6 lg:col-span-8">
          {selectedSession && editForm ? (
            <Card className="space-y-6">
              {/* Session Inspector Header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      Buổi học {selectedSession.sessionNumber}
                    </span>
                    {editForm.status === "published" ? (
                      <Badge tone="emerald">
                        <Globe size={12} className="mr-1 inline" /> Xuất bản (Công khai 3 bên)
                      </Badge>
                    ) : (
                      <Badge tone="amber">
                        <Lock size={12} className="mr-1 inline" /> Bản nháp (Chỉ gia sư)
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    Chi tiết Buổi học #{selectedSession.sessionNumber}
                  </h3>
                </div>

                {/* Main Action Buttons (UC-T05 Main Flow Step 8 & Alternative Flow 7a) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => saveSession("draft")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Lock size={14} /> Lưu bản nháp
                  </button>
                  <Button onClick={() => saveSession("published")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Globe size={14} /> Lưu & Xuất bản Nhật ký
                  </Button>
                </div>
              </div>

              {/* 1. General Session Metadata Form */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50 ring-1 ring-slate-200/60 dark:ring-slate-800">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thông tin chung buổi học
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Tiêu đề bài giảng / Nội dung trọng tâm
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="VD: Buổi 5: Task 2: Bài luận quan điểm & Cấu trúc câu phức"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Ngày dạy thực tế
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Public Class Log Work (UC-T05 Core Feature) */}
              <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Globe size={15} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        Public Class Log Work (Nhật ký dạy học 3 bên)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Vùng văn bản hiển thị công khai cho Gia sư, Học sinh ({student?.name}) và Phụ huynh cùng xem
                      </p>
                    </div>
                  </div>
                  {selectedSession.publicLogWork?.publishedAt && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã xuất bản: {selectedSession.publicLogWork.publishedAt}
                    </span>
                  )}
                </div>

                {/* Input Area 1: Kiến thức đã hoàn thành trong buổi */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Kiến thức đã hoàn thành trong buổi học
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          knowledgeTaught:
                            f.knowledgeTaught +
                            "\n1. Ôn tập ngữ pháp thì...\n2. 15 từ vựng mới chủ đề...\n3. Kỹ năng thực hành nói...",
                        }))
                      }
                      className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      + Chèn mẫu gợi ý
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={editForm.knowledgeTaught}
                    onChange={(e) => setEditForm((f) => ({ ...f, knowledgeTaught: e.target.value }))}
                    placeholder="Nhập chi tiết ngữ pháp, từ vựng và bài tập đã giảng trong buổi..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Input Area 2: Dặn dò về nhà */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-amber-500" />
                      Dặn dò về nhà & Bài tập cần nộp
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          homeworkAssigned:
                            f.homeworkAssigned +
                            "\n1. Hoàn thành Bài tập 01 trên hệ thống trước hạn.\n2. Học thuộc 15 từ vựng mới và thu âm 1 đoạn nói ngắn.",
                        }))
                      }
                      className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      + Chèn mẫu dặn dò
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={editForm.homeworkAssigned}
                    onChange={(e) => setEditForm((f) => ({ ...f, homeworkAssigned: e.target.value }))}
                    placeholder="Ghi rõ bài tập cần làm, thời hạn nộp bài và yêu cầu học từ vựng..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Input Area 3: Lời nhắn tới Phụ huynh */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Send size={14} className="text-indigo-500" />
                    Nhận xét & Lời nhắn gửi Phụ huynh ({student?.parentName || "Phụ huynh"})
                  </label>
                  <input
                    type="text"
                    value={editForm.parentNote}
                    onChange={(e) => setEditForm((f) => ({ ...f, parentNote: e.target.value }))}
                    placeholder="Nhận xét ngắn về thái độ học tập, mức độ tiếp thu của bé trong buổi học này..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* 3. File Attachments (UC-T05 Main Flow Step 6 & Exception Flow 6a/6a1/6a2) */}
              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Tài liệu học tập đính kèm tại Buổi học {selectedSession.sessionNumber}
                    </h4>
                  </div>
                  {/* Simulation Toggle for Exception Flow 6a testing */}
                  <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700">
                    <input
                      type="checkbox"
                      checked={simulatedNetworkFail}
                      onChange={(e) => setSimulatedNetworkFail(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span>Mô phỏng lỗi mạng (Test 6a)</span>
                  </label>
                </div>

                {/* Upload Exception / Validation Error Banner (Flow 6a1) */}
                {uploadError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                    <div className="flex-1">
                      <p className="font-semibold">{uploadError.message}</p>
                      {uploadError.code === "NETWORK_ERROR" && (
                        <button
                          type="button"
                          onClick={handleRetryUpload}
                          className="mt-1.5 inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-rose-700"
                        >
                          <RefreshCw size={12} /> Tải lại file (Thử lại)
                        </button>
                      )}
                    </div>
                    <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-rose-600">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* File Upload Drag & Drop Area */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-5 text-center dark:border-slate-700 dark:bg-slate-900/30 hover:bg-slate-100/50 transition">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.mp3"
                  />
                  <UploadCloud size={24} className="mb-1 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Nhấp để đính kèm tài liệu bài giảng (.pdf, .docx, .png, .mp3)
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Dung lượng tệp tối đa: <strong>5MB</strong> &middot; Hệ thống kiểm tra an toàn link download
                  </p>
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-600">
                      <RefreshCw size={14} className="animate-spin" /> Đang tải file lên hệ thống...
                    </div>
                  )}
                </div>

                {/* Uploaded Files List */}
                <div className="space-y-2">
                  {(selectedSession.attachments || []).length === 0 ? (
                    <p className="text-center py-2 text-xs text-slate-400">Chưa có tài liệu nào đính kèm cho buổi học này.</p>
                  ) : (
                    selectedSession.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {att.type === "pdf" ? (
                            <FileCheck size={18} className="text-rose-500 shrink-0" />
                          ) : att.type === "docx" || att.type === "doc" ? (
                            <FileText size={18} className="text-blue-500 shrink-0" />
                          ) : att.type === "mp3" ? (
                            <Music size={18} className="text-purple-500 shrink-0" />
                          ) : (
                            <ImageIcon size={18} className="text-emerald-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">{att.name}</p>
                            <p className="text-[11px] text-slate-400">{att.size} &middot; Tải lên {att.uploadedAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              showToast(`Đang tải file an toàn: ${att.name}`);
                            }}
                            className="rounded px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          >
                            Tải về
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                            title="Xóa tệp"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Quiz & Homework Section (UC-T05 Main Flow Step 4 - Links to UC-T06 AI Workspace) */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Quiz trắc nghiệm gắn với Buổi học {selectedSession.sessionNumber}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tích hợp với workspace Soạn & Giao Quiz trắc nghiệm (UC-T06)
                      </p>
                    </div>
                  </div>

                  {/* Direct Button to launch AI Quiz Workspace (UC-T06) pre-filled with this session */}
                  <Link
                    to={`/tutor/exercise-generator?sessionId=${selectedSession.id}&sessionNum=${selectedSession.sessionNumber}&studentId=${student?.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition"
                  >
                    <Sparkles size={14} /> Soạn & Giao AI Quiz Workspace <ArrowRight size={12} />
                  </Link>
                </div>

                {/* List of associated quizzes */}
                <div className="space-y-2">
                  {sessionQuizzes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Chưa có bộ Quiz nào được giao riêng cho buổi học này. Nhấp nút nút <strong>Soạn & Giao AI Quiz Workspace</strong> ở trên để tạo mới.
                    </p>
                  ) : (
                    sessionQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between rounded-lg border border-amber-200/80 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen size={16} className="text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{quiz.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {quiz.skill} &middot; {quiz.type} &middot; Đã giao ngày {quiz.assignedDate}
                            </p>
                          </div>
                        </div>
                        <Badge tone={quiz.status === "graded" ? "emerald" : "amber"}>
                          {quiz.status === "graded" ? `Đã chấm (${quiz.score}/${quiz.maxScore})` : "Đã giao"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="py-12 text-center text-slate-400">
              Chưa chọn buổi học nào. Vui lòng chọn một buổi học từ danh sách bên trái.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Add New Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setShowAddModal(false)} />
          <Card className="relative z-10 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Tạo Buổi học thực tế tiếp theo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tiêu đề buổi học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSessionForm.title}
                  onChange={(e) => setNewSessionForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Buổi 7: IELTS Listening Part 3 & Vocabulary"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Ngày học dự kiến</label>
                  <input
                    type="date"
                    value={newSessionForm.date}
                    onChange={(e) => setNewSessionForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Thời lượng</label>
                  <select
                    value={newSessionForm.duration}
                    onChange={(e) => setNewSessionForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="60 phút">60 phút</option>
                    <option value="90 phút">90 phút</option>
                    <option value="120 phút">120 phút</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreateSession}>
                Khởi tạo buổi học
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
