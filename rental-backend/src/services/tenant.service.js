import { StatusCodes } from "http-status-codes";
import { ApiError, response, checkIsAdmin } from "../utils/index.js";
import { tenantRepository, roomRepository, buildingRepository } from "../repositories/index.js";

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

// Hàm tiện ích: Kiểm tra quyền sở hữu phòng (thông qua tòa nhà)
const verifyRoomOwnership = async (roomId, currentUser) => {
  if (checkIsAdmin(currentUser)) return true;
  
  const room = await roomRepository.findById(roomId, {
    select: 'buildingId',
    populate: { path: 'buildingId', select: 'landlordId' },
    lean: true,
  });
  if (!room) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  if (!room.buildingId) throw new ApiError(StatusCodes.NOT_FOUND, "Phòng này không thuộc tòa nhà nào");
  
  const landlordIdStr = room.buildingId.landlordId?._id 
    ? room.buildingId.landlordId._id.toString() 
    : room.buildingId.landlordId.toString();

  if (landlordIdStr !== currentUser._id.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền thao tác trên khách thuê của phòng này");
  }
  return true;
};

// ---------------------------------------------------------------------------
// RENT ROOM (Marketplace Flow)
// ---------------------------------------------------------------------------
const rentRoomService = async (roomId, currentUser) => {
  if (!roomId) throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu roomId");

  const roleName = typeof currentUser.role === 'object' ? currentUser.role?.name : currentUser.role;
  if (roleName && roleName.toLowerCase() !== "user") {
    throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản quản trị hoặc chủ trọ không thể thuê phòng trực tuyến");
  }

  // Kiểm tra xem người dùng hiện tại đã đang thuê một phòng khác chưa
  const activeTenant = await tenantRepository.findOne({ userId: currentUser._id, status: "active" });
  if (activeTenant) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Bạn đang thuê một phòng khác. Vui lòng trả phòng hiện tại trước.");
  }

  // Check if room exists and is available
  const room = await roomRepository.findById(roomId);
  if (!room) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  if (room.status !== "available") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng này hiện không có sẵn để thuê");
  }

  // Check capacity
  const currentTenantsCount = await tenantRepository.countDocuments({ roomId, status: "active" });
  if (currentTenantsCount >= room.maxCapacity) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng đã đạt giới hạn sức chứa tối đa");
  }

  // Create tenant profile using User's data
  const tenantData = {
    userId: currentUser._id,
    fullName: currentUser.fullName || currentUser.username,
    identityCard: currentUser.identityCard || "000000000000",
    phoneNumber: currentUser.phoneNumber || "0000000000",
    email: currentUser.email,
    homeTown: currentUser.homeTown || "Chưa cập nhật",
    roomId: roomId,
    status: "active"
  };

  const newTenant = await tenantRepository.create(tenantData);

  // Update room status
  room.status = "rented";
  await room.save();

  const tenant = await tenantRepository.findById(newTenant._id, {
    populate: TENANT_POPULATE,
    lean: true,
  });

  return response(StatusCodes.CREATED, "Thuê phòng thành công", tenant);
};

// ---------------------------------------------------------------------------
// CREATE TENANT (Admin/Landlord Flow)
// ---------------------------------------------------------------------------
const createTenantService = async (tenantData, currentUser) => {
  // Quyền sở hữu: Chỉ được thêm khách vào phòng của mình
  await verifyRoomOwnership(tenantData.roomId, currentUser);

  // Check if identityCard already exists
  const existingTenant = await tenantRepository.findOne({
    identityCard: tenantData.identityCard,
  });
  if (existingTenant) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Căn cước công dân đã tồn tại trong hệ thống",
    );
  }

  // Capacity check
  const room = await roomRepository.findById(tenantData.roomId);
  const currentTenantsCount = await tenantRepository.countDocuments({ roomId: tenantData.roomId, status: "active" });
  if (currentTenantsCount >= room.maxCapacity) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Phòng đã đạt giới hạn sức chứa tối đa. Không thể thêm người."
    );
  }

  const newTenant = await tenantRepository.create(tenantData);

  const tenant = await tenantRepository.findById(newTenant._id, {
    populate: TENANT_POPULATE,
    lean: true,
  });

  return response(StatusCodes.CREATED, "Tạo khách thuê thành công", tenant);
};

