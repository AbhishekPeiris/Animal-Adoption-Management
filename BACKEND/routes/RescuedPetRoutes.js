import express from "express";
import {
  createRescuedPet,
  getRescuedPets,
  getRescuedPetById,
  confirmRescuedPet,
  updateRescuedPet,
  deleteRescuedPet,
  updateRescuedPetByCode,
  deleteRescuedPetByCode,
  addMedicalRecord,
  addVaccination,
  updateAdoptionReadiness,
  archiveRescuedPet,
} from "../controller/RescuedPetController.js";

const router = express.Router();

// Admin creates rescued pet
router.post("/", createRescuedPet);

// View rescued pets (role-based)
router.get("/", getRescuedPets);

// Get single pet by ID (role-based)
router.get("/:id", getRescuedPetById);

// Medical record management
router.post("/:id/medical-records", addMedicalRecord);
router.post("/:id/vaccinations", addVaccination);

// Update adoption readiness
router.put("/:id/adoption-readiness", updateAdoptionReadiness);

// Archive pet
router.put("/:id/archive", archiveRescuedPet);

// Vet confirms pet
router.put("/confirm/:id", confirmRescuedPet);

// Update rescued pet
router.put("/:id", updateRescuedPet);

// Delete rescued pet
router.delete("/:id", deleteRescuedPet);

// Alternative: by rescuedPetId business code
router.put("/code/:code", updateRescuedPetByCode);
router.delete("/code/:code", deleteRescuedPetByCode);

export default router;
