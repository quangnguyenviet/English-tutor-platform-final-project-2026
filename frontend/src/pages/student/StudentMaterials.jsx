import React, { useState } from "react";
import {
  PlayCircle,
  FileText,
  Filter,
  Download,
  X,
  Video,
  Library,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

/** Kho tài liệu & video bài giảng — UC-S07 / UC-ST-15, UC-ST-16 */

export default function StudentMaterials() {
  const { session } = useAuth();
  const student = getStudentById(session?.studentId || "s1");

  const [selectedTutor, setSelectedTutor] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLesson, setSelectedLesson] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [previewVideo, setPreviewVideo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const rawMaterials = student?.materials || [];

  const tutorList = [
    { id: "all", name: "Tất cả Gia sư" },
    { id: "t1", name: "Cô Lan Anh (IELTS)" },
    { id: "t2", name: "Thầy Minh Quân (Writing)" },
    { id: "t3", name: "Cô Thu Hà (Giao tiếp)" },
  ];

  const typeList = [
    { id: "all", name: "Tất cả loại", icon: Library },
    { id: "video", name: "Video bài giảng", icon: Video },
    { id: "doc", name: "Tài liệu / Slide", icon: FileText },
    { id: "ebook", name: "Ebook", icon: FileText },
  ];

  const lessonList = [
    { id: "all", name: "Tất cả bài học" },
    ...Array.from(
      new Map(
        rawMaterials
          .filter((material) => material.sessionId)
          .map((material) => [
            material.sessionId,
            {
              id: material.sessionId,
              name: material.topic ? `${material.topic} · ${material.subject}` : material.subject,
            },
          ])
      ).values()
    ),
  ];

  function getMaterialKind(material) {
    if (material.type === "video") return "video";
    if (/ebook/i.test(material.title || "")) return "ebook";
    return "doc";
  }

  // Filter materials
  const filteredMaterials = rawMaterials.filter((m) => {
    const matchTutor = selectedTutor === "all" || m.tutorId === selectedTutor;
    const matchType = selectedType === "all" || getMaterialKind(m) === selectedType;
    const matchLesson = selectedLesson === "all" || m.sessionId === selectedLesson;
    const matchKeyword =
      !searchKeyword.trim() ||
      m.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (m.skill && m.skill.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (m.tutorName && m.tutorName.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchTutor && matchType && matchLesson && matchKeyword;
  });

  const handleDownloadDoc = (docTitle) => {
    setToastMessage(`Đã bắt đầu tải xuống tài liệu "${docTitle}"!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fade-slide-in fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Download size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        className="mb-0"
        eyebrow="Kho học liệu"
        title="Tài liệu & Video Bài giảng"
        description="Kho tài liệu số hóa cá nhân hóa: Video xem lại, slide bài giảng & Ebook được đính kèm bởi các Gia sư của bạn."
      />

      {/* Filter Toolbar with Search (UC-S07 3a) */}
      <Card className="p-4 space-y-3.5">
        <div className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm kiếm tài liệu, bài giảng theo tên bài học hoặc chủ đề..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-[auto_repeat(3,minmax(0,1fr))] md:items-center">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter size={14} /> Bộ lọc
          </span>

          <label>
            <span className="sr-only">Lọc theo loại học liệu</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {typeList.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Lọc theo gia sư</span>
            <select
              id="material-tutor-select"
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {tutorList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Lọc theo bài học</span>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {lessonList.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Materials Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((m) => {
          const isVideo = m.type === "video";
          const materialKind = getMaterialKind(m);
          return (
              <Card
                key={m.id}
                className="p-5 flex flex-col justify-between border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header: Type icon & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      {isVideo ? (
                        <PlayCircle size={19} strokeWidth={1.75} />
                      ) : (
                        <FileText size={19} strokeWidth={1.75} />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Badge tone="neutral" size="xs">
                        {m.subject}
                      </Badge>
                      <Badge tone="neutral" size="xs">
                        {isVideo ? "Video" : materialKind === "ebook" ? "Ebook" : "PDF"}
                      </Badge>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>Chủ đề: {m.topic}</span>
                      <span>&middot;</span>
                      <span>{m.date}</span>
                    </p>
                  </div>

                  {/* Tutor Attribution Tag */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      Gia sư: <strong className="text-slate-800 dark:text-slate-200 font-medium">{m.tutorName}</strong>
                    </span>
                    {isVideo ? (
                      <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">{m.duration}</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">{m.pages} trang</span>
                    )}
                  </div>
                </div>

              {/* Footer Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {isVideo ? (
                  <Button
                    size="sm"
                    onClick={() => setPreviewVideo(m)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <PlayCircle size={15} strokeWidth={1.75} /> Xem video bài giảng
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDoc(m.title)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Download size={14} strokeWidth={1.75} /> Tải {materialKind === "ebook" ? "Ebook" : "file PDF"} ({m.pages} trang)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {filteredMaterials.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <p className="text-sm font-semibold text-slate-500">Chưa có tài liệu nào thuộc bộ lọc này.</p>
          </Card>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewVideo.title}
                  </h3>
                  <p className="text-xs text-slate-500">Bài giảng từ {previewVideo.tutorName}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mock Video Iframe Container */}
            <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
                title={previewVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Chủ đề: <strong>{previewVideo.topic}</strong> &middot; Thời lượng: <strong>{previewVideo.duration}</strong></span>
              <Button size="sm" variant="outline" onClick={() => setPreviewVideo(null)}>
                Đóng Player
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
