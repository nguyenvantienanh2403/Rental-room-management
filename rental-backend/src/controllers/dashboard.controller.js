import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { dashboardService } from "../services/index.js";

const getOverview = catchAsync(async (req, res) => {
  const data = await dashboardService.getOverviewService();
  res.status(StatusCodes.OK).json(data);
});

export { getOverview };
