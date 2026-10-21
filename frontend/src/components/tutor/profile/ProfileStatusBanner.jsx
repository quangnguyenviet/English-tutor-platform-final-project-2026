import { AlertTriangle, CheckCircle2, Clock, Slash, User } from "lucide-react";
import Badge from "../../ui/Badge";
import Card from "../../ui/Card";

/** Cấu hình hiển thị cho từng trạng thái hồ sơ — tham chiếu plan.md §7. */
const STATUS_CONFIG = {
  INCOMPLETE: {
    label: "Chưa hoàn thiện hồ sơ",
    tone: "amber",
    Icon: User,
    description:
      "Bạn chưa điền đầy đủ hồ sơ. Vui lòng hoàn thiện thông tin và bấm \"Gửi duyệt\" để đăng ký.",
  },
  PENDING: {
    label: "Đang chờ duyệt",
    tone: "amber",
    Icon: Clock,
    description:
      "Hồ sơ của bạn đang được Admin / Lễ tân review. Bạn không thể chỉnh sửa trực tiếp trong lúc chờ duyệt.",
  },
  ACTIVE: {
    label: "Đã duyệt",
    tone: "emerald",
    Icon: CheckCircle2,
    description:
      "Hồ sơ đã được duyệt. Bạn có thể chỉnh sửa các trường được phép và lưu trực tiếp (không cần duyệt lại).",
  },
  REJECTED: {
    label: "Bị từ chối",
    tone: "rose",
    Icon: AlertTriangle,
    description:
      "Hồ sơ chưa đạt yêu cầu. Vui lòng sửa lại theo lý do dưới đây và bấm \"Gửi duyệt lại\".",
  },
  INACTIVE: {
    label: "Tạm ngưng",
    tone: "slate",
    Icon: Slash,
    description: "Hồ sơ hiện đang tạm ngưng.",
  },
};

/**
 * ProfileStatusBanner — banner theo trạng thái hồ sơ.
 *
 * @param {string} profileStatus - INCOMPLETE | PENDING | ACTIVE | REJECTED | INACTIVE
 * @param {string} [rejectionReason] - lý do từ chối (chỉ hiển thị khi REJECTED)
 * @param {string} [reviewedAt] - thời gian duyệt (tham khảo)
 */
export default function ProfileStatusBanner({
  profileStatus,
  rejectionReason,
  reviewedAt,
}) {
  const config = STATUS_CONFIG[profileStatus] || STATUS_CONFIG.INCOMPLETE;
  const Icon = config.icon || config.Icon;

  return (
    <Card
      className={`border-${config.tone}-200 bg-${config.tone}-50/40 dark:border-${config.tone}-900/60 dark:bg-${config.tone}-950/20`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${config.tone}-600 text-white shadow-xs`}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-50">
              Trạng thái: {config.label}
            </h3>
            <Badge tone={config.tone} size="sm">
              {profileStatus}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {config.description}
          </p>
          {reviewedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Cập nhật lần gần nhất:{" "}
              {new Date(reviewedAt).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {profileStatus === "REJECTED" && rejectionReason && (
        <div
          className={`border-t border-${config.tone}-200 dark:border-${config.tone}-900/60 pt-4 px-4 pb-4`}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={14} className="text-rose-600 mt-0.5" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Lý do từ chối
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg p-3 border border-rose-200 dark:border-rose-900/60 leading-relaxed">
            {rejectionReason}
          </p>
        </div>
      )}
    </Card>
  );
}
