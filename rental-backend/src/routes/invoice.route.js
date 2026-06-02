import express from "express";
import { invoiceController } from "../controllers/index.js";
import validate from "../middlewares/validate.middleware.js";
import { invoiceValidation } from "../validation/index.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router
  .route("/")
  .post(
    validate(invoiceValidation.createInvoice),
    invoiceController.createInvoice,
  )
  .get(invoiceController.getAllInvoices);

router
  .route("/:id")
  .get(invoiceController.getInvoiceById)
  .patch(
    validate(invoiceValidation.updateInvoice),
    invoiceController.updateInvoice,
  );

router
  .route("/:id/status")
  .patch(
    validate(invoiceValidation.updateStatus),
    invoiceController.updateInvoiceStatus,
  );

export default router;
