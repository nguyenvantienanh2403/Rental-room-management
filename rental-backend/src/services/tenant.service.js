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
      "Căn cước công dân đã tồn tại trong hệ thống",
    );
  }

  // Check if room exists
  const room = await roomModel.findById(tenantData.roomId);
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Capacity check
  const currentTenantsCount = await tenantModel.countDocuments({ roomId: tenantData.roomId, status: "active" });
  if (currentTenantsCount >= room.maxCapacity) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Phòng đã đạt giới hạn sức chứa tối đa. Không thể thêm người."
    );
  }

  const newTenant = await tenantModel.create(tenantData);

  const tenant = await tenantModel
    .findById(newTenant._id)
    .populate(TENANT_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Tạo khách thuê thành công", tenant);
};

// ---------------------------------------------------------------------------
// GET ALL TENANTS
// ---------------------------------------------------------------------------
const getAllTenantsService = async (queryOptions = {}) => {
  const tenants = await tenantModel
    .find({})
    .populate(TENANT_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return respone(StatusCodes.OK, "Lấy danh sách tất cả khách thuê thành công", tenants);
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

  return respone(StatusCodes.OK, "Lấy danh sách khách thuê thành công", tenants);
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
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
  }

  return respone(StatusCodes.OK, "Lấy thông tin khách thuê thành công", tenant);
};

// ---------------------------------------------------------------------------
// UPDATE TENANT
// ---------------------------------------------------------------------------
const updateTenantService = async (tenantId, updateData) => {
  const tenant = await tenantModel.findById(tenantId);

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
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
        "Căn cước công dân đã tồn tại trong hệ thống",
      );
    }
  }

  // Check if room is being updated and if it exists
  if (updateData.roomId && updateData.roomId !== tenant.roomId.toString()) {
    const room = await roomModel.findById(updateData.roomId);
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
    }

    // Capacity check for new room
    const currentTenantsCount = await tenantModel.countDocuments({ roomId: updateData.roomId, status: "active" });
    if (currentTenantsCount >= room.maxCapacity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Phòng đã đạt giới hạn sức chứa tối đa. Không thể thêm người."
      );
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
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không có dữ liệu hợp lệ để cập nhật");
  }

  const updatedTenant = await tenantModel
    .findByIdAndUpdate(
      tenantId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .populate(TENANT_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Cập nhật khách thuê thành công", updatedTenant);
};

// ---------------------------------------------------------------------------
// DELETE TENANT
// ---------------------------------------------------------------------------
const deleteTenantService = async (tenantId) => {
  const tenant = await tenantModel.findById(tenantId);

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
  }

  await tenantModel.findByIdAndDelete(tenantId);

  return respone(StatusCodes.OK, "Xóa khách thuê thành công");
};

export {
  createTenantService,
  getAllTenantsService,
  getTenantsByRoomService,
  getTenantByIdService,
  updateTenantService,
  deleteTenantService,
};
