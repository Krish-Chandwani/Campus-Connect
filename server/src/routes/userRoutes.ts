import { Router } from "express";
import { listMyEvents } from "../controllers/rsvpController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/me/events", listMyEvents);

export default router;
