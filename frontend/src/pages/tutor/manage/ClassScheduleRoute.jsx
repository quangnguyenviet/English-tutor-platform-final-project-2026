import { useOutletContext } from "react-router-dom";
import ClassSchedulePage from "./ClassSchedulePage";

/**
 * Wrapper route tab "Lịch dạy" (kế hoạch class-sessions Phase 2).
 * Lấy detail / classId / onCreateSession từ Outlet context của
 * TutorClassWorkspace rồi truyền cho page; page tự fetch occurrences,
 * danh sách buổi học và chi tiết bằng lib API.
 */
export default function ClassScheduleRoute() {
  const {
    detail,
    classId,
    onCreateSession,
    creatingSessionDate,
    createError,
    createErrorDate,
    openScheduleForm,
  } = useOutletContext();

  return (
    <ClassSchedulePage
      detail={detail}
      classId={classId}
      onCreateSession={onCreateSession}
      creatingSessionDate={creatingSessionDate}
      createError={createError}
      createErrorDate={createErrorDate}
      onEditSchedules={() => openScheduleForm(detail?.schedules)}
    />
  );
}
