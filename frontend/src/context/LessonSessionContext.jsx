import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  createInitialLessonSessions,
  hydrateLessonSessions,
  LESSON_SESSION_STORAGE_KEY,
  updateLessonSession,
} from "../lib/lessonSessionModel.js";

const LessonSessionContext = createContext(null);

function loadSessions(fallback = createInitialLessonSessions(), resetWhenMissing = false) {
  try {
    const stored = localStorage.getItem(LESSON_SESSION_STORAGE_KEY);
    if (!stored) return resetWhenMissing ? createInitialLessonSessions() : fallback;
    return hydrateLessonSessions(createInitialLessonSessions(), JSON.parse(stored));
  } catch {
    return fallback;
  }
}

function persistSessions(sessions) {
  try {
    localStorage.setItem(LESSON_SESSION_STORAGE_KEY, JSON.stringify({ version: 1, sessions }));
  } catch {
    // The prototype still works in private browsing or when storage is full.
  }
}

export function LessonSessionProvider({ children }) {
  const [sessions, setSessions] = useState(loadSessions);
  const currentSessions = useRef(sessions);

  useEffect(() => {
    const syncFromStorage = (event) => {
      if (event.key !== LESSON_SESSION_STORAGE_KEY) return;
      const latest = loadSessions(currentSessions.current, true);
      currentSessions.current = latest;
      setSessions(latest);
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const apply = useCallback((id, type, payload) => {
    // A different tab may have written after the last storage event; merge from
    // the current persisted snapshot before applying this action.
    const latest = loadSessions(currentSessions.current);
    const next = updateLessonSession(latest, id, type, payload);
    if (next === latest) {
      if (latest !== currentSessions.current) {
        currentSessions.current = latest;
        setSessions(latest);
      }
      return false;
    }
    currentSessions.current = next;
    persistSessions(next);
    setSessions(next);
    return true;
  }, []);

  const savePlan = useCallback((id, plan) => apply(id, "savePlan", plan), [apply]);
  const startSession = useCallback((id) => apply(id, "startSession"), [apply]);
  const endSession = useCallback((id) => apply(id, "endSession"), [apply]);
  const completeSession = useCallback((id, report) => apply(id, "completeSession", report), [apply]);
  const markException = useCallback(
    (id, status, reason) => apply(id, "markException", { status, reason }),
    [apply]
  );
  const addStudentQuestion = useCallback(
    (id, text) => apply(id, "addStudentQuestion", { text }),
    [apply]
  );
  const addTutorReply = useCallback(
    (id, questionId, text) => apply(id, "addTutorReply", { questionId, text }),
    [apply]
  );
  const requestReschedule = useCallback(
    (id, reason, proposedSlots) =>
      apply(id, "requestReschedule", { reason, proposedSlots }),
    [apply]
  );
  const confirmReschedule = useCallback(
    (id, schedule) => apply(id, "confirmReschedule", schedule),
    [apply]
  );

  return (
    <LessonSessionContext.Provider
      value={{
        sessions,
        savePlan,
        startSession,
        endSession,
        completeSession,
        markException,
        addStudentQuestion,
        addTutorReply,
        requestReschedule,
        confirmReschedule,
      }}
    >
      {children}
    </LessonSessionContext.Provider>
  );
}

export function useLessonSessions() {
  const context = useContext(LessonSessionContext);
  if (!context) throw new Error("useLessonSessions must be used within LessonSessionProvider");
  return context;
}
