import { useEffect, useState } from "react";
import { apiGetComplaintCounts, apiGetComplaints } from "../../lib/complaintApi";

/**
 * Số khiếu nại theo trạng thái và vài đơn mới nhất, dùng cho Dashboard Lễ tân và Admin.
 * Lỗi mạng không chặn Dashboard: giữ giá trị 0 và danh sách rỗng.
 */
export function useComplaintSummary(recentSize = 3) {
  const [counts, setCounts] = useState({ PENDING: 0, PROCESSING: 0, RESOLVED: 0, CANCELLED: 0, TOTAL: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([apiGetComplaintCounts(), apiGetComplaints({ size: recentSize })]).then(([c, r]) => {
      if (!alive) return;
      if (c.status === "fulfilled" && c.value) setCounts(c.value);
      if (r.status === "fulfilled") setRecent(r.value?.items || []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [recentSize]);

  return { counts, recent, loading };
}
