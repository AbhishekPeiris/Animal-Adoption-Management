import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
    {
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Donor Information
        donorName: { type: String, required: true, trim: true },
        donorEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        donorPhone: {
            type: String,
            trim: true,
            match: [/^\d{10}$/, "Invalid phone number"],
        },

        // Donation Details
        amount: {
            type: Number,
            required: true,
            min: [1, "Donation amount must be at least $1"],
        },

        cause: {
            type: String,
            required: true,
            enum: [
                "General Fund",
                "Medical Care",
                "Food & Supplies",
                "Shelter Maintenance",
                "Rescue Operations",
                "Emergency Fund",
                "Spay/Neuter Program",
                "Other",
            ],
        },

        customCause: {
            type: String,
            maxlength: 200,
            trim: true,
        },

        donationType: {
            type: String,
            enum: ["One-time", "Monthly", "Quarterly", "Yearly"],
            default: "One-time",
            required: true,
        },

        paymentMethod: {
            type: String,
            enum: [
                "Credit Card",
                "Debit Card",
                "PayPal",
                "Bank Transfer",
                "Cash",
                "Check",
            ],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Completed", "Failed", "Refunded"],
            default: "Pending",
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
        },

        // Recurring donation settings
        isRecurring: { type: Boolean, default: false },
        nextDonationDate: { type: Date },
        lastDonationDate: { type: Date },
        recurringEndDate: { type: Date },
        isActive: { type: Boolean, default: true },

        // Additional info
        message: {
            type: String,
            maxlength: 500,
            trim: true,
        },

        isAnonymous: { type: Boolean, default: false },

        // Admin fields
        acknowledgedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        acknowledgedAt: { type: Date },
        receiptSent: { type: Boolean, default: false },

        notes: {
            type: String,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
donationSchema.index({ donorId: 1 });
donationSchema.index({ cause: 1 });
donationSchema.index({ donationType: 1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ createdAt: -1 });

// Generate transaction ID before saving
donationSchema.pre("save", function (next) {
    if (!this.transactionId) {
        this.transactionId =
            "TXN" +
            Date.now() +
            Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    next();
});

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;
