import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { meterReadingService } from "../services/index.js";

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
  const result = await meterReadingService.getAllMeterReadingsService(
    req.query,
  );
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
