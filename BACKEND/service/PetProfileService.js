import PetProfile from "../model/PetProfile.js";

// Create new pet profile
export const createPetProfileService = async (petData) => {
  try {
    // Auto-generate petId if not provided
    if (!petData.petId) {
      const species = petData.petSpecies;
      const prefix = species === "Cat" ? "C" : "D";

      // Find the highest existing number for this species
      const existingProfiles = await PetProfile.find({
        petId: new RegExp(`^${prefix}-\\d+$`),
      }).sort({ petId: -1 }).limit(10);

      let counter = 1;
      if (existingProfiles.length > 0) {
        // Extract numbers and find the highest
        const numbers = existingProfiles.map(p => {
          const match = p.petId.match(new RegExp(`^${prefix}-(\\d+)$`));
          return match ? parseInt(match[1]) : 0;
        });
        counter = Math.max(...numbers) + 1;
      }

      petData.petId = `${prefix}-${counter.toString().padStart(3, "0")}`;
    }

    const pet = new PetProfile(petData);
    await pet.save();
    return pet;
  } catch (error) {
    throw new Error("Error creating pet profile: " + error.message);
  }
};

// Get all pet profiles
export const getAllPetProfilesService = async () => {
  try {
    return await PetProfile.find().lean();
  } catch (error) {
    throw new Error("Error fetching pet profiles: " + error.message);
  }
};

// Get pet profile by ID
export const getPetProfileByIdService = async (id) => {
  try {
    const pet = await PetProfile.findById(id).lean();
    if (!pet) throw new Error("Pet not found");
    return pet;
  } catch (error) {
    throw new Error("Error fetching pet profile: " + error.message);
  }
};

// Update
export const updatePetProfileService = async (id, updateData) => {
  try {
    const updatedPet = await PetProfile.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedPet) throw new Error("Pet not found");
    return updatedPet;
  } catch (error) {
    throw new Error("Error updating pet profile: " + error.message);
  }
};

// Delete pet profile
export const deletePetProfileService = async (id) => {
  try {
    const deletedPet = await PetProfile.findByIdAndDelete(id);
    if (!deletedPet) throw new Error("Pet not found");
    return deletedPet;
  } catch (error) {
    throw new Error("Error deleting pet profile: " + error.message);
  }
};
