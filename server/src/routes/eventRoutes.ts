import { Router } from "express";
import {
  checkIn,
  getCheckInQr,
  listEventAttendance,
} from "../controllers/attendanceController";
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

router.get("/:id/check-in-qr", requireEventOrganizer, getCheckInQr);
router.post("/:id/check-in", checkIn);
router.get("/:id/attendance", requireEventOrganizer, listEventAttendance);

router.get("/:id", getEvent);
router.patch("/:id", requireEventOrganizer, updateEvent);
router.delete("/:id", requireEventOrganizer, deleteEvent);

export default router;
