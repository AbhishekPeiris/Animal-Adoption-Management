import mongoose from "mongoose";

const petProfileSchema = new mongoose.Schema(
  {
    // Pet ID: required, unique, max length 20, species-aware pattern (C-xxx | D-xxx)
    petId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
      validate: {
        validator: function (value) {
          if (!value) return false;
          const species = this.petSpecies; // access sibling field
          // Base pattern: Single letter prefix + dash + digits (e.g., C-001 or D-045)
          const match = /^([A-Za-z])-\d{1,17}$/; // keep total <= 20
          const res = match.exec(value);
          if (!res) return false;
          const prefix = res[1].toUpperCase();
          if (species === "Cat") return prefix === "C";
          if (species === "Dog") return prefix === "D";
          // if (species === "Bird") return prefix === "B";
          // if (species === "Rabbit") return prefix === "R";
          // if (species === "Other") return prefix === "O";
          return false;
        },
        message:
          "Invalid Pet ID: Cats must start with 'C-' and Dogs with 'D-'. Use letters+dash+digits like C-001",
      },
    },
    // Name: 2–50 chars, letters/spaces/hyphens only
    petName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      match: [/^[A-Za-z\s-]+$/, "Name can contain only letters, spaces and hyphens"],
    },
    // Species: only Cat or Dog
    petSpecies: {
      type: String,
      required: true,
      enum: ["Dog", "Cat"],
    },
    // Breed: 2–50 chars, letters/spaces/hyphens
    petBreed: {
      type: String,
      required: true, // Add this line
      trim: true,
      minlength: 2,
      maxlength: 50,
      match: [/^[A-Za-z\s-]+$/, "Breed can contain only letters, spaces and hyphens"],
    },
    // Age: > 0, upper bound 30 years
    petAge: {
      type: Number,
      min: 0.0000001,
      max: 30,
      required: true,
    },
    petGender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    petStatus: {
      type: String,
      enum: ["Available", "Adopted", "Pending"],
      default: "Available",
      required: true,
    },
    petOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Description: 10–500 chars
    petDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    // Medical Info Summary
    medicalInfo: {
      healthStatus: {
        type: String,
        enum: ["Healthy", "Under Treatment", "Recovering", "Critical"],
        default: "Healthy"
      },
      isVaccinated: { type: Boolean, default: false },
      lastVetVisit: { type: Date },
      vetNotes: { type: String, maxlength: 500, default: "" },
      treatments: [{
        type: String,
        maxlength: 200
      }],
      vaccinations: [{
        vaccine: { type: String, maxlength: 100 },
        date: { type: Date },
        nextDue: { type: Date }
      }],
      medicalRecordIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord"
      }]
    },
    // Images
    images: [{ type: String }],
    // Add imageUrl field
    imageUrl: {
      type: String,
      default: "https://via.placeholder.com/300?text=Pet",
    },
  },
  {
    timestamps: true,
  }
);

// Check if model already exists before creating it
export default mongoose.models.PetProfile || mongoose.model("PetProfile", petProfileSchema);
