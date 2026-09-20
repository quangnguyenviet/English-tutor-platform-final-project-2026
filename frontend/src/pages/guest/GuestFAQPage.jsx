import FAQ from "../../components/landing/faq";
import FinalCTA from "../../components/landing/final-cta";
import { useOutletContext } from "react-router-dom";

export function GuestFAQPage() {
  const { openContactModal } = useOutletContext();
  
  return (
    <div className="flex flex-col gap-0 pt-4">
      <FAQ onOpenContactModal={openContactModal} />
      <FinalCTA onOpenContactModal={openContactModal} />
    </div>
  );
}

export default GuestFAQPage;
