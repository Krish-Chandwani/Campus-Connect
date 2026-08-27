import { Router } from "express";
import {
  addClubOrganizer,
  createClub,
  deleteClub,
  getClub,
  joinClub,
  leaveClub,
  listClubs,
  removeClubOrganizer,
  updateClub,
} from "../controllers/clubController";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireClubOrganizer } from "../middleware/club";

const router = Router();

router.use(requireAuth);

router.get("/", listClubs);
router.get("/:id", getClub);

router.post("/", requireRole("admin"), createClub);
router.post(
  "/:id/organizers",
  requireRole("admin"),
  requireClubOrganizer,
  addClubOrganizer
);
router.delete(
  "/:id/organizers/:userId",
  requireRole("admin"),
  requireClubOrganizer,
  removeClubOrganizer
);

router.patch("/:id", requireClubOrganizer, updateClub);
router.delete("/:id", requireRole("admin"), requireClubOrganizer, deleteClub);

router.post("/:id/join", joinClub);
router.delete("/:id/leave", leaveClub);

export default router;
