import { Link } from "react-router-dom";
import {
  MapPin,
  GraduationCap,
  Wifi,
  Home,
  LayoutList,
  ChevronRight,
  Sparkles,
  User,
  Briefcase,
} from "lucide-react";

// Avatar gradient palettes — harmonious blue/navy tones
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "linear-gradient(135deg, #2563eb, #1e40af)",
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #1d4ed8, #0369a1)",
];

function ModeIcon({ mode }) {
  if (mode === "online") return <Wifi className="w-3.5 h-3.5 text-primary" />;
  if (mode === "offline") return <Home className="w-3.5 h-3.5 text-primary" />;
  return <LayoutList className="w-3.5 h-3.5 text-primary" />;
}

export function TutorCard({ tutor, index = 0, onConnect, onViewDetail }) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  // Danh sách chuyên môn hiển thị kèm cấp lớp nếu có
  const specialtiesDisplay = (tutor.specialties && tutor.specialties.length > 0)
    ? tutor.specialties.map((s) => s.gradeLevel ? `${s.specialty} (${s.gradeLevel})` : s.specialty)
    : (tutor.subjects || tutor.specialization || []);

  return (
    <div
      className="rounded-2xl border border-border bg-card flex flex-col tutor-card-hover stagger-item overflow-hidden shadow-xs hover:border-primary/40 transition-all duration-200"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="p-5 flex flex-col flex-grow gap-3.5">
        {/* Header: Avatar + Name + University + Tags */}
        <div className="flex gap-3.5 items-start">
          <Link
            to={`/tutors/${tutor.id}`}
            className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-xs hover:opacity-90 transition-opacity overflow-hidden"
            style={{ background: gradient }}
          >
            {tutor.avatarUrl ? (
              <img src={tutor.avatarUrl} alt={`Ảnh đại diện ${tutor.name}`} className="w-full h-full object-cover" />
            ) : (
              tutor.initials
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/tutors/${tutor.id}`}
              className="font-bold text-base text-foreground leading-tight hover:text-primary transition-colors truncate block"
            >
              {tutor.name}
            </Link>

            <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">{tutor.university}</span>
            </p>

            {/* Badges: Giới tính + Trình độ + Kinh nghiệm */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
              {tutor.gender && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">
                  <User className="w-3 h-3 text-primary" />
                  {tutor.gender}
                </span>
              )}
              {tutor.educationStatusLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/50 dark:border-blue-800/40">
                  {tutor.educationStatusLabel}
                </span>
              )}
              {tutor.experienceYears != null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/50 dark:border-emerald-800/40">
                  <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {tutor.experienceYears > 0 ? `${tutor.experienceYears} năm KN` : "Mới tốt nghiệp"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio tóm tắt */}
        {tutor.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg border border-border/60">
            &ldquo;{tutor.bio}&rdquo;
          </p>
        )}

        {/* Highlights Preview (Chứng chỉ / Điểm số) */}
        {tutor.highlights && tutor.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tutor.highlights.slice(0, 2).map((hl) => (
              <span
                key={hl}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[180px]">{hl}</span>
              </span>
            ))}
          </div>
        )}

        {/* Chuyên môn giảng dạy */}
        <div className="flex flex-wrap gap-1.5">
          {specialtiesDisplay.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border text-foreground bg-muted/50"
            >
              {tag}
            </span>
          ))}
          {specialtiesDisplay.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground bg-muted">
              +{specialtiesDisplay.length - 3} môn
            </span>
          )}
        </div>

        {/* Thông tin hình thức & khu vực */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <ModeIcon mode={tutor.learningMode} />
            <span className="truncate">{tutor.learningModeLabel || tutor.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {tutor.district ? `${tutor.district}, ${tutor.province}` : tutor.location}
              {tutor.hometown && !tutor.district && ` (Quê quán: ${tutor.hometown})`}
            </span>
          </div>
        </div>

        {/* Footer: CTA */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-end gap-2">
          {onViewDetail && (
            <button
              type="button"
              onClick={() => onViewDetail(tutor)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Chi tiết
            </button>
          )}

          {onConnect && (
            <button
              type="button"
              onClick={() => onConnect(tutor)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-xs"
            >
              <span>Ghép đôi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {!onConnect && (
            <Link
              to={`/tutors/${tutor.id}`}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-xs"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutorCard;
