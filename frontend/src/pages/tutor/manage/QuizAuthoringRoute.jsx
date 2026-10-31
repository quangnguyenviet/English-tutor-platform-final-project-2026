import { useOutletContext } from "react-router-dom";
import QuizAuthoring from "./QuizAuthoring";

/**
 * Route wrapper cho màn soạn / sửa quiz của buổi học (FR-13). Truyền outlet
 * context (token, classId, basePath, detail) vào QuizAuthoring. Quiz mới theo
 * đường dẫn `/sessions/quiz/:sessionId`; sửa theo `?quizId=`.
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
