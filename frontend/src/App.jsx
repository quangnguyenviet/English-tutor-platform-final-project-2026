import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LessonSessionProvider } from "./context/LessonSessionContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSchedule from "./pages/student/StudentSchedule";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TutorManagement from "./pages/admin/TutorManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import MatchRequests from "./pages/admin/MatchRequests";
import ClassRequestManagement from "./pages/admin/ClassRequests";
import AccountantPayments from "./pages/accountant/AccountantPayments";
import TutorPayments from "./pages/tutor/TutorPayments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminNotifications from "./pages/admin/AdminNotifications";
import StaffManagement from "./pages/admin/StaffManagement";
import ComplaintManagement from "./pages/admin/ComplaintManagement";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorClassWorkspace from "./pages/tutor/TutorClassWorkspace";
import ClassOverview from "./pages/tutor/ClassOverview";
import ManageLearningPathRoute from "./pages/tutor/manage/ManageLearningPathRoute";
import ManageSessionsRoute from "./pages/tutor/manage/ManageSessionsRoute";
import QuizAuthoringRoute from "./pages/tutor/manage/QuizAuthoringRoute";
import ClassScheduleRoute from "./pages/tutor/manage/ClassScheduleRoute";
import ManageAssignmentsRoute from "./pages/tutor/manage/ManageAssignmentsRoute";
import AddAssignmentPage from "./pages/tutor/manage/AddAssignmentPage";
import ManageMaterialsRoute from "./pages/tutor/manage/ManageMaterialsRoute";
import TutorExerciseDetail from "./pages/tutor/TutorExerciseDetail";
import ExerciseGenerator from "./pages/tutor/ExerciseGenerator";
import ClassRequests from "./pages/tutor/ClassRequests";
import AvailableClasses from "./pages/tutor/AvailableClasses";
import AvailableClassDetail from "./pages/tutor/AvailableClassDetail";
import TutorClasses from "./pages/tutor/TutorClasses";
import LibraryPaths from "./pages/tutor/LibraryPaths";
import LibraryPathDetail from "./pages/tutor/LibraryPathDetail";
import LibraryExercises from "./pages/tutor/LibraryExercises";
import LibraryMaterials from "./pages/tutor/LibraryMaterials";
import TutorProfile from "./pages/tutor/TutorProfile";
import TutorProfileEditPage from "./pages/tutor/TutorProfileEditPage";
import TutorSchedule from "./pages/tutor/TutorSchedule";
import TutorLessonSessions from "./pages/tutor/TutorLessonSessions";
import ParentLearningProgress from "./pages/parent/ParentLearningProgress";
import LessonOperations from "./pages/operations/LessonOperations";

import StudentMarketplace from "./pages/student/StudentMarketplace";
import StudentOnboarding from "./pages/student/StudentOnboarding";
import StudentChat from "./pages/student/StudentChat";
import StudentExercises from "./pages/student/StudentExercises";
import ExerciseTaking from "./pages/student/ExerciseTaking";
import StudentProgress from "./pages/student/StudentProgress";
import StudentMaterials from "./pages/student/StudentMaterials";
import SpacedRepetitionSession from "./pages/student/SpacedRepetitionSession";
import SettingsPage from "./pages/SettingsPage";

import GuestLayout from "./components/guest/GuestLayout";
import GuestTutorExplorePage from "./pages/guest/GuestTutorExplorePage";
import GuestTutorDetailPage from "./pages/guest/GuestTutorDetailPage";
import GuestClassesExplorePage from "./pages/guest/GuestClassesExplorePage";
import GuestClassDetailPage from "./pages/guest/GuestClassDetailPage";
import GuestPricingPage from "./pages/guest/GuestPricingPage";
import GuestFAQPage from "./pages/guest/GuestFAQPage";
import GuestHowItWorksPage from "./pages/guest/GuestHowItWorksPage";
import GuestContactPage from "./pages/guest/GuestContactPage";

import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import ReceptionistMatchRequests from "./pages/receptionist/ReceptionistMatchRequests";
import ReceptionistClassRequests from "./pages/receptionist/ReceptionistClassRequests";
import ReceptionistPaymentApproval from "./pages/receptionist/ReceptionistPaymentApproval";
import ReceptionistTutorList from "./pages/receptionist/ReceptionistTutorList";
import ReceptionistStudentList from "./pages/receptionist/ReceptionistStudentList";
import ReceptionistNotifications from "./pages/receptionist/ReceptionistNotifications";
import ReceptionistComplaints from "./pages/receptionist/ReceptionistComplaints";

import AccountantDashboard from "./pages/accountant/AccountantDashboard";

import TutorRegisterPage from "./pages/tutor/TutorRegisterPage";

function RequireRole({ role, children }) {
  const { session, authLoading } = useAuth();
  // Đang kiểm tra token lúc khởi động — chưa biết có session hay không, đợi thêm
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={`/${session.role}`} replace />;
  return children;
}

