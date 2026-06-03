import express from "express";
import { dashboardController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router.get("/overview", dashboardController.getOverview);

export default router;
