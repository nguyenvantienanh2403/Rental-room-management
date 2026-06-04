import express from "express";
import { roomController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { roomValidation } from "../validation/index.js";

const roomRoute = express.Router();

// GET /rooms — Public: Get all rooms
roomRoute.get("/", roomController.getAllRooms);

// GET /rooms/building/:buildingId — Public: Get rooms in a specific building
roomRoute.get("/building/:buildingId", roomController.getRoomsByBuilding);

// GET /rooms/:slug — Public: Get room detail by slug
roomRoute.get("/:slug", roomController.getRoomBySlug);

// POST /rooms — Authenticated: Create a new room
roomRoute.post(
  "/",
  auth,
  validate(roomValidation.createRoom),
  roomController.createRoom,
);

// PATCH /rooms/:id — Authenticated: Update a room
roomRoute.patch(
  "/:id",
  auth,
  validate(roomValidation.updateRoom),
  roomController.updateRoom,
);

// DELETE /rooms/:id — Authenticated: Delete a room
roomRoute.delete("/:id", auth, roomController.deleteRoom);

export default roomRoute;
