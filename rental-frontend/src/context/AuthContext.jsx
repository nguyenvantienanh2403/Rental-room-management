import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      const userData = res.data || res;
      setUser(userData);
    } catch (err) {
      console.error("Failed to fetch user context:", err);
      // Clean up token if getMe fails (e.g. token expired/invalid)
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      // The authService.login function handles storing the token.
      // Now fetch the logged in user details
      await fetchUser();
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      const userData = res.data || res;
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      logout();
      throw err;
    }
  };

  const isAdmin = user?.role?.name?.toLowerCase() === "admin";
  const isLandlord = user?.role?.name?.toLowerCase() === "landlord";
  const isTenant = user?.role?.name?.toLowerCase() === "user";

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isLandlord,
    isTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
