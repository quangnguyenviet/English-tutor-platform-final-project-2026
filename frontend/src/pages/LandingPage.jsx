import { useState } from "react";
import SiteHeader from "../components/landing/site-header";
import Hero from "../components/landing/hero";
import PainPoints from "../components/landing/pain-points";
import HowItWorks from "../components/landing/how-it-works";
import Features from "../components/landing/features";
import Trust from "../components/landing/trust";
import Testimonials from "../components/landing/testimonials";
import TutorCTA from "../components/landing/tutor-cta";
import FAQ from "../components/landing/faq";
import FinalCTA from "../components/landing/final-cta";
import SiteFooter from "../components/landing/site-footer";
import ParentContactModal from "../components/landing/parent-contact-modal";

export function LandingPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <SiteHeader onOpenContactModal={openContactModal} />
      <main className="flex-grow">
        <Hero onOpenContactModal={openContactModal} />
        <PainPoints />
        <HowItWorks />
        <Features />
        <Trust />
        <Testimonials />
        <TutorCTA />
        <FAQ onOpenContactModal={openContactModal} />
        <FinalCTA onOpenContactModal={openContactModal} />
      </main>
      <SiteFooter />

      {/* Parent Registration / Trial Modal */}
      <ParentContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </div>
  );
}

export default LandingPage;
