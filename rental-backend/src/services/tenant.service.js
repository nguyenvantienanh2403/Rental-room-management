import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { tenantModel, roomModel } from "../models/index.js";

const TENANT_POPULATE = [
  {
    path: "roomId",
    select: "name price buildingId",
    populate: {
      path: "buildingId",
      select: "name address",
    },
  },
];

// ---------------------------------------------------------------------------
// CREATE TENANT
// ---------------------------------------------------------------------------
const createTenantService = async (tenantData) => {
  // Check if identityCard already exists
  const existingTenant = await tenantModel.findOne({
    identityCard: tenantData.identityCard,
  });
  if (existingTenant) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Identity card already exists in the system",
    );
  }

  // Check if room exists
  const room = await roomModel.findById(tenantData.roomId);
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  const newTenant = await tenantModel.create(tenantData);

  const tenant = await tenantModel
    .findById(newTenant._id)
    .populate(TENANT_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Tenant created successfully", tenant);
};

// ---------------------------------------------------------------------------
// GET TENANTS BY ROOM ID
// ---------------------------------------------------------------------------
const getTenantsByRoomService = async (roomId) => {
  const tenants = await tenantModel
    .find({ roomId })
    .populate(TENANT_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return respone(StatusCodes.OK, "Tenants retrieved successfully", tenants);
};

// ---------------------------------------------------------------------------
// GET TENANT BY ID
// ---------------------------------------------------------------------------
const getTenantByIdService = async (tenantId) => {
  const tenant = await tenantModel
    .findById(tenantId)
    .populate(TENANT_POPULATE)
    .lean();

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  return respone(StatusCodes.OK, "Tenant retrieved successfully", tenant);
};

// ---------------------------------------------------------------------------
// UPDATE TENANT
// ---------------------------------------------------------------------------
const updateTenantService = async (tenantId, updateData) => {
  const tenant = await tenantModel.findById(tenantId);

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  // Check if identityCard is being updated and if it conflicts
  if (
    updateData.identityCard &&
    updateData.identityCard !== tenant.identityCard
  ) {
    const existingTenant = await tenantModel.findOne({
      identityCard: updateData.identityCard,
    });
    if (existingTenant) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Identity card already exists in the system",
      );
    }
  }

  // Check if room is being updated and if it exists
  if (updateData.roomId && updateData.roomId !== tenant.roomId.toString()) {
    const room = await roomModel.findById(updateData.roomId);
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
    }
  }

  const allowedFields = [
    "fullName",
    "identityCard",
    "phoneNumber",
    "email",
    "homeTown",
    "roomId",
    "status",
  ];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No valid fields to update");
  }

  const updatedTenant = await tenantModel
    .findByIdAndUpdate(
      tenantId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .populate(TENANT_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Tenant updated successfully", updatedTenant);
};

// ---------------------------------------------------------------------------
// DELETE TENANT
// ---------------------------------------------------------------------------
const deleteTenantService = async (tenantId) => {
  const tenant = await tenantModel.findById(tenantId);

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  await tenantModel.findByIdAndDelete(tenantId);

  return respone(StatusCodes.OK, "Tenant deleted successfully");
};

export {
  createTenantService,
  getTenantsByRoomService,
  getTenantByIdService,
  updateTenantService,
  deleteTenantService,
};
