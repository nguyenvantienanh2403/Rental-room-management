import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { userRepository, roleRepository } from "../src/repositories/index.js";
import {
  getUserByIdService,
  getAllUsersService,
  updateProfileService,
  changePasswordService,
  deleteUserService,
  requestEmailChangeService,
  verifyEmailChangeService,
  createLandlordService,
} from "../src/services/user.service.js";

describe("User Service Unit Tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("getUserByIdService", () => {
    it("should successfully retrieve a user by ID", async () => {
      const mockUser = {
        _id: "user_123",
        username: "testuser",
        email: "test@example.com",
        status: "active",
      };

      mock.method(userRepository, "findById", async () => mockUser);

      const res = await getUserByIdService("user_123");

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Lấy thông tin người dùng thành công");
      assert.strictEqual(res.data._id, "user_123");
      assert.strictEqual(res.data.username, "testuser");
    });

    it("should throw 404 ApiError if user does not exist", async () => {
      mock.method(userRepository, "findById", async () => null);

      await assert.rejects(
        getUserByIdService("nonexistent_id"),
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.message, "Không tìm thấy người dùng");
          return true;
        }
      );
    });

    it("should throw 410 ApiError if user is inactive", async () => {
      const mockUser = {
        _id: "user_123",
        status: "inactive",
      };

      mock.method(userRepository, "findById", async () => mockUser);

      await assert.rejects(
        getUserByIdService("user_123"),
        (err) => {
          assert.strictEqual(err.statusCode, 410);
          assert.strictEqual(err.message, "Tài khoản này đã bị vô hiệu hóa");
          return true;
        }
      );
    });
  });

  describe("getAllUsersService", () => {
    it("should retrieve a list of users with pagination", async () => {
      const mockUsers = [
        { _id: "user_1", username: "user1", email: "user1@example.com" },
        { _id: "user_2", username: "user2", email: "user2@example.com" },
      ];

      mock.method(userRepository, "find", async () => mockUsers);
      mock.method(userRepository, "countDocuments", async () => 2);

      const res = await getAllUsersService({ page: 1, limit: 10 });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Lấy danh sách người dùng thành công");
      assert.strictEqual(res.data.users.length, 2);
      assert.strictEqual(res.data.pagination.totalCount, 2);
      assert.strictEqual(res.data.pagination.totalPages, 1);
    });
  });

  describe("updateProfileService", () => {
    it("should successfully update user profile", async () => {
      const mockUser = {
        _id: "user_123",
        username: "updated_username",
        fullName: "Updated Name",
      };

      mock.method(userRepository, "findOne", async () => null);
      mock.method(userRepository, "findByIdAndUpdate", async () => mockUser);

      const res = await updateProfileService(
        "user_123",
        "user_123",
        { username: "updated_username", fullName: "Updated Name" }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Cập nhật hồ sơ thành công");
      assert.strictEqual(res.data.username, "updated_username");
    });

    it("should throw 403 if target user is not current user", async () => {
      await assert.rejects(
        updateProfileService("user_123", "user_456", {}),
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.message, "Bạn chỉ có thể cập nhật thông tin cá nhân của mình");
          return true;
        }
      );
    });

    it("should throw 409 if updated username is already taken", async () => {
      mock.method(userRepository, "findOne", async () => ({ _id: "user_456", username: "taken" }));

      await assert.rejects(
        updateProfileService("user_123", "user_123", { username: "taken" }),
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.message, "Tên đăng nhập đã được sử dụng");
          return true;
        }
      );
    });
  });

  describe("changePasswordService", () => {
    it("should successfully change user password", async () => {
      const hashedOldPassword = await bcrypt.hash("oldpassword", 10);
      const mockUser = {
        _id: "user_123",
        password: hashedOldPassword,
        save: async () => {},
      };

      mock.method(userRepository, "findById", async () => mockUser);

      const res = await changePasswordService("user_123", "user_123", {
        currentPassword: "oldpassword",
        newPassword: "newpassword",
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Thay đổi mật khẩu thành công");
    });

    it("should throw 400 if current and new passwords are same", async () => {
      await assert.rejects(
        changePasswordService("user_123", "user_123", {
          currentPassword: "password",
          newPassword: "password",
        }),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Mật khẩu mới phải khác mật khẩu hiện tại");
          return true;
        }
      );
    });

    it("should throw 401 if current password is incorrect", async () => {
      const hashedOldPassword = await bcrypt.hash("oldpassword", 10);
      const mockUser = {
        _id: "user_123",
        password: hashedOldPassword,
      };

      mock.method(userRepository, "findById", async () => mockUser);

      await assert.rejects(
        changePasswordService("user_123", "user_123", {
          currentPassword: "wrongpassword",
          newPassword: "newpassword",
        }),
        (err) => {
          assert.strictEqual(err.statusCode, 401);
          assert.strictEqual(err.message, "Mật khẩu hiện tại không đúng");
          return true;
        }
      );
    });
  });

  describe("deleteUserService", () => {
    it("should successfully soft delete user", async () => {
      const mockUser = {
        _id: "user_123",
        status: "active",
        save: async () => {},
      };

      mock.method(userRepository, "findById", async () => mockUser);

      const res = await deleteUserService("user_123");

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.message, "Vô hiệu hóa người dùng thành công");
      assert.strictEqual(mockUser.status, "inactive");
    });
  });

  describe("requestEmailChangeService & verifyEmailChangeService", () => {
    it("should successfully request email change OTP and verify it", async () => {
      // Mock Nodemailer
      const sendMailMock = mock.fn(async () => {});
      mock.method(nodemailer, "createTransport", () => ({
        sendMail: sendMailMock,
      }));

      const hashedOldPassword = await bcrypt.hash("password", 10);
      const mockUser = {
        _id: "user_123",
        email: "old@example.com",
        password: hashedOldPassword,
        save: async () => {},
      };

      mock.method(userRepository, "findById", async () => mockUser);
      mock.method(userRepository, "findOne", async () => null);

      const reqRes = await requestEmailChangeService("user_123", {
        currentPassword: "password",
        newEmail: "new@example.com",
      });

      assert.strictEqual(reqRes.statusCode, 200);
      assert.strictEqual(reqRes.message, "Mã xác nhận đã được gửi đến email mới của bạn");
      assert.ok(mockUser.emailChangeOTP);
      assert.strictEqual(mockUser.newEmailPending, "new@example.com");
      assert.strictEqual(sendMailMock.mock.callCount(), 1);

      // Now verify OTP
      // We don't know the plain OTP since it's random, but we can bypass or inject a known OTP in test
      const testOtp = "123456";
      const hashedTestOtp = crypto.createHash("sha256").update(testOtp).digest("hex");
      mockUser.emailChangeOTP = hashedTestOtp;
      mockUser.emailChangeExpires = Date.now() + 10 * 60 * 1000;

      const verifyRes = await verifyEmailChangeService("user_123", { otp: testOtp });

      assert.strictEqual(verifyRes.statusCode, 200);
      assert.strictEqual(verifyRes.message, "Đổi địa chỉ email thành công");
      assert.strictEqual(mockUser.email, "new@example.com");
      assert.strictEqual(mockUser.emailChangeOTP, undefined);
    });
  });

  describe("createLandlordService", () => {
    it("should successfully create landlord account", async () => {
      const mockRole = { _id: "role_landlord", name: "landlord" };
      const mockLandlord = {
        _id: "landlord_123",
        username: "landlord",
        email: "landlord@example.com",
      };

      mock.method(userRepository, "findOne", async () => null);
      mock.method(roleRepository, "findOne", async () => mockRole);
      mock.method(userRepository, "create", async () => mockLandlord);

      const res = await createLandlordService({
        username: "landlord",
        email: "landlord@example.com",
        password: "password",
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.message, "Tạo tài khoản Chủ nhà thành công");
      assert.strictEqual(res.data._id, "landlord_123");
    });
  });
});
