import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { decodeJwt, isTokenExpired } from '../utils/jwt';
import { toast } from 'sonner';

const AuthContext = createContext(null);

const TOKEN_KEY = 'academix_token';
const USER_KEY = 'academix_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        if (isTokenExpired(storedToken)) {
          logoutSilent();
        } else {
          const decoded = decodeJwt(storedToken);
          if (decoded && !user) {
            
            try {
              const res = await usersApi.getUserById(decoded.userId);
              if (res?.user) {
                setUser(res.user);
                localStorage.setItem(USER_KEY, JSON.stringify(res.user));
              } else {
                setUser({ _id: decoded.userId, role: decoded.role });
              }
            } catch (err) {
              setUser({ _id: decoded.userId, role: decoded.role });
            }
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const logoutSilent = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(credentials);
      
      const jwtToken = typeof res === 'string' ? res : res?.accessToken || res?.token;

      if (!jwtToken) {
        throw new Error('Invalid token received from server');
      }

      const decoded = decodeJwt(jwtToken);
      if (!decoded) {
        throw new Error('Invalid authentication token payload');
      }

      localStorage.setItem(TOKEN_KEY, jwtToken);
      setToken(jwtToken);

      let userInfo = { _id: decoded.userId, role: decoded.role, email: credentials.email };

      
      try {
        const userRes = await usersApi.getUserById(decoded.userId);
        if (userRes?.user) {
          userInfo = userRes.user;
        }
      } catch (e) {
        
      }

      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      toast.success('Login successful');
      return userInfo;
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutSilent();
    toast.info('Logged out successfully');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = {
    user,
    token,
    role: user?.role || decodeJwt(token)?.role || null,
    userId: user?._id || decodeJwt(token)?.userId || null,
    isAuthenticated: Boolean(token && !isTokenExpired(token)),
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
