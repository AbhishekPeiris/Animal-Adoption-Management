import React, { useEffect, useState } from "react";
import API from "../../services/api";
import Modal from "react-modal";
import styles from "./PetListing.module.css";

Modal.setAppElement("#root");

function PetListing() {
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);
  const [viewPetDetails, setViewPetDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    petName: "",
    petSpecies: "Cat",
    petBreed: "",
    petAge: "",
    petDescription: "",
    petGender: "Male",
    petStatus: "Available",
    imageUrl: "",
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = () => {
    console.log("🔄 Fetching pet profiles...");
    return API.get("/pet-profiles")
      .then((res) => {
        console.log("✅ Fetched pet profiles:", res.data.length);
        setPets(res.data);
      })
      .catch((err) => console.error("❌ Error fetching pets:", err));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePetIdChange = (e) => {
    let value = (e.target.value || "").trim();
    value = value.replace(/\s+/g, "").replace(/[^A-Za-z0-9-]/g, "");
    if (value.length >= 1) value = value[0].toUpperCase() + value.slice(1);
    setFormData({ ...formData, petId: value });
  };

  const openAddModal = () => {
    setEditingPetId(null);
    setFormData({
      petName: "",
      petSpecies: "Cat",
      petBreed: "",
      petAge: "",
      petDescription: "",
      petGender: "Male",
      petStatus: "Available",
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitize = (str) => (str || "").replace(/<[^>]*>/g, "").trim();
    const name = sanitize(formData.petName);
    const breed = sanitize(formData.petBreed);
    const description = sanitize(formData.petDescription);
    const species = formData.petSpecies;
    const ageNum = Number(formData.petAge);

    if (
      !name ||
      name.length < 2 ||
      name.length > 50 ||
      !/^[A-Za-z\s-]+$/.test(name)
    ) {
      return alert("Name: 2–50 letters, spaces or hyphens only");
    }
    if (
      !breed ||
      breed.length < 2 ||
      breed.length > 50 ||
      !/^[A-Za-z\s-]+$/.test(breed)
    ) {
      return alert("Breed: 2–50 letters, spaces or hyphens only");
    }
    if (Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 30) {
      return alert("Age must be > 0 and ≤ 30");
    }
    if (!description || description.length < 10 || description.length > 500) {
      return alert("Description: 10–500 characters");
    }

    const payload = {
      petName: name,
      petSpecies: species,
      petBreed: breed,
      petAge: ageNum,
      petDescription: description,
      petGender: formData.petGender,
      petStatus: formData.petStatus,
      imageUrl:
        formData.imageUrl?.trim() || "https://via.placeholder.com/300?text=Pet",
    };

    try {
      if (editingPetId) {
        const { petId: _ignore, ...updatePayload } = payload;
        const res = await API.put(
          `/pet-profiles/${editingPetId}`,
          updatePayload
        );
        const updated = res?.data?.pet ?? res?.data;
        setPets(
          pets.map((pet) => (pet && pet._id === editingPetId ? updated : pet))
        );
        setEditingPetId(null);
      } else {
        const res = await API.post("/pet-profiles", payload);
        const created = res?.data?.pet ?? res?.data;
        if (created) await fetchPets();
      }
      setFormData({
        petName: "",
        petSpecies: "Cat",
        petBreed: "",
        petAge: "",
        petDescription: "",
        petGender: "Male",
        petStatus: "Available",
        imageUrl: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Error saving pet: ${err.response?.data?.message || err.message}`);
    }
  };

  const deletePet = async (id) => {
    if (!window.confirm("Delete this pet?")) return;
    try {
      await API.delete(`/pet-profiles/${id}`);
      setPets((prev) => prev.filter((p) => p && p._id !== id));
    } catch (err) {
      console.error(err);
      alert(
        `Error deleting pet: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const openEditModal = (pet) => {
    setFormData({
      petName: pet.petName,
      petSpecies: pet.petSpecies,
      petBreed: pet.petBreed,
      petAge: pet.petAge,
      petDescription: pet.petDescription,
      petGender: pet.petGender,
      petStatus: pet.petStatus || "Available",
      imageUrl: pet.imageUrl || "",
    });
    setEditingPetId(pet._id);
    setIsModalOpen(true);
  };

  const openPetDetails = async (pet) => {
    try {
      const res = await API.get(`/pet-profiles/${pet._id}`, {
        params: { userRole: "ADMIN" },
      });
      setViewPetDetails(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching pet details:", error);
      alert("Failed to load pet details");
    }
  };

  const filteredPets = (pets || []).filter((pet) => {
    const name = (pet?.petName ?? "").toLowerCase();
    const species = (pet?.petSpecies ?? "").toLowerCase();
    const breed = (pet?.petBreed ?? "").toLowerCase();
    const q = (search ?? "").toLowerCase();
    return name.includes(q) || species.includes(q) || breed.includes(q);
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pet Listing</h1>

      <div className={styles.topBar}>
        <button className={styles.btn} onClick={openAddModal}>
          Add New Pet
        </button>
        <button
          className={styles.btn}
          onClick={fetchPets}
          style={{ marginLeft: "10px", backgroundColor: "#6c757d" }}
        >
          Refresh
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, species, or breed"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />

      <table className={styles.recordsTable}>
        <thead>
          <tr>
            <th>Pet ID</th>
            <th>Name</th>
            <th>Species</th>
            <th>Breed</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <tr key={pet._id}>
                <td>{pet.petId}</td>
                <td>{pet.petName}</td>
                <td>{pet.petSpecies}</td>
                <td>{pet.petBreed}</td>
                <td>{pet.petAge}</td>
                <td>{pet.petGender}</td>
                <td>{pet.petStatus}</td>
                <td>{pet.petDescription}</td>
                <td>
                  <button
                    className={`${styles.btn}`}
                    onClick={() => openPetDetails(pet)}
                    style={{ marginRight: 5, backgroundColor: "#17a2b8" }}
                  >
                    View Details
                  </button>
                  <button
                    className={`${styles.btn} ${styles.editBtn}`}
                    onClick={() => openEditModal(pet)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.btn} ${styles.deleteBtn}`}
                    onClick={() => deletePet(pet._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className={styles.noRecords}>
                No pets found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pet Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onRequestClose={() => setIsDetailsOpen(false)}
        contentLabel="Pet Details"
        className={styles.petModal}
        overlayClassName={styles.petOverlay}
      >
        {viewPetDetails ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2>{viewPetDetails.petName} - Full Details</h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            {viewPetDetails.imageUrl && (
              <img
                src={viewPetDetails.imageUrl}
                alt={viewPetDetails.petName}
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 15,
                }}
              />
            )}

            <div
              style={{
                display: "grid",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div>
                <strong>Pet ID:</strong> {viewPetDetails.petId}
              </div>
              <div>
                <strong>Species:</strong> {viewPetDetails.petSpecies}
              </div>
              <div>
                <strong>Breed:</strong> {viewPetDetails.petBreed}
              </div>
              <div>
                <strong>Age:</strong> {viewPetDetails.petAge} years
              </div>
              <div>
                <strong>Gender:</strong> {viewPetDetails.petGender}
              </div>
              <div>
                <strong>Status:</strong> {viewPetDetails.petStatus}
              </div>
              <div>
                <strong>Description:</strong> {viewPetDetails.petDescription}
              </div>
            </div>

            {viewPetDetails.medicalInfo && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 15,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                }}
              >
                <h4>Medical Information</h4>
                <div>
                  <strong>Health Status:</strong> {viewPetDetails.medicalInfo.healthStatus}
                </div>
                <div>
                  <strong>Vaccinated:</strong> {viewPetDetails.medicalInfo.isVaccinated ? "Yes" : "No"}
                </div>
                {viewPetDetails.medicalInfo.lastVetVisit && (
                  <div>
                    <strong>Last Vet Visit:</strong>{" "}
                    {new Date(viewPetDetails.medicalInfo.lastVetVisit).toLocaleDateString()}
                  </div>
                )}
                {viewPetDetails.medicalInfo.vetNotes && (
                  <div>
                    <strong>Vet Notes:</strong> {viewPetDetails.medicalInfo.vetNotes}
                  </div>
                )}
              </div>
            )}

            {viewPetDetails.medicalRecords &&
              viewPetDetails.medicalRecords.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4>Medical Records & Vaccinations</h4>
                  {viewPetDetails.medicalRecords.map((record, index) => (
                    <div
                      key={index}
                      style={{
                        padding: 10,
                        margin: "5px 0",
                        backgroundColor: "#e9ecef",
                        borderRadius: 5,
                      }}
                    >
                      <div>
                        <strong>Vaccination:</strong> {record.vaccination}
                      </div>
                      <div>
                        <strong>Due Date:</strong>{" "}
                        {new Date(record.dueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Age:</strong> {record.age} years
                      </div>
                      <div>
                        <strong>Record Date:</strong>{" "}
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            <div className={styles.modalButtons}>
              <button className={styles.btn} onClick={() => setIsDetailsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add/Edit Pet"
        className={styles.petModal}
        overlayClassName={styles.petOverlay}
      >
        <h2>{editingPetId ? "Edit" : "Add New"} Pet</h2>
        <form onSubmit={handleSubmit}>
          {editingPetId && (
            <input
              type="text"
              name="petId"
              value={pets.find((p) => p._id === editingPetId)?.petId || ""}
              disabled
              readOnly
              style={{ background: "#eee", marginBottom: 10 }}
            />
          )}
          <input
            type="text"
            name="petName"
            placeholder="Pet Name"
            value={formData.petName}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={50}
            pattern="^[A-Za-z\s-]+$"
          />
          <select
            name="petSpecies"
            value={formData.petSpecies}
            onChange={handleChange}
            required
          >
            <option value="Cat">Cat</option>
            <option value="Dog">Dog</option>
          </select>
          <input
            type="text"
            name="petBreed"
            placeholder="Breed"
            value={formData.petBreed}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="petAge"
            placeholder="Age"
            value={formData.petAge}
            onChange={handleChange}
            required
          />
          <select
            name="petGender"
            value={formData.petGender}
            onChange={handleChange}
            required
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            name="petStatus"
            value={formData.petStatus}
            onChange={handleChange}
            required
          >
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="Adopted">Adopted</option>
          </select>
          <textarea
            name="petDescription"
            placeholder="Description"
            value={formData.petDescription}
            onChange={handleChange}
            required
          />
          <input
            type="url"
            name="imageUrl"
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={handleChange}
          />

          <div className={styles.modalButtons}>
            <button type="submit" className={styles.btn}>
              {editingPetId ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.deleteBtn}`}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PetListing;
