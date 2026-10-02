import { useOutletContext } from "react-router-dom";
import ManageSessions from "./ManageSessions";

export default function ManageSessionsRoute() {
  const { student, dailySessions, setDailySessions, exercisesList } = useOutletContext();

  return (
    <ManageSessions
      student={student}
      dailySessions={dailySessions}
      setDailySessions={setDailySessions}
      exercisesList={exercisesList}
    />
  );
}
