import { createContext, useContext, useEffect, useState } from "react";
import { tutors, tutor, students, matchRequests, paymentProofs } from "../data/mockData";

const AuthContext = createContext(null);
const STORAGE_KEY = "gsa_session";
const ADMIN_ACCOUNT = { name: "Quản trị hệ thống", initials: "QT", email: "admin@englishpath.vn" };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // State quản lý danh sách gia sư & học sinh — dùng cho module admin
  const [tutorList, setTutorList] = useState(() => [...tutors]);
  const [studentList, setStudentList] = useState(() => [...students]);
  // State quản lý match requests & thanh toán QR proof
  const [matchRequestList, setMatchRequestList] = useState(() => [...matchRequests]);
  const [paymentProofList, setPaymentProofList] = useState(() => [...paymentProofs]);

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  function loginAsAdmin() {
    setSession({ role: "admin", name: ADMIN_ACCOUNT.name, initials: ADMIN_ACCOUNT.initials, email: ADMIN_ACCOUNT.email });
  }

  function loginAsTutor() {
    setSession({ role: "tutor", name: tutor.name, initials: tutor.initials });
  }

  function loginAsStudent(studentId) {
    const s = students.find((x) => x.id === studentId) || { id: "s1", name: "Nguyễn Minh Anh", initials: "MA" };
    setSession({ role: "student", studentId: s.id, name: s.name, initials: s.initials });
  }

  function logout() {
    setSession(null);
  }

  // Admin CRUD helpers for tutors
  function addTutor(newTutor) {
    const id = `t-${Date.now()}`;
    setTutorList((prev) => [{ ...newTutor, id }, ...prev]);
  }

  function updateTutor(id, patch) {
    setTutorList((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTutor(id) {
    setTutorList((prev) => prev.filter((t) => t.id !== id));
  }

  // Admin CRUD helpers for students
  function addStudent(newStudent) {
    const id = `s-${Date.now()}`;
    const initials = newStudent.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    setStudentList((prev) => [
      { ...newStudent, id, initials, overallProgress: 0, learningPath: [], exercises: [], progressHistory: [], materials: [] },
      ...prev,
    ]);
  }

  function updateStudent(id, patch) {
    setStudentList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStudent(id) {
    setStudentList((prev) => prev.filter((s) => s.id !== id));
  }

  // Admin Match Request helpers (FR-16)
  function updateMatchRequest(id, patch) {
    setMatchRequestList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function createMatchOffer(requestId, tutorId, tutorName, fee) {
    setMatchRequestList((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "offered",
              matchedTutorId: tutorId,
              matchedTutorName: tutorName,
              offeredAt: new Date().toISOString(),
              matchOfferFee: fee,
            }
          : r
      )
    );
  }

  // Admin Payment / QR Proof helpers (FR-23)
  function approvePaymentProof(paymentId) {
    setPaymentProofList((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "approved",
              parentContactLocked: false,
              reviewedAt: new Date().toISOString(),
              reviewedBy: session?.name || "Quản trị viên",
              rejectReason: null,
            }
          : p
      )
    );
  }

  function rejectPaymentProof(paymentId, reason) {
    setPaymentProofList((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "rejected",
              reviewedAt: new Date().toISOString(),
              reviewedBy: session?.name || "Quản trị viên",
              rejectReason: reason || "Thông tin chuyển khoản không trùng khớp hoặc ảnh mờ.",
            }
          : p
      )
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loginAsAdmin,
        loginAsTutor,
        loginAsStudent,
        logout,
        tutorList,
        setTutorList,
        addTutor,
        updateTutor,
        removeTutor,
        studentList,
        setStudentList,
        addStudent,
        updateStudent,
        removeStudent,
        matchRequestList,
        setMatchRequestList,
        updateMatchRequest,
        createMatchOffer,
        paymentProofList,
        setPaymentProofList,
        approvePaymentProof,
        rejectPaymentProof,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
