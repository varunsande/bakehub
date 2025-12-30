import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email) => {
    try {
      await axios.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email');
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to send OTP';
      const errorDetails = error.response?.data?.details;

      if (errorDetails) {
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line',
          },
        });
        console.error('OTP Error Details:', errorDetails);
      } else {
        toast.error(errorMessage);
      }
      return false;
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await axios.post('/auth/verify-otp', { email, otp });

      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setUser(userData);
      toast.success('Login successful');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      const response = await axios.put('/auth/profile', data);
      setUser(response.data.user);
      toast.success('Profile updated');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  // Axios interceptor for token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            const response = await axios.post('/auth/refresh-token', {
              refreshToken,
            });

            const { accessToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            axios.defaults.headers.common[
              'Authorization'
            ] = `Bearer ${accessToken}`;
            originalRequest.headers[
              'Authorization'
            ] = `Bearer ${accessToken}`;

            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        } else {
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
        updateProfile,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
