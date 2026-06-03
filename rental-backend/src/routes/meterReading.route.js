import express from "express";
import { meterReadingController } from "../controllers/index.js";
import validate from "../middlewares/validate.middleware.js";
import { meterReadingValidation } from "../validation/index.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router
  .route("/")
  .post(
    validate(meterReadingValidation.createMeterReading),
    meterReadingController.createMeterReading,
  )
  .get(meterReadingController.getAllMeterReadings);

router
  .route("/:id")
  .get(meterReadingController.getMeterReadingById)
  .patch(
    validate(meterReadingValidation.updateMeterReading),
    meterReadingController.updateMeterReading,
  )
  .delete(meterReadingController.deleteMeterReading);

export default router;
