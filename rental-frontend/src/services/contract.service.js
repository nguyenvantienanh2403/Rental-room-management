import { api } from "./api";

export const contractService = {
  getAll: async (params = {}) => {
    const response = await api.get("/contracts", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/contracts", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/contracts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  },
};
