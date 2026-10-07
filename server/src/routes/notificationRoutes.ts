import { Router } from "express";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;
