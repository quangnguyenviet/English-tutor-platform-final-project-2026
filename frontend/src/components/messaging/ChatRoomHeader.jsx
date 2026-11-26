import { Link } from "react-router-dom";
import { Briefcase, Eye, FilePlus2, FileText, GraduationCap, Lock, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { initialsOf, purposeLabel } from "../../lib/messagingApi";

const infoBoxClass = "mt-3 flex flex-wrap gap-x-5 gap-y-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/50 dark:text-slate-200";

function InfoItem({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-2">
      <Icon size={15} className="shrink-0 text-slate-400" /> {children}
    </p>
  );
}

/** Phần đầu phòng chat, luôn nằm trên cùng: đối phương, thông tin liên quan và các nút thao tác đề xuất. */
export default function ChatRoomHeader({ detail, viewer, onCreateProposal, onShowProposals }) {
  const { room, parent, tutor } = detail;
  const counterpart = room.counterpart;
  const readOnly = viewer === "STAFF";
  const profilePath = viewer === "PARENT" ? `/tutors/${counterpart.userId}` : null;

  const identity = (
    <>
      <Avatar initials={initialsOf(counterpart.fullName)} src={counterpart.avatarUrl} size="md" />
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {counterpart.fullName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {room.roomType === "APPLICATION" ? "Ứng viên từ tin đăng" : "Nhắn tin trực tiếp"}
          {profilePath && " · Xem hồ sơ gia sư"}
        </p>
      </div>
    </>
  );

  return (
    <header className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {profilePath
          ? <Link to={profilePath} className="group flex min-w-0 items-center gap-3">{identity}</Link>
          : <div className="flex min-w-0 items-center gap-3">{identity}</div>}
        <div className="flex items-center gap-2">
          {readOnly && <Badge tone="violet"><Eye size={12} /> Chỉ xem</Badge>}
          {!readOnly && !room.writable && <Badge tone="rose"><Lock size={12} /> Phòng đã khóa</Badge>}
          {!readOnly && (
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={onShowProposals}>
              <FileText size={15} /> Xem đề xuất
              {room.pendingProposals > 0 && <Badge tone="amber" size="xs">{room.pendingProposals} chờ</Badge>}
            </Button>
          )}
          {room.writable && viewer === "TUTOR" && (
            <Button size="sm" className="cursor-pointer" onClick={onCreateProposal}>
              <FilePlus2 size={15} /> Tạo đề xuất
            </Button>
          )}
        </div>
      </div>

      {tutor && (
        <div className={infoBoxClass}>
          {tutor.university && <InfoItem icon={GraduationCap}>{tutor.university}</InfoItem>}
          {tutor.experienceYears != null && <InfoItem icon={Briefcase}>{tutor.experienceYears} năm kinh nghiệm</InfoItem>}
          {tutor.bio && <p className="line-clamp-2 w-full text-xs text-slate-500 dark:text-slate-400">{tutor.bio}</p>}
          {!tutor.university && tutor.experienceYears == null && !tutor.bio && (
            <p className="text-slate-500 dark:text-slate-400">Gia sư chưa cập nhật thông tin giới thiệu.</p>
          )}
        </div>
      )}

      {parent && (
        <div className={infoBoxClass}>
          <InfoItem icon={ShieldCheck}>Mục đích: {purposeLabel(parent.purpose)}</InfoItem>
          <InfoItem icon={MapPin}>{[parent.ward, parent.province].filter(Boolean).join(", ")}</InfoItem>
          <InfoItem icon={Phone}>
            {parent.phoneUnlocked ? (
              <span><span className="font-mono">{parent.phone}</span> <span className="text-xs text-slate-500">· mở khóa ngày {new Date(parent.phoneUnlockedAt).toLocaleDateString("vi-VN")}</span></span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Số điện thoại phụ huynh được mở sau khi một đề xuất được đồng ý</span>
            )}
          </InfoItem>
          {parent.children.length > 0 && (
            <InfoItem icon={Users}>
              Con đã có hồ sơ: {parent.children.map((c) => `${c.fullName}${c.grade ? ` (${c.grade})` : ""}`).join(", ")}
            </InfoItem>
          )}
        </div>
      )}
    </header>
  );
}
