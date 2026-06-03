import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { meterReadingModel, invoiceModel, contractModel } from "../models/index.js";

// Helper to check if invoice exists and is locked
const checkInvoiceLock = async (contractId, month, year) => {
  const invoice = await invoiceModel.findOne({ contractId, month, year });
  if (invoice && invoice.status !== "draft") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phiếu chốt số đã được lập hóa đơn chính thức, không thể thay đổi hoặc xóa.");
  }
};

// Helper to check chain constraint
const checkChainConstraint = async (contractId, meterReadingId) => {
  const latestReading = await meterReadingModel.findOne({ contractId }).sort({ year: -1, month: -1 });
  if (latestReading && latestReading._id.toString() !== meterReadingId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Chỉ được phép sửa/xóa phiếu chốt số mới nhất của hợp đồng để tránh sai lệch chuỗi kế thừa.");
  }
};

const createMeterReadingService = async (data) => {
  const { contractId, month, year, electricity, water } = data;

  // Validate Contract
  const contract = await contractModel.findById(contractId);
  if (!contract) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng.");

  // Logic 4: De-duplication
  const existing = await meterReadingModel.findOne({ contractId, month, year });
  if (existing) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phiếu chốt số cho tháng này đã tồn tại.");
  }

  // Find previous reading for inheritance
  const prevReading = await meterReadingModel.findOne({ contractId }).sort({ year: -1, month: -1 });
  
  // Also enforce chronological creation to prevent breaking chain
  if (prevReading) {
    if (year < prevReading.year || (year === prevReading.year && month <= prevReading.month)) {
       throw new ApiError(StatusCodes.BAD_REQUEST, "Chỉ được phép tạo phiếu chốt số cho kỳ mới hơn kỳ gần nhất.");
    }
  }

  // Process Electricity
  let oldElectricityIndex = 0;
  if (electricity.isMeterReplaced) {
    oldElectricityIndex = 0;
  } else if (prevReading) {
    oldElectricityIndex = prevReading.electricity.newIndex;
  }
  
  if (!electricity.isMeterReplaced && electricity.newIndex < oldElectricityIndex) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số điện mới (${electricity.newIndex}) không được nhỏ hơn chỉ số cũ (${oldElectricityIndex}).`);
  }
  
  const electricityData = {
    oldIndex: oldElectricityIndex,
    newIndex: electricity.newIndex,
    isMeterReplaced: electricity.isMeterReplaced,
  };

  // Process Water
  let waterData = undefined;
  if (water && water.newIndex !== undefined) {
    let oldWaterIndex = 0;
    if (water.isMeterReplaced) {
      oldWaterIndex = 0;
    } else if (prevReading && prevReading.water && prevReading.water.newIndex !== undefined) {
      oldWaterIndex = prevReading.water.newIndex;
    }
    
    if (!water.isMeterReplaced && water.newIndex < oldWaterIndex) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số nước mới (${water.newIndex}) không được nhỏ hơn chỉ số cũ (${oldWaterIndex}).`);
    }
    
    waterData = {
      oldIndex: oldWaterIndex,
      newIndex: water.newIndex,
      isMeterReplaced: water.isMeterReplaced,
    };
  }

  const newReading = await meterReadingModel.create({
    contractId,
    month,
    year,
    electricity: electricityData,
    water: waterData,
  });

  return respone(StatusCodes.CREATED, "Tạo phiếu chốt số thành công", newReading);
};

const updateMeterReadingService = async (id, data) => {
  const reading = await meterReadingModel.findById(id);
  if (!reading) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu chốt số.");

  // Logic 5: Immutability via Invoice
  await checkInvoiceLock(reading.contractId, reading.month, reading.year);

  // Chain Constraint
  await checkChainConstraint(reading.contractId, reading._id);

  const prevReading = await meterReadingModel.findOne({ 
    contractId: reading.contractId,
    _id: { $ne: reading._id }
  }).sort({ year: -1, month: -1 });

  // Update Electricity
  if (data.electricity) {
    const isReplaced = data.electricity.isMeterReplaced !== undefined ? data.electricity.isMeterReplaced : reading.electricity.isMeterReplaced;
    const newIndex = data.electricity.newIndex !== undefined ? data.electricity.newIndex : reading.electricity.newIndex;
    
    let oldIndex = 0;
    if (isReplaced) {
      oldIndex = 0;
    } else if (prevReading) {
      oldIndex = prevReading.electricity.newIndex;
    }

    if (!isReplaced && newIndex < oldIndex) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số điện mới (${newIndex}) không được nhỏ hơn chỉ số cũ (${oldIndex}).`);
    }

    reading.electricity.oldIndex = oldIndex;
    reading.electricity.newIndex = newIndex;
    reading.electricity.isMeterReplaced = isReplaced;
  }

  // Update Water
  if (data.water && data.water.newIndex !== undefined) {
    const isReplaced = data.water.isMeterReplaced !== undefined ? data.water.isMeterReplaced : (reading.water ? reading.water.isMeterReplaced : false);
    const newIndex = data.water.newIndex;
    
    let oldIndex = 0;
    if (isReplaced) {
      oldIndex = 0;
    } else if (prevReading && prevReading.water && prevReading.water.newIndex !== undefined) {
      oldIndex = prevReading.water.newIndex;
    }

    if (!isReplaced && newIndex < oldIndex) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số nước mới (${newIndex}) không được nhỏ hơn chỉ số cũ (${oldIndex}).`);
    }

    reading.water = {
      oldIndex,
      newIndex,
      isMeterReplaced: isReplaced,
    };
  }

  await reading.save();

  return respone(StatusCodes.OK, "Cập nhật phiếu chốt số thành công", reading);
};

const deleteMeterReadingService = async (id) => {
  const reading = await meterReadingModel.findById(id);
  if (!reading) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu chốt số.");

  // Logic 5: Immutability via Invoice
  await checkInvoiceLock(reading.contractId, reading.month, reading.year);

  // Chain Constraint
  await checkChainConstraint(reading.contractId, reading._id);

  await meterReadingModel.findByIdAndDelete(id);

  return respone(StatusCodes.OK, "Xóa phiếu chốt số thành công");
};

const getAllMeterReadingsService = async (query = {}) => {
  const { contractId, page = 1, limit = 10 } = query;
  const filter = {};
  if (contractId) filter.contractId = contractId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [readings, totalCount] = await Promise.all([
    meterReadingModel.find(filter).sort({ year: -1, month: -1 }).skip(skip).limit(limitNum).lean(),
    meterReadingModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Lấy danh sách thành công", {
    readings,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

const getMeterReadingByIdService = async (id) => {
  const reading = await meterReadingModel.findById(id).lean();
  if (!reading) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiếu chốt số.");
  return respone(StatusCodes.OK, "Lấy thông tin thành công", reading);
};

export {
  createMeterReadingService,
  updateMeterReadingService,
  deleteMeterReadingService,
  getAllMeterReadingsService,
  getMeterReadingByIdService,
};
