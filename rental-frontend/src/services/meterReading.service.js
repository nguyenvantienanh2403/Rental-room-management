import { api } from "./api";

export const meterReadingService = {
  getAll: async (params = {}) => {
    const response = await api.get("/meter-readings", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/meter-readings/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/meter-readings", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/meter-readings/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/meter-readings/${id}`);
    return response.data;
  },
};
