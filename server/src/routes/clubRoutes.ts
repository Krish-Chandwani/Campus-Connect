import { Router } from "express";
import {
  createClub,
  deleteClub,
  getClub,
  joinClub,
  leaveClub,
  listClubs,
  updateClub,
} from "../controllers/clubController";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireClubOrganizer } from "../middleware/club";

const router = Router();

router.use(requireAuth);

router.get("/", listClubs);
router.get("/:id", getClub);
router.post("/", requireRole("organizer", "admin"), createClub);
router.patch("/:id", requireClubOrganizer, updateClub);
router.delete("/:id", requireClubOrganizer, deleteClub);
router.post("/:id/join", joinClub);
router.delete("/:id/leave", leaveClub);

export default router;
