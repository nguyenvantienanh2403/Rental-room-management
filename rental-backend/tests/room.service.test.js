import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import { roomRepository, buildingRepository } from "../src/repositories/index.js";
import { createRoomService } from "../src/services/room.service.js";

describe("Room Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("createRoomService", () => {
    it("should throw ApiError if building is not found", async () => {
      // Mock buildingRepository.findById to return null
      mock.method(buildingRepository, "findById", async () => null);

      await assert.rejects(
        createRoomService(
          { name: "101", buildingId: "nonexistent_building" },
          { _id: "landlord_id", role: { name: "landlord" } }
        ),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy tòa nhà");
          return true;
        }
      );
    });

    it("should throw ApiError if user is not the owner of the building", async () => {
      // Mock buildingRepository.findById to return building owned by another landlord
      mock.method(buildingRepository, "findById", async () => ({
        _id: "building_id",
        landlordId: "another_landlord_id",
      }));

      await assert.rejects(
        createRoomService(
          { name: "101", buildingId: "building_id" },
          { _id: "landlord_id", role: { name: "landlord" } }
        ),
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.message, "Bạn không có quyền thao tác trên tòa nhà này");
          return true;
        }
      );
    });

    it("should successfully create a room if user owns the building", async () => {
      // Mock buildingRepository.findById
      mock.method(buildingRepository, "findById", async () => ({
        _id: "building_id",
        landlordId: "landlord_id",
      }));

      // Mock roomRepository.create
      mock.method(roomRepository, "create", async (data) => ({
        _id: "new_room_id",
        ...data,
      }));

      // Mock roomRepository.findById
      mock.method(roomRepository, "findById", async () => ({
        _id: "new_room_id",
        name: "101",
        buildingId: "building_id",
      }));

      const res = await createRoomService(
        { name: "101", buildingId: "building_id" },
        { _id: "landlord_id", role: { name: "landlord" } }
      );

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Tạo phòng thành công");
      assert.strictEqual(res.data._id, "new_room_id");
    });
  });
});
