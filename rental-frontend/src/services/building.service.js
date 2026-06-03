import { api } from "./api";

export const buildingService = {
  getAll: async (params = {}) => {
    const response = await api.get("/buildings", { params });
    return response.data;
  },
  getById: async (identifier) => {
    const response = await api.get(`/buildings/${identifier}`);
    return response.data;
  },
  create: async (buildingData) => {
    const response = await api.post("/buildings", buildingData);
    return response.data;
  },
  update: async (id, buildingData) => {
    const response = await api.patch(`/buildings/${id}`, buildingData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
  },
};
