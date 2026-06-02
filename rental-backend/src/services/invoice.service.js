import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { invoiceModel, contractModel } from "../models/index.js";

const INVOICE_POPULATE = [
  {
    path: "contractId",
    select: "contractCode startDate endDate",
    populate: [
      {
        path: "roomId",
        select: "name buildingId",
      },
      {
        path: "tenantId",
        select: "fullName phoneNumber",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// CREATE INVOICE
// ---------------------------------------------------------------------------
const createInvoiceService = async (invoiceData) => {
  const { contractId, month, year, oldElectricityIndex: reqOldElec = 0, oldWaterIndex: reqOldWater = 0, newElectricityIndex, newWaterIndex, otherFees = 0 } = invoiceData;

  // Logic 1: Chống trùng lặp (De-duplication)
  const existingInvoice = await invoiceModel.findOne({ contractId, month, year });
  if (existingInvoice) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Hóa đơn cho tháng này đã được khởi tạo trước đó.");
  }

  // Lấy thông tin Contract để chụp giá
  const contract = await contractModel.findById(contractId);
  if (!contract) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng.");
  }
  if (contract.status !== "active") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Hợp đồng không còn hoạt động.");
  }

  // Logic 2: Kế thừa số điện nước (Index Inheritance)
  // Lấy hóa đơn gần nhất của hợp đồng này
  const lastInvoice = await invoiceModel.findOne({ contractId }).sort({ year: -1, month: -1 });
  
  let oldElectricityIndex = reqOldElec;
  let oldWaterIndex = reqOldWater;
  
  if (lastInvoice) {
    oldElectricityIndex = lastInvoice.newElectricityIndex;
    oldWaterIndex = lastInvoice.newWaterIndex;
  }

  if (newElectricityIndex < oldElectricityIndex) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số điện mới (${newElectricityIndex}) không được nhỏ hơn chỉ số cũ (${oldElectricityIndex}).`);
  }
  
  if (newWaterIndex < oldWaterIndex) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số nước mới (${newWaterIndex}) không được nhỏ hơn chỉ số cũ (${oldWaterIndex}).`);
  }

  // Logic 3: Sao chụp giá (Pricing Snapshot) từ Contract
  const newInvoiceData = {
    contractId,
    month,
    year,
    roomPriceSnapshot: contract.monthlyPrice || 0,
    electricityPriceSnapshot: contract.electricityPrice || 0,
    waterPriceSnapshot: contract.waterPrice || 0,
    oldElectricityIndex,
    newElectricityIndex,
    oldWaterIndex,
    newWaterIndex,
    otherFees,
  };

  const newInvoice = await invoiceModel.create(newInvoiceData);
  
  const populatedInvoice = await invoiceModel
    .findById(newInvoice._id)
    .populate(INVOICE_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Tạo hóa đơn thành công", populatedInvoice);
};

// ---------------------------------------------------------------------------
// UPDATE INVOICE
// ---------------------------------------------------------------------------
const updateInvoiceService = async (invoiceId, updateData) => {
  const invoice = await invoiceModel.findById(invoiceId);
  
  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hóa đơn.");
  }

  // Logic 4: Khóa dữ liệu (Immutability)
  if (invoice.status !== "draft") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Hóa đơn đã chốt hoặc đã thanh toán, không thể chỉnh sửa số liệu.");
  }

  // Check valid indexes if updated
  if (updateData.newElectricityIndex !== undefined) {
    if (updateData.newElectricityIndex < invoice.oldElectricityIndex) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số điện mới không được nhỏ hơn chỉ số cũ (${invoice.oldElectricityIndex}).`);
    }
    invoice.newElectricityIndex = updateData.newElectricityIndex;
  }
  
  if (updateData.newWaterIndex !== undefined) {
    if (updateData.newWaterIndex < invoice.oldWaterIndex) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Chỉ số nước mới không được nhỏ hơn chỉ số cũ (${invoice.oldWaterIndex}).`);
    }
    invoice.newWaterIndex = updateData.newWaterIndex;
  }
  
  if (updateData.otherFees !== undefined) {
    invoice.otherFees = updateData.otherFees;
  }
  
  await invoice.save(); // pre-save will calculate totalAmount

  const updatedInvoice = await invoiceModel
    .findById(invoiceId)
    .populate(INVOICE_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Cập nhật số liệu hóa đơn thành công", updatedInvoice);
};

// ---------------------------------------------------------------------------
// UPDATE INVOICE STATUS
// ---------------------------------------------------------------------------
const updateInvoiceStatusService = async (invoiceId, newStatus) => {
  const invoice = await invoiceModel.findById(invoiceId);
  
  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hóa đơn.");
  }

  // Logic 5: Chuyển trạng thái tuần tự (State Machine)
  const currentStatus = invoice.status;
  
  if (currentStatus === "paid" || currentStatus === "cancelled") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Quy trình chuyển đổi trạng thái không hợp lệ. Hóa đơn đã hoàn tất hoặc bị hủy.");
  }

  let isValidTransition = false;

  if (currentStatus === "draft" && ["issued", "cancelled"].includes(newStatus)) {
    isValidTransition = true;
  } else if (currentStatus === "issued" && ["paid", "cancelled"].includes(newStatus)) {
    isValidTransition = true;
  }

  if (!isValidTransition) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Quy trình chuyển đổi trạng thái không hợp lệ từ '${currentStatus}' sang '${newStatus}'.`);
  }

  invoice.status = newStatus;
  await invoice.save();

  const updatedInvoice = await invoiceModel
    .findById(invoiceId)
    .populate(INVOICE_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Cập nhật trạng thái hóa đơn thành công", updatedInvoice);
};

// ---------------------------------------------------------------------------
// GET ALL INVOICES
// ---------------------------------------------------------------------------
const getAllInvoicesService = async (query = {}) => {
  const { page = 1, limit = 10, status, contractId, month, year } = query;

  const filter = {};
  if (status) filter.status = status;
  if (contractId) filter.contractId = contractId;
  if (month) filter.month = month;
  if (year) filter.year = year;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [invoices, totalCount] = await Promise.all([
    invoiceModel
      .find(filter)
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    invoiceModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Lấy danh sách hóa đơn thành công", {
    invoices,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET INVOICE BY ID
// ---------------------------------------------------------------------------
const getInvoiceByIdService = async (invoiceId) => {
  const invoice = await invoiceModel
    .findById(invoiceId)
    .populate(INVOICE_POPULATE)
    .lean();

  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hóa đơn.");
  }

  return respone(StatusCodes.OK, "Lấy thông tin hóa đơn thành công", invoice);
};

export {
  createInvoiceService,
  updateInvoiceService,
  updateInvoiceStatusService,
  getAllInvoicesService,
  getInvoiceByIdService,
};
