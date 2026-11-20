import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiOpenDirectRoom } from "../../lib/messagingApi";
import ParentAccessModal from "../messaging/ParentAccessModal";

/**
 * "Nhắn tin" với gia sư: bắt buộc đăng nhập Google → wizard 4 bước (lần đầu) → mở phòng chat trực tiếp.
 * Thay thế form đăng ký học công khai (UC-PA-03).
 */
export function HireTutorModal({ isOpen, onClose, tutor }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleReady = useCallback(async () => {
    try {
      const { roomId } = await apiOpenDirectRoom(tutor.id, token);
      onClose();
      navigate(`/parent/messages/${roomId}`);
    } catch (error) {
      window.alert(error.message || "Không thể mở phòng chat với gia sư này.");
      onClose();
    }
  }, [tutor, token, navigate, onClose]);

  if (!isOpen || !tutor) return null;

  return (
    <ParentAccessModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nhắn tin với gia sư ${tutor.name}`}
      description="Trao đổi trực tiếp với gia sư trên hệ thống. Thông tin liên hệ cá nhân được bảo vệ cho đến khi bạn đồng ý một đề xuất lớp học."
      onReady={handleReady}
    />
  );
}

export default HireTutorModal;
