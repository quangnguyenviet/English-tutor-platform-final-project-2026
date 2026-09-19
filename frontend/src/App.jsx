import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TutorManagement from "./pages/admin/TutorManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import MatchRequests from "./pages/admin/MatchRequests";
import PaymentApproval from "./pages/admin/PaymentApproval";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminNotifications from "./pages/admin/AdminNotifications";
import ReceptionistManagement from "./pages/admin/ReceptionistManagement";
import ComplaintManagement from "./pages/admin/ComplaintManagement";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import StudentsList from "./pages/tutor/StudentsList";
import StudentDetail from "./pages/tutor/StudentDetail";
import ManageOverview from "./pages/tutor/manage/ManageOverview";
import ManageLearningPathRoute from "./pages/tutor/manage/ManageLearningPathRoute";
import ManageAssignmentsRoute from "./pages/tutor/manage/ManageAssignmentsRoute";
import AddAssignmentPage from "./pages/tutor/manage/AddAssignmentPage";
import ManageMaterialsRoute from "./pages/tutor/manage/ManageMaterialsRoute";
import TutorExerciseDetail from "./pages/tutor/TutorExerciseDetail";
import ExerciseGenerator from "./pages/tutor/ExerciseGenerator";
import ClassRequests from "./pages/tutor/ClassRequests";
import LibraryPaths from "./pages/tutor/LibraryPaths";
import LibraryPathDetail from "./pages/tutor/LibraryPathDetail";
import LibraryExercises from "./pages/tutor/LibraryExercises";
import LibraryMaterials from "./pages/tutor/LibraryMaterials";
import TutorProfile from "./pages/tutor/TutorProfile";
import TutorSchedule from "./pages/tutor/TutorSchedule";

import StudentMarketplace from "./pages/student/StudentMarketplace";
import StudentOnboarding from "./pages/student/StudentOnboarding";
import StudentChat from "./pages/student/StudentChat";
import StudentExercises from "./pages/student/StudentExercises";
import ExerciseTaking from "./pages/student/ExerciseTaking";
import StudentProgress from "./pages/student/StudentProgress";
import StudentMaterials from "./pages/student/StudentMaterials";
import SettingsPage from "./pages/SettingsPage";

import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import ReceptionistMatchRequests from "./pages/receptionist/ReceptionistMatchRequests";
import ReceptionistPaymentApproval from "./pages/receptionist/ReceptionistPaymentApproval";
import ReceptionistTutorList from "./pages/receptionist/ReceptionistTutorList";
import ReceptionistStudentList from "./pages/receptionist/ReceptionistStudentList";
import ReceptionistNotifications from "./pages/receptionist/ReceptionistNotifications";
import ReceptionistComplaints from "./pages/receptionist/ReceptionistComplaints";

function RequireRole({ role, children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={`/${session.role}`} replace />;
  return children;
}

function StudentDetailDefaultTab() {
  const { studentId } = useParams();
  return <Navigate to={`/tutor/students/${studentId}/path`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Landing Page cho Phụ huynh (Khách xem không cần đăng nhập) */}
          <Route path="/" element={<LandingPage />} />

          {/* Student Dashboard App (Yêu cầu đăng nhập học sinh) */}
          <Route
            path="/dashboard"
            element={
              <RequireRole role="student">
                <StudentDashboardPage />
              </RequireRole>
            }
          />

          {/* Trang Đăng nhập Học sinh */}
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="tutors" element={<TutorManagement />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="match-requests" element={<MatchRequests />} />
            <Route path="payments" element={<PaymentApproval />} />
            <Route path="receptionists" element={<ReceptionistManagement />} />
            <Route path="complaints" element={<ComplaintManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/tutor"
            element={
              <RequireRole role="tutor">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<TutorDashboard />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="students/:studentId" element={<StudentDetailDefaultTab />} />
            <Route path="students/:studentId/overview" element={<StudentDetail />}>
              <Route index element={<ManageOverview />} />
            </Route>
            <Route path="students/:studentId/path" element={<StudentDetail />}>
              <Route index element={<ManageLearningPathRoute />} />
            </Route>
            <Route path="students/:studentId/exercises" element={<StudentDetail />}>
              <Route index element={<ManageAssignmentsRoute />} />
              <Route path="add" element={<AddAssignmentPage />} />
            </Route>
            <Route path="students/:studentId/materials" element={<StudentDetail />}>
              <Route index element={<ManageMaterialsRoute />} />
            </Route>
            <Route path="students/:studentId/exercises/:exerciseId" element={<TutorExerciseDetail />} />
            <Route path="schedule" element={<TutorSchedule />} />
            <Route path="exercise-generator" element={<ExerciseGenerator />} />
            <Route path="requests" element={<ClassRequests />} />
            <Route path="library/paths" element={<LibraryPaths />} />
            <Route path="library/paths/:templateId" element={<LibraryPathDetail />} />
            <Route path="library/exercises" element={<LibraryExercises />} />
            <Route path="library/materials" element={<LibraryMaterials />} />
            <Route path="profile" element={<TutorProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/student"
            element={
              <RequireRole role="student">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<StudentDashboardPage />} />
            <Route path="marketplace" element={<StudentMarketplace />} />
            <Route path="onboarding" element={<StudentOnboarding />} />
            <Route path="chat" element={<StudentChat />} />
            <Route path="schedule" element={<StudentDashboardPage />} />
            <Route path="exercises" element={<StudentExercises />} />
            <Route path="exercises/:exerciseId" element={<ExerciseTaking />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="materials" element={<StudentMaterials />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />

          <Route
            path="/receptionist"
            element={
              <RequireRole role="receptionist">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<ReceptionistDashboard />} />
            <Route path="match-requests" element={<ReceptionistMatchRequests />} />
            <Route path="payments" element={<ReceptionistPaymentApproval />} />
            <Route path="tutors" element={<ReceptionistTutorList />} />
            <Route path="students" element={<ReceptionistStudentList />} />
            <Route path="complaints" element={<ReceptionistComplaints />} />
            <Route path="notifications" element={<ReceptionistNotifications />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