function ClassWorkspaceDefaultTab() {
  const { classId } = useParams();
  return <Navigate to={`/tutor/classes/${classId}/overview`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LessonSessionProvider>
        <Routes>
          {/* Landing Page & Guest Portal Routes (Không cần đăng nhập) */}
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestLayout />}>
            <Route path="/tutors" element={<GuestTutorExplorePage />} />
            <Route path="/tutors/:tutorId" element={<GuestTutorDetailPage />} />
            <Route path="/classes" element={<GuestClassesExplorePage />} />
            <Route path="/classes/:classId" element={<GuestClassDetailPage />} />
            <Route path="/pricing" element={<GuestPricingPage />} />
            <Route path="/faq" element={<GuestFAQPage />} />
            <Route path="/how-it-works" element={<GuestHowItWorksPage />} />
            <Route path="/contact" element={<GuestContactPage />} />
            {/* UC-P05: Tra cứu tiến độ (Tạm ẩn, phát triển sau)
            <Route path="/parent-view" element={<ParentProgressViewPage />} />
            */}
          </Route>


          {/* Student Dashboard App (Yêu cầu đăng nhập học sinh) */}
          <Route
            path="/dashboard"
            element={<Navigate to="/student" replace />}
          />

          {/* Trang Đăng nhập */}
          <Route path="/login" element={<LoginPage />} />

          {/* Tutor Registration Route (Public - onboarding flow) */}
          <Route path="/tutor/register" element={<TutorRegisterPage />} />

          {/* Admin Routes */}
          <Route
            path="/parent"
            element={
              <RequireRole role="parent">
                <ParentLearningProgress />
              </RequireRole>
            }
          />

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
            <Route path="class-requests" element={<ClassRequestManagement />} />
            <Route path="payments" element={<AccountantPayments />} />
            <Route path="staff" element={<StaffManagement />} />
            {/* Giữ đường dẫn cũ để không vỡ link đã lưu */}
            <Route path="receptionists" element={<StaffManagement />} />
            <Route path="complaints" element={<ComplaintManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="lessons" element={<LessonOperations />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Tutor Routes */}
          <Route
            path="/tutor"
            element={
              <RequireRole role="tutor">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<TutorDashboard />} />
            <Route path="schedule" element={<TutorSchedule />} />
            <Route path="payments" element={<TutorPayments />} />
            <Route path="lessons" element={<TutorLessonSessions />} />
            <Route path="exercise-generator" element={<ExerciseGenerator />} />
            <Route path="available-classes" element={<AvailableClasses />} />
            <Route path="available-classes/:classId" element={<AvailableClassDetail />} />
            <Route path="classes" element={<TutorClasses />} />
            <Route path="classes/:classId" element={<ClassWorkspaceDefaultTab />} />
            <Route path="classes/:classId/exercises/:exerciseId" element={<TutorExerciseDetail />} />
            <Route path="classes/:classId/overview" element={<TutorClassWorkspace />}>
              <Route index element={<ClassOverview />} />
            </Route>
            <Route path="classes/:classId/path" element={<TutorClassWorkspace />}>
              <Route index element={<ManageLearningPathRoute />} />
            </Route>
            <Route path="classes/:classId/sessions" element={<TutorClassWorkspace />}>
              <Route index element={<ManageSessionsRoute />} />
              <Route path="quiz/:sessionId" element={<QuizAuthoringRoute />} />
            </Route>
            <Route path="classes/:classId/schedule" element={<TutorClassWorkspace />}>
              <Route index element={<ClassScheduleRoute />} />
            </Route>
            <Route path="classes/:classId/exercises" element={<TutorClassWorkspace />}>
              <Route index element={<ManageAssignmentsRoute />} />
              <Route path="add" element={<AddAssignmentPage />} />
            </Route>
            <Route path="classes/:classId/materials" element={<TutorClassWorkspace />}>
              <Route index element={<ManageMaterialsRoute />} />
            </Route>
            <Route path="requests" element={<ClassRequests />} />
            <Route path="library/paths" element={<LibraryPaths />} />
            <Route path="library/paths/:templateId" element={<LibraryPathDetail />} />
            <Route path="library/exercises" element={<LibraryExercises />} />
            <Route path="library/materials" element={<LibraryMaterials />} />
            <Route path="profile" element={<TutorProfile />} />
            <Route path="profile/edit" element={<TutorProfileEditPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <RequireRole role="student">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="marketplace" element={<StudentMarketplace />} />
            <Route path="onboarding" element={<StudentOnboarding />} />
            <Route path="chat" element={<StudentChat />} />
            <Route path="schedule" element={<StudentSchedule />} />
            <Route path="exercises" element={<StudentExercises />} />
            <Route path="exercises/:exerciseId" element={<ExerciseTaking />} />
            <Route path="spaced-repetition" element={<SpacedRepetitionSession />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="materials" element={<StudentMaterials />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Receptionist Routes */}
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
            <Route path="class-requests" element={<ReceptionistClassRequests />} />
            <Route path="payments" element={<ReceptionistPaymentApproval />} />
            <Route path="tutors" element={<ReceptionistTutorList />} />
            <Route path="students" element={<ReceptionistStudentList />} />
            <Route path="lessons" element={<LessonOperations />} />
            <Route path="complaints" element={<ReceptionistComplaints />} />
            <Route path="notifications" element={<ReceptionistNotifications />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Accountant Routes */}
          <Route
            path="/accountant"
            element={
              <RequireRole role="accountant">
                <AppShell />
              </RequireRole>
            }
          >
            <Route index element={<AccountantDashboard />} />
            <Route path="payments" element={<AccountantPayments />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </LessonSessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
