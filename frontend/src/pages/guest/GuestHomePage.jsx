import { useOutletContext } from "react-router-dom";
import Hero from "../../components/landing/hero";
import PainPoints from "../../components/landing/pain-points";
import Features from "../../components/landing/features";
import Testimonials from "../../components/landing/testimonials";
import FinalCTA from "../../components/landing/final-cta";

export function GuestHomePage() {
  const { openContactModal } = useOutletContext();

  return (
    <div className="flex flex-col gap-0">
      <Hero onOpenContactModal={openContactModal} />
      <PainPoints />
      <Features />
      <Testimonials />
      <FinalCTA onOpenContactModal={openContactModal} />
    </div>
  );
}

export default GuestHomePage;
