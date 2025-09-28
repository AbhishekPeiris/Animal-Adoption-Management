import express from "express";
import {
  createAdoptionFormController,
  getAllAdoptionFormsController,
  getAdoptionFormByIdController,
  updateAdoptionFormController,
  deleteAdoptionFormController,
} from "../controller/AdoptionFormController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create adoption form (any logged-in user)
router.post("/", authenticate, createAdoptionFormController);

// Get adoption forms (role-based: admin sees all, users see their own)
router.get("/", authenticate, getAllAdoptionFormsController);

// Get adoption form by ID (admin or form owner)
router.get("/:id", authenticate, getAdoptionFormByIdController);

// Update adoption form (role-based permissions)
router.put("/:id", authenticate, updateAdoptionFormController);

// Delete adoption form (role-based permissions)
router.delete("/:id", authenticate, deleteAdoptionFormController);

export default router;
