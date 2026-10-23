import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTA({ onOpenContactModal }) {
  return (
    <section className="py-20 bg-background border-b border-border relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Sẵn sàng bứt phá trình độ tiếng Anh cho con?
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Đăng ký học thử 1 kèm 1 miễn phí hôm nay. Không rủi ro, không mất phí nâng cấp, kiểm tra trình độ chính xác.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={onOpenContactModal}
            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <span>Nhận tư vấn tìm gia sư</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Miễn phí 100% buổi đầu
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cam kết đổi gia sư
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Không ràng buộc hợp đồng
          </span>
        </div>
      </div>
    </section>
  );
}
export default FinalCTA;
