import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import { buildingRepository } from "../src/repositories/index.js";
import {
  createBuildingService,
  getBuildingBySlugOrIdService,
} from "../src/services/building.service.js";

describe("Building Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("createBuildingService", () => {
    it("should successfully create a building", async () => {
      // Mock buildingRepository.create
      mock.method(buildingRepository, "create", async (data) => ({
        _id: "new_building_id",
        ...data,
      }));

      // Mock buildingRepository.findById
      mock.method(buildingRepository, "findById", async () => ({
        _id: "new_building_id",
        name: "Building A",
        landlordId: "landlord_id",
      }));

      const res = await createBuildingService(
        { _id: "landlord_id" },
        { name: "Building A" }
      );

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Tạo tòa nhà thành công");
      assert.strictEqual(res.data._id, "new_building_id");
    });
  });

  describe("getBuildingBySlugOrIdService", () => {
    it("should throw ApiError if building is not found", async () => {
      // Mock findOne to return null
      mock.method(buildingRepository, "findOne", async () => null);

      await assert.rejects(
        getBuildingBySlugOrIdService("nonexistent-slug", { _id: "admin_id", role: { name: "admin" } }),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy tòa nhà");
          return true;
        }
      );
    });

    it("should throw ApiError if building is inactive", async () => {
      // Mock findOne to return inactive building
      mock.method(buildingRepository, "findOne", async () => ({
        _id: "building_id",
        name: "Building A",
        status: "inactive",
        landlordId: "landlord_id",
      }));

      await assert.rejects(
        getBuildingBySlugOrIdService("inactive-slug", { _id: "landlord_id", role: { name: "landlord" } }),
        (err) => {
          assert.strictEqual(err.statusCode, 410);
          assert.strictEqual(err.message, "Tòa nhà này đã bị vô hiệu hóa");
          return true;
        }
      );
    });

    it("should throw ApiError if user is not landlord or admin", async () => {
      // Mock findOne to return building owned by another landlord
      mock.method(buildingRepository, "findOne", async () => ({
        _id: "building_id",
        name: "Building A",
        status: "active",
        landlordId: "another_landlord_id",
      }));

      await assert.rejects(
        getBuildingBySlugOrIdService("active-slug", { _id: "some_user_id", role: { name: "landlord" } }),
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.message, "Bạn không có quyền truy cập tòa nhà này");
          return true;
        }
      );
    });
  });
});
