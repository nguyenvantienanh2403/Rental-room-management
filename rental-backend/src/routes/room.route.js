import express from "express";
import { roomController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { roomValidation } from "../validation/index.js";
import { uploadMultipleImages } from "../middlewares/upload.middleware.js";

const roomRoute = express.Router();

// POST /rooms/upload-images — Authenticated: Upload images
roomRoute.post("/upload-images", auth, uploadMultipleImages, roomController.uploadRoomImages);

// GET /rooms/public — Public: Get all available rooms for marketplace
roomRoute.get("/public", roomController.getPublicRooms);

// GET /rooms — Authenticated: Get all rooms
roomRoute.get("/", auth, roomController.getAllRooms);

// GET /rooms/building/:buildingId — Authenticated: Get rooms in a specific building
roomRoute.get("/building/:buildingId", auth, roomController.getRoomsByBuilding);

// GET /rooms/:slug — Authenticated: Get room detail by slug
roomRoute.get("/:slug", auth, roomController.getRoomBySlug);

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
