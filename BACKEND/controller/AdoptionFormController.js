import {
  createAdoptionFormService,
  getAllAdoptionFormsService,
  getAdoptionFormByIdService,
  updateAdoptionFormService,
  deleteAdoptionFormService,
  getUserAdoptionFormsService,
} from "../service/AdoptionFormService.js";

// Create a new adoption form
export const createAdoptionFormController = async (req, res) => {
  try {
    const formData = { ...req.body, userId: req.user.id };

    // Basic validation
    const { adopterName, adopterEmail, adopterPhone, adopterAddress, reasonForAdoption, petId } = formData;
    if (!adopterName || !adopterEmail || !adopterPhone || !adopterAddress || !reasonForAdoption || !petId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newForm = await createAdoptionFormService(formData);
    res.status(201).json(newForm);
  } catch (error) {
    console.error("Error creating adoption form:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get adoption forms based on user role
export const getAllAdoptionFormsController = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can see all forms
      const forms = await getAllAdoptionFormsService();
      return res.status(200).json(forms);
    } else {
      // Users can only see their own forms
      const forms = await getUserAdoptionFormsService(userId);
      return res.status(200).json(forms);
    }
  } catch (error) {
    console.error("Error fetching adoption forms:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get adoption form by ID
export const getAdoptionFormByIdController = async (req, res) => {
  try {
    const form = await getAdoptionFormByIdService(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });

    // Check if user can access this form
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && form.userId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(form);
  } catch (error) {
    console.error("Error fetching adoption form by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update adoption form
export const updateAdoptionFormController = async (req, res) => {
  try {
    const formId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;

    const existingForm = await getAdoptionFormByIdService(formId);
    if (!existingForm) return res.status(404).json({ message: "Form not found" });

    // Check permissions
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can update any form (including status)
      const updatedForm = await updateAdoptionFormService(formId, req.body);
      return res.status(200).json(updatedForm);
    } else {
      // Users can only update their own pending forms
      if (existingForm.userId.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (existingForm.formStatus !== 'Pending') {
        return res.status(400).json({ message: "Cannot edit non-pending forms" });
      }

      // Don't allow users to change status or userId
      const { formStatus, userId: _, ...updateData } = req.body;
      const updatedForm = await updateAdoptionFormService(formId, updateData);
      return res.status(200).json(updatedForm);
    }
  } catch (error) {
    console.error("Error updating adoption form:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete adoption form
export const deleteAdoptionFormController = async (req, res) => {
  try {
    const formId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;

    const existingForm = await getAdoptionFormByIdService(formId);
    if (!existingForm) return res.status(404).json({ message: "Form not found" });

    // Check permissions
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Admin/Staff can delete any form
      const deletedForm = await deleteAdoptionFormService(formId);
      return res.status(200).json({ message: "Form deleted successfully" });
    } else {
      // Users can only cancel their own pending forms
      if (existingForm.userId.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (existingForm.formStatus !== 'Pending') {
        return res.status(400).json({ message: "Cannot cancel non-pending forms" });
      }

      const deletedForm = await deleteAdoptionFormService(formId);
      return res.status(200).json({ message: "Adoption request cancelled successfully" });
    }
  } catch (error) {
    console.error("Error deleting adoption form:", error);
    res.status(500).json({ message: error.message });
  }
};
