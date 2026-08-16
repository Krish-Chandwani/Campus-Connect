import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../controllers/eventController";
import {
  cancelRsvp,
  createRsvp,
  listEventAttendees,
} from "../controllers/rsvpController";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireEventOrganizer } from "../middleware/event";

const router = Router();

router.use(requireAuth);

router.get("/", listEvents);
router.post("/", requireRole("organizer", "admin"), createEvent);

router.post("/:id/rsvp", createRsvp);
router.delete("/:id/rsvp", cancelRsvp);
router.get("/:id/attendees", requireEventOrganizer, listEventAttendees);

router.get("/:id", getEvent);
router.patch("/:id", requireEventOrganizer, updateEvent);
router.delete("/:id", requireEventOrganizer, deleteEvent);

export default router;
