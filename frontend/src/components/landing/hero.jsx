import { Star, ArrowRight } from "lucide-react";

export function Hero({ onOpenContactModal }) {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="flex flex-col items-start space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Học 1 kèm 1 với gia sư Việt chất lượng cao
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.2] max-w-4xl">
            Lộ trình học tiếng Anh cá nhân hóa cho con, <span className="text-primary">báo cáo rõ ràng</span> từng tuần
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            EnglishPath giúp phụ huynh hoàn toàn yên tâm theo dõi tiến độ học tập của con qua lớp học 1 kèm 1, AI tự động theo dõi kỹ năng nghe nói đọc viết và thanh toán ký quỹ an toàn.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
            <button
              type="button"
              onClick={onOpenContactModal}
              className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>Tìm gia sư nhanh</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors flex items-center justify-center"
            >
              Xem cách hoạt động
            </a>
          </div>

          {/* Social Trust Line */}
          <div className="pt-4 flex items-center gap-4 text-sm text-muted-foreground border-t border-border/60 w-full max-w-2xl">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span>
              <strong className="text-foreground font-semibold">4.9/5</strong> từ 2.000+ phụ huynh tin tưởng
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Hero;
