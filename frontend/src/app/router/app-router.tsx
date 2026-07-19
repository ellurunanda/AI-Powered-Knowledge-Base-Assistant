import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../../components/layout/main-layout";
import { ToastProvider } from "../providers/toast-provider";
import { AuthProvider } from "../../features/auth/auth-context";
import { AdminUsersPage } from "../../pages/admin-users-page";
import { ChatPage } from "../../pages/chat-page";
import { DashboardPage } from "../../pages/dashboard-page";
import { HistoryPage } from "../../pages/history-page";
import { LoginPage } from "../../pages/login-page";
import { SearchPage } from "../../pages/search-page";
import { SignupPage } from "../../pages/signup-page";
import { UploadPage } from "../../pages/upload-page";
import { AdminOnlyRoute, ProtectedRoute, PublicOnlyRoute } from "./route-guards";

export function AppRouter() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/admin/users"
              element={
                <AdminOnlyRoute>
                  <AdminUsersPage />
                </AdminOnlyRoute>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
