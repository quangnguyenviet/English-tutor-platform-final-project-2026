import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
  Video,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetTutorProfile } from "../../lib/tutorApi";
import { PROFILE_STATUS } from "../../lib/tutorProfileModel";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ProfileStatusBanner from "../../components/tutor/profile/ProfileStatusBanner";
import ProfileSkeleton from "../../components/tutor/profile/ProfileSkeleton";
import ProfileEmptyState from "../../components/tutor/profile/ProfileEmptyState";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

const STATUS_LABEL = {
  [PROFILE_STATUS.INCOMPLETE]: "Chưa hoàn thiện hồ sơ",
  [PROFILE_STATUS.PENDING]: "Đang chờ duyệt",
  [PROFILE_STATUS.ACTIVE]: "Đã duyệt",
  [PROFILE_STATUS.REJECTED]: "Bị từ chối",
  [PROFILE_STATUS.INACTIVE]: "Tạm ngưng",
};

const STATUS_TONE = {
  [PROFILE_STATUS.INCOMPLETE]: "amber",
  [PROFILE_STATUS.PENDING]: "amber",
  [PROFILE_STATUS.ACTIVE]: "emerald",
  [PROFILE_STATUS.REJECTED]: "rose",
  [PROFILE_STATUS.INACTIVE]: "slate",
};

function formatDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Hiển thị một dòng thông tin chi tiết trong thẻ hồ sơ. */
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

export default function TutorProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const loadProfile = useCallback(async function loadProfile() {
    if (!token) {
      setLoading(false);
      setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await apiGetTutorProfile(token);
      setProfile(data || null);
      if (!data || Object.keys(data).length === 0) {
        setNotFound(true);
      }
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
        setError(null);
      } else if (err.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError(err.message || "Không thể tải hồ sơ. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, token]);

  const retry = () => loadProfile();
  const handleGoLogin = () => navigate("/login?role=tutor");
  const handleGoCreate = () => navigate("/tutor/create-profile");

  // Loading
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Empty (chưa có hồ sơ)
  if (notFound) {
    return <ProfileEmptyState />;
  }

  // Error
  if (error) {
    const isAuthError = /đăng nhập/i.test(error);
    return (
      <Card className="p-12 text-center border-rose-200 dark:border-rose-900/60">
        <AlertTriangle size={32} className="mx-auto mb-3 text-rose-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">{error}</h3>
        {isAuthError ? (
          <div className="mt-6 flex justify-center">
            <Button onClick={handleGoLogin}>Đăng nhập lại</Button>
          </div>
        ) : (
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={retry}>Thử lại</Button>
            <Button variant="outline" onClick={handleGoCreate}>
              Tạo hồ sơ mới
            </Button>
          </div>
        )}
      </Card>
    );
  }

  const p = profile;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hồ sơ gia sư"
        title={p.fullName || "Hồ sơ của bạn"}
        description={
          p.profileStatus
            ? `Mã số: ${p.tutorId || "–"}  •  Trạng thái: ${STATUS_LABEL[p.profileStatus]}  •  Cập nhật: ${formatDate(
                p.updatedAt,
              )}`
            : `Mã số: ${p.tutorId || "–"}  •  Cập nhật: ${formatDate(
                p.updatedAt,
              )}`
        }
      />

      <ProfileStatusBanner
        profileStatus={p.profileStatus || PROFILE_STATUS.INCOMPLETE}
        rejectionReason={p.rejectionReason}
        reviewedAt={p.reviewedAt || p.updatedAt}
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-4">
            <div className="flex flex-col items-center">
              <img
                src={p.avatarUrl || DEFAULT_AVATAR}
                alt="Ảnh đại diện gia sư"
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md"
              />
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  tone={STATUS_TONE[p.profileStatus] || "slate"}
                  size="sm"
                >
                  {STATUS_LABEL[p.profileStatus] || p.profileStatus}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                Ảnh đại diện
              </p>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <DetailRow icon={User} label="Họ và tên" value={p.fullName || "–"} />
            <DetailRow icon={Mail} label="Email" value={p.email || "–"} />
            <DetailRow
              icon={Phone}
              label="Số điện thoại"
              value={p.phone || "–"}
            />
          </div>

          <div className="md:col-span-4 space-y-3">
            <DetailRow
              icon={Calendar}
              label="Ngày sinh"
              value={p.dateOfBirth || "–"}
            />
            <DetailRow
              icon={User}
              label="Giới tính"
              value={p.gender || "–"}
            />
            <DetailRow
              icon={MapPin}
              label="Quê quán"
              value={p.hometown || "–"}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">
            Thông tin bổ sung
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailRow icon={MapPin} label="Địa chỉ" value={p.address || "–"} />
            <DetailRow
              icon={GraduationCap}
              label="Trường / Học vấn"
              value={p.university || p.educationStatus || "–"}
            />
            <DetailRow
              icon={Briefcase}
              label="Kinh nghiệm"
              value={
                p.experienceYears != null
                  ? `${p.experienceYears} năm`
                  : "–"
              }
            />
          </div>

          {p.bio && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Giới thiệu
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {p.bio}
              </p>
            </div>
          )}

          {p.videoUrl && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Video giới thiệu
              </h3>
              <a
                href={p.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Video size={16} className="shrink-0" /> Xem video
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
