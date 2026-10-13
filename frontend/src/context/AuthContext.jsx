import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Automatically use the live Render API URL if not on localhost
const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "" : "https://job-portal-fe45.onrender.com");
axios.defaults.baseURL = API_BASE;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = (tokenData, userData) => {
    localStorage.setItem("token", tokenData);
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
