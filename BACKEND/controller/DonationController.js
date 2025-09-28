import {
  createDonationService,
  getAllDonationsService,
  getUserDonationsService,
  getDonationByIdService,
  updateDonationService,
  deleteDonationService,
  getDonationStatsService
} from "../service/DonationService.js";

// Create donation
export const createDonationController = async (req, res) => {
  try {
    const donationData = { ...req.body, donorId: req.user.id };
    
    // Basic validation
    const { donorName, donorEmail, amount, cause, paymentMethod } = donationData;
    if (!donorName || !donorEmail || !amount || !cause || !paymentMethod) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    if (amount < 1) {
      return res.status(400).json({ message: "Donation amount must be at least $1" });
    }
    
    // Set next donation date for recurring donations
    if (donationData.isRecurring && donationData.donationType !== "One-time") {
      const nextDate = new Date();
      switch (donationData.donationType) {
        case "Monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "Quarterly":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "Yearly":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      donationData.nextDonationDate = nextDate;
    }
    
    const newDonation = await createDonationService(donationData);
    res.status(201).json(newDonation);
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get donations based on user role
export const getAllDonationsController = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can see all donations
      const donations = await getAllDonationsService(req.query);
      return res.status(200).json(donations);
    } else {
      // Users can only see their own donations
      const donations = await getUserDonationsService(userId);
      return res.status(200).json(donations);
    }
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get donation by ID
export const getDonationByIdController = async (req, res) => {
  try {
    const donation = await getDonationByIdService(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    
    // Check if user can access this donation
    const userRole = req.user.role;
    const userId = req.user.id;
    
    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && donation.donorId._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.status(200).json(donation);
  } catch (error) {
    console.error("Error fetching donation by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update donation
export const updateDonationController = async (req, res) => {
  try {
    const donationId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    const existingDonation = await getDonationByIdService(donationId);
    if (!existingDonation) return res.status(404).json({ message: "Donation not found" });
    
    // Check permissions
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can update any donation
      const updatedDonation = await updateDonationService(donationId, req.body);
      return res.status(200).json(updatedDonation);
    } else {
      // Users can only update their own recurring donation settings
      if (existingDonation.donorId._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only allow updating certain fields for users
      const allowedUpdates = ['isActive', 'recurringEndDate', 'message'];
      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = req.body[key];
        }
      });
      
      const updatedDonation = await updateDonationService(donationId, updateData);
      return res.status(200).json(updatedDonation);
    }
  } catch (error) {
    console.error("Error updating donation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete donation (Cancel recurring)
export const deleteDonationController = async (req, res) => {
  try {
    const donationId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    const existingDonation = await getDonationByIdService(donationId);
    if (!existingDonation) return res.status(404).json({ message: "Donation not found" });
    
    // Check permissions
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can delete any donation
      await deleteDonationService(donationId);
      return res.status(200).json({ message: "Donation deleted successfully" });
    } else {
      // Users can only cancel their own recurring donations
      if (existingDonation.donorId._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!existingDonation.isRecurring) {
        return res.status(400).json({ message: "Cannot cancel non-recurring donations" });
      }
      
      // Instead of deleting, mark as inactive
      await updateDonationService(donationId, { isActive: false });
      return res.status(200).json({ message: "Recurring donation cancelled successfully" });
    }
  } catch (error) {
    console.error("Error deleting donation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get donation statistics (Admin only)
export const getDonationStatsController = async (req, res) => {
  try {
    const stats = await getDonationStatsService();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching donation statistics:", error);
    res.status(500).json({ message: error.message });
  }
};
