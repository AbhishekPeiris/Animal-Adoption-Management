import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "react-modal";

Modal.setAppElement("#root");

function PetAdoption() {
  const { user, isLoggedIn } = useAuth();
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [myForms, setMyForms] = useState([]);
  const [showMyForms, setShowMyForms] = useState(false);
  const [viewPetDetails, setViewPetDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    adopterName: "",
    adopterEmail: "",
    adopterPhone: "",
    adopterAddress: "",
    reasonForAdoption: "",
    homeType: "House",
    hasYard: false,
    otherPets: "",
    experience: "",
  });

  useEffect(() => {
    fetchPets();
    if (isLoggedIn) {
      fetchMyForms();
    }
  }, [isLoggedIn]);

  const fetchPets = () => {
    API.get("/pet-profiles", { params: { userRole: user?.role || "USER" } })
      .then((res) => setPets(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  };

  const fetchMyForms = () => {
    if (!isLoggedIn) return;

    API.get("/adoption-forms")
      .then((res) => {
        console.log("Fetched adoption forms:", res.data);
        setMyForms(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error fetching adoption forms:", err);
        if (err.response?.status !== 401) {
          // Don't show error for 401 as it's handled by interceptor
          alert("Error fetching your adoption requests. Please try again.");
        }
      });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAdoptionForm = (pet) => {
    if (!isLoggedIn) {
      alert("Please log in to submit an adoption request.");
      return;
    }
    setSelectedPet(pet);
    setFormData({
      adopterName: user?.name || "",
      adopterEmail: user?.email || "",
      adopterPhone: "",
      adopterAddress: "",
      reasonForAdoption: "",
      homeType: "House",
      hasYard: false,
      otherPets: "",
      experience: "",
    });
    setIsFormOpen(true);
  };

  const submitAdoptionForm = async (e) => {
    e.preventDefault();

    // Check if user is still logged in
    if (!isLoggedIn) {
      alert("Please log in to submit an adoption request.");
      return;
    }

    try {
      const response = await API.post("/adoption-forms", {
        ...formData,
        petId: selectedPet._id,
      });

      console.log("Adoption form submitted successfully:", response.data);
      alert("Adoption request submitted successfully!");
      setIsFormOpen(false);
      fetchMyForms();
    } catch (error) {
      console.error("Error submitting adoption request:", error);

      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        // The interceptor will handle redirect to login
      } else {
        alert(
          "Error submitting adoption request: " +
          (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const cancelAdoptionRequest = async (formId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this adoption request?"
      )
    )
      return;
    try {
      await API.delete(`/adoption-forms/${formId}`);
      alert("Adoption request cancelled successfully!");
      fetchMyForms();
    } catch (error) {
      alert(
        "Error cancelling request: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const openPetDetails = async (pet) => {
    try {
      const res = await API.get(`/pet-profiles/${pet._id}`, {
        params: { userRole: user?.role || "USER" }
      });
      setViewPetDetails(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching pet details:", error);
      alert("Failed to load pet details");
    }
  };

  const filteredPets = (pets || []).filter((pet) => {
    const q = (search ?? "").toString().toLowerCase();
    return (
      (pet?.petName ?? "").toString().toLowerCase().includes(q) ||
      (pet?.petBreed ?? "").toString().toLowerCase().includes(q) ||
      (pet?.petSpecies ?? "").toString().toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        width: "90%",
        maxWidth: 1200,
        margin: "30px auto",
        padding: "0 20px",
      }}
    >
      <h1>Pet Adoption</h1>

      {isLoggedIn && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowMyForms(!showMyForms)}
            style={{
              padding: "10px 20px",
              marginRight: 10,
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 5,
            }}
          >
            {showMyForms
              ? "Show Available Pets"
              : "My Adoption Requests"}
          </button>
        </div>
      )}

      {showMyForms ? (
        <div>
          <h2>My Adoption Requests</h2>
          {myForms.length > 0 ? (
            <div style={{ display: "grid", gap: 16 }}>
              {myForms.map((form) => (
                <div
                  key={form._id}
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3>{form.petId?.petName || "Unknown Pet"}</h3>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          form.formStatus === "Approved"
                            ? "green"
                            : form.formStatus === "Rejected"
                              ? "red"
                              : "orange",
                      }}
                    >
                      {form.formStatus}
                    </span>
                  </div>
                  <div>
                    <strong>Submitted:</strong>{" "}
                    {new Date(form.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Reason:</strong> {form.reasonForAdoption}
                  </div>
                  {form.adminNotes && (
                    <div>
                      <strong>Admin Notes:</strong> {form.adminNotes}
                    </div>
                  )}
                  {form.formStatus === "Pending" && (
                    <button
                      onClick={() => cancelAdoptionRequest(form._id)}
                      style={{
                        marginTop: 10,
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No adoption requests found.</p>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search by name, breed or species"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              margin: "10px 0 20px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {filteredPets.length > 0 ? (
              filteredPets.map((pet) => (
                <div
                  key={pet._id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid #e0e0e0"
                  }}
                >
                  {pet.imageUrl && (
                    <img
                      src={pet.imageUrl}
                      alt={pet.petName}
                      style={{
                        width: "100%",
                        height: 220,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: 15,
                      }}
                    />
                  )}

                  <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 10, color: "#2c3e50" }}>
                    {pet.petName}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginBottom: 15 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span><strong>Species:</strong> {pet.petSpecies}</span>
                      <span><strong>Age:</strong> {pet.petAge} years</span>
                    </div>
                    <div><strong>Breed:</strong> {pet.petBreed}</div>
                    <div><strong>Gender:</strong> {pet.petGender}</div>
                    <div>
                      <strong>Status:</strong>
                      <span style={{
                        marginLeft: 8,
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        backgroundColor: pet.petStatus === "Available" ? "#d4edda" : "#f8d7da",
                        color: pet.petStatus === "Available" ? "#155724" : "#721c24"
                      }}>
                        {pet.petStatus}
                      </span>
                    </div>
                  </div>

                  {pet.medicalInfo && (
                    <div
                      style={{
                        marginBottom: 15,
                        padding: 12,
                        backgroundColor: "#f8f9fa",
                        borderRadius: 8,
                        border: "1px solid #dee2e6"
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 8, color: "#495057" }}>
                        Medical Summary
                      </div>
                      <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
                        <div>
                          <strong>Health:</strong>
                          <span style={{
                            marginLeft: 5,
                            color: pet.medicalInfo.healthStatus === "Healthy" ? "#28a745" : "#dc3545"
                          }}>
                            {pet.medicalInfo.healthStatus}
                          </span>
                        </div>
                        <div>
                          <strong>Vaccinated:</strong>
                          <span style={{
                            marginLeft: 5,
                            color: pet.medicalInfo.isVaccinated ? "#28a745" : "#ffc107"
                          }}>
                            {pet.medicalInfo.isVaccinated ? "✓ Yes" : "⚠ Pending"}
                          </span>
                        </div>
                        {pet.medicalInfo.lastVetVisit && (
                          <div>
                            <strong>Last Vet Visit:</strong> {new Date(pet.medicalInfo.lastVetVisit).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginBottom: 15,
                      color: "#6c757d",
                      fontSize: 14,
                      lineHeight: 1.4
                    }}
                  >
                    {pet.petDescription.length > 100
                      ? pet.petDescription.substring(0, 100) + "..."
                      : pet.petDescription
                    }
                  </div>

                  <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                    <button
                      onClick={() => openPetDetails(pet)}
                      style={{
                        padding: "10px 15px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500
                      }}
                    >
                      View Full Details
                    </button>

                    {pet.petStatus === "Available" && (
                      <button
                        onClick={() => openAdoptionForm(pet)}
                        style={{
                          padding: "12px 15px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 15,
                          fontWeight: 600
                        }}
                      >
                        🏠 Request Adoption
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: "center",
                padding: 40,
                gridColumn: "1 / -1",
                color: "#6c757d"
              }}>
                No pets found matching your search
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pet Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onRequestClose={() => setIsDetailsOpen(false)}
        contentLabel="Pet Details"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 800,
            maxHeight: "90vh",
            overflow: "auto",
            borderRadius: 12,
            border: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)"
          }
        }}
      >
        {viewPetDetails ? (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#2c3e50" }}>{viewPetDetails.petName}</h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#6c757d"
                }}
              >
                ×
              </button>
            </div>

            {viewPetDetails.imageUrl && (
              <div style={{ textAlign: "center", marginBottom: 25 }}>
                <img
                  src={viewPetDetails.imageUrl}
                  alt={viewPetDetails.petName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 12,
                    objectFit: "cover",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}
                />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>

              {/* Basic Information */}
              <div style={{
                padding: 20,
                backgroundColor: "#f8f9fa",
                borderRadius: 10,
                border: "1px solid #dee2e6"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: 15, color: "#495057" }}>Basic Information</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  <div><strong>ID:</strong> {viewPetDetails.petId}</div>
                  <div><strong>Species:</strong> {viewPetDetails.petSpecies}</div>
                  <div><strong>Breed:</strong> {viewPetDetails.petBreed}</div>
                  <div><strong>Age:</strong> {viewPetDetails.petAge} years</div>
                  <div><strong>Gender:</strong> {viewPetDetails.petGender}</div>
                  <div><strong>Status:</strong> {viewPetDetails.petStatus}</div>
                </div>
              </div>

              {/* Medical Information */}
              {viewPetDetails.medicalInfo && (
                <div style={{
                  padding: 20,
                  backgroundColor: "#e8f5e8",
                  borderRadius: 10,
                  border: "1px solid #c3e6cb"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 15, color: "#155724" }}>Medical Information</h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <strong>Health Status:</strong>
                      <span style={{
                        marginLeft: 8,
                        color: viewPetDetails.medicalInfo.healthStatus === "Healthy" ? "#28a745" : "#dc3545"
                      }}>
                        {viewPetDetails.medicalInfo.healthStatus}
                      </span>
                    </div>
                    <div>
                      <strong>Vaccinated:</strong>
                      <span style={{ marginLeft: 8 }}>
                        {viewPetDetails.medicalInfo.isVaccinated ? "✓ Yes" : "⚠ No"}
                      </span>
                    </div>
                    {viewPetDetails.medicalInfo.lastVetVisit && (
                      <div>
                        <strong>Last Vet Visit:</strong> {new Date(viewPetDetails.medicalInfo.lastVetVisit).toLocaleDateString()}
                      </div>
                    )}
                    {viewPetDetails.medicalInfo.vetNotes && (
                      <div>
                        <strong>Vet Notes:</strong>
                        <div style={{
                          marginTop: 5,
                          padding: 10,
                          backgroundColor: "#fff",
                          borderRadius: 6,
                          fontSize: 14
                        }}>
                          {viewPetDetails.medicalInfo.vetNotes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Description */}
            <div style={{
              marginTop: 20,
              padding: 20,
              backgroundColor: "#fff3cd",
              borderRadius: 10,
              border: "1px solid #ffeaa7"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 15, color: "#856404" }}>About {viewPetDetails.petName}</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: "#6c757d" }}>
                {viewPetDetails.petDescription}
              </p>
            </div>

            {/* Medical Records */}
            {viewPetDetails.medicalRecords && viewPetDetails.medicalRecords.length > 0 && (
              <div style={{
                marginTop: 20,
                padding: 20,
                backgroundColor: "#d1ecf1",
                borderRadius: 10,
                border: "1px solid #bee5eb"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: 15, color: "#0c5460" }}>Medical Records & Vaccinations</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {viewPetDetails.medicalRecords.map((record, index) => (
                    <div key={index} style={{
                      padding: 15,
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      border: "1px solid #b8daff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <strong style={{ color: "#007bff" }}>{record.vaccination}</strong>
                        <span style={{ fontSize: 12, color: "#6c757d" }}>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#495057" }}>
                        <div><strong>Due Date:</strong> {new Date(record.dueDate).toLocaleDateString()}</div>
                        <div><strong>Age at Vaccination:</strong> {record.age} years</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {viewPetDetails.petStatus === "Available" && (
              <div style={{
                marginTop: 25,
                textAlign: "center",
                padding: 20,
                backgroundColor: "#f8f9fa",
                borderRadius: 10
              }}>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openAdoptionForm(viewPetDetails);
                  }}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}
                >
                  🏠 Adopt {viewPetDetails.petName}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>Loading pet details...</div>
        )}
      </Modal>

      {/* Adoption Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onRequestClose={() => setIsFormOpen(false)}
        contentLabel="Adoption Request Form"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <h2>Adoption Request for {selectedPet?.petName}</h2>
        <form
          onSubmit={submitAdoptionForm}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          <input
            type="text"
            name="adopterName"
            placeholder="Your Full Name"
            value={formData.adopterName}
            onChange={handleInputChange}
            required
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />

          <input
            type="email"
            name="adopterEmail"
            placeholder="Email Address"
            value={formData.adopterEmail}
            onChange={handleInputChange}
            required
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />

          <input
            type="tel"
            name="adopterPhone"
            placeholder="Phone Number (10 digits)"
            value={formData.adopterPhone}
            onChange={handleInputChange}
            required
            pattern="[0-9]{10}"
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />

          <textarea
            name="adopterAddress"
            placeholder="Full Address"
            value={formData.adopterAddress}
            onChange={handleInputChange}
            required
            rows={3}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <select
            name="homeType"
            value={formData.homeType}
            onChange={handleInputChange}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Other">Other</option>
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="checkbox"
              name="hasYard"
              checked={formData.hasYard}
              onChange={handleInputChange}
            />
            Do you have a yard?
          </label>

          <textarea
            name="otherPets"
            placeholder="Do you have other pets? Please describe."
            value={formData.otherPets}
            onChange={handleInputChange}
            rows={2}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <textarea
            name="experience"
            placeholder="Previous experience with pets"
            value={formData.experience}
            onChange={handleInputChange}
            rows={2}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <textarea
            name="reasonForAdoption"
            placeholder="Why do you want to adopt this pet?"
            value={formData.reasonForAdoption}
            onChange={handleInputChange}
            required
            rows={3}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PetAdoption;



