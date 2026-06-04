import { api } from './api';

export const roomService = {
  getAll: async (params = {}) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },
  
  getByBuilding: async (buildingId, params = {}) => {
    const response = await api.get(`/rooms/building/${buildingId}`, { params });
    return response.data;
  },
  
  create: async (room) => {
    const response = await api.post('/rooms', room);
    return response.data;
  },

  update: async (id, updatedData) => {
    const response = await api.patch(`/rooms/${id}`, updatedData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  }
};
