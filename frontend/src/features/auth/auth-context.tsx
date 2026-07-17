import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { httpClient } from "../../lib/api/http-client";
import type { User } from "../../types/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await httpClient.get<{ success: boolean; data: User }>("/auth/me");
      setUser(response.data.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const response = await httpClient.get<{ success: boolean; data: User }>("/auth/me");
        if (isMounted) {
          setUser(response.data.data);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void init();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await httpClient.post<{ success: boolean; data: { user: User } }>("/auth/login", {
      email,
      password,
    });
    setUser(response.data.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await httpClient.post<{ success: boolean; data: { user: User } }>("/auth/register", {
      name,
      email,
      password,
    });
    setUser(response.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await httpClient.post("/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, refreshProfile, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

