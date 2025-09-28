import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import styles from "./volunteerReq.module.css";

const VolunteerReq = () => {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchVolunteers();
    fetchStats();
  }, []);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/volunteers");
      setVolunteers(response.data);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      alert("Failed to fetch volunteers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get("/api/volunteers/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateVolunteerStatus = async (
    volunteerId,
    newStatus,
    adminNotes = ""
  ) => {
    try {
      const updateData = {
        status: newStatus,
        approvedBy: user.id,
        approvedAt: new Date(),
        notes: adminNotes,
      };

      if (newStatus === "Active") {
        updateData.backgroundCheckStatus = "Approved";
      }

      await API.put(`/api/volunteers/${volunteerId}`, updateData);
      alert(`Volunteer ${newStatus.toLowerCase()} successfully!`);
      fetchVolunteers();
      fetchStats();
      setIsModalOpen(false);
      setSelectedVolunteer(null);
      setNotes("");
    } catch (error) {
      console.error("Error updating volunteer:", error);
      alert(
        "Error updating volunteer: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const deleteVolunteer = async (volunteerId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this volunteer application?"
      )
    )
      return;
    try {
      await API.delete(`/api/volunteers/${volunteerId}`);
      alert("Volunteer application deleted successfully.");
      fetchVolunteers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting volunteer:", error);
      alert(
        "Error deleting volunteer: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const openModal = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setNotes(volunteer.notes || "");
    setIsModalOpen(true);
  };

  const filteredVolunteers = volunteers.filter((volunteer) => {
    if (filter === "all") return true;
    return (
      volunteer.status.toLowerCase().replace(" ", "") ===
      filter.toLowerCase().replace(" ", "")
    );
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase().replace(" ", "")) {
      case "active":
        return styles.active;
      case "pendingapproval":
        return styles.pending;
      case "inactive":
        return styles.inactive;
      case "suspended":
        return styles.suspended;
      default:
        return styles.pending;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading volunteers...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Volunteer Management</h1>
        <button onClick={fetchVolunteers} className={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>{stats.totalVolunteers || 0}</h3>
              <p>Total Volunteers</p>
            </div>
            <div className={styles.statCard}>
              <h3>{stats.activeVolunteers || 0}</h3>
              <p>Active Volunteers</p>
            </div>
            <div className={styles.statCard}>
              <h3>{stats.pendingApproval || 0}</h3>
              <p>Pending Approval</p>
            </div>
            <div className={styles.statCard}>
              <h3>{stats.totalHours || 0}</h3>
              <p>Total Hours Logged</p>
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
          All ({volunteers.length})
        </button>
        <button
          className={
            filter === "pendingapproval" ? styles.activeTab : styles.tab
          }
          onClick={() => setFilter("pendingapproval")}
        >
          Pending (
          {volunteers.filter((v) => v.status === "Pending Approval").length})
        </button>
        <button
          className={filter === "active" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("active")}
        >
          Active ({volunteers.filter((v) => v.status === "Active").length})
        </button>
        <button
          className={filter === "inactive" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("inactive")}
        >
          Inactive ({volunteers.filter((v) => v.status === "Inactive").length})
        </button>
        <button
          className={filter === "suspended" ? styles.activeTab : styles.tab}
          onClick={() => setFilter("suspended")}
        >
          Suspended ({volunteers.filter((v) => v.status === "Suspended").length}
          )
        </button>
      </div>

      {/* Volunteers List */}
      <div className={styles.volunteersGrid}>
        {filteredVolunteers.length > 0 ? (
          filteredVolunteers.map((volunteer) => (
            <div key={volunteer._id} className={styles.volunteerCard}>
              <div className={styles.cardHeader}>
                <div className={styles.volunteerName}>
                  <h3>
                    {volunteer.firstName} {volunteer.lastName}
                  </h3>
                  <p>{volunteer.email}</p>
                </div>
                <span
                  className={`${styles.status} ${getStatusColor(
                    volunteer.status
                  )}`}
                >
                  {volunteer.status}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div>
                  <strong>Phone:</strong> {volunteer.phone}
                </div>
                <div>
                  <strong>Address:</strong> {volunteer.address}
                </div>
                <div>
                  <strong>Skills:</strong>{" "}
                  {volunteer.skills?.join(", ") || "None"}
                </div>
                <div>
                  <strong>Experience:</strong>{" "}
                  {volunteer.experience || "None provided"}
                </div>
                <div>
                  <strong>Background Check:</strong>{" "}
                  {volunteer.backgroundCheckStatus}
                </div>
                <div>
                  <strong>Hours Logged:</strong> {volunteer.hoursLogged || 0}
                </div>
                <div>
                  <strong>Tasks Completed:</strong>{" "}
                  {volunteer.tasksCompleted || 0}
                </div>
                <div>
                  <strong>Applied:</strong>{" "}
                  {new Date(volunteer.createdAt).toLocaleDateString()}
                </div>

                {volunteer.emergencyContact?.name && (
                  <div className={styles.emergencyContact}>
                    <strong>Emergency Contact:</strong>{" "}
                    {volunteer.emergencyContact.name}(
                    {volunteer.emergencyContact.relationship}) -{" "}
                    {volunteer.emergencyContact.phone}
                  </div>
                )}

                {volunteer.approvedBy && (
                  <div className={styles.approved}>
                    <strong>Processed by:</strong> {volunteer.approvedBy.name}
                    <br />
                    <strong>On:</strong>{" "}
                    {new Date(volunteer.approvedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => openModal(volunteer)}
                  className={styles.manageBtn}
                >
                  Manage
                </button>
                {volunteer.status === "Pending Approval" && (
                  <>
                    <button
                      onClick={() =>
                        updateVolunteerStatus(volunteer._id, "Active")
                      }
                      className={styles.approveBtn}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        updateVolunteerStatus(volunteer._id, "Inactive")
                      }
                      className={styles.rejectBtn}
                    >
                      Reject
                    </button>
                  </>
                )}
                {(volunteer.status === "Inactive" ||
                  volunteer.status === "Suspended") && (
                  <button
                    onClick={() => deleteVolunteer(volunteer._id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noVolunteers}>
            No volunteers found for the selected filter.
          </div>
        )}
      </div>

      {/* Management Modal */}
      {isModalOpen && selectedVolunteer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Manage Volunteer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.volunteerDetails}>
                <h3>Volunteer Details</h3>
                <p>
                  <strong>Name:</strong> {selectedVolunteer.firstName}{" "}
                  {selectedVolunteer.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedVolunteer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedVolunteer.phone}
                </p>
                <p>
                  <strong>Address:</strong> {selectedVolunteer.address}
                </p>
                <p>
                  <strong>Current Status:</strong> {selectedVolunteer.status}
                </p>
                <p>
                  <strong>Background Check:</strong>{" "}
                  {selectedVolunteer.backgroundCheckStatus}
                </p>
                <p>
                  <strong>Skills:</strong>{" "}
                  {selectedVolunteer.skills?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Experience:</strong>{" "}
                  {selectedVolunteer.experience || "None provided"}
                </p>
              </div>

              <div className={styles.statusActions}>
                <h3>Update Status</h3>
                <div className={styles.statusButtons}>
                  <button
                    onClick={() =>
                      updateVolunteerStatus(
                        selectedVolunteer._id,
                        "Pending Approval",
                        notes
                      )
                    }
                    className={styles.pendingBtn}
                  >
                    Set Pending
                  </button>
                  <button
                    onClick={() =>
                      updateVolunteerStatus(
                        selectedVolunteer._id,
                        "Active",
                        notes
                      )
                    }
                    className={styles.activeBtn}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      updateVolunteerStatus(
                        selectedVolunteer._id,
                        "Inactive",
                        notes
                      )
                    }
                    className={styles.inactiveBtn}
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() =>
                      updateVolunteerStatus(
                        selectedVolunteer._id,
                        "Suspended",
                        notes
                      )
                    }
                    className={styles.suspendedBtn}
                  >
                    Suspend
                  </button>
                </div>
              </div>

              <div className={styles.notesSection}>
                <h3>Admin Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this volunteer..."
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

export default VolunteerReq;
