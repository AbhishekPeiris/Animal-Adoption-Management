import express from "express";
import {
  createPetProfileController,
  getAllPetProfilesController,
  getPetProfileByIdController,
  updatePetProfileController,
  deletePetProfileController,
  updateMedicalInfoController,
} from "../controller/PetProfileController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const PetProfileRouter = express.Router();

PetProfileRouter.post("/", authenticate, authorizeRoles("ADMIN", "STAFF"), createPetProfileController);      // Create
PetProfileRouter.get("/", getAllPetProfilesController);      // Read all
PetProfileRouter.get("/:id", getPetProfileByIdController);   // Read one   
PetProfileRouter.put("/:id", authenticate, authorizeRoles("ADMIN", "STAFF"), updatePetProfileController);    // Update
PetProfileRouter.delete("/:id", authenticate, authorizeRoles("ADMIN"), deletePetProfileController); // Delete

// Medical info routes
PetProfileRouter.put("/:id/medical", authenticate, authorizeRoles("ADMIN", "STAFF", "VET"), updateMedicalInfoController);    // Update medical info


export default PetProfileRouter;
