import Volunteer from "../model/Volunteer.js";

// Create volunteer
export const createVolunteerService = async (volunteerData) => {
    try {
        const volunteer = new Volunteer(volunteerData);
        return await volunteer.save();
    } catch (error) {
        throw new Error("Error creating volunteer: " + error.message);
    }
};

// Get all volunteers
export const getAllVolunteersService = async (filters = {}) => {
    try {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.skills) query.skills = { $in: filters.skills };
        if (filters.backgroundCheck) query.backgroundCheckStatus = filters.backgroundCheck;

        return await Volunteer.find(query)
            .populate("userId", "name email")
            .populate("approvedBy", "name")
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        throw new Error("Error fetching volunteers: " + error.message);
    }
};

// Get volunteer by user ID
export const getVolunteerByUserIdService = async (userId) => {
    try {
        const volunteer = await Volunteer.findOne({ userId })
            .populate("userId", "name email")
            .populate("approvedBy", "name")
            .lean();
        return volunteer;
    } catch (error) {
        throw new Error("Error fetching volunteer: " + error.message);
    }
};

// Get volunteer by ID
export const getVolunteerByIdService = async (id) => {
    try {
        const volunteer = await Volunteer.findById(id)
            .populate("userId", "name email")
            .populate("approvedBy", "name")
            .lean();
        if (!volunteer) throw new Error("Volunteer not found");
        return volunteer;
    } catch (error) {
        throw new Error("Error fetching volunteer: " + error.message);
    }
};

// Update volunteer
export const updateVolunteerService = async (id, updateData) => {
    try {
        const updatedVolunteer = await Volunteer.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedVolunteer) throw new Error("Volunteer not found");
        return updatedVolunteer;
    } catch (error) {
        throw new Error("Error updating volunteer: " + error.message);
    }
};

// Delete volunteer
export const deleteVolunteerService = async (id) => {
    try {
        const deletedVolunteer = await Volunteer.findByIdAndDelete(id);
        if (!deletedVolunteer) throw new Error("Volunteer not found");
        return deletedVolunteer;
    } catch (error) {
        throw new Error("Error deleting volunteer: " + error.message);
    }
};

// Get volunteer statistics
export const getVolunteerStatsService = async () => {
    try {
        const totalVolunteers = await Volunteer.countDocuments();
        const activeVolunteers = await Volunteer.countDocuments({ status: "Active" });
        const pendingApproval = await Volunteer.countDocuments({ status: "Pending Approval" });

        const skillStats = await Volunteer.aggregate([
            { $unwind: "$skills" },
            { $group: { _id: "$skills", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const totalHours = await Volunteer.aggregate([
            { $group: { _id: null, totalHours: { $sum: "$hoursLogged" } } }
        ]);

        return {
            totalVolunteers,
            activeVolunteers,
            pendingApproval,
            skillStats,
            totalHours: totalHours[0]?.totalHours || 0
        };
    } catch (error) {
        throw new Error("Error fetching volunteer statistics: " + error.message);
    }
};
