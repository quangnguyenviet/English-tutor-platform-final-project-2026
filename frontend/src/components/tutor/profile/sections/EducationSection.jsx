import { GraduationCap, Briefcase, Building2 } from "lucide-react";
import Card from "../../../ui/Card";

/**
 * EducationSection — Trình độ học vấn & kinh nghiệm (chế độ xem).
 * @param {Object} data
 */
export default function EducationSection({
  university,
  educationStatus,
  experienceYears,
  address,
}) {
  const EDU_LABEL = {
    STUDENT: "Đang học",
    GRADUATED: "Đã tốt nghiệp",
    LECTURER: "Giảng viên",
  };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Thông tin học vấn
        </h3>
      </div>

      <div className="space-y-3">
        <DetailRow
          icon={Building2}
          label="Trường / cơ sở"
          value={university || "–"}
        />
        <DetailRow
          icon={GraduationCap}
          label="Trạng thái học vấn"
          value={EDU_LABEL[educationStatus] || educationStatus || "–"}
        />
        <DetailRow
          icon={Briefcase}
          label="Kinh nghiệm dạy"
          value={
            experienceYears != null
              ? `${experienceYears} năm`
              : "–"
          }
        />
        <DetailRow
          icon={Building2}
          label="Địa chỉ dạy"
          value={address || "–"}
        />
      </div>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-5 h-5 text-slate-400">
        <Icon size={16} />
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>
    </div>
  );
}
