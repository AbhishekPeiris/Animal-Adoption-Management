import {
  createPetProfileService,
  getAllPetProfilesService,
  getPetProfileByIdService,
  updatePetProfileService,
  deletePetProfileService,
} from "../service/PetProfileService.js";
import MedicalRecord from "../model/MedicalRecord.js";

// Create new pet profile
export const createPetProfileController = async (req, res) => {
  try {
    console.log("Creating pet profile with data:", req.body);

    const petData = req.body;

    // Basic validation
    if (!petData.petName || !petData.petSpecies || !petData.petDescription) {
      return res.status(400).json({ message: "petName, petSpecies, and petDescription are required" });
    }

    // Validate petBreed
    if (!petData.petBreed || petData.petBreed.length < 2) {
      return res.status(400).json({ message: "petBreed is required and must be at least 2 characters" });
    }

    const newPet = await createPetProfileService(petData);
    console.log("Pet profile created successfully:", newPet);
    res.status(201).json(newPet);
  } catch (error) {
    console.error("Error creating pet profile:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all pet profiles with role-based filtering
export const getAllPetProfilesController = async (req, res) => {
  try {
    const { userRole } = req.query;
    const pets = await getAllPetProfilesService();

    // Filter medical info for regular users
    if (userRole === 'USER' || userRole === 'ADOPTER') {
      const filteredPets = pets.map(pet => ({
        ...pet,
        medicalInfo: pet.medicalInfo ? {
          healthStatus: pet.medicalInfo.healthStatus,
          isVaccinated: pet.medicalInfo.isVaccinated,
          lastVetVisit: pet.medicalInfo.lastVetVisit
        } : null
      }));
      return res.status(200).json(filteredPets);
    }

    res.status(200).json(pets);
  } catch (error) {
    console.error("Error fetching all pets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get pet profile by ID with role-based details and medical records
export const getPetProfileByIdController = async (req, res) => {
  try {
    const { userRole } = req.query;
    const pet = await getPetProfileByIdService(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    // Fetch medical records for this pet
    let medicalRecords = [];
    try {
      medicalRecords = await MedicalRecord.find({ petId: pet.petId }).sort({ createdAt: -1 });
    } catch (medicalError) {
      console.log("No medical records found or error fetching:", medicalError.message);
    }

    // Filter medical info for regular users
    if (userRole === 'USER' || userRole === 'ADOPTER') {
      const filteredPet = {
        ...pet,
        medicalInfo: pet.medicalInfo ? {
          healthStatus: pet.medicalInfo.healthStatus,
          isVaccinated: pet.medicalInfo.isVaccinated,
          lastVetVisit: pet.medicalInfo.lastVetVisit
        } : null,
        // Include basic medical records for adopters
        medicalRecords: medicalRecords.map(record => ({
          vaccination: record.vaccination,
          dueDate: record.dueDate,
          age: record.age,
          createdAt: record.createdAt
        }))
      };
      return res.status(200).json(filteredPet);
    }

    // Full details for admin/staff/vet
    const detailedPet = {
      ...pet,
      medicalRecords: medicalRecords
    };

    res.status(200).json(detailedPet);
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update pet profile
export const updatePetProfileController = async (req, res) => {
  try {
    const updatedPet = await updatePetProfileService(req.params.id, req.body);
    if (!updatedPet) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json(updatedPet);
  } catch (error) {
    console.error("Error updating pet profile:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete pet profile
export const deletePetProfileController = async (req, res) => {
  try {
    const deletedPet = await deletePetProfileService(req.params.id);
    if (!deletedPet) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json({ message: "Pet deleted successfully" });
  } catch (error) {
    console.error("Error deleting pet profile:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update medical info for pet
export const updateMedicalInfoController = async (req, res) => {
  try {
    const { medicalInfo } = req.body;
    const updatedPet = await updatePetProfileService(req.params.id, { medicalInfo });
    if (!updatedPet) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json({ message: "Medical info updated successfully", pet: updatedPet });
  } catch (error) {
    console.error("Error updating medical info:", error);
    res.status(500).json({ message: error.message });
  }
};
