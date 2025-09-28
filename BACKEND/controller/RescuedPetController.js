import RescuedPet from "../model/RescuedPet.js";
import PetProfile from "../model/PetProfile.js"; // Add this import

// Admin creates rescued pet profile
export const createRescuedPet = async (req, res) => {
  try {
    // Generate a unique rescuedPetId (e.g., 4-char alphanumeric)
    let rescuedPetId;
    let isUnique = false;
    while (!isUnique) {
      rescuedPetId = Math.random().toString(36).substr(2, 4).toUpperCase();
      const exists = await RescuedPet.findOne({ rescuedPetId });
      if (!exists) isUnique = true;
    }
    const rescuedPet = new RescuedPet({ ...req.body, rescuedPetId });
    await rescuedPet.save();
    res.status(201).json(rescuedPet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// View rescued pets (role-based filtering)
export const getRescuedPets = async (req, res) => {
  try {
    const { userRole, showArchived = false } = req.query;

    let filter = showArchived === "true" ? {} : { isArchived: { $ne: true } };
    let projection = {};

    // Role-based filtering for users/adopters
    if (userRole === "USER" || userRole === "ADOPTER") {
      filter.adoptionStatus = { $in: ["Available", "Pending"] };
      filter.adoptionReadiness = "Ready";
      // Limited fields for public view
      projection = {
        rescuedPetId: 1,
        rescuedPetName: 1,
        species: 1,
        breed: 1,
        rescuedPetAge: 1,
        rescuedPetGender: 1,
        healthStatus: 1,
        adoptionStatus: 1,
        imageUrl: 1,
        description: 1,
        createdAt: 1,
      };
    }

    const pets = await RescuedPet.find(filter, projection)
      .populate("vetId")
      .sort({ createdAt: -1 });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single rescued pet (role-based details)
export const getRescuedPetById = async (req, res) => {
  try {
    const { userRole } = req.query;
    let projection = {};

    if (userRole === "USER" || userRole === "ADOPTER") {
      projection = {
        rescuedPetId: 1,
        rescuedPetName: 1,
        species: 1,
        breed: 1,
        rescuedPetAge: 1,
        rescuedPetGender: 1,
        healthStatus: 1,
        adoptionStatus: 1,
        imageUrl: 1,
        additionalImages: 1,
        description: 1,
        createdAt: 1,
      };
    }

    const pet = await RescuedPet.findById(req.params.id, projection).populate(
      "vetId"
    );
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add medical record to rescued pet
export const addMedicalRecord = async (req, res) => {
  try {
    const { treatment, medication, veterinarian, notes, cost } = req.body;

    const pet = await RescuedPet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const newRecord = {
      date: new Date(),
      treatment,
      medication: medication || "",
      veterinarian: veterinarian || "",
      notes: notes || "",
      cost: cost || 0,
    };

    pet.medicalRecords.push(newRecord);
    await pet.save();

    res.status(201).json({ message: "Medical record added successfully", pet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add vaccination record
export const addVaccination = async (req, res) => {
  try {
    const { vaccineName, dateGiven, nextDueDate, veterinarian } = req.body;

    const pet = await RescuedPet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const newVaccination = {
      vaccineName,
      dateGiven: new Date(dateGiven),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      veterinarian: veterinarian || "",
    };

    pet.vaccinations.push(newVaccination);
    await pet.save();

    res
      .status(201)
      .json({ message: "Vaccination record added successfully", pet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update adoption readiness
export const updateAdoptionReadiness = async (req, res) => {
  try {
    const { adoptionReadiness, adoptionStatus } = req.body;

    const updateData = { adoptionReadiness };
    if (adoptionStatus) updateData.adoptionStatus = adoptionStatus;

    const pet = await RescuedPet.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json({ message: "Adoption readiness updated successfully", pet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Archive rescued pet
export const archiveRescuedPet = async (req, res) => {
  try {
    const { reason } = req.body;

    const pet = await RescuedPet.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        archiveReason: reason || "No reason provided",
        adoptionStatus: "Unavailable",
      },
      { new: true }
    );

    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json({ message: "Pet archived successfully", pet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vet confirms pet
export const confirmRescuedPet = async (req, res) => {
  try {
    const pet = await RescuedPet.findByIdAndUpdate(
      req.params.id,
      { isConfirmed: true },
      { new: true }
    );
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json({ message: "Pet confirmed successfully", pet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update rescued pet
export const updateRescuedPet = async (req, res) => {
  try {
    console.log("🔄 Updating rescued pet with data:", req.body);

    // Get the existing pet data first
    const existingPet = await RescuedPet.findById(req.params.id);
    if (!existingPet) return res.status(404).json({ message: "Pet not found" });

    const updated = await RescuedPet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    console.log("✅ Pet updated successfully:", updated.rescuedPetName);

    // If pet is adopted, create PetProfile if not already present
    if (req.body.adoptionStatus === "Adopted") {
      console.log(
        "🏠 Pet is being adopted, checking if PetProfile should be created..."
      );
      console.log("🐾 Pet species:", updated.species);
      console.log("🐾 Pet data:", {
        name: updated.rescuedPetName,
        species: updated.species,
        breed: updated.breed,
        age: updated.rescuedPetAge,
        gender: updated.rescuedPetGender,
      });

      // Only Dog/Cat supported for PetProfile
      if (["Dog", "Cat"].includes(updated.species)) {
        console.log(
          `🐕 Creating PetProfile for ${updated.species}: ${updated.rescuedPetName}`
        );

        try {
          // Generate proper PetProfile ID format (C-xxx or D-xxx)
          const prefix = updated.species === "Cat" ? "C" : "D";

          // Find the highest existing number for this species
          const existingProfiles = await PetProfile.find({
            petId: new RegExp(`^${prefix}-\\d+$`),
          })
            .sort({ petId: -1 })
            .limit(10);

          let counter = 1;
          if (existingProfiles.length > 0) {
            // Extract numbers and find the highest
            const numbers = existingProfiles.map((p) => {
              const match = p.petId.match(new RegExp(`^${prefix}-(\\d+)$`));
              return match ? parseInt(match[1]) : 0;
            });
            counter = Math.max(...numbers) + 1;
          }

          const petProfileId = `${prefix}-${counter
            .toString()
            .padStart(3, "0")}`;
          console.log(`🆔 Generated PetProfile ID: ${petProfileId}`);

          // Check if PetProfile already exists for this rescued pet (by name and species)
          const existingProfile = await PetProfile.findOne({
            petName: updated.rescuedPetName,
            petSpecies: updated.species,
          });

          if (existingProfile) {
            console.log(
              `⚠️  PetProfile already exists for ${updated.rescuedPetName} - ${existingProfile.petId}`
            );
          } else {
            // Validate required fields before creating PetProfile
            if (!updated.breed || updated.breed.length < 2) {
              console.log("❌ Invalid breed data, cannot create PetProfile");
              return res.status(200).json(updated);
            }

            // Create the new PetProfile
            const petProfileData = {
              petId: petProfileId,
              petName: updated.rescuedPetName,
              petSpecies: updated.species,
              petBreed: updated.breed,
              petAge: updated.rescuedPetAge,
              petGender: updated.rescuedPetGender,
              petStatus: "Adopted",
              petDescription: updated.description,
              imageUrl:
                updated.imageUrl || "https://via.placeholder.com/300?text=Pet",
            };

            console.log("📝 Creating PetProfile with data:", petProfileData);

            const newProfile = await PetProfile.create(petProfileData);
            console.log(
              `🎉 Successfully created PetProfile with ID: ${petProfileId} for adopted rescued pet: ${updated.rescuedPetName}`
            );
            console.log("📄 New PetProfile:", newProfile);
          }
        } catch (profileError) {
          console.error("❌ Error creating PetProfile:", profileError);
          console.error("Error details:", profileError.message);
          if (profileError.errors) {
            console.error("Validation errors:", profileError.errors);
          }
          // Don't fail the main update if PetProfile creation fails
        }
      } else {
        console.log(
          `⚠️  Species "${updated.species}" not supported for PetProfile creation (only Dog/Cat)`
        );
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error in updateRescuedPet:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete rescued pet (admin only - permanent delete)
export const deleteRescuedPet = async (req, res) => {
  try {
    const deleted = await RescuedPet.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json({ message: "Pet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update rescued pet by rescuedPetId (business identifier)
export const updateRescuedPetByCode = async (req, res) => {
  try {
    const updated = await RescuedPet.findOneAndUpdate(
      { rescuedPetId: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete rescued pet by rescuedPetId (business identifier)
export const deleteRescuedPetByCode = async (req, res) => {
  try {
    const deleted = await RescuedPet.findOneAndDelete({
      rescuedPetId: req.params.code,
    });
    if (!deleted) return res.status(404).json({ message: "Pet not found" });
    res.status(200).json({ message: "Pet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
