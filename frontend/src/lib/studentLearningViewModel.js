const STATUS_ORDER = {
  assigned: 0,
  submitted: 1,
  graded: 2,
};

function dueTime(exercise) {
  if (!exercise?.dueDate) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(exercise.dueDate);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function filterAndSortExercises(
  exercises = [],
  tutorId = "all",
  status = "all",
  skill = "all",
  difficulty = "all"
) {
  return [...(exercises || [])]
    .filter((exercise) => tutorId === "all" || exercise.tutorId === tutorId)
    .filter((exercise) => status === "all" || exercise.status === status)
    .filter((exercise) => skill === "all" || exercise.skill === skill)
    .filter((exercise) => difficulty === "all" || exercise.difficulty === difficulty)
    .sort((left, right) => {
      const statusDifference =
        (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99);

      if (statusDifference !== 0) return statusDifference;
      if (left.status === "assigned") return dueTime(left) - dueTime(right);

      return 0;
    });
}

export function getExerciseSummary(exercises = []) {
  const safeExercises = exercises || [];
  const assigned = safeExercises.filter((exercise) => exercise.status === "assigned");
  const submitted = safeExercises.filter((exercise) => exercise.status === "submitted");
  const graded = safeExercises.filter((exercise) => exercise.status === "graded");

  return {
    total: safeExercises.length,
    assigned: assigned.length,
    submitted: submitted.length,
    graded: graded.length,
    priorityExercise: filterAndSortExercises(assigned)[0] || null,
  };
}

export function getProgressSummary(student) {
  const safeStudent = student || {};
  const gradedExercises = (safeStudent.exercises || []).filter(
    (exercise) => exercise.status === "graded"
  );
  const normalizedScores = gradedExercises
    .filter((exercise) => Number(exercise.maxScore) > 0)
    .map((exercise) => (Number(exercise.score) / Number(exercise.maxScore)) * 100);
  const averageScore = normalizedScores.length
    ? Math.round(
        normalizedScores.reduce((total, score) => total + score, 0) /
          normalizedScores.length
      )
    : 0;
  const profile = safeStudent.studentKnowledgeProfile || {};

  return {
    gradedExercises,
    averageScore,
    overallElo: profile.overallElo || 0,
    focusSkill: profile.weaknesses?.[0] || null,
    strongestSkill: profile.strengths?.[0] || null,
    onTimeSubmissionRate: safeStudent.effortMetrics?.onTimeSubmissionRate || 0,
    currentStreak: safeStudent.effortMetrics?.currentStreak || 0,
  };
}
