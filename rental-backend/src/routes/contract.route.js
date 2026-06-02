import express from "express";
import { contractController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { contractValidation } from "../validation/index.js";

const contractRoute = express.Router();

// GET /contracts — Lấy tất cả hợp đồng với các bộ lọc (Yêu cầu xác thực)
contractRoute.get("/", auth, contractController.getAllContracts);

// GET /contracts/:id — Lấy chi tiết hợp đồng theo ID (Yêu cầu xác thực)
contractRoute.get("/:id", auth, contractController.getContractById);

// POST /contracts — Tạo hợp đồng mới (Yêu cầu xác thực)
contractRoute.post(
  "/",
  auth,
  validate(contractValidation.createContract),
  contractController.createContract,
);

// PATCH /contracts/:id — Cập nhật hợp đồng (Yêu cầu xác thực)
contractRoute.patch(
  "/:id",
  auth,
  validate(contractValidation.updateContract),
  contractController.updateContract,
);

// DELETE /contracts/:id — Xóa một hợp đồng (Yêu cầu xác thực)
contractRoute.delete("/:id", auth, contractController.deleteContract);

export default contractRoute;
