import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ParentAccessModal from "../messaging/ParentAccessModal";

/**
 * "Tìm gia sư": bắt buộc đăng nhập Google → wizard 4 bước (lần đầu) → form đăng tin trên trang "Tin của tôi".
 * Thay thế form khách để lại họ tên và SĐT (UC-PA-04).
 */
export function ParentContactModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleReady = useCallback(() => {
    onClose();
    navigate("/parent/postings?new=1");
  }, [navigate, onClose]);

  if (!isOpen) return null;

  return (
    <ParentAccessModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng tin tìm gia sư"
      description="Trung tâm duyệt tin trong 24 giờ, sau đó gia sư phù hợp sẽ ứng tuyển để bạn trao đổi trực tiếp."
      onReady={handleReady}
    />
  );
}

export default ParentContactModal;
