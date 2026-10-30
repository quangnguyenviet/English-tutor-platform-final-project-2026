import { useCallback, useEffect, useState } from "react";
import { TRACKED_STATUSES } from "../../lib/paymentModel";

/** Tải danh sách theo fetcher; tải lại khi deps đổi hoặc gọi reload(). */
export function usePaymentList(fetcher, deps) {
  const [state, setState] = useState({ items: [], totalItems: 0, loading: true, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetcher()
      .then((page) => {
        if (cancelled) return;
        setState({ items: page?.items || [], totalItems: page?.totalItems ?? 0, loading: false, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ items: [], totalItems: 0, loading: false, error: err.message || "Không tải được dữ liệu." });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Đếm số khoản theo từng trạng thái (mỗi trạng thái 1 lần gọi size=1). */
export function useStatusCounts(fetchByStatus, reloadKey) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const statuses = TRACKED_STATUSES;
    Promise.all(statuses.map((s) => fetchByStatus(s).then((p) => p?.totalItems ?? 0)))
      .then((totals) => {
        if (cancelled) return;
        setCounts(Object.fromEntries(statuses.map((s, i) => [s, totals[i]])));
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return counts;
}

/** Các khoản phí theo một trạng thái (mặc định 5 khoản mới nhất) kèm tổng số, cho dashboard. */
export function usePaymentsByStatus(fetchPage, status, size = 5) {
  const [state, setState] = useState({ items: [], total: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    fetchPage({ status, size })
      .then((page) => {
        if (!cancelled) setState({ items: page?.items || [], total: page?.totalItems ?? 0, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ items: [], total: 0, loading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, size]);

  return state;
}
