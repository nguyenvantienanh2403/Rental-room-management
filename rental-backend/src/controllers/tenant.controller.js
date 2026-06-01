import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { tenantService } from "../services/index.js";

// ---------------------------------------------------------------------------
// POST /tenants
// ---------------------------------------------------------------------------
const createTenant = catchAsync(async (req, res) => {
  const data = await tenantService.createTenantService(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /tenants/room/:roomId
// ---------------------------------------------------------------------------
const getTenantsByRoom = catchAsync(async (req, res) => {
  const data = await tenantService.getTenantsByRoomService(req.params.roomId);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /tenants/:id
// ---------------------------------------------------------------------------
const getTenantById = catchAsync(async (req, res) => {
  const data = await tenantService.getTenantByIdService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /tenants/:id
// ---------------------------------------------------------------------------
const updateTenant = catchAsync(async (req, res) => {
  const data = await tenantService.updateTenantService(req.params.id, req.body);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /tenants/:id
// ---------------------------------------------------------------------------
const deleteTenant = catchAsync(async (req, res) => {
  const data = await tenantService.deleteTenantService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

export {
  createTenant,
  getTenantsByRoom,
  getTenantById,
  updateTenant,
  deleteTenant,
};
