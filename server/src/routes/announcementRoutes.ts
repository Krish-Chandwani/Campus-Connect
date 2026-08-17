import { Router } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../controllers/announcementController";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireAnnouncementManager } from "../middleware/announcement";

const router = Router();

router.use(requireAuth);

router.get("/", listAnnouncements);
router.get("/:id", getAnnouncement);
router.post("/", requireRole("organizer", "admin"), createAnnouncement);
router.patch("/:id", requireAnnouncementManager, updateAnnouncement);
router.delete("/:id", requireAnnouncementManager, deleteAnnouncement);

export default router;
