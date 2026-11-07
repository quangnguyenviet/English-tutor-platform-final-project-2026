import { useOutletContext } from "react-router-dom";
import ClassSchedulePage from "./ClassSchedulePage";

/**
 * Wrapper route tab "Lịch dạy" (V16: lattice ca dạy + nhật ký dạy học).
 * Lấy detail / classId / openScheduleForm từ Outlet context của
 * TutorClassWorkspace rồi truyền cho page; page tự fetch occurrences,
 * nhật ký dạy học và ngoại lệ bằng lib API.
 */
export default function ClassScheduleRoute() {
  const { detail, classId, openScheduleForm } = useOutletContext();

  return (
    <ClassSchedulePage
      detail={detail}
      classId={classId}
      onEditSchedules={() => openScheduleForm(detail?.schedules)}
    />
  );
}
