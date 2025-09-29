import React, { useEffect, useState } from "react";
import API from "../services/api";
import Modal from "react-modal";
import styles from "./AdoptionRequests.module.css";
import { useAuth } from "../context/AuthContext";
import { downloadCSV, formatDataForCSV } from "../utils/csvExport";

Modal.setAppElement("#root");

const AdoptionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get("/adoption-forms");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching adoption requests:", error);
      alert("Failed to fetch adoption requests");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, adminNotes = "") => {
    try {
      const updateData = {
        formStatus: status,
        adminNotes: adminNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      };

      await API.put(`/adoption-forms/${requestId}`, updateData);

      // Update the local state
      setRequests(
        requests.map((req) =>
          req._id === requestId
            ? { ...req, ...updateData, reviewedBy: { name: user.name } }
            : req
        )
      );

      alert(`Request ${status.toLowerCase()} successfully!`);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("Failed to update request status");
    }
  };

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleStatusUpdate = (status) => {
    if (!selectedRequest) return;

    let adminNotes = "";
    if (status === "Rejected") {
      adminNotes = prompt("Please provide a reason for rejection:");
      if (!adminNotes) return; // User cancelled
    } else if (status === "Approved") {
      adminNotes = prompt("Add any notes for the adopter (optional):") || "";
    }

    updateRequestStatus(selectedRequest._id, status, adminNotes);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      statusFilter === "All" || request.formStatus === statusFilter;
    const matchesSearch =
      !search ||
      request.adopterName.toLowerCase().includes(search.toLowerCase()) ||
      request.petId?.petName?.toLowerCase().includes(search.toLowerCase()) ||
      request.adopterEmail.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#28a745";
      case "Rejected":
        return "#dc3545";
      case "Pending":
        return "#ffc107";
      default:
        return "#6c757d";
    }
  };

  const exportToCSV = () => {
    const csvData = formatDataForCSV(filteredRequests, "adoption-requests");
    downloadCSV(csvData, "adoption_requests_report");
  };

  if (loading) {
    return <div className={styles.loading}>Loading adoption requests...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Adoption Requests Management</h1>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Search by adopter name, pet name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchRequests} className={styles.refreshBtn}>
            Refresh
          </button>
          {/* Export CSV only for admin */}
          {user?.role === "ADMIN" && (
            <button
              onClick={exportToCSV}
              className={styles.refreshBtn}
              style={{ background: "#28a745" }}
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{requests.filter((r) => r.formStatus === "Pending").length}</h3>
          <p>Pending</p>
        </div>
        <div className={styles.statCard}>
          <h3>{requests.filter((r) => r.formStatus === "Approved").length}</h3>
          <p>Approved</p>
        </div>
        <div className={styles.statCard}>
          <h3>{requests.filter((r) => r.formStatus === "Rejected").length}</h3>
          <p>Rejected</p>
        </div>
        <div className={styles.statCard}>
          <h3>{requests.length}</h3>
          <p>Total</p>
        </div>
      </div>

      <div className={styles.requestsGrid}>
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div key={request._id} className={styles.requestCard}>
              <div className={styles.cardHeader}>
                <h3>{request.adopterName}</h3>
                <span
                  className={styles.status}
                  style={{
                    backgroundColor: getStatusColor(request.formStatus),
                  }}
                >
                  {request.formStatus}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.petInfo}>
                  <strong>Pet:</strong>{" "}
                  {request.petId?.petName || "Unknown Pet"}
                </div>
                <div>
                  <strong>Email:</strong> {request.adopterEmail}
                </div>
                <div>
                  <strong>Phone:</strong> {request.adopterPhone}
                </div>
                <div>
                  <strong>Home Type:</strong> {request.homeType}
                </div>
                <div>
                  <strong>Has Yard:</strong> {request.hasYard ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>

                {request.adminNotes && (
                  <div className={styles.adminNotes}>
                    <strong>Admin Notes:</strong> {request.adminNotes}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => openRequestDetails(request)}
                  className={styles.viewBtn}
                >
                  View Details
                </button>

                {request.formStatus === "Pending" && (
                  <>
                    <button
                      onClick={() =>
                        updateRequestStatus(request._id, "Approved")
                      }
                      className={styles.approveBtn}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        updateRequestStatus(
                          request._id,
                          "Rejected",
                          prompt("Reason for rejection:") || ""
                        )
                      }
                      className={styles.rejectBtn}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noRequests}>
            No adoption requests found matching your criteria.
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onRequestClose={() => setIsDetailsOpen(false)}
        contentLabel="Request Details"
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
      >
        {selectedRequest && (
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Adoption Request Details</h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.section}>
                <h3>Adopter Information</h3>
                <div className={styles.infoGrid}>
                  <div>
                    <strong>Name:</strong> {selectedRequest.adopterName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedRequest.adopterEmail}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedRequest.adopterPhone}
                  </div>
                  <div>
                    <strong>Address:</strong> {selectedRequest.adopterAddress}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Home Information</h3>
                <div className={styles.infoGrid}>
                  <div>
                    <strong>Home Type:</strong> {selectedRequest.homeType}
                  </div>
                  <div>
                    <strong>Has Yard:</strong>{" "}
                    {selectedRequest.hasYard ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Other Pets:</strong>{" "}
                    {selectedRequest.otherPets || "None mentioned"}
                  </div>
                  <div>
                    <strong>Experience:</strong>{" "}
                    {selectedRequest.experience || "None mentioned"}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Pet Information</h3>
                <div>
                  <strong>Pet Name:</strong>{" "}
                  {selectedRequest.petId?.petName || "Unknown"}
                </div>
                <div>
                  <strong>Pet ID:</strong>{" "}
                  {selectedRequest.petId?.petId || "Unknown"}
                </div>
              </div>

              <div className={styles.section}>
                <h3>Request Details</h3>
                <div>
                  <strong>Reason for Adoption:</strong>
                </div>
                <p className={styles.reason}>
                  {selectedRequest.reasonForAdoption}
                </p>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: getStatusColor(
                        selectedRequest.formStatus
                      ),
                    }}
                  >
                    {selectedRequest.formStatus}
                  </span>
                </div>
              </div>

              {selectedRequest.adminNotes && (
                <div className={styles.section}>
                  <h3>Admin Notes</h3>
                  <p>{selectedRequest.adminNotes}</p>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className={styles.section}>
                  <h3>Review Information</h3>
                  <div>
                    <strong>Reviewed By:</strong>{" "}
                    {selectedRequest.reviewedBy.name}
                  </div>
                  <div>
                    <strong>Reviewed At:</strong>{" "}
                    {new Date(selectedRequest.reviewedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {selectedRequest.formStatus === "Pending" && (
              <div className={styles.modalActions}>
                <button
                  onClick={() => handleStatusUpdate("Approved")}
                  className={styles.approveBtn}
                >
                  Approve Request
                </button>
                <button
                  onClick={() => handleStatusUpdate("Rejected")}
                  className={styles.rejectBtn}
                >
                  Reject Request
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdoptionRequests;
