import mongoose from "mongoose";

const rescuedPetSchema = new mongoose.Schema(
  {
    rescuedPetId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 4,
      match: [/^[A-Za-z0-9-]+$/, "Invalid Pet ID"],
    },
    rescuedPetName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
      match: [/^[A-Za-z\s-]+$/, "Invalid name"],
    },

    // Enhanced pet information
    species: {
      type: String,
      required: true,
      enum: ["Dog", "Cat", "Bird", "Rabbit", "Other"],
    },
    breed: { type: String, required: true, maxlength: 100 },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
    rescuedDate: { type: Date, required: true },
    rescueLocation: { type: String, required: true, maxlength: 200 },
    rescuedPetAge: { type: Number, required: true, min: 0, max: 30 },
    rescuedPetGender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    // Health and medical information
    healthStatus: {
      type: String,
      enum: ["Healthy", "Injured", "Recovering", "Critical", "Under Treatment"],
      required: true,
    },
    initialCondition: { type: String, required: true, maxlength: 500 },
    recoveryProgress: { type: String, maxlength: 1000, default: "" },
    medicalNotes: { type: String, maxlength: 2000, default: "" },

    // Medical records array
    medicalRecords: [
      {
        date: { type: Date, required: true },
        treatment: { type: String, required: true, maxlength: 500 },
        medication: { type: String, maxlength: 300, default: "" },
        veterinarian: { type: String, maxlength: 100 },
        notes: { type: String, maxlength: 500, default: "" },
        cost: { type: Number, min: 0, default: 0 },
      },
    ],

    // Vaccination records
    vaccinations: [
      {
        vaccineName: { type: String, required: true, maxlength: 100 },
        dateGiven: { type: Date, required: true },
        nextDueDate: { type: Date },
        veterinarian: { type: String, maxlength: 100 },
      },
    ],

    adoptionStatus: {
      type: String,
      enum: [
        "Available",
        "Pending",
        "Adopted",
        "Unavailable",
        "Not for Adoption",
        "Under Treatment",
      ],
      default: "Under Treatment",
    },
    adoptionReadiness: {
      type: String,
      enum: ["Ready", "Not Ready", "Under Assessment"],
      default: "Not Ready",
    },

    // Images
    imageUrl: { type: String, default: "" },
    additionalImages: [{ type: String }],

    // Foreign key reference to Vet
    vetId: { type: mongoose.Schema.Types.ObjectId, ref: "Vet" },

    // Status whether vet has confirmed or not
    isConfirmed: { type: Boolean, default: false },

    // Archive status
    isArchived: { type: Boolean, default: false },
    archiveReason: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// Check if model already exists before creating it
const RescuedPet = mongoose.models.RescuedPet || mongoose.model("RescuedPet", rescuedPetSchema);
export default RescuedPet;
