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

import tenantModel from "../models/tenant.model.js";
import contractModel from "../models/contract.model.js";

const getAllInvoices = catchAsync(async (req, res) => {
  let query = { ...req.query };
  const userRole = req.user.role?.name || req.user.role;
  if (userRole === "user") {
    const tenant = await tenantModel.findOne({ userId: req.user._id });
    if (tenant) {
      const contract = await contractModel.findOne({ tenantId: tenant._id });
      if (contract) {
        query.contractId = contract._id;
      } else {
        query.contractId = "000000000000000000000000"; // Forces empty result if no contract
      }
    } else {
      query.contractId = "000000000000000000000000";
    }
  }

  const result = await invoiceService.getAllInvoicesService(query);
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
