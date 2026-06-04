import express from "express";
import { buildingController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { buildingValidation } from "../validation/index.js";

const buildingRoute = express.Router();

// GET /buildings — Authenticated: danh sách buildings
buildingRoute.get("/", auth, buildingController.getAllBuildings);

// GET /buildings/:identifier — Authenticated: chi tiết theo slug hoặc id
buildingRoute.get("/:identifier", auth, buildingController.getBuildingBySlugOrId);

// POST /buildings — Authenticated: tạo mới
buildingRoute.post(
  "/",
  auth,
  validate(buildingValidation.createBuilding),
  buildingController.createBuilding,
);

// PATCH /buildings/:id — Authenticated: cập nhật (owner only)
buildingRoute.patch(
  "/:id",
  auth,
  validate(buildingValidation.updateBuilding),
  buildingController.updateBuilding,
);

// DELETE /buildings/:id — Authenticated: soft delete (owner only)
buildingRoute.delete("/:id", auth, buildingController.deleteBuilding);

export default buildingRoute;
