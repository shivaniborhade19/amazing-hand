import { useState, useEffect, useCallback } from "react";
import { getUserInfo, removeUserInfo } from "@/services/authService";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginTime, setLoginTime] = useState<number | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const user = getUserInfo();

    if (user && user.id && user.accessToken) {
      setIsAuthenticated(true);
      setLoginTime(Date.now());
    } else {
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  // Login — called after successful fetchUserInfo
  const login = useCallback(() => {
    const user = getUserInfo();

    // authenticate only if valid userInfo exists
    if (user && user.id && user.accessToken) {
      setIsAuthenticated(true);
      setLoginTime(Date.now());
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    removeUserInfo();
    setIsAuthenticated(false);
    setLoginTime(null);
  }, []);

  // Auto-expire session after 3 minutes (180000 ms)
  useEffect(() => {
    if (isAuthenticated && loginTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - loginTime >= 180000) {
          logout();
          alert("Session expired — please log in again.");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loginTime, logout]);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
