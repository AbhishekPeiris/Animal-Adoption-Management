import mongoose from "mongoose";

const adoptionFormSchema = new mongoose.Schema(
  {
    // User who submitted the form
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    adopterName: { type: String, required: true, trim: true },
    adopterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    adopterPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Invalid phone number"]
    },
    adopterAddress: { type: String, required: true, trim: true },
    reasonForAdoption: { type: String, required: true, trim: true },

    // Home details
    homeType: {
      type: String,
      enum: ["House", "Apartment", "Condo", "Other"],
      default: "House"
    },
    hasYard: { type: Boolean, default: false },
    otherPets: { type: String, default: "" },
    experience: { type: String, default: "" },

    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetProfile",
      required: true
    },

    formStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },

    // Admin notes
    adminNotes: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
adoptionFormSchema.index({ userId: 1 });
adoptionFormSchema.index({ petId: 1 });
adoptionFormSchema.index({ formStatus: 1 });

// Check if model already exists before creating it
const AdoptionForm = mongoose.models.AdoptionForm || mongoose.model("AdoptionForm", adoptionFormSchema);
export default AdoptionForm;
