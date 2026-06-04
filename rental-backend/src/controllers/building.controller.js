import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { buildingService } from "../services/index.js";

// ---------------------------------------------------------------------------
// POST /buildings — Tạo building mới
// ---------------------------------------------------------------------------
const createBuilding = catchAsync(async (req, res) => {
  const data = await buildingService.createBuildingService(req.user, req.body);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /buildings — Danh sách buildings
// ---------------------------------------------------------------------------
const getAllBuildings = catchAsync(async (req, res) => {
  const data = await buildingService.getAllBuildingsService(req.query, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// GET /buildings/:identifier — Chi tiết building theo slug hoặc id
// ---------------------------------------------------------------------------
const getBuildingBySlugOrId = catchAsync(async (req, res) => {
  const data = await buildingService.getBuildingBySlugOrIdService(req.params.identifier, req.user);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /buildings/:id — Cập nhật building
// ---------------------------------------------------------------------------
const updateBuilding = catchAsync(async (req, res) => {
  const data = await buildingService.updateBuildingService(
    req.user,
    req.params.id,
    req.body,
  );
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /buildings/:id — Soft delete building
// ---------------------------------------------------------------------------
const deleteBuilding = catchAsync(async (req, res) => {
  const data = await buildingService.deleteBuildingService(req.user, req.params.id);
  res.status(StatusCodes.OK).json(data);
});

export {
  createBuilding,
  getAllBuildings,
  getBuildingBySlugOrId,
  updateBuilding,
  deleteBuilding,
};
