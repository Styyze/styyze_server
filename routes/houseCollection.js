
import express from "express";

import {
  createCollection,
  getHouseCollections,
  getHouseCollectionById,
  updateCollection,
  deleteCollection
} from "../controllers/collection.js";

import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post("/create/collection/:houseId", protect, createCollection);

router.get("/get/house/collections/:houseId", protect, getHouseCollections);

router.get("/get/:collectionId", protect, getHouseCollectionById);

router.patch("/house/:houseId/:collectionId", protect, updateCollection
);

router.delete("/delete/collection/:houseId/:collectionId", protect, deleteCollection);

export default router;
