import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LineChart, Megaphone, MessageCircle, Users } from "lucide-react";

const PARENT_LINKS = [
  { to: "/parent/messages", label: "Phòng chat", icon: MessageCircle },
  { to: "/parent/postings", label: "Tin của tôi", icon: Megaphone },
  { to: "/parent/progress", label: "Tiến độ của con", icon: LineChart },
];

/** Menu thả xuống gộp các mục của phụ huynh: rê chuột để mở, chạm hoặc dùng bàn phím thì bấm để mở/đóng. */
export default function ParentMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = PARENT_LINKS.some(({ to }) => pathname.startsWith(to));

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button type="button" aria-expanded={open}
        // Chuột đã mở menu bằng rê chuột nên bấm không được đóng lại.
        onClick={(e) => setOpen((value) => (e.nativeEvent.pointerType === "mouse" ? true : !value))}
        className={"inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors " +
          (active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
        <Users className="w-4 h-4" /> Khu vực phụ huynh
        <ChevronDown className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        // pt-2 nối liền nút với bảng chọn để rê chuột xuống không bị đóng giữa chừng.
        <div className="absolute left-0 top-full z-50 pt-2">
          <ul className="w-52 rounded-xl border border-border bg-background p-1.5 shadow-lg">
            {PARENT_LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} onClick={() => setOpen(false)}
                  className={({ isActive }) => "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                    (isActive ? "bg-muted text-primary" : "text-foreground hover:bg-muted")}>
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
