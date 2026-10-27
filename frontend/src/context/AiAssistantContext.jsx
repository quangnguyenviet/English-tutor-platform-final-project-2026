import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AiAssistantContext = createContext(null);

// Global right-sidebar AI assistant: open/close state lives here (toggled from
// the topbar), while the currently-viewed page (e.g. the class workspace) registers
// which student it's drafting for, since the assistant is scoped per-student.
export function AiAssistantProvider({ children }) {
  const [open, setOpen] = useState(true);
  const [target, setTarget] = useState(null);

  const registerTarget = useCallback((t) => setTarget(t), []);
  const clearTarget = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ open, setOpen, target, registerTarget, clearTarget }),
    [open, target, registerTarget, clearTarget]
  );

  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>;
}

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) throw new Error("useAiAssistant must be used within AiAssistantProvider");
  return ctx;
}
