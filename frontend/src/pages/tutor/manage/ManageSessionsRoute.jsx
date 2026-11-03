import { useOutletContext } from "react-router-dom";
import ManageSessions from "./ManageSessions";

/**
 * Route wrapper tab "Bài giảng" (V16): truyền outlet context
 * (token, classId, basePath, detail) vào ManageSessions. Bài giảng, tài
 * liệu và quiz lấy từ API thật — không dùng mock.
 */
export default function ManageSessionsRoute() {
  const { token, classId, basePath, detail } = useOutletContext();

  return (
    <ManageSessions
      token={token}
      classId={classId}
      basePath={basePath}
      classDetail={detail}
    />
  );
}
