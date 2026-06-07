import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { roomRepository, tenantRepository } from "../src/repositories/index.js";
import { createContractService } from "../src/services/contract.service.js";

// Mock Mongoose session
const mockSession = {
  startTransaction: () => {},
  commitTransaction: async () => {},
  abortTransaction: async () => {},
  endSession: () => {},
};

describe("Contract Service Unit Tests", () => {
  beforeEach(() => {
    mock.method(mongoose, "startSession", async () => mockSession);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("createContractService", () => {
    it("should throw ApiError if room is not found", async () => {
      mock.method(roomRepository, "findById", async () => null);

      await assert.rejects(
        createContractService({ roomId: "nonexistent_room", tenantId: "tenant_id" }),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy phòng");
          return true;
        }
      );
    });

    it("should throw ApiError if room is not available", async () => {
      mock.method(roomRepository, "findById", async () => ({ _id: "room_id", status: "rented" }));

      await assert.rejects(
        createContractService({ roomId: "rented_room", tenantId: "tenant_id" }),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Phòng này hiện không trống");
          return true;
        }
      );
    });

    it("should throw ApiError if tenant is not found", async () => {
      mock.method(roomRepository, "findById", async () => ({ _id: "room_id", status: "available" }));
      mock.method(tenantRepository, "findById", async () => null);

      await assert.rejects(
        createContractService({ roomId: "available_room", tenantId: "nonexistent_tenant" }),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy khách thuê");
          return true;
        }
      );
    });
  });
});
