import { api } from "./api";

export const dashboardService = {
  getOverview: async () => {
    const response = await api.get("/dashboard/overview");
    return response.data;
  },
};
