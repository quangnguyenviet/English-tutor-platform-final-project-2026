import { ArrowRight, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../ui/Button";
import Card from "../../ui/Card";

export default function ProfileEmptyState() {
  return (
    <Card className="p-12 text-center">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 mx-auto mb-4"
      >
        <UserPlus size={24} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        Chưa có hồ sơ gia sư
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
        Bạn chưa đăng ký hồ sơ gia sư. Hãy tạo hồ sơ để bắt đầu nhận lớp.
      </p>
      <div className="mt-8 flex justify-center">
        <Link to="/tutor/create-profile">
          <Button>Tạo hồ sơ gia sư</Button>
        </Link>
      </div>
      <div className="mt-4 flex justify-center">
        <Link
          to="/tutor/create-profile"
          className="text-xs text-slate-500 dark:text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowRight size={14} className="mr-1" /> Hướng dẫn tạo hồ sơ
        </Link>
      </div>
    </Card>
  );
}
