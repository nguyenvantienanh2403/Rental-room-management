import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { roomService } from "../services/index.js";

// ---------------------------------------------------------------------------
// POST /rooms
// ---------------------------------------------------------------------------
const createRoom = catchAsync(async (req, res) => {
  const data = await roomService.createRoomService(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms/building/:buildingId
// ---------------------------------------------------------------------------
const getRoomsByBuilding = catchAsync(async (req, res) => {
  const data = await roomService.getRoomsByBuildingService(req.params.buildingId, req.query);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /rooms/:slug
// ---------------------------------------------------------------------------
const getRoomBySlug = catchAsync(async (req, res) => {
  const data = await roomService.getRoomBySlugService(req.params.slug);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /rooms/:id
// ---------------------------------------------------------------------------
const updateRoom = catchAsync(async (req, res) => {
  const data = await roomService.updateRoomService(req.params.id, req.body);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /rooms/:id
// ---------------------------------------------------------------------------
const deleteRoom = catchAsync(async (req, res) => {
  const data = await roomService.deleteRoomService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

export {
  createRoom,
  getRoomsByBuilding,
  getRoomBySlug,
  updateRoom,
  deleteRoom,
};
