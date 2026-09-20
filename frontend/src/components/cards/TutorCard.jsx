import { TrendingUp, Calendar, ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

export default function TutorCard({ tutor, onViewDetail, onSelectTutor }) {
  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-slate-900/50">
      <div>
        {/* Header: Avatar, Name & Mode Badge */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar initials={tutor.initials} size="md" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">{tutor.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tutor.gender || "Gia sư"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge tone={tutor.learningMode === "offline" ? "amber" : "blue"} size="xs">
              {tutor.learningMode === "offline" ? "🏠 Offline" : tutor.learningMode === "both" ? "🌐 Hybrid" : "💻 Online"}
            </Badge>
          </div>
        </div>

        {/* Bio */}
        <p className="mb-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
          {tutor.bio}
        </p>

        {/* Quick Academic Background */}
        {tutor.university && (
          <div className="mb-3 space-y-1 rounded-lg bg-slate-50/80 p-2 text-[11px] text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              <span>🎓</span> <span className="truncate">{tutor.university}</span>
            </div>
            {tutor.gender && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span>👤</span> <span>Giới tính: <strong className="font-semibold text-slate-800 dark:text-slate-200">{tutor.gender}</strong></span>
              </div>
            )}
            {tutor.awards && tutor.awards.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium truncate">
                <span>🏆</span> <span className="truncate">{tutor.awards[0].title}</span>
              </div>
            )}
          </div>
        )}

        {/* Specialization Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tutor.specialization.map((spec, i) => (
            <span
              key={i}
              className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
            >
              {spec}
            </span>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-center text-xs dark:bg-slate-800/50">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <TrendingUp size={12} />
              <span>Tiến bộ</span>
            </div>
            <p className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">{tutor.progressRate}</p>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Calendar size={12} />
              <span>Học phí</span>
            </div>
            <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{tutor.ratePerHour}</p>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant="secondary"
          className="flex-1 text-xs"
          onClick={() => onViewDetail(tutor)}
        >
          Xem hồ sơ
        </Button>
        <Button
          className="flex-1 text-xs"
          onClick={() => onSelectTutor(tutor)}
        >
          Kết nối ngay <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </Card>
  );
}
