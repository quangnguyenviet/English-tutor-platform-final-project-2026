import { useOutletContext } from "react-router-dom";
import ManageLearningPath from "./ManageLearningPath";

export default function ManageLearningPathRoute() {
  const {
    student,
    classId,
    pathItems,
    setPathItems,
    exercisesList,
    setExercisesList,
    materialsList,
    setMaterialsList,
  } = useOutletContext();

  return (
    <ManageLearningPath
      student={student}
      classId={classId}
      pathItems={pathItems}
      setPathItems={setPathItems}
      exercisesList={exercisesList}
      setExercisesList={setExercisesList}
      materialsList={materialsList}
      setMaterialsList={setMaterialsList}
    />
  );
}