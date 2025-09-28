import express from "express";
import {
    createDonationController,
    getAllDonationsController,
    getDonationByIdController,
    updateDonationController,
    deleteDonationController,
    getDonationStatsController
} from "../controller/DonationController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create donation (any logged-in user)
router.post("/", authenticate, createDonationController);

// Get donations (role-based: admin sees all, users see their own)
router.get("/", authenticate, getAllDonationsController);

// Get donation statistics (admin/staff only)
router.get("/stats", authenticate, authorizeRoles("ADMIN", "STAFF"), getDonationStatsController);

// Get donation by ID (admin or donor)
router.get("/:id", authenticate, getDonationByIdController);

// Update donation (role-based permissions)
router.put("/:id", authenticate, updateDonationController);

// Delete/Cancel donation (role-based permissions)
router.delete("/:id", authenticate, deleteDonationController);

export default router;
