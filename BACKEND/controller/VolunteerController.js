import {
    createVolunteerService,
    getAllVolunteersService,
    getVolunteerByUserIdService,
    getVolunteerByIdService,
    updateVolunteerService,
    deleteVolunteerService,
    getVolunteerStatsService
} from "../service/VolunteerService.js";

// Create/Register volunteer
export const createVolunteerController = async (req, res) => {
    try {
        const volunteerData = { ...req.body, userId: req.user.id };

        // Basic validation
        const { firstName, lastName, email, phone, address } = volunteerData;
        if (!firstName || !lastName || !email || !phone || !address) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // Check if user is already registered as volunteer
        const existingVolunteer = await getVolunteerByUserIdService(req.user.id);
        if (existingVolunteer) {
            return res.status(400).json({ message: "You are already registered as a volunteer" });
        }

        const newVolunteer = await createVolunteerService(volunteerData);
        res.status(201).json(newVolunteer);
    } catch (error) {
        console.error("Error creating volunteer:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get volunteers based on user role
export const getAllVolunteersController = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        if (userRole === 'ADMIN' || userRole === 'STAFF') {
            // Admin/Staff can see all volunteers
            const volunteers = await getAllVolunteersService(req.query);
            return res.status(200).json(volunteers);
        } else {
            // Users can only see their own volunteer profile
            const volunteer = await getVolunteerByUserIdService(userId);
            return res.status(200).json(volunteer ? [volunteer] : []);
        }
    } catch (error) {
        console.error("Error fetching volunteers:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get volunteer by ID
export const getVolunteerByIdController = async (req, res) => {
    try {
        const volunteer = await getVolunteerByIdService(req.params.id);
        if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

        // Check if user can access this volunteer profile
        const userRole = req.user.role;
        const userId = req.user.id;

        if (userRole !== 'ADMIN' && userRole !== 'STAFF' && volunteer.userId._id.toString() !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(volunteer);
    } catch (error) {
        console.error("Error fetching volunteer by ID:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update volunteer
export const updateVolunteerController = async (req, res) => {
    try {
        const volunteerId = req.params.id;
        const userRole = req.user.role;
        const userId = req.user.id;

        const existingVolunteer = await getVolunteerByIdService(volunteerId);
        if (!existingVolunteer) return res.status(404).json({ message: "Volunteer not found" });

        // Check permissions
        if (userRole === 'ADMIN' || userRole === 'STAFF') {
            // Admin/Staff can update any volunteer (including status, assignments, etc.)
            const updatedVolunteer = await updateVolunteerService(volunteerId, req.body);
            return res.status(200).json(updatedVolunteer);
        } else {
            // Users can only update their own profile with limited fields
            if (existingVolunteer.userId._id.toString() !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }

            // Only allow updating certain fields for users
            const allowedUpdates = [
                'phone', 'address', 'emergencyContact', 'skills', 'availability',
                'preferredTasks', 'experience', 'preferredContactMethod',
                'newsletterSubscribed', 'eventNotifications'
            ];

            const updateData = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updateData[key] = req.body[key];
                }
            });

            const updatedVolunteer = await updateVolunteerService(volunteerId, updateData);
            return res.status(200).json(updatedVolunteer);
        }
    } catch (error) {
        console.error("Error updating volunteer:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete volunteer
export const deleteVolunteerController = async (req, res) => {
    try {
        const volunteerId = req.params.id;
        const userRole = req.user.role;
        const userId = req.user.id;

        const existingVolunteer = await getVolunteerByIdService(volunteerId);
        if (!existingVolunteer) return res.status(404).json({ message: "Volunteer not found" });

        // Check permissions
        if (userRole === 'ADMIN' || userRole === 'STAFF') {
            // Admin/Staff can delete any volunteer
            await deleteVolunteerService(volunteerId);
            return res.status(200).json({ message: "Volunteer deleted successfully" });
        } else {
            // Users can withdraw their own volunteer registration
            if (existingVolunteer.userId._id.toString() !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }

            await deleteVolunteerService(volunteerId);
            return res.status(200).json({ message: "Volunteer registration withdrawn successfully" });
        }
    } catch (error) {
        console.error("Error deleting volunteer:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get volunteer statistics (Admin only)
export const getVolunteerStatsController = async (req, res) => {
    try {
        const stats = await getVolunteerStatsService();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching volunteer statistics:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get current user's volunteer profile
export const getMyVolunteerProfileController = async (req, res) => {
    try {
        const volunteer = await getVolunteerByUserIdService(req.user.id);
        if (!volunteer) {
            return res.status(404).json({ message: "Volunteer profile not found" });
        }
        res.status(200).json(volunteer);
    } catch (error) {
        console.error("Error fetching volunteer profile:", error);
        res.status(500).json({ message: error.message });
    }
};
