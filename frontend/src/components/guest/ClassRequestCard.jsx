import { Link } from "react-router-dom";
import { BookOpen, Home, MapPin, DollarSign, Percent, User, Users, Calendar, ArrowRight } from "lucide-react";

function ModeChip({ mode }) {
  const isOnline = mode === "Online";
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border border-primary/25 bg-primary/10 text-primary">
      {isOnline ? "🌐 Online" : "🏠 Tại nhà"}
    </span>
  );
}

export function ClassRequestCard({ listing, index = 0, onViewDetail }) {
  const formattedFee = new Intl.NumberFormat("vi-VN").format(listing.feePerSession);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3.5 tutor-card-hover stagger-item"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Header: code + date */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground">
          Mã lớp:{" "}
          <span className="text-primary font-bold text-sm">{listing.code}</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          {listing.postedDate}
        </span>
      </div>

      {/* Subject — prominent */}
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Yêu cầu môn:</p>
          <p className="text-sm font-bold text-foreground leading-snug truncate">{listing.subject}</p>
        </div>
      </div>

      {/* Details list */}
      <div className="space-y-2 text-xs py-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            Hình thức:
          </span>
          <ModeChip mode={listing.teachingMode} />
        </div>

        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            Địa chỉ:
          </span>
          <span className="font-medium text-foreground text-right leading-snug truncate max-w-[60%]">{listing.address}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary shrink-0" />
            Học phí:
          </span>
          <span className="font-bold text-primary">{formattedFee} VNĐ/buổi</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            Phí nhận lớp:
          </span>
          <span className="font-medium text-foreground">{listing.commissionRate}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            Yêu cầu gia sư:
          </span>
          <span className="font-medium text-foreground truncate max-w-[60%] text-right">{listing.genderRequirement} - {listing.teacherRequirement}</span>
        </div>
      </div>

      {/* CTA - Nút Xem chi tiết */}
      <Link
        to={`/classes/${listing.id}`}
        onClick={onViewDetail}
        className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
      >
        <span>Xem chi tiết</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default ClassRequestCard;
