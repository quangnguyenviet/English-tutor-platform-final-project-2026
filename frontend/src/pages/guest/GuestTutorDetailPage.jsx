import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Eye,
  FileCheck,
  Building,
  User,
  ExternalLink,
  Share2
} from "lucide-react";
import { tutors } from "../../data/mockData";
import HireTutorModal from "../../components/guest/HireTutorModal";

export function GuestTutorDetailPage() {
  const { tutorId } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);

  // Find tutor by id (or fallback to first tutor if id not found)
  const currentTutor = tutors.find((t) => t.id === tutorId) || tutors[0];

  const handleOpenHireModal = () => {
    setIsHireModalOpen(true);
  };

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
            <span>Quay lại trang tìm gia sư</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenHireModal}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              Liên hệ ngay
            </button>
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
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-extrabold text-3xl sm:text-4xl text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
              >
                {currentTutor.initials}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đã xác thực hồ sơ</span>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {currentTutor.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    {currentTutor.gender}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">{currentTutor.ratePerHour}</div>
                  <div className="text-xs text-muted-foreground">Học phí / buổi</div>
                </div>
              </div>

              {/* Subtitles & Badges */}
              <p className="text-base text-foreground font-semibold flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <span>{currentTutor.university}</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-y border-border my-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-sm truncate">{currentTutor.certificates?.[0]?.name || "Chứng chỉ Quốc tế"}</div>
                    <div className="truncate">Chứng chỉ chuyên môn</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{currentTutor.district ? `${currentTutor.district}, ${currentTutor.province}` : currentTutor.currentAddress}</div>
                    <div className="truncate">{currentTutor.learningModeLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{currentTutor.progressRate}</div>
                    <div>Học sinh tiến bộ</div>
                  </div>
                </div>
              </div>

              {/* Highlight Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {currentTutor.highlights?.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Sections (Grid 2 cols) ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols on Large) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. TỰ GIỚI THIỆU */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Tự giới thiệu bản thân</h2>
              </div>

              {currentTutor.selfIntroduction ? (
                <div className="space-y-4 text-sm leading-relaxed text-foreground">
                  <h3 className="font-bold text-base text-primary">
                    {currentTutor.selfIntroduction.headline}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentTutor.selfIntroduction.overview}
                  </p>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <div className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      Triết lý & Phương pháp giảng dạy:
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {currentTutor.selfIntroduction.teachingPhilosophy}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground block mb-1">Kinh nghiệm giảng dạy</span>
                      <span className="font-bold text-foreground">{currentTutor.selfIntroduction.experienceYears}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground block mb-1">Đối tượng kèm cặp tốt nhất</span>
                      <span className="font-semibold text-foreground text-xs leading-snug">{currentTutor.selfIntroduction.targetStudents}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{currentTutor.bio}</p>
              )}
            </section>

            {/* 2. THÀNH TÍCH DẠY HỌC */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Thành tích dạy học & Giải thưởng</h2>
              </div>

              <div className="space-y-4">
                {currentTutor.teachingAchievements?.map((ach, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-border bg-muted/20 flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 font-bold text-xs">
                      {ach.year}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ach.detail}</p>
                    </div>
                  </div>
                ))}

                {/* Awards list */}
                {currentTutor.awards?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Giải thưởng cá nhân & Chứng nhận
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentTutor.awards.map((aw, i) => (
                        <div key={i} className="p-3 rounded-xl border border-border bg-card flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs">{aw.title}</div>
                            <div className="text-[11px] text-muted-foreground">{aw.issuer} ({aw.year})</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. CÁC ẢNH ĐÍNH KÈM */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <FileCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Các ảnh đính kèm (Bằng cấp & Chứng chỉ)</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {currentTutor.attachedImages?.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className="group relative rounded-2xl border border-border bg-muted/40 p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all overflow-hidden aspect-4/3"
                  >
                    <div className={`w-full h-16 rounded-xl bg-gradient-to-br ${img.color || "from-blue-600 to-indigo-800"} flex items-center justify-center text-white mb-2 shadow-xs group-hover:scale-105 transition-transform`}>
                      <FileCheck className="w-6 h-6 opacity-90" />
                    </div>
                    <span className="text-xs font-bold text-foreground line-clamp-1 leading-snug">{img.title}</span>
                    <span className="text-[10px] text-primary mt-0.5 font-medium">{img.category}</span>
                  </div>
                ))}
              </div>

              {/* Image preview modal */}
              {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                  <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-xl">
                    <div className={`w-full h-48 rounded-2xl bg-gradient-to-br ${selectedImage.color || "from-blue-600 to-indigo-800"} flex flex-col items-center justify-center text-white p-6 shadow-md`}>
                      <ShieldCheck className="w-12 h-12 mb-2" />
                      <span className="font-bold text-lg">{selectedImage.title}</span>
                      <span className="text-xs opacity-80 mt-1">{selectedImage.category}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hồ sơ và văn bằng đã được ban quản trị EnglishPath đối soát và chứng thực hợp lệ.
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 4. CÁC LỚP ĐÃ VÀ ĐANG DẠY */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Các lớp đã và đang dạy</h2>
              </div>

              <div className="space-y-4">
                {currentTutor.taughtClasses?.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-xs px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                          {cls.code}
                        </span>
                        <h4 className="font-bold text-foreground text-sm">{cls.subject}</h4>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cls.status === "Đang dạy"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                        }`}>
                        {cls.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                      <div><span className="text-foreground font-semibold">Cấp lớp:</span> {cls.grade}</div>
                      <div><span className="text-foreground font-semibold">Hình thức:</span> {cls.mode}</div>
                      <div><span className="text-foreground font-semibold">Thời gian:</span> {cls.period}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 text-xs border border-border space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span>Kết quả đạt được:</span>
                        <span className="text-primary font-bold ml-1">{cls.result}</span>
                      </div>
                      <p className="text-muted-foreground italic leading-relaxed">
                        &ldquo;{cls.feedback}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Contact Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-32 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>

                <h3 className="text-xl font-extrabold text-foreground">
                  Đăng ký học với {currentTutor.name}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Học phí:</span>
                  <span className="font-bold text-foreground text-sm">{currentTutor.ratePerHour}/buổi</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Hình thức:</span>
                  <span className="font-semibold text-foreground">{currentTutor.learningModeLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Khu vực nhận lớp:</span>
                  <span className="font-semibold text-foreground">{currentTutor.district ? `${currentTutor.district}, ${currentTutor.province}` : currentTutor.currentAddress}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenHireModal}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer text-center active:scale-98"
                >
                  Liên hệ ngay
                </button>
                <Link
                  to="/tutors"
                  className="w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors text-center block"
                >
                  Quay lại trang tìm gia sư
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
                🛡️ <strong>Cam kết từ EnglishPath:</strong> Buổi đầu tiên là buổi đánh giá năng lực & học thử 1 kèm 1 miễn phí với gia sư {currentTutor.name}. Đổi gia sư bất cứ lúc nào nếu chưa phù hợp.
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
