import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { LoadingState } from "../../components/common/loading-state";
import { useAuth } from "../../features/auth/use-auth";

interface GuardProps {
  children: ReactElement;
}

export function ProtectedRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking session..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
