import express from "express";
import {
  getUsersWithBooks,
  getUserLocation,
  getUserProfile,
  searchUsers,
  getUnreadNotificationCount,
  markRelevantNotificationsRead,
  updatePublicKey,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/with-books", getUsersWithBooks);
router.get("/:userId/location", getUserLocation);
router.get("/:userId/profile", getUserProfile);
router.get("/notifications/unread-count", protect, getUnreadNotificationCount);
router.put("/notifications/mark-read", protect, markRelevantNotificationsRead);
router.put("/public-key", protect, updatePublicKey);

export default router;
