import { Router } from "express";
import { listMyAttendance } from "../controllers/attendanceController";
import { listMyEvents } from "../controllers/rsvpController";
import { listUsers, updateUserRole } from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/me/events", listMyEvents);
router.get("/me/attendance", listMyAttendance);

router.get("/", requireRole("admin"), listUsers);
router.patch("/:id/role", requireRole("admin"), updateUserRole);

export default router;
