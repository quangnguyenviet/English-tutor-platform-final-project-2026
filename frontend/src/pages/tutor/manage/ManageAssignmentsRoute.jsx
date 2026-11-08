import { useOutletContext } from "react-router-dom";
import ManageAssignments from "./ManageAssignments";

export default function ManageAssignmentsRoute() {
  const { token, classId, basePath } = useOutletContext();

  return (
    <ManageAssignments
      token={token}
      classId={classId}
      basePath={basePath}
    />
  );
}
