import express from "express";
import { tenantController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { tenantValidation } from "../validation/index.js";

const tenantRoute = express.Router();

// GET /tenants/room/:roomId — Get tenants belonging to a room (Requires Auth)
tenantRoute.get("/room/:roomId", auth, tenantController.getTenantsByRoom);

// GET /tenants/:id — Get tenant detail by ID (Requires Auth)
tenantRoute.get("/:id", auth, tenantController.getTenantById);

// POST /tenants — Create a new tenant (Requires Auth)
tenantRoute.post(
  "/",
  auth,
  validate(tenantValidation.createTenant),
  tenantController.createTenant,
);

// PATCH /tenants/:id — Update a tenant (Requires Auth)
tenantRoute.patch(
  "/:id",
  auth,
  validate(tenantValidation.updateTenant),
  tenantController.updateTenant,
);

// DELETE /tenants/:id — Delete a tenant (Requires Auth)
tenantRoute.delete("/:id", auth, tenantController.deleteTenant);

export default tenantRoute;
