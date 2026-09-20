import { X, Award, Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";

export default function TutorDetailModal({ tutor, onClose, onSelectTutor }) {
  if (!tutor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <Avatar initials={tutor.initials} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{tutor.name}</h2>
              {tutor.gender && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {tutor.gender}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>Học phí: <strong className="text-slate-900 dark:text-slate-100">{tutor.ratePerHour}</strong></span>
              <span>&middot;</span>
              <span>Hình thức: <strong className="text-slate-900 dark:text-slate-100">{tutor.learningModeLabel || "Online & Offline"}</strong></span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {tutor.specialization?.map((spec, i) => (
                <span
                  key={i}
                  className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Giới thiệu bản thân</h4>
          <p className="text-sm text-slate-700 dark:text-slate-200">{tutor.bio}</p>
        </div>

        {/* Academic Credentials Grid */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Award size={16} className="text-blue-600 dark:text-blue-400" /> Lý lịch Học tập & Trình độ
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">🎂 Năm sinh / Tuổi:</span> {tutor.birthYear || "2002"}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">🏡 Quê quán:</span> {tutor.hometown || "TP.HCM"}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">📍 Nơi ở hiện tại:</span> {tutor.currentAddress || "TP.HCM"}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">🎒 Trường Cấp 3:</span> {tutor.highSchool || "THPT Chuyên"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">🎓 Đại học & Ngành:</span> {tutor.university || "Đại học Sư phạm"}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">💯 Điểm thi ĐH / THPT:</span> <strong className="text-blue-600 dark:text-blue-400">{tutor.graduationScore}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">📊 Xếp loại Học lực GPA:</span> <strong className="text-emerald-600 dark:text-emerald-400">{tutor.academicRank}</strong>
              </p>
            </div>
          </div>

          {/* Awards List */}
          {tutor.awards && tutor.awards.length > 0 && (
            <div className="mt-4 border-t border-blue-200/60 pt-3 dark:border-blue-800/60">
              <h5 className="mb-2 text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                🏆 Giải thưởng & Thành tích Khen thưởng:
              </h5>
              <div className="space-y-1.5">
                {tutor.awards.map((aw, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg bg-white/80 p-2 text-xs shadow-2xs dark:bg-slate-800/80">
                    <span className="font-bold text-amber-600 shrink-0">[{aw.year}]</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex-1">{aw.title}</span>
                    <span className="text-[11px] text-slate-500 italic">({aw.issuer})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certificates & Qualifications */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Award size={16} className="text-blue-600 dark:text-blue-400" /> Bằng cấp & Chứng chỉ
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {tutor.certificates?.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-[11px] text-slate-500">{c.issuer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Schedule Slots */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" /> Khung giờ giảng dạy còn trống
          </h4>
          <div className="flex flex-wrap gap-2">
            {tutor.availableSlots?.map((slot, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Clock size={12} /> {slot}
              </span>
            ))}
          </div>
        </div>

        {/* Student Reviews */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Đánh giá từ Học sinh cũ ({tutor.reviews?.length || 0})
          </h4>
          <div className="space-y-2">
            {tutor.reviews?.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{r.student}</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                    Học sinh đã học
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">&quot;{r.comment}&quot;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Đóng
          </Button>
          <Button
            onClick={() => {
              onClose();
              onSelectTutor(tutor);
            }}
            className="flex-1"
          >
            Kết nối & Thuê Gia sư ngay <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
