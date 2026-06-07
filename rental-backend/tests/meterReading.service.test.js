import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import { meterReadingRepository, invoiceRepository, contractRepository } from "../src/repositories/index.js";
import {
  createMeterReadingService,
  updateMeterReadingService,
  deleteMeterReadingService,
  getAllMeterReadingsService,
  getMeterReadingByIdService,
} from "../src/services/meterReading.service.js";

describe("Meter Reading Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("createMeterReadingService", () => {
    it("should successfully create a meter reading", async () => {
      const mockContract = { _id: "contract_123" };
      const prevReading = {
        year: 2026,
        month: 5,
        electricity: { newIndex: 100 },
        water: { newIndex: 50 },
      };

      const readingData = {
        contractId: "contract_123",
        month: 6,
        year: 2026,
        electricity: { newIndex: 150, isMeterReplaced: false },
        water: { newIndex: 70, isMeterReplaced: false },
      };

      mock.method(contractRepository, "findById", async () => mockContract);
      mock.method(meterReadingRepository, "findOne", async (filter, options) => {
        // Return null for duplicate check, return prevReading for inheritance
        if (options && options.sort) {
          return prevReading;
        }
        return null;
      });
      mock.method(meterReadingRepository, "create", async (data) => ({ _id: "reading_123", ...data }));

      const res = await createMeterReadingService(readingData);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Tạo phiếu chốt số thành công");
      assert.strictEqual(res.data.electricity.oldIndex, 100);
      assert.strictEqual(res.data.electricity.newIndex, 150);
    });

    it("should throw 404 if contract is not found", async () => {
      mock.method(contractRepository, "findById", async () => null);

      await assert.rejects(
        createMeterReadingService({ contractId: "nonexistent" }),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy hợp đồng.");
          return true;
        }
      );
    });

    it("should throw 400 if reading for the month already exists", async () => {
      mock.method(contractRepository, "findById", async () => ({ _id: "contract_123" }));
      mock.method(meterReadingRepository, "findOne", async () => ({ _id: "already_exists" }));

      await assert.rejects(
        createMeterReadingService({ contractId: "contract_123", month: 6, year: 2026 }),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Phiếu chốt số cho tháng này đã tồn tại.");
          return true;
        }
      );
    });

    it("should throw 400 if electricity new index is smaller than old index", async () => {
      const mockContract = { _id: "contract_123" };
      const prevReading = {
        year: 2026,
        month: 5,
        electricity: { newIndex: 200 },
      };

      mock.method(contractRepository, "findById", async () => mockContract);
      mock.method(meterReadingRepository, "findOne", async (filter, options) => {
        if (options && options.sort) return prevReading;
        return null;
      });

      await assert.rejects(
        createMeterReadingService({
          contractId: "contract_123",
          month: 6,
          year: 2026,
          electricity: { newIndex: 190, isMeterReplaced: false },
        }),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes("không được nhỏ hơn chỉ số cũ"));
          return true;
        }
      );
    });
  });

  describe("updateMeterReadingService", () => {
    it("should successfully update latest meter reading if invoice is in draft", async () => {
      const mockReading = {
        _id: "reading_123",
        contractId: "contract_123",
        month: 6,
        year: 2026,
        electricity: { oldIndex: 100, newIndex: 150, isMeterReplaced: false },
        save: async () => {},
      };

      mock.method(meterReadingRepository, "findById", async () => mockReading);
      mock.method(invoiceRepository, "findOne", async () => ({ status: "draft" })); // invoice is in draft
      mock.method(meterReadingRepository, "findOne", async () => mockReading); // latest reading is this reading

      const res = await updateMeterReadingService("reading_123", {
        electricity: { newIndex: 180, isMeterReplaced: false },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Cập nhật phiếu chốt số thành công");
      assert.strictEqual(mockReading.electricity.newIndex, 180);
    });

    it("should throw 400 if related invoice is not in draft (locked)", async () => {
      mock.method(meterReadingRepository, "findById", async () => ({
        _id: "reading_123",
        contractId: "contract_123",
        month: 6,
        year: 2026,
      }));
      mock.method(invoiceRepository, "findOne", async () => ({ status: "paid" })); // paid invoice, locked

      await assert.rejects(
        updateMeterReadingService("reading_123", {}),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes("Phiếu chốt số đã được lập hóa đơn chính thức"));
          return true;
        }
      );
    });

    it("should throw 400 if updating reading that is not the latest", async () => {
      mock.method(meterReadingRepository, "findById", async () => ({
        _id: "reading_old",
        contractId: "contract_123",
        month: 5,
        year: 2026,
      }));
      mock.method(invoiceRepository, "findOne", async () => null); // no invoice
      mock.method(meterReadingRepository, "findOne", async () => ({ _id: "reading_latest" })); // latest is different

      await assert.rejects(
        updateMeterReadingService("reading_old", {}),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes("Chỉ được phép sửa/xóa phiếu chốt số mới nhất"));
          return true;
        }
      );
    });
  });

  describe("deleteMeterReadingService", () => {
    it("should successfully delete latest meter reading if invoice is in draft", async () => {
      const mockReading = {
        _id: "reading_123",
        contractId: "contract_123",
        month: 6,
        year: 2026,
      };

      mock.method(meterReadingRepository, "findById", async () => mockReading);
      mock.method(invoiceRepository, "findOne", async () => null); // no invoice means unlocked
      mock.method(meterReadingRepository, "findOne", async () => mockReading); // is latest
      mock.method(meterReadingRepository, "findByIdAndDelete", async () => {});

      const res = await deleteMeterReadingService("reading_123");

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Xóa phiếu chốt số thành công");
    });
  });
});
