import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import { userModel, roleModel, token } from "../src/models/index.js";
import { registerService, loginService, refreshTokenService, logoutService } from "../src/services/auth.service.js";
import bcrypt from "bcrypt";
import { jwt_utils } from "../src/utils/index.js";

describe("Auth Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("registerService", () => {
    it("should throw ApiError if email is already taken", async () => {
      // Giả lập email đã tồn tại
      mock.method(userModel, "findOne", async () => {
        return { _id: "existing_user_id" };
      });

      await assert.rejects(
        registerService({ email: "test@example.com", username: "test" }),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Email đã được sử dụng");
          return true;
        }
      );
    });

    it("should successfully register a new user", async () => {
      // Giả lập email chưa tồn tại
      mock.method(userModel, "findOne", async () => null);
      // Giả lập tìm thấy role mặc định
      mock.method(roleModel, "findOne", async () => ({ _id: "role_user_id" }));
      // Giả lập tạo user mới thành công
      mock.method(userModel, "create", async (data) => ({
        _id: "new_user_id",
        username: data.username,
        email: data.email,
      }));

      const res = await registerService({
        username: "newuser",
        email: "new@example.com",
        password: "password123",
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Đăng ký thành công");
      assert.strictEqual(res.data.userId, "new_user_id");
    });
  });

  describe("loginService", () => {
    it("should throw ApiError if user email is not found", async () => {
      mock.method(userModel, "findOne", () => ({
        populate: () => null
      }));

      await assert.rejects(
        loginService("wrong@example.com", "password", {}),
        (err) => {
          assert.strictEqual(err.statusCode, 401);
          assert.strictEqual(err.message, "Email hoặc mật khẩu không hợp lệ");
          return true;
        }
      );
    });

    it("should throw ApiError if password does not match", async () => {
      mock.method(userModel, "findOne", () => ({
        populate: () => ({
          _id: "user_id",
          password: "hashed_password",
        })
      }));
      mock.method(bcrypt, "compare", async () => false);

      await assert.rejects(
        loginService("test@example.com", "wrong_pass", {}),
        (err) => {
          assert.strictEqual(err.statusCode, 401);
          assert.strictEqual(err.message, "Email hoặc mật khẩu không hợp lệ");
          return true;
        }
      );
    });
  });

  describe("logoutService", () => {
    it("should throw ApiError if no refresh token is provided", async () => {
      await assert.rejects(
        logoutService(null),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Không tìm thấy refresh token");
          return true;
        }
      );
    });

    it("should delete refresh token successfully", async () => {
      mock.method(token, "deleteOne", async () => ({ deletedCount: 1 }));

      const res = await logoutService("valid_token");
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Đăng xuất thành công");
    });
  });
});
