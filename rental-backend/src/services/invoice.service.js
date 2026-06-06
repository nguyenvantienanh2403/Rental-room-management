import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import {
  invoiceModel,
  contractModel,
  meterReadingModel,
  tenantModel,
  notificationModel,
} from "../models/index.js";

const INVOICE_POPULATE = [
  {
    path: "contractId",
    select: "contractCode startDate endDate",
    populate: [
      {
        path: "roomId",
        select: "name buildingId",
        populate: {
          path: "buildingId",
          select: "landlordId",
          populate: {
            path: "landlordId",
            select: "bankInfo fullName phoneNumber",
          },
        },
      },
      {
        path: "tenantId",
        select: "fullName phoneNumber",
      },
    ],
  },
  {
    path: "meterReadingId",
    select: "electricity water",
  },
];

// Helper to calculate total
const calculateTotals = (
  roomCharge,
  electricityTotal,
  waterTotal,
  otherFees = [],
  discount = 0,
) => {
  const sumOtherFees = otherFees.reduce((acc, fee) => acc + fee.amount, 0);
  const totalAmount =
    roomCharge + electricityTotal + waterTotal + sumOtherFees - discount;
  return Math.max(0, totalAmount);
};

// ---------------------------------------------------------------------------
// CREATE INVOICE
// ---------------------------------------------------------------------------
const createInvoiceService = async (invoiceData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      contractId,
      month,
      year,
      otherFees = [],
      discount = 0,
      dueDate,
    } = invoiceData;

    // Logic 1: De-duplication
    const existingInvoice = await invoiceModel
      .findOne({ contractId, month, year })
      .session(session);
    if (existingInvoice) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Hóa đơn cho tháng này đã được khởi tạo trước đó.",
      );
    }

    // B1: Lấy phiếu chốt số
    const meterReading = await meterReadingModel
      .findOne({ contractId, month, year })
      .session(session);
    if (!meterReading) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Chưa có phiếu chốt số điện nước cho tháng này.",
      );
    }

    // B2: Lấy thông tin Contract để lấy đơn giá
    const contract = await contractModel.findById(contractId).session(session);
    if (!contract) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hợp đồng.");
    }
    if (contract.status !== "active") {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Hợp đồng không còn hoạt động.",
      );
    }

    // Lấy số lượng người thuê đang ở trong phòng của hợp đồng này
    const numberOfTenants = await tenantModel
      .countDocuments({ roomId: contract.roomId, status: "active" })
      .session(session);

    // B3: Tính tiền điện
    const electricityUsed = Math.max(
      0,
      meterReading.electricity.newIndex - meterReading.electricity.oldIndex,
    );
    const electricityTotal = electricityUsed * contract.electricityPrice;

    // B4: Tính tiền nước
    let waterTotal = 0;
    if (meterReading.water && meterReading.water.newIndex !== undefined) {
      // Có chỉ số nước -> tính theo khối
      const waterUsed = Math.max(
        0,
        meterReading.water.newIndex - meterReading.water.oldIndex,
      );
      waterTotal = waterUsed * contract.waterPrice;
    } else {
      // Không có chỉ số nước -> tính theo đầu người
      waterTotal = contract.waterPrice * numberOfTenants;
    }

    // Tính tiền dịch vụ từ hợp đồng và gộp vào otherFees
    let finalOtherFees = [...otherFees];
    if (contract.services && contract.services.length > 0) {
      contract.services.forEach(service => {
        // Chỉ thêm vào nếu người dùng không tự ghi đè tên dịch vụ đó trong otherFees
        const existingOverride = finalOtherFees.find(f => f.name === service.name);
        if (!existingOverride) {
          finalOtherFees.push({
            name: service.name,
            amount: service.price * (service.quantity || 1)
          });
        }
      });
    }

    // B5: Tính tổng tiền
    const totalAmount = calculateTotals(
      contract.monthlyPrice,
      electricityTotal,
      waterTotal,
      finalOtherFees,
      discount,
    );

    // Tính toán Due Date
    let finalDueDate = dueDate;
    if (!finalDueDate) {
      const today = new Date();
      finalDueDate = new Date(today);
      finalDueDate.setDate(today.getDate() + 5);
    }

    // Lưu Snapshot
    const newInvoiceData = {
      contractId,
      meterReadingId: meterReading._id,
      month,
      year,
      roomCharge: contract.monthlyPrice,
      electricityUnitPrice: contract.electricityPrice,
      waterUnitPrice: contract.waterPrice,
      electricityTotal,
      waterTotal,
      otherFees: finalOtherFees,
      discount,
      totalAmount,
      dueDate: finalDueDate,
      status: "draft",
    };

    const newInvoices = await invoiceModel.create([newInvoiceData], {
      session,
    });
    const newInvoice = newInvoices[0];

    const populatedInvoice = await invoiceModel
      .findById(newInvoice._id)
      .populate(INVOICE_POPULATE)
      .session(session)
      .lean();

    // Bắn thông báo NEW_INVOICE
    const landlordId =
      populatedInvoice.contractId?.roomId?.buildingId?.landlordId;
    const roomName = populatedInvoice.contractId?.roomId?.name;
    if (landlordId) {
      await notificationModel.create(
        [
          {
            recipientId: landlordId,
            title: "Hóa đơn mới",
            message: `Hóa đơn tháng ${month}/${year} của ${roomName || "phòng"} đã được tạo thành công.`,
            type: "NEW_INVOICE",
            metadata: {
              invoiceId: newInvoice._id,
              contractId: contractId,
            },
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return respone(
      StatusCodes.CREATED,
      "Tạo hóa đơn thành công",
      populatedInvoice,
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// UPDATE INVOICE
// ---------------------------------------------------------------------------
const updateInvoiceService = async (invoiceId, updateData) => {
  const invoice = await invoiceModel.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hóa đơn.");
  }

  // Khóa dữ liệu (Immutability)
  if (invoice.status !== "draft") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Hóa đơn đã chốt hoặc đã thanh toán, không thể chỉnh sửa số liệu.",
    );
  }

  // Cập nhật phụ phí, giảm giá và ngày đến hạn
  if (updateData.otherFees !== undefined) {
    invoice.otherFees = updateData.otherFees;
  }

  if (updateData.discount !== undefined) {
    invoice.discount = updateData.discount;
  }

  if (updateData.dueDate !== undefined) {
    invoice.dueDate = updateData.dueDate;
  }

  // Tính lại tổng tiền (Giữ nguyên các giá trị snapshot cũ)
  invoice.totalAmount = calculateTotals(
    invoice.roomCharge,
    invoice.electricityTotal,
    invoice.waterTotal,
    invoice.otherFees,
    invoice.discount,
  );

  await invoice.save();

  const updatedInvoice = await invoiceModel
    .findById(invoiceId)
    .populate(INVOICE_POPULATE)
    .lean();

  return respone(
    StatusCodes.OK,
    "Cập nhật số liệu hóa đơn thành công",
    updatedInvoice,
  );
};

// ---------------------------------------------------------------------------
// UPDATE INVOICE STATUS
// ---------------------------------------------------------------------------
const updateInvoiceStatusService = async (invoiceId, newStatus) => {
  const invoice = await invoiceModel.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy hóa đơn.");
  }

  // Chuyển trạng thái tuần tự (State Machine)
  const currentStatus = invoice.status;

  if (currentStatus === "paid" || currentStatus === "cancelled") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Quy trình chuyển đổi trạng thái không hợp lệ. Hóa đơn đã hoàn tất hoặc bị hủy.",
    );
  }

  let isValidTransition = false;

  if (
    currentStatus === "draft" &&
    ["issued", "cancelled"].includes(newStatus)
  ) {
    isValidTransition = true;
  } else if (
    currentStatus === "issued" &&
    ["paid", "cancelled"].includes(newStatus)
  ) {
    isValidTransition = true;
  }

  if (!isValidTransition) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Quy trình chuyển đổi trạng thái không hợp lệ từ '${currentStatus}' sang '${newStatus}'.`,
    );
  }

  invoice.status = newStatus;
  await invoice.save();

  const updatedInvoice = await invoiceModel
    .findById(invoiceId)
    .populate(INVOICE_POPULATE)
    .lean();

  // Bắn thông báo INVOICE_PAID nếu trạng thái là paid
  if (newStatus === "paid") {
    const landlordId =
      updatedInvoice.contractId?.roomId?.buildingId?.landlordId;
    const roomName = updatedInvoice.contractId?.roomId?.name;
    if (landlordId) {
      await notificationModel.create({
        recipientId: landlordId,
        title: "Đã thanh toán hóa đơn",
        message: `Hóa đơn tháng ${updatedInvoice.month}/${updatedInvoice.year} của ${roomName || "phòng"} đã được thanh toán.`,
        type: "INVOICE_PAID",
        metadata: {
          invoiceId: invoiceId,
          contractId: updatedInvoice.contractId?._id,
        },
      });
    }
  }

  return respone(
    StatusCodes.OK,
    "Cập nhật trạng thái hóa đơn thành công",
    updatedInvoice,
  );
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
