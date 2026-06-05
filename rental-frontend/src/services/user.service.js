import { api } from "./api";

export const userService = {
  // Lấy danh sách tất cả người dùng (Admin)
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Xóa người dùng (Admin)
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Tạo chủ nhà (Admin)
  createLandlord: async (data) => {
    const response = await api.post('/users/landlord', data);
    return response.data;
  },
  // Cập nhật thông tin cá nhân
  updateProfile: async (id, data) => {
    const response = await api.patch(`/users/${id}/profile`, data);
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (id, data) => {
    const response = await api.patch(`/users/${id}/change-password`, data);
    return response.data;
  },

  // Tải lên avatar (dùng FormData)
  uploadAvatar: async (formData) => {
    const response = await api.patch(`/users/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Đổi email (OTP Bước 1)
  requestEmailChange: async (data) => {
    const response = await api.post(`/users/me/request-email-change`, data);
    return response.data;
  },

  // Đổi email (OTP Bước 2)
  verifyEmailChange: async (data) => {
    const response = await api.post(`/users/me/verify-email-change`, data);
    return response.data;
  }
};
