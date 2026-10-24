import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import {
  apiGetTutorProfile,
  apiSubmitTutorProfile,
  apiSubmitProfileForReview,
  uploadTutorAvatar,
  uploadTutorCredentials,
} from "../../lib/tutorApi";
import {
  PROFILE_STATUS,
  buildUpsertPayload,
  emptyForm,
  getEditMode,
  validateCollections,
} from "../../lib/tutorProfileModel";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProfileSkeleton from "../../components/tutor/profile/ProfileSkeleton";
import ProfileEditForm from "../../components/tutor/profile/ProfileEditForm";

/**
 * TutorProfileEditPage — Route /tutor/profile/edit.
 * - Chưa có hồ sơ (404): chế độ tạo mới với form rỗng.
 * - Đã có hồ sơ: chế độ chỉnh sửa (full edit hoặc restricted khi ACTIVE).
 * - PENDING / INACTIVE: chuyển về trang xem (không cho sửa).
 */
export default function TutorProfileEditPage() {
  const { token, session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async function loadProfile() {
    if (!token) {
      setLoading(false);
      setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiGetTutorProfile(token);
      // 404 hoặc body rỗng = chưa có hồ sơ → chế độ tạo mới, không phải lỗi
      setProfile(data && Object.keys(data).length > 0 ? data : null);
    } catch (err) {
      if (err.status === 404) {
        setProfile(null);
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
  }, [loadProfile]);

  /**
   * Lưu hồ sơ: upload avatar/file chứng chỉ mới → build payload → POST.
   * thenSubmit = true: gửi duyệt ngay sau khi lưu.
   */
  const persist = async ({ form, avatarFile }, thenSubmit) => {
    if (!token) {
      navigate("/login?role=tutor");
      return;
    }

    const status = profile?.profileStatus || PROFILE_STATUS.INCOMPLETE;
    const isFullEdit = getEditMode(status) === "full";

    // Kiểm tra mảng con (khu vực dạy, chuyên môn, lịch rảnh, chứng chỉ)
    if (isFullEdit) {
      const collectionErrors = validateCollections(form);
      if (collectionErrors.length > 0) {
        toast.error(collectionErrors[0]);
        return;
      }
    }

    // 1. Upload avatar mới (nếu có)
    let avatarUrl = form.avatarUrl || "";
    if (avatarFile) {
      avatarUrl = await uploadTutorAvatar(token, avatarFile);
    }

    // 2. Chỉ giữ các dòng chứng chỉ hợp lệ (có tên + file/URL), upload file mới
    const rows = (Array.isArray(form.credentials) ? form.credentials : []).filter(
      (c) => (c.title || "").trim() && (c.file || c.fileUrl),
    );
    const newFiles = rows.filter((c) => c.file).map((c) => c.file);
    const uploadedUrls =
      newFiles.length > 0
        ? await uploadTutorCredentials(token, newFiles)
        : [];

    // 3. Ghép URL vào từng chứng chỉ; loại File object khỏi payload
    let urlIndex = 0;
    const credentials = rows.map(({ file, ...rest }) => ({
      ...rest,
      title: (rest.title || "").trim(),
      score: (rest.score || "").trim() || null,
      fileUrl: file ? uploadedUrls[urlIndex++] || null : rest.fileUrl || null,
    }));

    if (credentials.some((c) => !c.fileUrl)) {
      throw new Error(
        "Không nhận được URL file minh chứng sau khi tải lên. Vui lòng thử lại.",
      );
    }

    // 4. Build payload & lưu
    const payload = buildUpsertPayload({ ...form, avatarUrl, credentials });
    await apiSubmitTutorProfile(token, payload);

    // 5. Gửi duyệt (nếu yêu cầu)
    if (thenSubmit) {
      await apiSubmitProfileForReview(token);
    }

    toast.success(
      thenSubmit ? "Đã gửi hồ sơ chờ duyệt" : "Đã lưu hồ sơ",
    );

    if (thenSubmit || status !== PROFILE_STATUS.INCOMPLETE) {
      navigate("/tutor/profile");
    } else {
      // Lưu nháp hồ sơ INCOMPLETE: ở lại form, nạp lại dữ liệu từ server
      // (xóa File đã upload khỏi state để tránh upload trùng lần sau)
      await loadProfile();
    }
  };

  const handleSave = async (data) => {
    try {
      await persist(data, false);
    } catch (err) {
      toast.error(err.message || "Lưu hồ sơ thất bại. Vui lòng thử lại.");
    }
  };

  const handleSubmitForReview = async (data) => {
    try {
      await persist(data, true);
    } catch (err) {
      toast.error(err.message || "Gửi duyệt thất bại. Vui lòng thử lại.");
    }
  };

  const handleCancel = () => {
    // Hồ sơ chưa hoàn thiện (hoặc chưa tồn tại): về dashboard,
    // vì /tutor/profile sẽ chuyển ngược lại form sửa
    const incomplete =
      !profile || profile.profileStatus === PROFILE_STATUS.INCOMPLETE;
    navigate(incomplete ? "/tutor" : "/tutor/profile");
  };

  const retry = () => loadProfile();
  const handleGoLogin = () => navigate("/login?role=tutor");

  if (loading) {
    return <ProfileSkeleton />;
  }

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
            <Button variant="outline" onClick={() => navigate("/tutor/profile")}>
              Về hồ sơ
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // PENDING / INACTIVE: không cho chỉnh sửa, quay về trang xem
  if (profile && getEditMode(profile.profileStatus) === "locked") {
    return <Navigate to="/tutor/profile" replace />;
  }

  return (
    <ProfileEditForm
      profile={profile}
      initialForm={
        profile
          ? undefined
          : { ...emptyForm(), fullName: session?.name || "" }
      }
      onCancel={handleCancel}
      onSave={handleSave}
      onSubmitForReview={handleSubmitForReview}
    />
  );
}
