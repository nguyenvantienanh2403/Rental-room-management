import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { contractService } from "../services/index.js";

// ---------------------------------------------------------------------------
// POST /contracts
// ---------------------------------------------------------------------------
const createContract = catchAsync(async (req, res) => {
  const data = await contractService.createContractService(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /contracts
// ---------------------------------------------------------------------------
const getAllContracts = catchAsync(async (req, res) => {
  const data = await contractService.getAllContractsService(req.query);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /contracts/:id
// ---------------------------------------------------------------------------
const getContractById = catchAsync(async (req, res) => {
  const data = await contractService.getContractByIdService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /contracts/:id
// ---------------------------------------------------------------------------
const updateContract = catchAsync(async (req, res) => {
  const data = await contractService.updateContractService(req.params.id, req.body);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /contracts/:id
// ---------------------------------------------------------------------------
const deleteContract = catchAsync(async (req, res) => {
  const data = await contractService.deleteContractService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

export {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
  deleteContract,
};
