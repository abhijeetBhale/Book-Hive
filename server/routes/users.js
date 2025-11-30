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
import { cacheMiddleware } from "../middleware/cache.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/with-books", cacheMiddleware(30000), getUsersWithBooks); // Cache for 30 seconds
router.get("/:userId/location", cacheMiddleware(60000), getUserLocation); // Cache for 1 minute
router.get("/:userId/profile", cacheMiddleware(30000), getUserProfile); // Cache for 30 seconds
router.get("/notifications/unread-count", protect, getUnreadNotificationCount);
router.put("/notifications/mark-read", protect, markRelevantNotificationsRead);
router.put("/public-key", protect, updatePublicKey);
router.post("/migrate-ratings", migrateUserRatings);

// Account deletion routes
router.get("/account/deletion-preview", protect, getDeletionPreview);
router.delete("/account", protect, deleteAccount);

export default router;
