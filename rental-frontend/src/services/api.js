import axios from "axios";

// Default to /api/v1 as per user's prompt
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic error handling for 401
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      // Optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
