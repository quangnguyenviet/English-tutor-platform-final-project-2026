import FinalCTA from "../../components/landing/final-cta";
import { Check } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const plans = [
  {
    name: "Cơ bản",
    price: "150.000đ",
    period: "/ buổi",
    description: "Phù hợp cho học sinh mất gốc, cần lấy lại nền tảng.",
    features: ["Gia sư sinh viên giỏi", "Lộ trình 1 kèm 1", "Báo cáo học tập mỗi tuần", "Hỗ trợ giải đáp 24/7"],
  },
  {
    name: "Nâng cao",
    price: "250.000đ",
    period: "/ buổi",
    description: "Phù hợp luyện thi IELTS, TOEIC, thi Đại học.",
    features: ["Gia sư IELTS 7.5+", "Giáo trình thiết kế riêng", "Thi thử hàng tháng miễn phí", "Cam kết đầu ra bằng văn bản"],
    popular: true,
  },
  {
    name: "Chuyên sâu",
    price: "350.000đ",
    period: "/ buổi",
    description: "Luyện thi chuyên, học thuật nâng cao cường độ cao.",
    features: ["Gia sư Giáo viên / Chuyên gia", "Chữa bài chi tiết 1-1", "Học liệu VIP không giới hạn", "Hoàn tiền 100% nếu không đạt mục tiêu"],
  }
];

export function GuestPricingPage() {
  const { openContactModal } = useOutletContext();

  return (
    <div className="flex flex-col gap-0 pt-8 pb-16">
      <div className="text-center max-w-3xl mx-auto px-4 mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Bảng Giá & Gói Học</h1>
        <p className="text-lg text-muted-foreground">
          Đầu tư cho tương lai với mức học phí minh bạch, cam kết chất lượng đầu ra.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <div key={idx} className={`relative flex flex-col p-8 rounded-3xl border ${plan.popular ? 'border-primary shadow-xl bg-card' : 'border-border bg-background'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Được lựa chọn nhiều nhất
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 h-10">{plan.description}</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={openContactModal}
                className={`w-full py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                  plan.popular 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md' 
                    : 'bg-muted text-foreground hover:bg-border'
                }`}
              >
                Đăng ký học thử
              </button>
            </div>
          ))}
        </div>
      </div>

      <FinalCTA onOpenContactModal={openContactModal} />
    </div>
  );
}

export default GuestPricingPage;
