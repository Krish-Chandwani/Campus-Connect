import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../controllers/eventController";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireEventOrganizer } from "../middleware/event";

const router = Router();

router.use(requireAuth);

router.get("/", listEvents);
router.get("/:id", getEvent);
router.post("/", requireRole("organizer", "admin"), createEvent);
router.patch("/:id", requireEventOrganizer, updateEvent);
router.delete("/:id", requireEventOrganizer, deleteEvent);

export default router;
