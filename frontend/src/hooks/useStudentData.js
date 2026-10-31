import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Tải dữ liệu cổng học sinh: `fetcher(token)` chạy lại khi `deps` đổi.
 * Trả { data, loading, error, reload }; reload không chớp skeleton nếu đã có dữ liệu.
 */
export function useStudentData(fetcher, deps = []) {
  const { token } = useAuth();
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(
    async (background) => {
      if (!token) return;
      if (!background) setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const data = await fetcher(token);
        setState({ data, loading: false, error: "" });
      } catch (err) {
        setState((prev) => ({
          data: background ? prev.data : null,
          loading: false,
          error: err.message || "Không tải được dữ liệu",
        }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, ...deps],
  );

  useEffect(() => {
    run(false);
  }, [run]);

  return { ...state, reload: () => run(true), retry: () => run(false) };
}
