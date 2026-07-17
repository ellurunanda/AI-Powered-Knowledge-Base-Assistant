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
let bootstrappedUser: User | null | undefined;

async function loadProfileFromApi(): Promise<User | null> {
  try {
    const response = await httpClient.get<{ success: boolean; data: User }>("/auth/me");
    return response.data.data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const nextUser = await loadProfileFromApi();
    bootstrappedUser = nextUser;
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);

      if (bootstrappedUser !== undefined) {
        if (isMounted) {
          setUser(bootstrappedUser);
          setIsLoading(false);
        }
        return;
      }

      const nextUser = await loadProfileFromApi();
      bootstrappedUser = nextUser;
      if (isMounted) {
        setUser(nextUser);
        setIsLoading(false);
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
    const nextUser = response.data.data.user;
    bootstrappedUser = nextUser;
    setUser(nextUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await httpClient.post<{ success: boolean; data: { user: User } }>("/auth/register", {
      name,
      email,
      password,
    });
    const nextUser = response.data.data.user;
    bootstrappedUser = nextUser;
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await httpClient.post("/auth/logout");
    bootstrappedUser = null;
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
