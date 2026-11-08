import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  FileCheck,
  User,
  Calendar,
  Briefcase,
  Home,
  Video,
  ExternalLink,
  Clock,
} from "lucide-react";
import HireTutorModal from "../../components/guest/HireTutorModal";
import { apiGetPublicTutor } from "../../lib/tutorApi";
import { mapPublicTutor } from "../../lib/publicTutorMapper";

const DAY_LABELS = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

const SLOT_LABELS = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
};

export function GuestTutorDetailPage() {
  const { tutorId } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [currentTutor, setCurrentTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTutor() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const profile = await apiGetPublicTutor(tutorId);
        if (isMounted) setCurrentTutor(mapPublicTutor(profile));
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.status === 404
              ? "Hồ sơ gia sư không tồn tại hoặc chưa được công khai."
              : error.message || "Không thể tải hồ sơ gia sư.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTutor();
    return () => {
      isMounted = false;
    };
  }, [tutorId]);

  const handleOpenHireModal = () => {
    setIsHireModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70dvh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Đang tải hồ sơ gia sư">
        <div className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!currentTutor) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center px-4 text-center">
        <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        <h1 className="mt-4 text-lg font-bold text-foreground">Không thể hiển thị hồ sơ gia sư</h1>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
        <Link
          to="/tutors"
          className="mt-5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-all"
        >
          Quay lại danh sách gia sư
        </Link>
      </div>
    );
  }

  // Bảng map lịch rảnh theo ngày & ca
  const availMap = new Set(
    (currentTutor.availabilities || []).map((a) => `${a.dayOfWeek}_${a.timeSlot}`),
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/tutors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách gia sư</span>
          </Link>

          <div className="flex items-center gap-3">
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ── Main Profile Header Card ─────────────────────────────────── */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Avatar block */}
            <div className="flex flex-col items-center sm:items-start shrink-0">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-extrabold text-3xl sm:text-4xl text-white shadow-md overflow-hidden"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
              >
                {currentTutor.avatarUrl ? (
                  <img
                    src={currentTutor.avatarUrl}
                    alt={`Ảnh đại diện ${currentTutor.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentTutor.initials
                )}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hồ sơ đã thẩm định</span>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {currentTutor.name}
                </h1>
                {currentTutor.gender && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                    {currentTutor.gender}
                  </span>
                )}
                {currentTutor.educationStatusLabel && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                    {currentTutor.educationStatusLabel}
                  </span>
                )}
              </div>

              {/* Đại học */}
              <p className="text-base text-foreground font-semibold flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <span>{currentTutor.university}</span>
              </p>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border my-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-sm truncate">
                      {currentTutor.certificates?.[0]
                        ? `${currentTutor.certificates[0].name}${currentTutor.certificates[0].score ? ` (${currentTutor.certificates[0].score})` : ""}`
                        : "Đã thẩm định"}
                    </div>
                    <div className="text-[11px] truncate">Chứng chỉ tiêu biểu</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">
                      {currentTutor.district ? `${currentTutor.district}, ${currentTutor.province}` : currentTutor.location}
                    </div>
                    <div className="text-[11px] truncate">{currentTutor.learningModeLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {currentTutor.experienceYears != null && currentTutor.experienceYears > 0
                        ? `${currentTutor.experienceYears} năm`
                        : "Mới gia nhập"}
                    </div>
                    <div className="text-[11px]">Kinh nghiệm dạy</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">
                      {currentTutor.hometown || "Việt Nam"}
                    </div>
                    <div className="text-[11px] truncate">Quê quán</div>
                  </div>
                </div>
              </div>

              {/* Highlights Badges */}
              {currentTutor.highlights?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentTutor.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      <Sparkles className="w-3 h-3 text-primary" />
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content Sections (Grid 2 cols) ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols on Large) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. TỰ GIỚI THIỆU & VIDEO */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Giới thiệu bản thân</h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-foreground">
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {currentTutor.bio || "Gia sư đã được thẩm định hồ sơ chuyên môn bởi trung tâm EnglishPath."}
                </p>

                {/* Video giới thiệu nếu có */}
                {currentTutor.videoUrl && (
                  <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">Video giới thiệu &amp; phong cách giảng dạy</div>
                        <div className="text-xs text-muted-foreground truncate max-w-sm">{currentTutor.videoUrl}</div>
                      </div>
                    </div>
                    <a
                      href={currentTutor.videoUrl.startsWith("http") ? currentTutor.videoUrl : `https://${currentTutor.videoUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <span>Xem video</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* 2. CHUYÊN MÔN & CẤP LỚP NHẬN DẠY (KHÔNG HIỂN THỊ NHÃN ĐÃ XÁC THỰC) */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Chuyên môn &amp; Cấp lớp nhận dạy</h2>
              </div>

              {currentTutor.specialties && currentTutor.specialties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentTutor.specialties.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl border border-border bg-muted/20 flex items-start justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{item.specialty}</h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <span>Cấp lớp / Trình độ:</span>
                          <strong className="text-foreground font-semibold">
                            {item.gradeLevel || "Tất cả các cấp"}
                          </strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Đang cập nhật danh mục chuyên môn chi tiết.</p>
              )}
            </section>

            {/* 3. LỊCH RẢNH THAM KHẢO */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Lịch rảnh tham khảo</h2>
              </div>

              {currentTutor.availabilities && currentTutor.availabilities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Ca học \ Thứ
                        </th>
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <th key={day} className="py-2.5 px-2 text-center font-semibold text-foreground">
                            {DAY_LABELS[day]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                        <tr key={slot} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {SLOT_LABELS[slot]}
                          </td>
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const isAvailable = availMap.has(`${day}_${slot}`);
                            return (
                              <td key={day} className="py-2.5 px-2 text-center">
                                {isAvailable ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30">–</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-[11px] text-muted-foreground italic">
                    * Lịch trên mang tính tham khảo, phụ huynh và gia sư có thể thống nhất lại giờ học cụ thể khi xếp lớp.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Lịch học linh hoạt theo thỏa thuận với phụ huynh và học viên.</p>
              )}
            </section>

            {/* 4. KHU VỰC NHẬN DẠY TẠI NHÀ */}
            {currentTutor.serviceAreas && currentTutor.serviceAreas.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Khu vực nhận dạy tại nhà</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentTutor.serviceAreas.map((area, idx) => (
                    <span
                      key={area.id || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-xs font-semibold text-foreground"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {area.district ? `${area.district}, ` : ""}{area.province}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 5. BẰNG CẤP & CHỨNG CHỈ (CÓ FILE MINH CHỨNG) */}
            {currentTutor.certificates && currentTutor.certificates.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Bằng cấp &amp; Minh chứng đã đối soát</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentTutor.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              {cert.type}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3 h-3" />
                              Hợp lệ
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground text-sm mt-0.5 truncate">{cert.name}</h4>
                          {cert.score && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Điểm số / Xếp loại: <strong className="text-foreground">{cert.score}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {cert.fileUrl && (
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Tệp đối soát:</span>
                          <button
                            type="button"
                            onClick={() => setSelectedImage(cert)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <span>Xem chứng chỉ</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Modal preview chứng chỉ */}
                {selectedImage && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div className="text-left">
                          <h3 className="font-bold text-base text-foreground">{selectedImage.name || selectedImage.title}</h3>
                          <p className="text-xs text-muted-foreground">Minh chứng đã được ban quản trị EnglishPath xác thực</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Display image or PDF link */}
                      {selectedImage.fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedImage.fileUrl) ? (
                        <div className="w-full max-h-96 rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center">
                          <img
                            src={selectedImage.fileUrl}
                            alt={selectedImage.name || selectedImage.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full py-12 rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center gap-3">
                          <FileCheck className="w-12 h-12 text-primary" />
                          <span className="text-xs text-muted-foreground">Tệp tài liệu văn bằng đối soát</span>
                          {selectedImage.fileUrl && (
                            <a
                              href={selectedImage.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>Mở tệp gốc trong tab mới</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="w-full py-2.5 rounded-xl bg-muted text-foreground font-semibold text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Sticky Contact Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-32 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Đăng ký nhận tư vấn
                </span>
                <h3 className="text-xl font-extrabold text-foreground mt-1">
                  Đăng ký học với gia sư {currentTutor.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  EnglishPath hỗ trợ tư vấn lộ trình học phù hợp và sắp xếp 1 buổi học thử miễn phí.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Hình thức dạy:</span>
                  <span className="font-semibold text-foreground">{currentTutor.learningModeLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Khu vực nhận lớp:</span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[180px]">
                    {currentTutor.district ? `${currentTutor.district}, ${currentTutor.province}` : currentTutor.location}
                  </span>
                </div>
                {currentTutor.hometown && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Quê quán:</span>
                    <span className="font-semibold text-foreground">{currentTutor.hometown}</span>
                  </div>
                )}
                {currentTutor.educationStatusLabel && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Trình độ học vấn:</span>
                    <span className="font-semibold text-foreground">{currentTutor.educationStatusLabel}</span>
                  </div>
                )}
                {currentTutor.experienceYears != null && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Kinh nghiệm:</span>
                    <span className="font-semibold text-foreground">
                      {currentTutor.experienceYears > 0 ? `${currentTutor.experienceYears} năm` : "Mới tốt nghiệp"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenHireModal}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer text-center active:scale-[0.98]"
                >
                  Đăng ký học thử 1 kèm 1
                </button>
                <Link
                  to="/tutors"
                  className="w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors text-center block"
                >
                  Quay lại danh sách gia sư
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
                🛡️ <strong>Cam kết từ EnglishPath:</strong> Buổi học đầu tiên là buổi đánh giá năng lực &amp; học thử 1 kèm 1 hoàn toàn miễn phí. Đổi gia sư bất cứ lúc nào nếu không phù hợp.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hire Specific Tutor Modal */}
      <HireTutorModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        tutor={currentTutor}
      />
    </div>
  );
}

export default GuestTutorDetailPage;
