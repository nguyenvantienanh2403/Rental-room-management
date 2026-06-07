import { describe, it, before, after, afterEach, mock } from "node:test";
import assert from "node:assert";
import express from "express";
import router from "../src/routes/index.js";
import errorHandler from "../src/middlewares/error.middleware.js";
import sentryHelper from "../src/utils/sentry.js";
import env from "../src/config/env.config.js";

describe("API Integration Tests", () => {
  let server;
  let baseUrl;

  before(() => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1", router);
    app.use(errorHandler); // Đảm bảo đính kèm error handler để bắt ApiError
    
    // Khởi chạy trên cổng ngẫu nhiên khả dụng (port 0)
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;
  });

  after(() => {
    server.close();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("POST /auth/login", () => {
    it("should return 400 Bad Request when request body is empty", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.ok(body.message); // Có tin nhắn lỗi validation từ Joi
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should return 401 Unauthorized when refresh token is missing", async () => {
      const res = await fetch(`${baseUrl}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.message, "Không tìm thấy refresh token");
    });
  });

  describe("POST /contracts", () => {
    it("should return 401 Unauthorized when authorization token is missing", async () => {
      const res = await fetch(`${baseUrl}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.message, "Không tìm thấy token");
    });
  });

  describe("POST /invoices", () => {
    it("should return 401 Unauthorized when authorization token is missing", async () => {
      const res = await fetch(`${baseUrl}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.message, "Không tìm thấy token");
    });
  });

  describe("Error Middleware Sentry Integration", () => {
    it("should capture 500 errors and send them to Sentry", async () => {
      const captureExceptionMock = mock.fn();
      mock.method(sentryHelper, "captureException", captureExceptionMock);

      const oldDsn = env.sentry.dsn;
      env.sentry.dsn = "https://mock-dsn@sentry.io/123";

      const app = express();
      app.get("/error-test", (req, res, next) => {
        next(new Error("Lỗi giả lập 500"));
      });
      app.use(errorHandler);

      const serverTest = app.listen(0);
      const port = serverTest.address().port;

      const res = await fetch(`http://localhost:${port}/error-test`);
      const body = await res.json();

      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.statusCode, 500);
      assert.strictEqual(captureExceptionMock.mock.callCount(), 1);

      serverTest.close();
      env.sentry.dsn = oldDsn;
    });

    it("should not capture operational errors (status code < 500) in Sentry", async () => {
      const captureExceptionMock = mock.fn();
      mock.method(sentryHelper, "captureException", captureExceptionMock);

      const oldDsn = env.sentry.dsn;
      env.sentry.dsn = "https://mock-dsn@sentry.io/123";

      const app = express();
      app.get("/error-test-400", (req, res, next) => {
        const err = new Error("Lỗi tham số đầu vào");
        err.statusCode = 400;
        next(err);
      });
      app.use(errorHandler);

      const serverTest = app.listen(0);
      const port = serverTest.address().port;

      const res = await fetch(`http://localhost:${port}/error-test-400`);
      const body = await res.json();

      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.statusCode, 400);
      assert.strictEqual(captureExceptionMock.mock.callCount(), 0);

      serverTest.close();
      env.sentry.dsn = oldDsn;
    });
  });
});
