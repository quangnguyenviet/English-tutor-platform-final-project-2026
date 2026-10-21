import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetTutorProfile } from "../../lib/tutorApi";
import { getEditMode } from "../../lib/tutorProfileModel";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProfileSkeleton from "../../components/tutor/profile/ProfileSkeleton";
import ProfileEmptyState from "../../components/tutor/profile/ProfileEmptyState";
import ProfileView from "../../components/tutor/profile/ProfileView";
import ProfileEditForm from "../../components/tutor/profile/ProfileEditForm";

export default function TutorProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

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

  // ── Điều phối chế độ Xem ↔ Sửa (task 6) ──
  const handleEdit = () => {
    // Chỉ vào chế độ sửa khi trạng thái cho phép (INCOMPLETE / REJECTED / ACTIVE)
    if (getEditMode(profile?.profileStatus) === "locked") return;
    setEditing(true);
  };
  const handleCancelEdit = () => setEditing(false);

  // Hành động lưu / gửi duyệt / hủy duyệt (task 7 sẽ triển khai)
  const handleSave = async () => {
    // TODO: task 7 — upload avatar/credentials mới → build payload → apiSubmitTutorProfile → refresh
  };
  const handleSubmitForReview = () => {
    // TODO: task 7 — lưu trước nếu dirty rồi apiSubmitProfileForReview
  };
  const handleCancelReview = () => {
    // TODO: task 7 — gọi cancelProfileForReview
  };

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

  // Chế độ sửa (task 6): full edit cho INCOMPLETE/REJECTED, restricted cho ACTIVE
  if (editing) {
    return (
      <ProfileEditForm
        profile={profile}
        onCancel={handleCancelEdit}
        onSave={handleSave}
        onSubmitForReview={handleSubmitForReview}
      />
    );
  }

  return (
    <ProfileView
      profile={profile}
      onEdit={handleEdit}
      onSubmitForReview={handleSubmitForReview}
      onCancelReview={handleCancelReview}
    />
  );
}
