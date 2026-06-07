import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { meterReadingService } from "../services/index.js";
import { tenantModel, contractModel } from "../models/index.js";

const createMeterReading = catchAsync(async (req, res) => {
  const result = await meterReadingService.createMeterReadingService(req.body);
  res.status(StatusCodes.CREATED).json(result);
});

const updateMeterReading = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await meterReadingService.updateMeterReadingService(
    id,
    req.body,
  );
  res.status(StatusCodes.OK).json(result);
});

const deleteMeterReading = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await meterReadingService.deleteMeterReadingService(id);
  res.status(StatusCodes.OK).json(result);
});

const getAllMeterReadings = catchAsync(async (req, res) => {
  let query = { ...req.query };
  const userRole = req.user.role?.name || req.user.role;
  if (userRole === "user") {
    const tenant = await tenantModel.findOne({ userId: req.user._id });
    if (tenant) {
      const contract = await contractModel.findOne({ tenantId: tenant._id });
      if (contract) {
        query.contractId = contract._id;
      } else {
        query.contractId = "000000000000000000000000";
      }
    } else {
      query.contractId = "000000000000000000000000";
    }
  }

  const result = await meterReadingService.getAllMeterReadingsService(query);
  res.status(StatusCodes.OK).json(result);
});

const getMeterReadingById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await meterReadingService.getMeterReadingByIdService(id);
  res.status(StatusCodes.OK).json(result);
});

export {
  createMeterReading,
  updateMeterReading,
  deleteMeterReading,
  getAllMeterReadings,
  getMeterReadingById,
};
