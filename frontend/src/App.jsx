import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ReviewLandingPage from "./pages/auth/ReviewLandingPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import EditorDashboard from "./pages/editor/EditorDashboard";
import NewProjectPage from "./pages/editor/NewProjectPage";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import HeadDashboard from "./pages/head/HeadDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ActivityPage from "./pages/admin/ActivityPage";
import DeniedPage from "./pages/shared/DeniedPage";
import ProjectDetailPage from "./pages/shared/ProjectDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/review/:token" element={<ReviewLandingPage />} />
      <Route path="/denied" element={<DeniedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path="/editor"
          element={
            <ProtectedRoute roles={["editor", "admin"]}>
              <EditorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/new"
          element={
            <ProtectedRoute roles={["editor", "admin"]}>
              <NewProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute roles={["editor", "reviewer", "head", "admin"]}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviewer"
          element={
            <ProtectedRoute roles={["reviewer", "admin"]}>
              <ReviewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/head"
          element={
            <ProtectedRoute roles={["head", "admin"]}>
              <HeadDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute roles={["admin"]}>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