// ---------------------------------------------------------------------------
// GET ALL TENANTS
// ---------------------------------------------------------------------------
const getAllTenantsService = async (queryOptions = {}, currentUser) => {
  let filter = {};

  if (!checkIsAdmin(currentUser)) {
    // Landlord: Lấy danh sách ID các tòa nhà của họ
    const buildings = await buildingRepository.find({ landlordId: currentUser._id }, { select: '_id', lean: true });
    const buildingIds = buildings.map(b => b._id);
    
    // Lấy danh sách ID các phòng thuộc các tòa nhà đó
    const rooms = await roomRepository.find({ buildingId: { $in: buildingIds } }, { select: '_id', lean: true });
    const roomIds = rooms.map(r => r._id);
    
    filter.roomId = { $in: roomIds };
  }

  const tenants = await tenantRepository.find(filter, {
    populate: TENANT_POPULATE,
    sort: { createdAt: -1 },
    lean: true,
  });

  return response(StatusCodes.OK, "Lấy danh sách tất cả khách thuê thành công", tenants);
};

// ---------------------------------------------------------------------------
// GET TENANTS BY ROOM ID
// ---------------------------------------------------------------------------
const getTenantsByRoomService = async (roomId, currentUser) => {
  await verifyRoomOwnership(roomId, currentUser);

  const tenants = await tenantRepository.find({ roomId }, {
    populate: TENANT_POPULATE,
    sort: { createdAt: -1 },
    lean: true,
  });

  return response(StatusCodes.OK, "Lấy danh sách khách thuê thành công", tenants);
};

// ---------------------------------------------------------------------------
// GET TENANT BY ID
// ---------------------------------------------------------------------------
const getTenantByIdService = async (tenantId, currentUser) => {
  const tenant = await tenantRepository.findById(tenantId, { lean: true });
  if (!tenant) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");
  
  await verifyRoomOwnership(tenant.roomId, currentUser);

  const populatedTenant = await tenantRepository.findById(tenantId, {
    populate: TENANT_POPULATE,
    lean: true,
  });
  return response(StatusCodes.OK, "Lấy thông tin khách thuê thành công", populatedTenant);
};

// ---------------------------------------------------------------------------
// UPDATE TENANT
// ---------------------------------------------------------------------------
const updateTenantService = async (tenantId, updateData, currentUser) => {
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");

  // Kiểm tra phòng cũ của khách thuê này xem mình có quyền không
  await verifyRoomOwnership(tenant.roomId, currentUser);

  // Check if identityCard is being updated and if it conflicts
  if (
    updateData.identityCard &&
    updateData.identityCard !== tenant.identityCard
  ) {
    const existingTenant = await tenantRepository.findOne({
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
    // Phải có quyền ở cả phòng mới
    await verifyRoomOwnership(updateData.roomId, currentUser);
    
    const room = await roomRepository.findById(updateData.roomId);
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
    }

    // Capacity check for new room
    const currentTenantsCount = await tenantRepository.countDocuments({ roomId: updateData.roomId, status: "active" });
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

  const updatedTenant = await tenantRepository.findByIdAndUpdate(
    tenantId,
    { $set: sanitizedData },
    { populate: TENANT_POPULATE, lean: true }
  );

  return response(StatusCodes.OK, "Cập nhật khách thuê thành công", updatedTenant);
};

// ---------------------------------------------------------------------------
// DELETE TENANT
// ---------------------------------------------------------------------------
const deleteTenantService = async (tenantId, currentUser) => {
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy khách thuê");

  await verifyRoomOwnership(tenant.roomId, currentUser);

  await tenantRepository.findByIdAndDelete(tenantId);

  return response(StatusCodes.OK, "Xóa khách thuê thành công");
};

export {
  createTenantService,
  getAllTenantsService,
  getTenantsByRoomService,
  getTenantByIdService,
  updateTenantService,
  deleteTenantService,
  rentRoomService,
};
