import { api } from './api';

export const tenantService = {
  getAll: async (params = {}) => {
    const response = await api.get('/tenants', { params });
    return response.data;
  },
  
  create: async (tenant) => {
    const response = await api.post('/tenants', tenant);
    return response.data;
  },

  update: async (id, updatedData) => {
    const response = await api.patch(`/tenants/${id}`, updatedData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  }
};
