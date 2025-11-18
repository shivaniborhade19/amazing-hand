import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginTime, setLoginTime] = useState<number | null>(null);

  // Login function (called when user logs in)
  const login = () => {
    setIsAuthenticated(true);
    setLoginTime(Date.now());
  };

  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
    setLoginTime(null);
  };

  // Automatically expire login after 1 minute (60 seconds)
  useEffect(() => {
    if (isAuthenticated && loginTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - loginTime >= 180000) {
          // 1 minute expired
          logout();
          alert("Session expired — please log in again.");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loginTime]);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
