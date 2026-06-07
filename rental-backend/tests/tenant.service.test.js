import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import { tenantRepository, roomRepository, buildingRepository } from "../src/repositories/index.js";
import {
  createTenantService,
  getAllTenantsService,
  getTenantsByRoomService,
  getTenantByIdService,
  updateTenantService,
  deleteTenantService,
  rentRoomService,
} from "../src/services/tenant.service.js";

describe("Tenant Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("rentRoomService", () => {
    it("should successfully rent a room for a tenant online", async () => {
      const currentUser = {
        _id: "user_123",
        role: "user",
        fullName: "User A",
        email: "user@example.com",
      };

      const mockRoom = {
        _id: "room_123",
        status: "available",
        maxCapacity: 2,
        save: async () => {},
      };

      const mockNewTenant = { _id: "tenant_123" };
      const mockPopulatedTenant = { _id: "tenant_123", fullName: "User A", roomId: "room_123" };

      mock.method(tenantRepository, "findOne", async () => null);
      mock.method(roomRepository, "findById", async () => mockRoom);
      mock.method(tenantRepository, "countDocuments", async () => 0);
      mock.method(tenantRepository, "create", async () => mockNewTenant);
      mock.method(tenantRepository, "findById", async () => mockPopulatedTenant);

      const res = await rentRoomService("room_123", currentUser);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Thuê phòng thành công");
      assert.strictEqual(res.data._id, "tenant_123");
      assert.strictEqual(mockRoom.status, "rented");
    });

    it("should throw 403 if landlord tries to rent online", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      await assert.rejects(
        rentRoomService("room_123", currentUser),
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.message, "Tài khoản quản trị hoặc chủ trọ không thể thuê phòng trực tuyến");
          return true;
        }
      );
    });

    it("should throw 400 if user is already renting another room", async () => {
      const currentUser = { _id: "user_123", role: "user" };
      mock.method(tenantRepository, "findOne", async () => ({ _id: "tenant_existing", status: "active" }));

      await assert.rejects(
        rentRoomService("room_123", currentUser),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Bạn đang thuê một phòng khác. Vui lòng trả phòng hiện tại trước.");
          return true;
        }
      );
    });
  });

  describe("createTenantService", () => {
    it("should successfully create a tenant by landlord", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      const mockRoom = {
        _id: "room_123",
        maxCapacity: 2,
        buildingId: {
          landlordId: "landlord_123",
        },
      };

      const tenantData = {
        roomId: "room_123",
        fullName: "Tenant B",
        identityCard: "123456789",
      };

      mock.method(roomRepository, "findById", async () => mockRoom);
      mock.method(tenantRepository, "findOne", async () => null);
      mock.method(tenantRepository, "countDocuments", async () => 0);
      mock.method(tenantRepository, "create", async () => ({ _id: "tenant_new" }));
      mock.method(tenantRepository, "findById", async () => ({ _id: "tenant_new", fullName: "Tenant B" }));

      const res = await createTenantService(tenantData, currentUser);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Tạo khách thuê thành công");
      assert.strictEqual(res.data.fullName, "Tenant B");
    });

    it("should throw 403 if landlord does not own the room's building", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      const mockRoom = {
        _id: "room_123",
        buildingId: {
          landlordId: "another_landlord",
        },
      };

      mock.method(roomRepository, "findById", async () => mockRoom);

      await assert.rejects(
        createTenantService({ roomId: "room_123", identityCard: "123" }, currentUser),
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.message, "Bạn không có quyền thao tác trên khách thuê của phòng này");
          return true;
        }
      );
    });
  });

  describe("getAllTenantsService", () => {
    it("should retrieve all tenants for admin", async () => {
      const currentUser = { _id: "admin_123", role: "admin" };
      const mockTenants = [{ _id: "t1" }, { _id: "t2" }];

      mock.method(tenantRepository, "find", async () => mockTenants);
      mock.method(tenantRepository, "countDocuments", async () => 2);

      const res = await getAllTenantsService({}, currentUser);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.tenants.length, 2);
      assert.strictEqual(res.data.pagination.totalCount, 2);
    });

    it("should retrieve only own tenants for landlord", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      const mockBuildings = [{ _id: "b1" }];
      const mockRooms = [{ _id: "r1" }];
      const mockTenants = [{ _id: "t1", roomId: "r1" }];

      mock.method(buildingRepository, "find", async () => mockBuildings);
      mock.method(roomRepository, "find", async () => mockRooms);
      mock.method(tenantRepository, "find", async () => mockTenants);
      mock.method(tenantRepository, "countDocuments", async () => 1);

      const res = await getAllTenantsService({}, currentUser);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.tenants.length, 1);
      assert.strictEqual(res.data.pagination.totalCount, 1);
    });
  });

  describe("updateTenantService", () => {
    it("should successfully update tenant information", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      const mockTenant = {
        _id: "tenant_123",
        roomId: "room_123",
        identityCard: "123456789",
      };

      const mockRoom = {
        _id: "room_123",
        buildingId: { landlordId: "landlord_123" },
      };

      mock.method(tenantRepository, "findById", async () => mockTenant);
      mock.method(roomRepository, "findById", async () => mockRoom);
      mock.method(tenantRepository, "findOne", async () => null);
      mock.method(tenantRepository, "findByIdAndUpdate", async () => ({ ...mockTenant, fullName: "New Name" }));

      const res = await updateTenantService("tenant_123", { fullName: "New Name" }, currentUser);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Cập nhật khách thuê thành công");
      assert.strictEqual(res.data.fullName, "New Name");
    });
  });

  describe("deleteTenantService", () => {
    it("should successfully delete tenant", async () => {
      const currentUser = { _id: "landlord_123", role: "landlord" };
      const mockTenant = { _id: "tenant_123", roomId: "room_123" };
      const mockRoom = { _id: "room_123", buildingId: { landlordId: "landlord_123" } };

      mock.method(tenantRepository, "findById", async () => mockTenant);
      mock.method(roomRepository, "findById", async () => mockRoom);
      mock.method(tenantRepository, "findByIdAndDelete", async () => {});

      const res = await deleteTenantService("tenant_123", currentUser);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Xóa khách thuê thành công");
    });
  });
});
