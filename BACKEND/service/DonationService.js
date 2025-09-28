import Donation from "../model/Donation.js";

// Create donation
export const createDonationService = async (donationData) => {
    try {
        const donation = new Donation(donationData);
        return await donation.save();
    } catch (error) {
        throw new Error("Error creating donation: " + error.message);
    }
};

// Get all donations
export const getAllDonationsService = async (filters = {}) => {
    try {
        const query = {};

        if (filters.cause) query.cause = filters.cause;
        if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
        if (filters.donationType) query.donationType = filters.donationType;
        if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
        if (filters.endDate) {
            query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
        }

        return await Donation.find(query)
            .populate("donorId", "name email")
            .populate("acknowledgedBy", "name")
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        throw new Error("Error fetching donations: " + error.message);
    }
};

// Get donations by user
export const getUserDonationsService = async (userId) => {
    try {
        return await Donation.find({ donorId: userId })
            .populate("acknowledgedBy", "name")
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        throw new Error("Error fetching user donations: " + error.message);
    }
};

// Get donation by ID
export const getDonationByIdService = async (id) => {
    try {
        const donation = await Donation.findById(id)
            .populate("donorId", "name email phone")
            .populate("acknowledgedBy", "name")
            .lean();
        if (!donation) throw new Error("Donation not found");
        return donation;
    } catch (error) {
        throw new Error("Error fetching donation: " + error.message);
    }
};

// Update donation
export const updateDonationService = async (id, updateData) => {
    try {
        const updatedDonation = await Donation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedDonation) throw new Error("Donation not found");
        return updatedDonation;
    } catch (error) {
        throw new Error("Error updating donation: " + error.message);
    }
};

// Delete donation
export const deleteDonationService = async (id) => {
    try {
        const deletedDonation = await Donation.findByIdAndDelete(id);
        if (!deletedDonation) throw new Error("Donation not found");
        return deletedDonation;
    } catch (error) {
        throw new Error("Error deleting donation: " + error.message);
    }
};

// Get donation statistics
export const getDonationStatsService = async () => {
    try {
        const stats = await Donation.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalDonations: { $sum: 1 },
                    averageDonation: { $avg: "$amount" }
                }
            }
        ]);

        const byCause = await Donation.aggregate([
            {
                $group: {
                    _id: "$cause",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            overall: stats[0] || { totalAmount: 0, totalDonations: 0, averageDonation: 0 },
            byCause
        };
    } catch (error) {
        throw new Error("Error fetching donation statistics: " + error.message);
    }
};
