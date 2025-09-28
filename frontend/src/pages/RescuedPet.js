import { useEffect, useState } from "react";
import API from "../services/api";
import Modal from "react-modal";
import styles from "./RescuedPet.module.css";
import { useAuth } from "../context/AuthContext";

Modal.setAppElement("#root");

function RescuedPet() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [viewPet, setViewPet] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    rescuedPetName: "",
    species: "Dog",
    breed: "",
    description: "",
    rescuedDate: "",
    rescueLocation: "",
    rescuedPetAge: "",
    rescuedPetGender: "Male",
    healthStatus: "Under Treatment",
    initialCondition: "",
    recoveryProgress: "",
    medicalNotes: "",
    adoptionStatus: "Under Treatment",
    adoptionReadiness: "Not Ready",
    imageUrl: "",
  });

  const [medicalFormData, setMedicalFormData] = useState({
    treatment: "",
    medication: "",
    veterinarian: "",
    notes: "",
    cost: "",
  });

  const fetchPets = () => {
    const params = {
      userRole: user?.role || "USER",
      showArchived: showArchived,
    };
    return API.get("/rescued-pets", { params })
      .then((res) => setPets(res.data))
      .catch((err) => console.error(err));
  };

  const refreshData = () => fetchPets();

  useEffect(() => {
    fetchPets();
  }, [showArchived, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMedicalChange = (e) => {
    setMedicalFormData({ ...medicalFormData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingPetId(null);
    setFormData({
      rescuedPetName: "",
      species: "Dog",
      breed: "",
      description: "",
      rescuedDate: "",
      rescueLocation: "",
      rescuedPetAge: "",
      rescuedPetGender: "Male",
      healthStatus: "Under Treatment",
      initialCondition: "",
      recoveryProgress: "",
      medicalNotes: "",
      adoptionStatus: "Under Treatment",
      adoptionReadiness: "Not Ready",
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openMedicalModal = (pet) => {
    setSelectedPet(pet);
    setMedicalFormData({
      treatment: "",
      medication: "",
      veterinarian: "",
      notes: "",
      cost: "",
    });
    setIsMedicalModalOpen(true);
  };

  const sanitize = (str) => (str || "").replace(/<[^>]*>/g, "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = sanitize(formData.rescuedPetName);
    if (
      !name ||
      name.length < 2 ||
      name.length > 100 ||
      !/^[A-Za-z\s-]+$/.test(name)
    ) {
      alert("Name must be 2-100 letters/spaces/hyphens.");
      return;
    }

    const breed = sanitize(formData.breed);
    if (!breed || breed.length < 2 || breed.length > 100) {
      alert("Breed must be 2-100 characters.");
      return;
    }

    try {
      const payload = {
        rescuedPetName: name,
        species: formData.species,
        breed: breed,
        description: sanitize(formData.description),
        rescuedDate: formData.rescuedDate,
        rescueLocation: sanitize(formData.rescueLocation),
        rescuedPetAge: Number(formData.rescuedPetAge),
        rescuedPetGender: formData.rescuedPetGender,
        healthStatus: formData.healthStatus,
        initialCondition: sanitize(formData.initialCondition),
        recoveryProgress: sanitize(formData.recoveryProgress),
        medicalNotes: sanitize(formData.medicalNotes),
        adoptionStatus: formData.adoptionStatus,
        adoptionReadiness: formData.adoptionReadiness,
        imageUrl: formData.imageUrl || "",
      };

      if (editingPetId) {
        const res = await API.put(`/rescued-pets/${editingPetId}`, payload);
        const updated = res?.data?.pet ?? res?.data;
        setPets(
          pets.map((pet) => (pet && pet._id === editingPetId ? updated : pet))
        );
        setEditingPetId(null);
      } else {
        const res = await API.post("/rescued-pets", payload);
        const created = res?.data?.pet ?? res?.data;
        if (created) setPets((prev) => [...prev, created]);
      }

      setIsModalOpen(false);
      fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        `Error saving rescued pet record: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleMedicalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPet || !medicalFormData.treatment.trim()) {
      alert("Treatment description is required.");
      return;
    }

    try {
      await API.post(`/rescued-pets/${selectedPet._id}/medical-records`, {
        treatment: sanitize(medicalFormData.treatment),
        medication: sanitize(medicalFormData.medication),
        veterinarian: sanitize(medicalFormData.veterinarian),
        notes: sanitize(medicalFormData.notes),
        cost: medicalFormData.cost ? Number(medicalFormData.cost) : 0,
      });

      alert("Medical record added successfully!");
      setIsMedicalModalOpen(false);
      fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        `Error adding medical record: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const updateAdoptionReadiness = async (id, status) => {
    try {
      await API.put(`/rescued-pets/${id}/adoption-readiness`, {
        adoptionReadiness: status,
        adoptionStatus: status === "Ready" ? "Available" : "Under Treatment",
      });
      alert("Adoption readiness updated successfully!");
      fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        `Error updating adoption readiness: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const archivePet = async (id) => {
    const reason = prompt("Enter reason for archiving:");
    if (!reason) return;

    try {
      await API.put(`/rescued-pets/${id}/archive`, { reason });
      alert("Pet archived successfully!");
      fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        `Error archiving pet: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const deletePet = async (id) => {
    if (!window.confirm("Delete this rescued pet?")) return;
    try {
      await API.delete(`/rescued-pets/${id}`);
      setPets((prev) => prev.filter((p) => p && p._id !== id));
    } catch (err) {
      console.error(err);
      alert(
        `Error deleting rescued pet: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const adoptPet = async (id) => {
    if (!window.confirm("Mark this pet as adopted?")) return;
    try {
      // Use the standard update endpoint that includes PetProfile creation logic
      const res = await API.put(`/rescued-pets/${id}`, {
        adoptionStatus: "Adopted",
      });
      const updated = res?.data?.pet ?? res?.data;
      setPets(pets.map((pet) => (pet && pet._id === id ? updated : pet)));
      alert("Pet has been marked as adopted and added to Pet Profiles!");

      // Refresh the data to ensure we have the latest state
      fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        `Error adopting pet: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const openEditModal = (pet) => {
    if (!pet || !pet._id) return alert("Invalid pet data.");
    setFormData({
      rescuedPetName: pet.rescuedPetName,
      species: pet.species || "Dog",
      breed: pet.breed || "",
      description: pet.description,
      rescuedDate: new Date(pet.rescuedDate).toISOString().split("T")[0],
      rescueLocation: pet.rescueLocation || "",
      rescuedPetAge: pet.rescuedPetAge,
      rescuedPetGender: pet.rescuedPetGender,
      healthStatus: pet.healthStatus || "Healthy",
      initialCondition: pet.initialCondition || "",
      recoveryProgress: pet.recoveryProgress || "",
      medicalNotes: pet.medicalNotes || "",
      adoptionStatus: pet.adoptionStatus || "Available",
      adoptionReadiness: pet.adoptionReadiness || "Not Ready",
      imageUrl: pet.imageUrl || "",
    });
    setEditingPetId(pet._id);
    setIsModalOpen(true);
  };

  // Fetch full pet details by ID for view modal
  const openViewModal = async (pet) => {
    try {
      const res = await API.get(`/rescued-pets/${pet._id}`, {
        params: { userRole: user?.role || "ADMIN" },
      });
      setViewPet(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      alert("Failed to load pet details.");
    }
  };

  const filteredPets = (pets || []).filter((pet) => {
    const id = (pet?.rescuedPetId ?? "").toString().toLowerCase();
    const name = (pet?.rescuedPetName ?? "").toString().toLowerCase();
    const q = (search ?? "").toLowerCase();
    return id.includes(q) || name.includes(q);
  });

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";
  const isVet = user?.role === "VET";
  const canEdit = isAdmin || isStaff || isVet;

  return (
    <div className={styles.container}>
      <h1>Rescued Pets Management</h1>

      <div className={styles.topBar}>
        {canEdit && (
          <button className={styles.btn} onClick={openAddModal}>
            Register New Pet
          </button>
        )}
        <button className={styles.btnRefresh} onClick={fetchPets}>
          Refresh
        </button>
        {canEdit && (
          <button
            className={styles.btnSecondary}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by ID or Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />

      <table className={styles.recordsTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Species</th>
            <th>Breed</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Health Status</th>
            {canEdit && <th>Rescue Location</th>}
            <th>Adoption Status</th>
            {canEdit && <th>Readiness</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <tr key={pet._id}>
                <td>{pet.rescuedPetId}</td>
                <td>{pet.rescuedPetName}</td>
                <td>{pet.species}</td>
                <td>{pet.breed}</td>
                <td>{pet.rescuedPetAge}</td>
                <td>{pet.rescuedPetGender}</td>
                <td>{pet.healthStatus}</td>
                {canEdit && <td>{pet.rescueLocation}</td>}
                <td>{pet.adoptionStatus}</td>
                {canEdit && <td>{pet.adoptionReadiness}</td>}
                <td>
                  {canEdit && (
                    <>
                      <button
                        className={styles.btnEdit}
                        onClick={() => openEditModal(pet)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => openMedicalModal(pet)}
                      >
                        Add Medical
                      </button>
                      <button
                        className={styles.btn}
                        onClick={() => openViewModal(pet)}
                        style={{ marginRight: 5 }}
                      >
                        View All
                      </button>
                      {pet.adoptionReadiness === "Not Ready" && (
                        <button
                          className={styles.btnSuccess}
                          onClick={() =>
                            updateAdoptionReadiness(pet._id, "Ready")
                          }
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        className={styles.btnWarning}
                        onClick={() => archivePet(pet._id)}
                      >
                        Archive
                      </button>
                    </>
                  )}
                  {pet.adoptionStatus === "Available" &&
                    pet.adoptionReadiness === "Ready" && (
                      <button
                        className={styles.btnSuccess}
                        onClick={() => adoptPet(pet._id)}
                      >
                        Adopt
                      </button>
                    )}
                  {isAdmin && (
                    <button
                      className={styles.btnDanger}
                      onClick={() => deletePet(pet._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={canEdit ? "11" : "9"} className={styles.noRecords}>
                No pets found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Enhanced Pet Registration/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add/Edit Rescued Pet"
        className={styles.modalWindow}
        overlayClassName={styles.modalOverlay}
      >
        <h2>{editingPetId ? "Edit" : "Register New"} Rescued Pet</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="text"
              name="rescuedPetName"
              placeholder="Pet Name"
              value={formData.rescuedPetName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <select
              name="species"
              value={formData.species}
              onChange={handleChange}
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              {/* <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option> */}
            </select>
            <input
              type="text"
              name="breed"
              placeholder="Breed"
              value={formData.breed}
              onChange={handleChange}
              required
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <div className={styles.formRow}>
            <input
              type="date"
              name="rescuedDate"
              value={formData.rescuedDate}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="rescueLocation"
              placeholder="Rescue Location"
              value={formData.rescueLocation}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <input
              type="number"
              name="rescuedPetAge"
              placeholder="Age"
              value={formData.rescuedPetAge}
              onChange={handleChange}
              required
              min={0}
              max={30}
              step={0.1}
            />
            <select
              name="rescuedPetGender"
              value={formData.rescuedPetGender}
              onChange={handleChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <textarea
            name="initialCondition"
            placeholder="Initial Health Condition"
            value={formData.initialCondition}
            onChange={handleChange}
            required
          />

          <div className={styles.formRow}>
            <select
              name="healthStatus"
              value={formData.healthStatus}
              onChange={handleChange}
            >
              <option value="Healthy">Healthy</option>
              <option value="Injured">Injured</option>
              <option value="Recovering">Recovering</option>
              <option value="Critical">Critical</option>
              <option value="Under Treatment">Under Treatment</option>
            </select>
            <select
              name="adoptionReadiness"
              value={formData.adoptionReadiness}
              onChange={handleChange}
            >
              <option value="Ready">Ready</option>
              <option value="Not Ready">Not Ready</option>
              <option value="Under Assessment">Under Assessment</option>
            </select>
          </div>

          <input
            type="url"
            name="imageUrl"
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={handleChange}
          />

          <div className={styles.modalButtons}>
            <button type="submit" className={styles.btn}>
              {editingPetId ? "Update" : "Register"}
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Medical Records Modal */}
      <Modal
        isOpen={isMedicalModalOpen}
        onRequestClose={() => setIsMedicalModalOpen(false)}
        contentLabel="Add Medical Record"
        className={styles.modalWindow}
        overlayClassName={styles.modalOverlay}
      >
        <h2>Add Medical Record for {selectedPet?.rescuedPetName}</h2>
        <form onSubmit={handleMedicalSubmit}>
          <textarea
            name="treatment"
            placeholder="Treatment Description *"
            value={medicalFormData.treatment}
            onChange={handleMedicalChange}
            required
          />
          <input
            type="text"
            name="medication"
            placeholder="Medication (optional)"
            value={medicalFormData.medication}
            onChange={handleMedicalChange}
          />
          <input
            type="text"
            name="veterinarian"
            placeholder="Veterinarian Name"
            value={medicalFormData.veterinarian}
            onChange={handleMedicalChange}
          />
          <textarea
            name="notes"
            placeholder="Additional Notes"
            value={medicalFormData.notes}
            onChange={handleMedicalChange}
          />
          <input
            type="number"
            name="cost"
            placeholder="Treatment Cost"
            value={medicalFormData.cost}
            onChange={handleMedicalChange}
            min={0}
            step={0.01}
          />

          <div className={styles.modalButtons}>
            <button type="submit" className={styles.btn}>
              Add Record
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setIsMedicalModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* View All Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onRequestClose={() => setIsViewModalOpen(false)}
        contentLabel="View Rescued Pet Details"
        className={styles.modalWindow}
        overlayClassName={styles.modalOverlay}
      >
        <h2>Rescued Pet Details</h2>
        {viewPet ? (
          <div>
            <div>
              <b>ID:</b> {viewPet.rescuedPetId}
            </div>
            <div>
              <b>Name:</b> {viewPet.rescuedPetName}
            </div>
            <div>
              <b>Species:</b> {viewPet.species}
            </div>
            <div>
              <b>Breed:</b> {viewPet.breed}
            </div>
            <div>
              <b>Age:</b> {viewPet.rescuedPetAge}
            </div>
            <div>
              <b>Gender:</b> {viewPet.rescuedPetGender}
            </div>
            <div>
              <b>Rescue Date:</b>{" "}
              {viewPet.rescuedDate
                ? new Date(viewPet.rescuedDate).toLocaleDateString()
                : ""}
            </div>
            <div>
              <b>Rescue Location:</b> {viewPet.rescueLocation}
            </div>
            <div>
              <b>Description:</b> {viewPet.description}
            </div>
            <div>
              <b>Initial Condition:</b> {viewPet.initialCondition}
            </div>
            <div>
              <b>Health Status:</b> {viewPet.healthStatus}
            </div>
            <div>
              <b>Recovery Progress:</b> {viewPet.recoveryProgress}
            </div>
            <div>
              <b>Medical Notes:</b> {viewPet.medicalNotes}
            </div>
            <div>
              <b>Adoption Status:</b> {viewPet.adoptionStatus}
            </div>
            <div>
              <b>Adoption Readiness:</b> {viewPet.adoptionReadiness}
            </div>
            <div>
              <b>Confirmed by Vet:</b> {viewPet.isConfirmed ? "Yes" : "No"}
            </div>
            <div>
              <b>Archived:</b> {viewPet.isArchived ? "Yes" : "No"}
            </div>
            {viewPet.archiveReason && (
              <div>
                <b>Archive Reason:</b> {viewPet.archiveReason}
              </div>
            )}
            <div>
              <b>Image:</b>
              <br />
              {viewPet.imageUrl && (
                <img
                  src={viewPet.imageUrl}
                  alt="pet"
                  style={{ maxWidth: 200, maxHeight: 200 }}
                />
              )}
            </div>
            {viewPet.additionalImages &&
              viewPet.additionalImages.length > 0 && (
                <div>
                  <b>Additional Images:</b>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {viewPet.additionalImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`pet-${idx}`}
                        style={{ maxWidth: 100, maxHeight: 100 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            <div>
              <b>Medical Records:</b>
              {viewPet.medicalRecords && viewPet.medicalRecords.length > 0 ? (
                <ul>
                  {viewPet.medicalRecords.map((rec, idx) => (
                    <li key={idx}>
                      <div>
                        <b>Date:</b>{" "}
                        {rec.date
                          ? new Date(rec.date).toLocaleDateString()
                          : ""}
                      </div>
                      <div>
                        <b>Treatment:</b> {rec.treatment}
                      </div>
                      <div>
                        <b>Medication:</b> {rec.medication}
                      </div>
                      <div>
                        <b>Veterinarian:</b> {rec.veterinarian}
                      </div>
                      <div>
                        <b>Notes:</b> {rec.notes}
                      </div>
                      <div>
                        <b>Cost:</b> {rec.cost}
                      </div>
                      <hr />
                    </li>
                  ))}
                </ul>
              ) : (
                <div>No medical records.</div>
              )}
            </div>
            <div>
              <b>Vaccinations:</b>
              {viewPet.vaccinations && viewPet.vaccinations.length > 0 ? (
                <ul>
                  {viewPet.vaccinations.map((vac, idx) => (
                    <li key={idx}>
                      <div>
                        <b>Vaccine:</b> {vac.vaccineName}
                      </div>
                      <div>
                        <b>Date Given:</b>{" "}
                        {vac.dateGiven
                          ? new Date(vac.dateGiven).toLocaleDateString()
                          : ""}
                      </div>
                      <div>
                        <b>Next Due:</b>{" "}
                        {vac.nextDueDate
                          ? new Date(vac.nextDueDate).toLocaleDateString()
                          : ""}
                      </div>
                      <div>
                        <b>Veterinarian:</b> {vac.veterinarian}
                      </div>
                      <hr />
                    </li>
                  ))}
                </ul>
              ) : (
                <div>No vaccination records.</div>
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.btn}
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>
    </div>
  );
}

export default RescuedPet;
