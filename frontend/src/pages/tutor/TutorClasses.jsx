import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  MapPin,
  Video,
  Wallet,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { apiGetMyClasses, mapClassSummary, CLASS_STATUS_META } from "../../lib/classroomApi";

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "TRIAL", label: "Đang dạy thử" },
  { id: "ACTIVE", label: "Đang hoạt động" },
  { id: "COMPLETED", label: "Đã kết thúc" },
  { id: "CANCELLED", label: "Đã hủy" },
];

function formatFee(value) {
  return value ? `${Number(value).toLocaleString("vi-VN")} ₫/buổi` : "Thỏa thuận";
}

function SkeletonCard() {
  return (
    <Card className="space-y-4 border-slate-200/80 p-5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
    </Card>
  );
}

export default function TutorClasses() {
  const { token } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const loadClasses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetMyClasses(token);
      setClasses((Array.isArray(result) ? result : []).map(mapClassSummary));
    } catch (err) {
      setError(err.message || "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filtered =
    activeTab === "all" ? classes : classes.filter((cls) => cls.status === activeTab);

  const countFor = (tab) =>
    tab === "all" ? classes.length : classes.filter((cls) => cls.status === tab).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cổng gia sư"
        title="Lớp học của tôi"
        description="Theo dõi các lớp học bạn đang phụ trách và thiết lập lịch dạy thử cho lớp mới nhận."
      />

      {/* Tabs lọc theo trạng thái lớp */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {tab.label}
            <span
              className={clsx(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
              )}
            >
              {countFor(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {loading && classes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <Card className="space-y-3 border-slate-200/80 py-12 text-center dark:border-slate-800">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadClasses}
            className="cursor-pointer text-xs font-semibold"
          >
            Thử lại
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="space-y-2 border-slate-200/80 py-12 text-center text-slate-400 dark:border-slate-800">
          <GraduationCap size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {activeTab === "all"
              ? "Bạn chưa có lớp học nào."
              : `Không có lớp nào ở trạng thái "${CLASS_STATUS_META[activeTab]?.label || activeTab}".`}
          </p>
          <p className="text-xs">
            Khi trung tâm ghép lớp cho bạn, lớp học sẽ xuất hiện tại đây.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cls) => (
            <Card
              key={cls.classId}
              className="flex flex-col justify-between space-y-4 border-slate-200/80 p-5 transition-all hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-800"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <Badge tone={cls.statusTone}>{cls.statusLabel}</Badge>
                  <Badge tone="slate">{cls.modeLabel || "Chưa rõ hình thức"}</Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50">
                    {cls.className}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Học viên: <strong>{cls.studentName || "Đang cập nhật"}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/60">
                  <div>
                    <span className="block text-[11px] text-slate-400">Học phí:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatFee(cls.pricePerSession)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Hình thức:</span>
                    <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                      {cls.teachingMode === "ONLINE" ? <Video size={12} /> : <MapPin size={12} />}
                      {cls.modeLabel}
                    </span>
                  </div>
                </div>

                {cls.trialSession ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-violet-200 bg-violet-50/80 p-3 text-xs dark:border-violet-900/60 dark:bg-violet-950/40">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                      <CalendarDays size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-violet-800 dark:text-violet-300">
                        [Học thử] {cls.trialSession.dateLabel} · {cls.trialSession.timeLabel}
                      </p>
                      <p className="text-[11px] text-violet-600 dark:text-violet-400">
                        {cls.trialSession.modeLabel}
                      </p>
                    </div>
                    <Badge tone={cls.trialSession.statusTone}>{cls.trialSession.statusLabel}</Badge>
                  </div>
                ) : cls.status === "TRIAL" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertCircle size={14} className="shrink-0" />
                    Chưa thiết lập lịch dạy thử. Vào chi tiết lớp để lên lịch buổi học thử.
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                  to={`/tutor/classes/${cls.classId}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Xem chi tiết lớp
                  <ChevronRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Wallet, label: "Học phí mỗi buổi", value: "Thỏa thuận khi trung tâm ghép lớp" },
          { icon: CalendarDays, label: "Lịch dạy thử", value: "Thiết lập 1 buổi duy nhất cho lớp TRIAL" },
          { icon: MapPin, label: "Hình thức học", value: "Online kèm phòng học hoặc tại nhà học sinh" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <item.icon size={15} />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
