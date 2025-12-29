import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

/* =====================
   Context
===================== */
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

/* =====================
   Axios Instance
===================== */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/* =====================
   Provider
===================== */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Load user on refresh */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email) => {
    try {
      await api.post("/auth/send-otp", { email });
      toast.success("OTP sent");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP failed");
      return false;
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      api.defaults.headers.common.Authorization =
        `Bearer ${res.data.accessToken}`;

      setUser(res.data.user);
      toast.success("Login successful");
      return true;
    } catch {
      toast.error("Invalid OTP");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  /* =====================
     Refresh Token Interceptor
  ===================== */
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          const res = await api.post("/auth/refresh-token", { refreshToken });

          localStorage.setItem("accessToken", res.data.accessToken);
          api.defaults.headers.common.Authorization =
            `Bearer ${res.data.accessToken}`;
          original.headers.Authorization =
            `Bearer ${res.data.accessToken}`;

          return api(original);
        } catch {
          logout();
        }
      }

      return Promise.reject(error);
    }
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOTP,
        verifyOTP,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
