import HowItWorks from "../../components/landing/how-it-works";
import Trust from "../../components/landing/trust";
import TutorCTA from "../../components/landing/tutor-cta";
import { useOutletContext } from "react-router-dom";

export function GuestHowItWorksPage() {
  const { openContactModal } = useOutletContext();

  return (
    <div className="flex flex-col gap-0 pt-8 pb-16">
      <div className="text-center max-w-3xl mx-auto px-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Cách Thức Hoạt Động</h1>
        <p className="text-lg text-muted-foreground">
          Khám phá quy trình ghép lớp và lộ trình cá nhân hóa 1 kèm 1 dành riêng cho bạn.
        </p>
      </div>
      <HowItWorks />
      <Trust />
      <TutorCTA />
    </div>
  );
}

export default GuestHowItWorksPage;
