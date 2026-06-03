import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { invoiceService } from "../services/index.js";

const createInvoice = catchAsync(async (req, res) => {
  const result = await invoiceService.createInvoiceService(req.body);
  res.status(StatusCodes.CREATED).json(result);
});

const updateInvoice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await invoiceService.updateInvoiceService(id, req.body);
  res.status(StatusCodes.OK).json(result);
});

const updateInvoiceStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await invoiceService.updateInvoiceStatusService(id, status);
  res.status(StatusCodes.OK).json(result);
});

const getAllInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.getAllInvoicesService(req.query);
  res.status(StatusCodes.OK).json(result);
});

const getInvoiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await invoiceService.getInvoiceByIdService(id);
  res.status(StatusCodes.OK).json(result);
});

export {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  getAllInvoices,
  getInvoiceById,
};
