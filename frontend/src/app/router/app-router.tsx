import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../../components/layout/main-layout";
import { AuthProvider } from "../../features/auth/auth-context";
import { ChatPage } from "../../pages/chat-page";
import { DashboardPage } from "../../pages/dashboard-page";
import { HistoryPage } from "../../pages/history-page";
import { LoginPage } from "../../pages/login-page";
import { SearchPage } from "../../pages/search-page";
import { SignupPage } from "../../pages/signup-page";
import { UploadPage } from "../../pages/upload-page";
import { ProtectedRoute, PublicOnlyRoute } from "./route-guards";

export function AppRouter() {
  return (
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
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
