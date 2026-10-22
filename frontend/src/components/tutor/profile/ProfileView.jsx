import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import ProfileStatusBanner from "./ProfileStatusBanner";
import PersonalSection from "./sections/PersonalSection";
import EducationSection from "./sections/EducationSection";
import IntroSection from "./sections/IntroSection";
import ServiceAreasSection from "./sections/ServiceAreasSection";
import SpecialtiesSection from "./sections/SpecialtiesSection";
import PricesSection from "./sections/PricesSection";
import AvailabilitySection from "./sections/AvailabilitySection";
import CredentialsSection from "./sections/CredentialsSection";
import { PROFILE_STATUS } from "../../../lib/tutorProfileModel";

const STATUS_LABEL = {
  [PROFILE_STATUS.INCOMPLETE]: "Chưa hoàn thiện hồ sơ",
  [PROFILE_STATUS.PENDING]: "Đang chờ duyệt",
  [PROFILE_STATUS.ACTIVE]: "Đã duyệt",
  [PROFILE_STATUS.REJECTED]: "Bị từ chối",
  [PROFILE_STATUS.INACTIVE]: "Tạm ngưng",
};

function formatDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * ProfileView — Chế độ xem hồ sơ gia sư đầy đủ, responsive, dark mode.
 * Chỉ dùng để HIỂN THỊ, không chứa form chỉnh sửa.
 *
 * @param {Object} profile - Dữ liệu hồ sơ từ backend (TutorProfileResponse)
 * @param {function} onEdit - Callback khi bấm nút Chỉnh sửa hồ sơ
 * @param {function} onSubmitForReview - Callback khi bấm Gửi duyệt / Gửi duyệt lại
 * @param {function} onCancelReview - Callback khi bấm Hủy duyệt (chỉ PENDING)
 */
export default function ProfileView({
  profile,
  onEdit,
  onSubmitForReview,
  /* onCancelReview — chưa dùng, giữ cho task 7 */},
) {
  if (!profile) return null;

  const p = profile;
  const status = p.profileStatus || PROFILE_STATUS.INCOMPLETE;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hồ sơ gia sư"
        title={p.fullName || "Hồ sơ của bạn"}
        description={
          `Mã số: ${p.tutorId || "–"}  •  Trạng thái: ${STATUS_LABEL[status]}  •  Cập nhật: ${formatDate(
            p.updatedAt,
          )}`
        }
      />

      {/* Banner trạng thái hồ sơ */}
      <ProfileStatusBanner
        profileStatus={status}
        rejectionReason={p.rejectionReason}
        reviewedAt={p.reviewedAt || p.updatedAt}
      />

      {/* Lưới các section thông tin */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Thông tin cá nhân + học vấn + giới thiệu */}
        <div className="lg:col-span-7 space-y-6">
          <PersonalSection
            fullName={p.fullName}
            email={p.email}
            phone={p.phone}
            dateOfBirth={p.dateOfBirth}
            gender={p.gender}
            hometown={p.hometown}
            avatarUrl={p.avatarUrl}
          />
          <EducationSection
            university={p.university}
            educationStatus={p.educationStatus}
            experienceYears={p.experienceYears}
            address={p.address}
          />
          <IntroSection bio={p.bio} videoUrl={p.videoUrl} />
        </div>

        {/* Cột 2: Chi tiết dạy học */}
        <div className="lg:col-span-5 space-y-6">
          <ServiceAreasSection serviceAreas={p.serviceAreas} />
          <SpecialtiesSection specialties={p.specialties} />
          <PricesSection prices={p.prices} />
          <AvailabilitySection availabilities={p.availabilities} />
          <CredentialsSection credentials={p.credentials} />
        </div>
      </div>

      {/* Sticky action bar (ẩn khi PENDING / INACTIVE — không được sửa) */}
      {(status === PROFILE_STATUS.INCOMPLETE ||
        status === PROFILE_STATUS.ACTIVE ||
        status === PROFILE_STATUS.REJECTED) && (
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {status === PROFILE_STATUS.ACTIVE
                ? "Chỉ được chỉnh sửa các trường được phép. Lưu trực tiếp không cần duyệt lại."
                : status === PROFILE_STATUS.REJECTED
                  ? "Sửa đầy đủ thông tin rồi bấm Gửi duyệt lại."
                  : "Hoàn thiện hồ sơ rồi bấm Gửi duyệt."}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  Chỉnh sửa hồ sơ
                </Button>
              )}
              {status === PROFILE_STATUS.INCOMPLETE && (
                <Button onClick={onSubmitForReview}>Gửi duyệt</Button>
              )}
              {status === PROFILE_STATUS.REJECTED && (
                <Button onClick={onSubmitForReview}>Gửi duyệt lại</Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
