import { ParentContactModal } from "../../components/landing/parent-contact-modal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function GuestContactPage() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    navigate("/");
  };

  useEffect(() => {
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  return (
    <div className="flex-grow flex items-center justify-center min-h-[70vh] bg-muted/30">
      <ParentContactModal isOpen={isOpen} onClose={handleClose} />
      {/* Fallback layout if modal covers screen or we just render modal immediately */}
    </div>
  );
}

export default GuestContactPage;
