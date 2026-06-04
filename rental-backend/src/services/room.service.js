import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { roomModel, buildingModel } from "../models/index.js";

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

// ---------------------------------------------------------------------------
// CREATE ROOM
// ---------------------------------------------------------------------------
const createRoomService = async (roomData) => {
  // Check if building exists
  const building = await buildingModel.findById(roomData.buildingId);
  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy tòa nhà");
  }

  const newRoom = await roomModel.create(roomData);

  const room = await roomModel
    .findById(newRoom._id)
    .populate(ROOM_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Tạo phòng thành công", room);
};

// ---------------------------------------------------------------------------
// GET ROOMS BY BUILDING ID
// ---------------------------------------------------------------------------
const getRoomsByBuildingService = async (buildingId, queryOptions = {}) => {
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

  return respone(StatusCodes.OK, "Lấy danh sách phòng thành công", {
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
// GET ALL ROOMS
// ---------------------------------------------------------------------------
const getAllRoomsService = async (queryOptions = {}) => {
  const { page = 1, limit = 10, status } = queryOptions;

  const filter = {};

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

  return respone(StatusCodes.OK, "Lấy danh sách tất cả phòng thành công", {
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
const getRoomBySlugService = async (slug) => {
  const room = await roomModel.findOne({ slug }).populate(ROOM_POPULATE).lean();

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  return respone(StatusCodes.OK, "Lấy thông tin phòng thành công", room);
};

// ---------------------------------------------------------------------------
// UPDATE ROOM
// ---------------------------------------------------------------------------
const updateRoomService = async (roomId, updateData) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

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

  return respone(StatusCodes.OK, "Cập nhật phòng thành công", updatedRoom);
};

// ---------------------------------------------------------------------------
// DELETE ROOM
// ---------------------------------------------------------------------------
const deleteRoomService = async (roomId) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng");
  }

  await roomModel.findByIdAndDelete(roomId);

  return respone(StatusCodes.OK, "Xóa phòng thành công");
};

export {
  createRoomService,
  getAllRoomsService,
  getRoomsByBuildingService,
  getRoomBySlugService,
  updateRoomService,
  deleteRoomService,
};
