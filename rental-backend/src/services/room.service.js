import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { roomModel, buildingModel } from "../models/index.js";

const ROOM_POPULATE = [
  {
    path: "buildingId",
    select: "name address type landlordId",
  },
];

// ---------------------------------------------------------------------------
// CREATE ROOM
// ---------------------------------------------------------------------------
const createRoomService = async (roomData) => {
  // Check if building exists
  const building = await buildingModel.findById(roomData.buildingId);
  if (!building) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Building not found");
  }

  const newRoom = await roomModel.create(roomData);

  const room = await roomModel
    .findById(newRoom._id)
    .populate(ROOM_POPULATE)
    .lean();

  return respone(StatusCodes.CREATED, "Room created successfully", room);
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

  return respone(StatusCodes.OK, "Rooms retrieved successfully", {
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
  const room = await roomModel
    .findOne({ slug })
    .populate(ROOM_POPULATE)
    .lean();

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  return respone(StatusCodes.OK, "Room retrieved successfully", room);
};

// ---------------------------------------------------------------------------
// UPDATE ROOM
// ---------------------------------------------------------------------------
const updateRoomService = async (roomId, updateData) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  const allowedFields = ["name", "price", "area", "status", "amenities", "images"];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No valid fields to update");
  }

  const updatedRoom = await roomModel
    .findByIdAndUpdate(roomId, { $set: sanitizedData }, { new: true, runValidators: true })
    .populate(ROOM_POPULATE)
    .lean();

  return respone(StatusCodes.OK, "Room updated successfully", updatedRoom);
};

// ---------------------------------------------------------------------------
// DELETE ROOM
// ---------------------------------------------------------------------------
const deleteRoomService = async (roomId) => {
  const room = await roomModel.findById(roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  await roomModel.findByIdAndDelete(roomId);

  return respone(StatusCodes.OK, "Room deleted successfully");
};

export {
  createRoomService,
  getRoomsByBuildingService,
  getRoomBySlugService,
  updateRoomService,
  deleteRoomService,
};
