import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../../components/layout/main-layout";
import { ChatPage } from "../../pages/chat-page";
import { DashboardPage } from "../../pages/dashboard-page";
import { HistoryPage } from "../../pages/history-page";
import { LoginPage } from "../../pages/login-page";
import { SearchPage } from "../../pages/search-page";
import { SignupPage } from "../../pages/signup-page";
import { UploadPage } from "../../pages/upload-page";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
