import express from "express";
import {
    createVolunteerController,
    getAllVolunteersController,
    getVolunteerByIdController,
    updateVolunteerController,
    deleteVolunteerController,
    getVolunteerStatsController,
    getMyVolunteerProfileController
} from "../controller/VolunteerController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register as volunteer (any logged-in user)
router.post("/", authenticate, createVolunteerController);

// Get volunteers (role-based: admin sees all, users see their own)
router.get("/", authenticate, getAllVolunteersController);

// Get current user's volunteer profile
router.get("/my-profile", authenticate, getMyVolunteerProfileController);

// Get volunteer statistics (admin/staff only)
router.get("/stats", authenticate, authorizeRoles("ADMIN", "STAFF"), getVolunteerStatsController);

// Get volunteer by ID (admin or volunteer owner)
router.get("/:id", authenticate, getVolunteerByIdController);

// Update volunteer (role-based permissions)
router.put("/:id", authenticate, updateVolunteerController);

// Delete volunteer registration (role-based permissions)
router.delete("/:id", authenticate, deleteVolunteerController);

export default router;
