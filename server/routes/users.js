import express from "express";
import {
  getUsersWithBooks,
  getUserLocation,
  getUserProfile,
  searchUsers,
  getUnreadNotificationCount,
  markRelevantNotificationsRead,
  updatePublicKey,
  migrateUserRatings,
} from "../controllers/userController.js";
import {
  deleteAccount,
  getDeletionPreview
} from "../controllers/accountDeletionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/with-books", getUsersWithBooks);
router.get("/:userId/location", getUserLocation);
router.get("/:userId/profile", getUserProfile);
router.get("/notifications/unread-count", protect, getUnreadNotificationCount);
router.put("/notifications/mark-read", protect, markRelevantNotificationsRead);
router.put("/public-key", protect, updatePublicKey);
router.post("/migrate-ratings", migrateUserRatings);

// Account deletion routes
router.get("/account/deletion-preview", protect, getDeletionPreview);
router.delete("/account", protect, deleteAccount);

export default router;
