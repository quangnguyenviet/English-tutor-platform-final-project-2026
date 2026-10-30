import { useOutletContext } from "react-router-dom";
import ManageSessions from "./ManageSessions";

/**
 * Route wrapper: truyền outlet context (token, classId, basePath, detail +
 * CTA tạo buổi học từ tab "Lịch dạy") vào ManageSessions (UC-T05 bước 4).
 * Dữ liệu buổi học & tài liệu lấy từ API thật — không dùng mock.
 */
export default function ManageSessionsRoute() {
  const {
    token,
    classId,
    basePath,
    detail,
    onCreateSession,
    creatingSessionDate,
    createError,
    createErrorDate,
  } = useOutletContext();

  return (
    <ManageSessions
      token={token}
      classId={classId}
      basePath={basePath}
      classDetail={detail}
      onCreateSession={onCreateSession}
      creatingSessionDate={creatingSessionDate}
      createError={createError}
      createErrorDate={createErrorDate}
    />
  );
}
