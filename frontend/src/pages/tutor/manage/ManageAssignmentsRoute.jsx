import { useOutletContext } from "react-router-dom";
import ManageAssignments from "./ManageAssignments";

export default function ManageAssignmentsRoute() {
  const { classId, pathItems, exercisesList, setExercisesList } = useOutletContext();

  return (
    <ManageAssignments
      classId={classId}
      exercisesList={exercisesList}
      setExercisesList={setExercisesList}
      pathItems={pathItems}
    />
  );
}