import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import styles from "./donationReq.module.css";

const DonationsReq = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchDonations();
    fetchStats();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/donations");
      setDonations(response.data);
    } catch (error) {
      console.error("Error fetching donations:", error);
      alert("Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get("/api/donations/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateDonationStatus = async (
    donationId,
    newStatus,
    adminNotes = ""
  ) => {
    try {
      const updateData = {
        paymentStatus: newStatus,
        acknowledgedBy: user.id,
        acknowledgedAt: new Date(),
        notes: adminNotes,
      };

      await API.put(`/api/donations/${donationId}`, updateData);
      alert(`Donation ${newStatus.toLowerCase()} successfully!`);
      fetchDonations();
      fetchStats();
      setIsModalOpen(false);
      setSelectedDonation(null);
      setNotes("");
    } catch (error) {
      console.error("Error updating donation:", error);
      alert(
        "Error updating donation: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const openModal = (donation) => {
    setSelectedDonation(donation);
    setNotes(donation.notes || "");
    setIsModalOpen(true);
  };

  const deleteDonation = async (donationId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this donation?"
      )
    )
      return;
    try {
      await API.delete(`/api/donations/${donationId}`);
      alert("Donation deleted successfully.");
      fetchDonations();
      fetchStats();
    } catch (error) {
      console.error("Error deleting donation:", error);
      alert(
        "Error deleting donation: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const filteredDonations = donations.filter((donation) => {
    if (filter === "all") return true;
    return donation.paymentStatus.toLowerCase() === filter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return styles.completed;
      case "pending":
        return styles.pending;
      case "failed":
        return styles.failed;
      case "refunded":
        return styles.refunded;
      default:
        return styles.pending;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading donations...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Donation Management</h1>
        <button onClick={fetchDonations} className={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>${stats.overall.totalAmount?.toFixed(2) || "0.00"}</h3>
              <p>Total Raised</p>
            </div>
            <div className={styles.statCard}>
              <h3>{stats.overall.totalDonations || 0}</h3>
              <p>Total Donations</p>
            </div>
            <div className={styles.statCard}>
              <h3>${stats.overall.averageDonation?.toFixed(2) || "0.00"}</h3>
              <p>Average Donation</p>
            </div>
            <div className={styles.statCard}>
              <h3>
                {donations.filter((d) => d.paymentStatus === "Pending").length}
              </h3>
              <p>Pending Review</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={filter === "all" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("all")}
        >
          All ({donations.length})
        </button>
        <button
          className={filter === "pending" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("pending")}
        >
          Pending (
          {donations.filter((d) => d.paymentStatus === "Pending").length})
        </button>
        <button
          className={filter === "completed" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("completed")}
        >
          Completed (
          {donations.filter((d) => d.paymentStatus === "Completed").length})
        </button>
        <button
          className={filter === "failed" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("failed")}
        >
          Failed ({donations.filter((d) => d.paymentStatus === "Failed").length}
          )
        </button>
      </div>

      {/* Donations List */}
      <div className={styles.donationsGrid}>
        {filteredDonations.length > 0 ? (
          filteredDonations.map((donation) => (
            <div key={donation._id} className={styles.donationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.donationAmount}>
                  ${donation.amount.toFixed(2)}
                  {donation.isRecurring && (
                    <span className={styles.recurringBadge}>Recurring</span>
                  )}
                </div>
                <span
                  className={`${styles.status} ${getStatusColor(
                    donation.paymentStatus
                  )}`}
                >
                  {donation.paymentStatus}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.donorInfo}>
                  <strong>Donor:</strong>{" "}
                  {donation.isAnonymous ? "Anonymous" : donation.donorName}
                </div>
                <div>
                  <strong>Email:</strong> {donation.donorEmail}
                </div>
                {donation.donorPhone && (
                  <div>
                    <strong>Phone:</strong> {donation.donorPhone}
                  </div>
                )}
                <div>
                  <strong>Cause:</strong> {donation.cause}
                </div>
                <div>
                  <strong>Type:</strong> {donation.donationType}
                </div>
                <div>
                  <strong>Payment Method:</strong> {donation.paymentMethod}
                </div>
                <div>
                  <strong>Transaction ID:</strong> {donation.transactionId}
                </div>
                <div>
                  <strong>Date:</strong>{" "}
                  {new Date(donation.createdAt).toLocaleDateString()}
                </div>

                {donation.message && (
                  <div className={styles.message}>
                    <strong>Message:</strong> {donation.message}
                  </div>
                )}

                {donation.acknowledgedBy && (
                  <div className={styles.acknowledged}>
                    <strong>Processed by:</strong>{" "}
                    {donation.acknowledgedBy.name}
                    <br />
                    <strong>On:</strong>{" "}
                    {new Date(donation.acknowledgedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => openModal(donation)}
                  className={styles.manageBtn}
                >
                  Manage
                </button>
                {donation.paymentStatus === "Pending" && (
                  <>
                    <button
                      onClick={() =>
                        updateDonationStatus(donation._id, "Completed")
                      }
                      className={styles.approveBtn}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        updateDonationStatus(donation._id, "Failed")
                      }
                      className={styles.rejectBtn}
                    >
                      Reject
                    </button>
                  </>
                )}
                {/* Delete button for Failed or Cancelled (inactive recurring) donations */}
                {(donation.paymentStatus === "Failed" ||
                  (donation.isRecurring && donation.isActive === false)) && (
                  <button
                    onClick={() => deleteDonation(donation._id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noDonations}>
            No donations found for the selected filter.
          </div>
        )}
      </div>

      {/* Management Modal */}
      {isModalOpen && selectedDonation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Manage Donation</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.donationDetails}>
                <h3>Donation Details</h3>
                <p>
                  <strong>Amount:</strong> ${selectedDonation.amount.toFixed(2)}
                </p>
                <p>
                  <strong>Donor:</strong>{" "}
                  {selectedDonation.isAnonymous
                    ? "Anonymous"
                    : selectedDonation.donorName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedDonation.donorEmail}
                </p>
                <p>
                  <strong>Cause:</strong> {selectedDonation.cause}
                </p>
                <p>
                  <strong>Current Status:</strong>{" "}
                  {selectedDonation.paymentStatus}
                </p>
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {selectedDonation.transactionId}
                </p>
              </div>

              <div className={styles.statusActions}>
                <h3>Update Status</h3>
                <div className={styles.statusButtons}>
                  <button
                    onClick={() =>
                      updateDonationStatus(
                        selectedDonation._id,
                        "Pending",
                        notes
                      )
                    }
                    className={styles.pendingBtn}
                  >
                    Set Pending
                  </button>
                  <button
                    onClick={() =>
                      updateDonationStatus(
                        selectedDonation._id,
                        "Completed",
                        notes
                      )
                    }
                    className={styles.completedBtn}
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() =>
                      updateDonationStatus(
                        selectedDonation._id,
                        "Failed",
                        notes
                      )
                    }
                    className={styles.failedBtn}
                  >
                    Mark Failed
                  </button>
                  <button
                    onClick={() =>
                      updateDonationStatus(
                        selectedDonation._id,
                        "Refunded",
                        notes
                      )
                    }
                    className={styles.refundedBtn}
                  >
                    Mark Refunded
                  </button>
                </div>
              </div>

              <div className={styles.notesSection}>
                <h3>Admin Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this donation..."
                  className={styles.notesTextarea}
                  rows="4"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsReq;
