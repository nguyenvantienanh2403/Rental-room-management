import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { contractModel, invoiceModel, meterReadingModel } from "../src/models/index.js";
import { createInvoiceService } from "../src/services/invoice.service.js";

// Mock Mongoose session
const mockSession = {
  startTransaction: () => {},
  commitTransaction: async () => {},
  abortTransaction: async () => {},
  endSession: () => {},
};

describe("Invoice Service Unit Tests", () => {
  beforeEach(() => {
    mock.method(mongoose, "startSession", async () => mockSession);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("createInvoiceService", () => {
    it("should throw ApiError if contract is not found", async () => {
      // Mock invoiceModel.findOne to return null (no existing invoice for this month)
      mock.method(invoiceModel, "findOne", () => ({
        session: async () => null,
      }));

      // Mock meterReadingModel.findOne to return mock meter reading (passing reading check B1)
      mock.method(meterReadingModel, "findOne", () => ({
        session: async () => ({ _id: "reading_id" }),
      }));

      // Mock contractModel.findById to return null (simulate contract not found)
      mock.method(contractModel, "findById", () => ({
        session: async () => null,
      }));

      await assert.rejects(
        createInvoiceService({ contractId: "nonexistent_contract", month: 6, year: 2026 }),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy hợp đồng.");
          return true;
        }
      );
    });
  });
});
