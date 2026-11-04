import { useOutletContext } from "react-router-dom";
import QuizAuthoring from "./QuizAuthoring";

/**
 * Route wrapper cho màn soạn / sửa quiz của BÀI GIẢNG (FR-13, V16). Truyền
 * outlet context (token, classId, basePath, detail) vào QuizAuthoring. Quiz mới
 * theo đường dẫn `/lessons/quiz/:lessonId`; sửa theo `?quizId=`. classId dùng
 * cho drawer hồ sơ kỹ năng (skill-profile).
 */
export default function QuizAuthoringRoute() {
  const { token, classId, basePath, detail } = useOutletContext();

  return (
    <QuizAuthoring
      token={token}
      classId={classId}
      basePath={basePath}
      detail={detail}
    />
  );
}
