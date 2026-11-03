import express from "express";

import { getBanks } from "../controllers/bankList.js";

const router = express.Router();

// GET /api/banks
router.get("/get/banks", getBanks);

export default router;