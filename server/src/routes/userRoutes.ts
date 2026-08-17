import { Router } from "express";
import { listMyAttendance } from "../controllers/attendanceController";
import { listMyEvents } from "../controllers/rsvpController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/me/events", listMyEvents);
router.get("/me/attendance", listMyAttendance);

export default router;
