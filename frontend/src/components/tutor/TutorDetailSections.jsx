import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  ExternalLink,
  Eye,
  FileCheck,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  UserCheck,
  Video,
  X,
} from "lucide-react";
import Badge from "../ui/Badge";

/** Phần nội dung hồ sơ gia sư (dùng ở Quản lý gia sư và xem trước gia sư ứng tuyển). */
export function TutorDetailSections({ tutor, onPreviewImage }) {
  return (
    <>
      {/* Lý do từ chối nếu có */}
      {tutor.rejectionReason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-950 dark:bg-rose-950/30">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold mb-1">
            <AlertCircle size={15} />
            Lý do từ chối trước đó:
          </div>
          <p className="text-rose-800 dark:text-rose-200">{tutor.rejectionReason}</p>
        </div>
      )}

      {/* 1. Thông tin liên hệ & cá nhân */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
        <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <UserCheck size={14} className="text-blue-500" />
          1. Thông tin liên hệ &amp; Cá nhân
        </h4>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Mail size={13} /> Email:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{tutor.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone size={13} /> SĐT:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{tutor.phone || "Chưa cập nhật"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar size={13} /> Ngày sinh:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{tutor.dateOfBirth || "Chưa cập nhật"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={13} /> Quê quán:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{tutor.hometown || "Chưa cập nhật"}</span>
          </div>
          <div className="sm:col-span-2 flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={13} /> Địa chỉ cư trú:</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{tutor.address || "Chưa cập nhật"}</span>
          </div>
        </div>

        {tutor.bio && (
          <div className="mt-2 rounded-lg bg-white p-3 border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Giới thiệu bản thân:</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{tutor.bio}</p>
          </div>
        )}

        {tutor.videoUrl && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Video size={13} className="text-rose-500" /> Video giới thiệu:
            </span>
            <a
              href={tutor.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400 font-medium"
            >
              {tutor.videoUrl} <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* 2. Lý lịch học vấn & Bằng cấp */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-950 dark:bg-blue-950/20 space-y-3">
        <h4 className="font-bold uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
          <GraduationCap size={15} className="text-blue-600 dark:text-blue-400" />
          2. Lý lịch học vấn &amp; Kinh nghiệm
        </h4>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Trường Đại học:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{tutor.university || "Chưa cập nhật"}</span>
          </div>
          <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Tình trạng học vấn:</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {tutor.educationStatus === "STUDENT"
                ? "Sinh viên"
                : tutor.educationStatus === "GRADUATED"
                ? "Đã tốt nghiệp"
                : tutor.educationStatus === "LECTURER"
                ? "Giảng viên"
                : tutor.educationStatus || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Kinh nghiệm giảng dạy:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {tutor.experienceYears ? `${tutor.experienceYears} năm kinh nghiệm` : "Mới bắt đầu"}
            </span>
          </div>
          <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Thời điểm gửi duyệt:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {tutor.submittedAt ? new Date(tutor.submittedAt).toLocaleString("vi-VN") : "Chưa có"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Chứng chỉ & Bằng cấp kèm ảnh thẩm định (Theo Use Case UC-REC-08) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
        <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileCheck size={15} className="text-emerald-500" />
            3. Bằng cấp &amp; Chứng chỉ tải lên (Thẩm định)
          </span>
          <span className="text-[10px] text-slate-400">Bắt buộc xem kỹ trước khi duyệt</span>
        </h4>

        {tutor.credentials && tutor.credentials.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {tutor.credentials.map((cred, idx) => (
              <div
                key={cred.id || idx}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{cred.title}</span>
                    <Badge tone="blue">{cred.type || "Chứng chỉ"}</Badge>
                  </div>
                  {cred.score && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Điểm/Xếp loại: {cred.score}
                    </p>
                  )}
                </div>

                {cred.fileUrl && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {cred.fileUrl.split("/").pop()}
                    </span>
                    <button
                      onClick={() => onPreviewImage(cred.fileUrl)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      <Eye size={12} /> Xem ảnh scan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Gia sư chưa tải lên tệp chứng chỉ nào.</p>
        )}
      </div>

      {/* 4. Chuyên môn & Bảng giá & Lịch rảnh */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Chuyên môn */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <BookOpen size={13} className="text-blue-500" /> Chuyên môn &amp; Khối lớp
          </h5>
          {tutor.specialties && tutor.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tutor.specialties.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  {s.specialty} {s.gradeLevel ? `(${s.gradeLevel})` : ""}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa cập nhật</span>
          )}
        </div>

        {/* Bảng giá */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Award size={13} className="text-amber-500" /> Bảng giá giảng dạy
          </h5>
          {tutor.prices && tutor.prices.length > 0 ? (
            <div className="space-y-1.5">
              {tutor.prices.map((p, idx) => (
                <div key={idx} className="flex justify-between text-[11px] border-b border-slate-100 pb-1 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{p.program || p.teachingMode}:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {Number(p.pricePerSession).toLocaleString("vi-VN")} ₫/buổi
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa cập nhật bảng giá</span>
          )}
        </div>
      </div>
    </>
  );
}

/** Lightbox xem ảnh scan chứng chỉ. */
export function CredentialImagePreview({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <FileCheck size={15} className="text-emerald-500" /> Minh chứng chứng chỉ gốc
          </span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Mở trong tab mới"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 bg-slate-950/10 dark:bg-slate-950/50">
          <img
            src={url}
            alt="Scan chứng chỉ"
            className="max-h-[75vh] w-auto rounded-lg object-contain shadow-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/600x400?text=File+kh%C3%B4ng+ph%E1%BA%A3i+%E1%BA%A3nh+ho%E1%BA%B7c+l%E1%BB%97i+t%E1%BA%A3i";
            }}
          />
        </div>
      </div>
    </div>
  );
}
