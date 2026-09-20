import { useState } from "react";
import { Outlet } from "react-router-dom";
import SiteHeader from "../landing/site-header";
import SiteFooter from "../landing/site-footer";
import ParentContactModal from "../landing/parent-contact-modal";

export function GuestLayout() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <SiteHeader onOpenContactModal={openContactModal} />
      
      <main className="flex-grow">
        {/* Child guest pages will render here via Outlet */}
        <Outlet context={{ openContactModal }} />
      </main>

      <SiteFooter />

      {/* Parent Registration / Trial Modal */}
      <ParentContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </div>
  );
}

export default GuestLayout;
