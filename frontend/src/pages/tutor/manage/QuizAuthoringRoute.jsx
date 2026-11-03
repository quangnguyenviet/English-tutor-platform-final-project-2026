import { useOutletContext } from "react-router-dom";
import QuizAuthoring from "./QuizAuthoring";

/**
 * Route wrapper cho màn soạn / sửa quiz của BÀI GIẢNG (FR-13, V16). Truyền
 * outlet context (token, basePath, detail) vào QuizAuthoring. Quiz mới theo
 * đường dẫn `/lessons/quiz/:lessonId`; sửa theo `?quizId=`.
 */
export default function QuizAuthoringRoute() {
  const { token, basePath, detail } = useOutletContext();

  return (
    <QuizAuthoring
      token={token}
      basePath={basePath}
      detail={detail}
    />
  );
}
