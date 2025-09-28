import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Personal Information
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            match: [/^\d{10}$/, "Invalid phone number"]
        },
        address: { type: String, required: true, trim: true },

        dateOfBirth: { type: Date },
        emergencyContact: {
            name: { type: String, trim: true },
            phone: { type: String, trim: true },
            relationship: { type: String, trim: true }
        },

        // Volunteer Details
        skills: [{
            type: String,
            enum: [
                "Animal Care",
                "Dog Walking",
                "Cat Socialization",
                "Administrative",
                "Event Planning",
                "Fundraising",
                "Photography",
                "Social Media",
                "Transportation",
                "Medical Assistance",
                "Cleaning",
                "Construction/Maintenance",
                "Training/Education",
                "Foster Care",
                "Other"
            ]
        }],

        availability: {
            monday: { available: { type: Boolean, default: false }, times: [String] },
            tuesday: { available: { type: Boolean, default: false }, times: [String] },
            wednesday: { available: { type: Boolean, default: false }, times: [String] },
            thursday: { available: { type: Boolean, default: false }, times: [String] },
            friday: { available: { type: Boolean, default: false }, times: [String] },
            saturday: { available: { type: Boolean, default: false }, times: [String] },
            sunday: { available: { type: Boolean, default: false }, times: [String] }
        },

        preferredTasks: [String],
        experience: { type: String, maxlength: 1000 },

        // Background Check & Training
        backgroundCheckStatus: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Not Required"],
            default: "Pending"
        },
        backgroundCheckDate: { type: Date },

        trainingCompleted: { type: Boolean, default: false },
        trainingDate: { type: Date },
        orientationCompleted: { type: Boolean, default: false },
        orientationDate: { type: Date },

        // Status
        status: {
            type: String,
            enum: ["Active", "Inactive", "Suspended", "Pending Approval"],
            default: "Pending Approval"
        },

        // Volunteer History
        hoursLogged: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },

        // Assignments
        currentAssignments: [{
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerTask" },
            title: String,
            assignedDate: { type: Date, default: Date.now },
            dueDate: Date,
            status: {
                type: String,
                enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
                default: "Assigned"
            }
        }],

        // Admin fields
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        approvedAt: { type: Date },

        notes: { type: String, maxlength: 1000 },

        // Preferences
        preferredContactMethod: {
            type: String,
            enum: ["Email", "Phone", "Text"],
            default: "Email"
        },

        newsletterSubscribed: { type: Boolean, default: true },
        eventNotifications: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

// Indexes
volunteerSchema.index({ userId: 1 });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ skills: 1 });
volunteerSchema.index({ email: 1 });

// Virtual for full name
volunteerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

const Volunteer = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;
