import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetMyClassDetail } from "../../lib/studentApi";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

export default function StudentClassWorkspace() {
  const { classId } = useParams();
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await apiGetMyClassDetail(token, classId));
    } catch (err) {
      setError(err.message || "Không thể tải thông tin lớp học.");
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading && !detail) {
    return (
      <Card className="space-y-4 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          ))}
        </div>
      </Card>
    );
  }

  if (error && !detail) {
    return (
      <Card className="space-y-3 py-12 text-center">
        <AlertCircle size={32} className="mx-auto text-rose-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{error}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDetail}>Thử lại</Button>
          <Button as={Link} to="/student/classes" size="sm">Về danh sách lớp</Button>
        </div>
      </Card>
    );
  }

  return (
    <Outlet
      context={{
        token,
        classId,
        detail,
        basePath: `/student/classes/${classId}`,
        reloadDetail: loadDetail,
      }}
    />
  );
}
