import AdoptionForm from "../model/AdoptionForm.js";

// Create adoption form
export const createAdoptionFormService = async (formData) => {
  try {
    const form = new AdoptionForm(formData);
    return await form.save();
  } catch (error) {
    throw new Error("Error creating adoption form: " + error.message);
  }
};

// Get all adoption forms
export const getAllAdoptionFormsService = async () => {
  try {
    return await AdoptionForm.find()
      .populate("petId")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    throw new Error("Error fetching adoption forms: " + error.message);
  }
};

// Get adoption form by ID
export const getAdoptionFormByIdService = async (id) => {
  try {
    const form = await AdoptionForm.findById(id)
      .populate("petId")
      .populate("reviewedBy", "name")
      .lean();
    if (!form) throw new Error("Form not found");
    return form;
  } catch (error) {
    throw new Error("Error fetching adoption form: " + error.message);
  }
};

// Get adoption forms for a specific user
export const getUserAdoptionFormsService = async (userId) => {
  try {
    return await AdoptionForm.find({ userId })
      .populate("petId")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    throw new Error("Error fetching user adoption forms: " + error.message);
  }
};

// Update adoption form
export const updateAdoptionFormService = async (id, updateData) => {
  try {
    const updatedForm = await AdoptionForm.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedForm) throw new Error("Form not found");
    return updatedForm;
  } catch (error) {
    throw new Error("Error updating adoption form: " + error.message);
  }
};

// Delete adoption form
export const deleteAdoptionFormService = async (id) => {
  try {
    const deletedForm = await AdoptionForm.findByIdAndDelete(id);
    if (!deletedForm) throw new Error("Form not found");
    return deletedForm;
  } catch (error) {
    throw new Error("Error deleting adoption form: " + error.message);
  }
};
