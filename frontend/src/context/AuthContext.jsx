import { createContext, useContext, useEffect, useState } from "react";
import { tutors, tutor, students, matchRequests, paymentProofs, receptionists, receptionist as receptionistData, complaints as complaintsData, studentNotifications as studentNotificationsData } from "../data/mockData";
import { apiLogin, apiChangePassword, apiLogout, apiIntrospect, apiRegisterTutor } from "../lib/authApi";
import { decodeJwt, scopeToRole, isTokenExpired } from "../lib/jwtDecode";

const AuthContext = createContext(null);
const STORAGE_KEY = "gsa_session";
const TOKEN_KEY = "gsa_token";
const ADMIN_ACCOUNT = { name: "Quản trị hệ thống", initials: "QT", email: "admin@englishpath.vn" };
const RECEPTIONIST_ACCOUNT = { name: receptionistData.name, initials: receptionistData.initials, email: receptionistData.email };

// Mock notification data for admin
const initialNotifications = [
  {
    id: "notif-1",
    type: "payment",
    title: "Gia sư Nguyễn Lan Anh đã nộp minh chứng thanh toán",
    message: "Gia sư đã chuyển khoản phí kết nối 450.000₫ qua VietinBank. Vui lòng kiểm tra và duyệt.",
    from: "Nguyễn Lan Anh",
    fromRole: "tutor",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 phút trước
  },
  {
    id: "notif-2",
    type: "match",
    title: "Yêu cầu ghép lớp mới từ phụ huynh Trần Văn Minh",
    message: "Phụ huynh đăng ký lớp cho con – Nguyễn Minh Khôi, lớp 8, mục tiêu IELTS 5.5.",
    from: "Trần Văn Minh",
    fromRole: "parent",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 phút trước
  },
  {
    id: "notif-3",
    type: "tutor_registration",
    title: "Gia sư mới đăng ký hồ sơ: Phạm Thị Hương",
    message: "Gia sư chuyên IELTS Speaking & Writing, 3 năm kinh nghiệm. Hồ sơ đang chờ duyệt.",
    from: "Phạm Thị Hương",
    fromRole: "tutor",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
  },
  {
    id: "notif-4",
    type: "system",
    title: "Gia sư Trần Đức Huy đã chấp nhận lời đề nghị nhận lớp",
    message: "Gia sư đồng ý nhận lớp học sinh Lê Hoàng Nam (B1). Đang chờ thanh toán phí kết nối.",
    from: "Hệ thống",
    fromRole: "system",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 giờ trước
  },
  {
    id: "notif-5",
    type: "tutor_registration",
    title: "Gia sư Lê Minh Tuấn đăng ký hồ sơ mới",
    message: "Gia sư chuyên Giao tiếp cơ bản và Phát âm chuẩn. Hồ sơ chờ duyệt.",
    from: "Lê Minh Tuấn",
    fromRole: "tutor",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 ngày trước
  },
  {
    id: "notif-6",
    type: "payment",
    title: "Gia sư Vũ Thị Mai yêu cầu gửi lại minh chứng",
    message: "Gia sư đã nộp lại ảnh biên lai chuyển khoản sau khi bị yêu cầu gửi lại lần trước.",
    from: "Vũ Thị Mai",
    fromRole: "tutor",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 ngày trước
  },
  {
    id: "notif-7",
    type: "match",
    title: "Phụ huynh Nguyễn Hải Yến hủy yêu cầu ghép lớp",
    message: "Phụ huynh đã liên hệ hủy yêu cầu ghép lớp cho con Nguyễn Minh Anh do thay đổi kế hoạch.",
    from: "Nguyễn Hải Yến",
    fromRole: "parent",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 ngày trước
  },
];

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  // true khi đang kiểm tra token lúc khởi động app
  const [authLoading, setAuthLoading] = useState(true);

  // State quản lý danh sách gia sư & học sinh — dùng cho module admin
  const [tutorList, setTutorList] = useState(() => [...tutors]);
  const [studentList, setStudentList] = useState(() => [...students]);
  // State quản lý match requests & thanh toán QR proof
  const [matchRequestList, setMatchRequestList] = useState(() => [...matchRequests]);
  const [paymentProofList, setPaymentProofList] = useState(() => [...paymentProofs]);
  // Receptionist state
  const [receptionistList, setReceptionistList] = useState(() => [...receptionists]);
  // Complaint state
  const [complaintList, setComplaintList] = useState(() => [...complaintsData]);
  // Notification state for admin
  const [notificationList, setNotificationList] = useState(() => [...initialNotifications]);
  // Thông báo dành riêng cho học sinh (UC-ST-17), tách khỏi luồng thông báo vận hành.
  const [studentNotificationList, setStudentNotificationList] = useState(() => [
    ...studentNotificationsData,
  ]);

  // Khôi phục session từ localStorage khi app khởi động
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedSession = localStorage.getItem(STORAGE_KEY);

      if (!savedToken || !savedSession) {
        setAuthLoading(false);
        return;
      }

      // Kiểm tra token hết hạn phía client trước (nhanh, không tốn network)
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setAuthLoading(false);
        return;
      }

      // Introspect với server để xác nhận token chưa bị blacklist
      const valid = await apiIntrospect(savedToken);
      if (valid) {
        try {
          setSession(JSON.parse(savedSession));
          setToken(savedToken);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }

      setAuthLoading(false);
    }

    restoreSession();
  }, []);

  /**
   * Đăng nhập thực với backend — gọi POST /api/v1/auth/token.
   * Decode JWT, map role, lưu token & session vào localStorage.
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ role: string, profileStatus: string | null }>} role slug và trạng thái hồ sơ gia sư để LoginPage điều hướng
   * @throws {Error} khi credentials sai hoặc role không hỗ trợ
   */
  async function login(username, password) {
    const { token: jwt, profileStatus, mustChangePassword } = await apiLogin(username, password);
    const payload = decodeJwt(jwt);
    const role = scopeToRole(payload?.scope);

    if (!role) {
      throw new Error(`Role không được hỗ trợ: ${payload?.scope ?? "unknown"}`);
    }

    const initials = (payload.sub ?? username)
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newSession = {
      role,
      username: payload.sub,
      name: payload.sub,
      initials,
      exp: payload.exp,
      userId: payload.uid ?? null,
      mustChangePassword: mustChangePassword === true,
    };

    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setToken(jwt);
    setSession(newSession);

    return { role, profileStatus: profileStatus ?? null, mustChangePassword: newSession.mustChangePassword };
  }

  /** Đổi mật khẩu rồi gỡ cờ bắt buộc đổi khỏi session. */
  async function changePassword(oldPassword, newPassword) {
    await apiChangePassword(token, { oldPassword, newPassword });
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, mustChangePassword: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  /**
   * Đăng ký tài khoản gia sư mới — gọi POST /api/v1/auth/register-tutor.
   * Backend tạo user role=TUTOR + tutor record với profile_status=INCOMPLETE,
   * trả JWT để frontend tự động login.
   *
   * @param {string} fullName
   * @param {string} email
   * @param {string} password
   * @returns {Promise<string>} role slug ("tutor") để navigate
   * @throws {Error} khi email đã tồn tại hoặc validation error
   */
  async function registerAsTutor(fullName, email, password) {
    const result = await apiRegisterTutor(fullName, email, password);
    const { token: jwt } = result;

    const payload = decodeJwt(jwt);
    const role = "tutor"; // Luôn là tutor vì đây là endpoint đăng ký gia sư

    const initials = (payload.sub ?? fullName)
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newSession = {
      role,
      username: result.username,
      name: result.fullName,
      initials,
      exp: payload.exp,
      userId: payload.uid ?? null,
    };

    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setToken(jwt);
    setSession(newSession);

    // Xóa pending register localStorage nếu có (phòng khi user refresh trang)
    localStorage.removeItem("gsa_pending_tutor_register");

    return role;
  }

  /**
   * Đăng xuất — blacklist token trên server rồi xóa local session.
   */
  async function logout() {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      await apiLogout(currentToken);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setSession(null);
  }

  // Giữ lại các hàm mock login bên dưới phòng trường hợp các phần khác của app cần dùng
  function loginAsAdmin() {
    setSession({ role: "admin", name: ADMIN_ACCOUNT.name, initials: ADMIN_ACCOUNT.initials, email: ADMIN_ACCOUNT.email });
  }

  function loginAsTutor() {
    setSession({ role: "tutor", tutorId: tutor.id, name: tutor.name, initials: tutor.initials });
  }

  function loginAsReceptionist() {
    setSession({ role: "receptionist", name: RECEPTIONIST_ACCOUNT.name, initials: RECEPTIONIST_ACCOUNT.initials, email: RECEPTIONIST_ACCOUNT.email });
  }

  function loginAsStudent(studentId) {
    const s = students.find((x) => x.id === studentId) || { id: "s1", name: "Nguyễn Minh Anh", initials: "MA" };
    setSession({ role: "student", studentId: s.id, name: s.name, initials: s.initials });
  }

  function loginAsParent(studentId = "s1") {
    const student = students.find((item) => item.id === studentId) || students[0];
    const name = student?.parentName || "Phụ huynh học sinh";
    const initials = name
      .replace(/^(Anh|Chị|Bác)\s+/i, "")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    setSession({ role: "parent", studentId: student.id, name, initials });
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

  // Cancel a match offer — sets request to "cancelled" with timestamp AND removes linked payment proof
  function cancelMatchOffer(requestId) {
    const request = matchRequestList.find((r) => r.id === requestId);
    setMatchRequestList((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "cancelled", cancelledAt: new Date().toISOString() }
          : r
      )
    );
    // Remove linked payment proof if exists
    if (request?.matchedTutorId) {
      setPaymentProofList((prev) =>
        prev.filter((p) => !(p.matchRequestId === requestId))
      );
    }
  }

  // Publish match request to tutor board (Path 1: open_match → published)
  function publishMatchRequest(requestId) {
    setMatchRequestList((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "published",
              publishedAt: new Date().toISOString(),
              appliedTutors: r.appliedTutors || [],
            }
          : r
      )
    );
  }

  // Select a tutor from the applied list (published → offered)
  function selectTutorFromPublished(requestId, tutorId, tutorName, fee) {
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

  // Send direct offer for Path 2 (direct_match: pending → offered)
  function sendDirectOffer(requestId, tutorId, tutorName, fee) {
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
    const payment = paymentProofList.find((p) => p.id === paymentId);
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
    // Auto-update linked match request to "matched"
    if (payment?.matchRequestId) {
      setMatchRequestList((prev) =>
        prev.map((r) =>
          r.id === payment.matchRequestId
            ? { ...r, status: "matched", matchedAt: new Date().toISOString() }
            : r
        )
      );
    }
    // Auto-update linked student approval status
    setStudentList((prev) =>
      prev.map((s) => {
        const isTarget =
          (payment?.studentId && s.id === payment.studentId) ||
          (payment?.studentName && s.name.toLowerCase() === payment.studentName.toLowerCase());
        if (isTarget) {
          return {
            ...s,
            approvalStatus: s.approvalStatus === "account_created" ? "account_created" : "approved",
            assignedTutorId: payment?.tutorId || s.assignedTutorId,
          };
        }
        return s;
      })
    );
  }

  // Request resubmit proof (replaces reject) — keeps item in "pending-like" state
  function requestResubmitProof(paymentId, reason) {
    setPaymentProofList((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "resubmit_requested",
              reviewedAt: new Date().toISOString(),
              reviewedBy: session?.name || "Quản trị viên",
              resubmitReason: reason || "Ảnh biên lai mờ hoặc thông tin chuyển khoản không khớp.",
            }
          : p
      )
    );
  }

  // Legacy reject - kept for backward compatibility but redirects to resubmit
  function rejectPaymentProof(paymentId, reason) {
    requestResubmitProof(paymentId, reason);
  }

  // Receptionist CRUD helpers (FR-31)
  function addReceptionist(newReceptionist) {
    const id = `r-${Date.now()}`;
    const initials = newReceptionist.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    setReceptionistList((prev) => [{ ...newReceptionist, id, initials, complaintsHandled: 0 }, ...prev]);
  }

  function updateReceptionist(id, patch) {
    setReceptionistList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeReceptionist(id) {
    setReceptionistList((prev) => prev.filter((r) => r.id !== id));
  }

  // Complaint helpers (FR-32, FR-37)
  function addComplaint(newComplaint) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(complaintList.length + 1).padStart(3, "0");
    const id = `KN-${dateStr}-${seq}`;
    setComplaintList((prev) => [
      {
        ...newComplaint,
        id,
        createdAt: now.toISOString(),
        status: "pending",
        statusLabel: "Chưa xử lí",
        resolution: null,
        resolvedAt: null,
      },
      ...prev,
    ]);
  }

  function updateComplaint(id, patch) {
    setComplaintList((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function resolveComplaint(id, resolution) {
    setComplaintList((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "resolved",
              statusLabel: "Đã xử lí",
              resolution,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }

  // Notification helpers
  function markNotificationRead(id) {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllNotificationsRead() {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markStudentNotificationRead(id) {
    setStudentNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllStudentNotificationsRead() {
    setStudentNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        token,
        authLoading,
        login,
        changePassword,
        logout,
        registerAsTutor,
        loginAsAdmin,
        loginAsTutor,
        loginAsReceptionist,
        loginAsStudent,
        loginAsParent,
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
        cancelMatchOffer,
        publishMatchRequest,
        selectTutorFromPublished,
        sendDirectOffer,
        paymentProofList,
        setPaymentProofList,
        approvePaymentProof,
        rejectPaymentProof,
        requestResubmitProof,
        receptionistList,
        setReceptionistList,
        addReceptionist,
        updateReceptionist,
        removeReceptionist,
        complaintList,
        setComplaintList,
        addComplaint,
        updateComplaint,
        resolveComplaint,
        notificationList,
        setNotificationList,
        markNotificationRead,
        markAllNotificationsRead,
        studentNotificationList,
        setStudentNotificationList,
        markStudentNotificationRead,
        markAllStudentNotificationsRead,
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
