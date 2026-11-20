import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TutorCard from "../../components/guest/TutorCard";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { apiGetPublicTutors } from "../../lib/tutorApi";
import { mapPublicTutor } from "../../lib/publicTutorMapper";

const PREVIEW_COUNT = 6;

/** Khám phá gia sư trong khu vực phụ huynh: chỉ hiện một vài gia sư, xem đầy đủ ở trang danh sách. */
export default function ParentTutorExplore() {
  const [tutors, setTutors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiGetPublicTutors({ page: 0, size: PREVIEW_COUNT })
      .then((result) => {
        if (!mounted) return;
        setTutors(result.items.map(mapPublicTutor));
        setTotal(result.totalItems);
      })
      .catch((e) => mounted && setError(e.message || "Không thể tải danh sách gia sư."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Khám phá"
        title="Gia sư nổi bật"
        description="Một vài gia sư để bạn bắt đầu. Xem tất cả để lọc theo khu vực, hình thức học và môn."
        actions={<Link to="/tutors"><Button className="cursor-pointer">Xem tất cả gia sư <ArrowRight size={16} /></Button></Link>}
      />
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor, i) => <TutorCard key={tutor.id} tutor={tutor} index={i} />)}
        </div>
      )}
      {!loading && total > tutors.length && (
        <div className="text-center">
          <Link to="/tutors"><Button variant="outline" className="cursor-pointer">Xem tất cả {total} gia sư <ArrowRight size={16} /></Button></Link>
        </div>
      )}
    </div>
  );
}
