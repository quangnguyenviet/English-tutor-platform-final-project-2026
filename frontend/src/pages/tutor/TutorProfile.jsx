import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import {
  apiGetTutorProfile,
  apiSetOpenToTeaching,
  apiSubmitProfileForReview,
} from "../../lib/tutorApi";
import { PROFILE_STATUS, getEditMode } from "../../lib/tutorProfileModel";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProfileSkeleton from "../../components/tutor/profile/ProfileSkeleton";
import ProfileView from "../../components/tutor/profile/ProfileView";
import OpenToTeachingToggle from "../../components/tutor/OpenToTeachingToggle";

/**
 * TutorProfile — Route /tutor/profile (chỉ xem).
 * - Chưa có hồ sơ: chuyển sang /tutor/profile/edit (chế độ tạo mới).
 * - Có hồ sơ: hiển thị ProfileView + các hành động chuyển sang route sửa.
 */
export default function TutorProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);

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
  const handleGoEdit = () => navigate("/tutor/profile/edit");

  // Chỉ cho vào trang sửa khi trạng thái cho phép (INCOMPLETE / REJECTED / ACTIVE)
  const handleEdit = () => {
    if (getEditMode(profile?.profileStatus) === "locked") return;
    navigate("/tutor/profile/edit");
  };

  const handleSubmitForReview = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      await apiSubmitProfileForReview(token);
      toast.success("Đã gửi hồ sơ chờ duyệt");
      await loadProfile();
    } catch (err) {
      toast.error(err.message || "Gửi duyệt thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleOpenToTeaching = async () => {
    if (!token || togglingOpen) return;
    const next = profile?.openToTeaching === false;
    setTogglingOpen(true);
    try {
      const data = await apiSetOpenToTeaching(token, next);
      setProfile((prev) => ({ ...prev, openToTeaching: data?.openToTeaching !== false }));
      toast.success(next ? "Đã bật chế độ nhận lớp" : "Đã tạm ngưng nhận lớp mới");
    } catch (err) {
      toast.error(err.message || "Không thể cập nhật chế độ nhận lớp.");
    } finally {
      setTogglingOpen(false);
    }
  };

  // Loading
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Chưa có hồ sơ hoặc hồ sơ chưa hoàn thiện → vào thẳng form tạo/sửa
  if (notFound || profile?.profileStatus === PROFILE_STATUS.INCOMPLETE) {
    return <Navigate to="/tutor/profile/edit" replace />;
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
            <Button variant="outline" onClick={handleGoEdit}>
              Tạo hồ sơ mới
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {profile?.profileStatus === PROFILE_STATUS.ACTIVE && (
        <OpenToTeachingToggle
          open={profile?.openToTeaching !== false}
          busy={togglingOpen}
          onToggle={handleToggleOpenToTeaching}
        />
      )}
      <ProfileView
        profile={profile}
        onEdit={handleEdit}
        onSubmitForReview={handleSubmitForReview}
      />
    </div>
  );
}
