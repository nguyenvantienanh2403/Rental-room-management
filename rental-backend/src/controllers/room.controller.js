import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { roomService } from "../services/index.js";

// ---------------------------------------------------------------------------
// POST /rooms
// ---------------------------------------------------------------------------
const createRoom = catchAsync(async (req, res) => {
  const data = await roomService.createRoomService(req.body, req.user);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms/public
// ---------------------------------------------------------------------------
const getPublicRooms = catchAsync(async (req, res) => {
  const data = await roomService.getPublicRoomsService(req.query);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms
// ---------------------------------------------------------------------------
const getAllRooms = catchAsync(async (req, res) => {
  const data = await roomService.getAllRoomsService(req.query, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms/building/:buildingId
// ---------------------------------------------------------------------------
const getRoomsByBuilding = catchAsync(async (req, res) => {
  const data = await roomService.getRoomsByBuildingService(req.params.buildingId, req.query, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms/:slug
// ---------------------------------------------------------------------------
const getRoomBySlug = catchAsync(async (req, res) => {
  const data = await roomService.getRoomBySlugService(req.params.slug, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /rooms/:id
// ---------------------------------------------------------------------------
const updateRoom = catchAsync(async (req, res) => {
  const data = await roomService.updateRoomService(req.params.id, req.body, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /rooms/:id
// ---------------------------------------------------------------------------
const deleteRoom = catchAsync(async (req, res) => {
  const data = await roomService.deleteRoomService(req.params.id, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// POST /rooms/upload-images
// ---------------------------------------------------------------------------
const uploadRoomImages = catchAsync(async (req, res) => {
  const data = await roomService.uploadRoomImagesService(req.files);
  res.status(StatusCodes.OK).json(data);
});

export {
  createRoom,
  getAllRooms,
  getPublicRooms,
  getRoomsByBuilding,
  getRoomBySlug,
  updateRoom,
  deleteRoom,
  uploadRoomImages,
};
