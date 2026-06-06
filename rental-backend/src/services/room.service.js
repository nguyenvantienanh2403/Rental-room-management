import { StatusCodes } from "http-status-codes";
import { ApiError, response } from "../utils/index.js";
import { roomModel, buildingModel } from "../models/index.js";
import { ROLES } from "../constants/index.js";

const ROOM_POPULATE = [
  {
    path: "buildingId",
    select: "name address type landlordId",
  },
  {
    path: "tenants",
    match: { status: "active" },
    select: "fullName identityCard phoneNumber homeTown",
  },
];

const checkIsAdmin = (user) => {
  if (!user || !user.role) return false;
  const roleName = typeof user.role === 'object' ? user.role.name : user.role;
  return roleName?.toLowerCase() === ROLES.ADMIN;
};

// Hàm tiện ích: Lấy tất cả ID tòa nhà của một Landlord
const getLandlordBuildingIds = async (landlordId) => {
  const buildings = await buildingModel.find({ landlordId }).select('_id').lean();
  return buildings.map(b => b._id);
};

// Hàm tiện ích: Kiểm tra quyền sở hữu tòa nhà
const verifyBuildingOwnership = async (buildingId, currentUser) => {
  if (checkIsAdmin(currentUser)) return true;
  const building = await buildingModel.findById(buildingId).select('landlordId').lean();
  if (!building) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  if (building.landlordId.toString() !== currentUser._id.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền thao tác trên tòa nhà này");
  }
  return true;
};

// ---------------------------------------------------------------------------
// CREATE ROOM
// ---------------------------------------------------------------------------
const createRoomService = async (roomData, currentUser) => {
  // Check ownership of building
  await verifyBuildingOwnership(roomData.buildingId, currentUser);

  const newRoom = await roomModel.create(roomData);

  const room = await roomModel
    .findById(newRoom._id)
    .populate(ROOM_POPULATE)
    .lean();

  return response(StatusCodes.CREATED, "Tạo phòng thành công", room);
};

// ---------------------------------------------------------------------------
// GET ROOMS BY BUILDING ID
// ---------------------------------------------------------------------------
const getRoomsByBuildingService = async (buildingId, queryOptions = {}, currentUser) => {
  // Kiểm tra quyền xem building này
  await verifyBuildingOwnership(buildingId, currentUser);

  const { page = 1, limit = 10, status } = queryOptions;
  const filter = { buildingId };

  if (status && ["available", "rented", "maintenance"].includes(status)) {
    filter.status = status;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomModel
      .find(filter)
      .populate(ROOM_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    roomModel.countDocuments(filter),
  ]);

  return response(StatusCodes.OK, "Lấy danh sách phòng thành công", {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET PUBLIC ROOMS (Marketplace)
// ---------------------------------------------------------------------------
const getPublicRoomsService = async (queryOptions = {}) => {
  const { page = 1, limit = 10 } = queryOptions;
  const filter = { status: "available" }; // Luôn luôn chỉ lấy phòng trống

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomModel
      .find(filter)
      .populate(ROOM_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    roomModel.countDocuments(filter),
  ]);

  return response(StatusCodes.OK, "Lấy danh sách phòng trống thành công", {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET ALL ROOMS (Xử lý Data Ownership toàn cục)
// ---------------------------------------------------------------------------
const getAllRoomsService = async (queryOptions = {}, currentUser) => {
  const { page = 1, limit = 10, status } = queryOptions;
  const filter = {};

  // Data ownership: Nếu không phải admin, chỉ lấy phòng thuộc các tòa nhà của mình
  if (!checkIsAdmin(currentUser)) {
    const allowedBuildingIds = await getLandlordBuildingIds(currentUser._id);
    filter.buildingId = { $in: allowedBuildingIds };
  }

  if (status && ["available", "rented", "maintenance"].includes(status)) {
    filter.status = status;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [rooms, totalCount] = await Promise.all([
    roomModel
      .find(filter)
      .populate(ROOM_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    roomModel.countDocuments(filter),
  ]);

  return response(StatusCodes.OK, "Lấy danh sách tất cả phòng thành công", {
    rooms,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET ROOM BY SLUG
// ---------------------------------------------------------------------------
const getRoomBySlugService = async (slug, currentUser) => {
  const room = await roomModel.findOne({ slug }).populate(ROOM_POPULATE).lean();

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId._id || room.buildingId, currentUser);

  return response(StatusCodes.OK, "Lấy thông tin phòng thành công", room);
};

// ---------------------------------------------------------------------------
// UPDATE ROOM
// ---------------------------------------------------------------------------
const updateRoomService = async (roomId, updateData, currentUser) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId, currentUser);

  const allowedFields = [
    "name",
    "price",
    "area",
    "status",
    "amenities",
    "images",
    "maxCapacity",
  ];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Không có dữ liệu hợp lệ để cập nhật",
    );
  }

  const updatedRoom = await roomModel
    .findByIdAndUpdate(
      roomId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .populate(ROOM_POPULATE)
    .lean();

  return response(StatusCodes.OK, "Cập nhật phòng thành công", updatedRoom);
};

// ---------------------------------------------------------------------------
// DELETE ROOM
// ---------------------------------------------------------------------------
const deleteRoomService = async (roomId, currentUser) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  // Check ownership
  await verifyBuildingOwnership(room.buildingId, currentUser);

  await roomModel.findByIdAndDelete(roomId);

  return response(StatusCodes.OK, "Xóa phòng thành công");
};

// ---------------------------------------------------------------------------
// UPLOAD ROOM IMAGES
// ---------------------------------------------------------------------------
const uploadRoomImagesService = async (files) => {
  if (!files || files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không có file ảnh được cung cấp");
  }

  const uploadPromises = files.map(file => 
    import("./upload.service.js").then(m => m.uploadToCloudinary(
      file.buffer,
      "rental-app/rooms",
      {
        transformation: [
          { width: 1200, height: 800, crop: "fill" },
          { quality: "auto", fetch_format: "auto" },
        ],
      }
    ))
  );

  const results = await Promise.all(uploadPromises);
  const imageUrls = results.map(result => result.secure_url);

  return response(StatusCodes.OK, "Tải ảnh lên thành công", imageUrls);
};

export {
  createRoomService,
  getRoomsByBuildingService,
  getAllRoomsService,
  getPublicRoomsService,
  getRoomBySlugService,
  updateRoomService,
  deleteRoomService,
  uploadRoomImagesService,
};
