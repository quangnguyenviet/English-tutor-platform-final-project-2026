import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { getStudentById } from "../../data/mockData";

export default function StudentDetail() {
  const { studentId } = useParams();
  const student = getStudentById(studentId);

  const [pathItems, setPathItems] = useState(() => student?.learningPath ?? []);
  const [dailySessions, setDailySessions] = useState(() => student?.dailySessions ?? []);
  const [exercisesList, setExercisesList] = useState(() => student?.exercises ?? []);
  const [materialsList, setMaterialsList] = useState(() => student?.materials ?? []);

  useEffect(() => {
    setPathItems(student?.learningPath ?? []);
    setDailySessions(student?.dailySessions ?? []);
    setExercisesList(student?.exercises ?? []);
    setMaterialsList(student?.materials ?? []);
  }, [studentId]);

  if (!student) {
    return <p className="text-sm text-slate-500">Không tìm thấy học sinh.</p>;
  }

  return (
    <div>
      <Outlet
        context={{
          student,
          pathItems,
          setPathItems,
          dailySessions,
          setDailySessions,
          exercisesList,
          setExercisesList,
          materialsList,
          setMaterialsList,
        }}
      />
    </div>
  );
}