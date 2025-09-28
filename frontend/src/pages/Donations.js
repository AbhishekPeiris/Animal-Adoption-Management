import React, { useEffect, useState } from "react";
import API from "../services/api";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";
import styles from "./Donations.module.css";

Modal.setAppElement("#root");

const Donations = () => {
    const { user, isLoggedIn } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [stats, setStats] = useState(null);

    const [donationForm, setDonationForm] = useState({
        donorName: "",
        donorEmail: "",
        donorPhone: "",
        amount: "",
        cause: "General Fund",
        customCause: "",
        donationType: "One-time",
        paymentMethod: "Credit Card",
        message: "",
        isAnonymous: false,
        isRecurring: false,
    });

    useEffect(() => {
        if (isLoggedIn) {
            fetchDonations();
            if (user?.role === "ADMIN" || user?.role === "STAFF") {
                fetchStats();
            }
        }
    }, [isLoggedIn, user]);

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
            console.error("Error fetching donation stats:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDonationForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmitDonation = async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            alert("Please log in to make a donation");
            return;
        }

        try {
            const formData = {
                ...donationForm,
                donorName: donationForm.donorName || user?.name || "",
                donorEmail: donationForm.donorEmail || user?.email || "",
                amount: parseFloat(donationForm.amount),
                // Set recurring flag based on donation type
                isRecurring: donationForm.donationType !== "One-time",
            };

            // Remove empty optional fields
            if (!formData.donorPhone) delete formData.donorPhone;
            if (!formData.message) delete formData.message;
            if (!formData.customCause) delete formData.customCause;

            await API.post("/api/donations", formData);
            alert("Thank you for your donation!");
            setIsDonationModalOpen(false);
            setDonationForm({
                donorName: "",
                donorEmail: "",
                donorPhone: "",
                amount: "",
                cause: "General Fund",
                customCause: "",
                donationType: "One-time",
                paymentMethod: "Credit Card",
                message: "",
                isAnonymous: false,
                isRecurring: false,
            });
            fetchDonations();
            if (user?.role === "ADMIN" || user?.role === "STAFF") {
                fetchStats();
            }
        } catch (error) {
            console.error("Error making donation:", error);
            alert(
                "Error processing donation: " +
                (error.response?.data?.message || error.message)
            );
        }
    };

    const cancelRecurringDonation = async (donationId) => {
        if (
            !window.confirm(
                "Are you sure you want to cancel this recurring donation?"
            )
        )
            return;

        try {
            await API.delete(`/api/donations/${donationId}`);
            alert("Recurring donation cancelled successfully");
            fetchDonations();
        } catch (error) {
            console.error("Error cancelling donation:", error);
            alert(
                "Error cancelling donation: " +
                (error.response?.data?.message || error.message)
            );
        }
    };

    const isAdmin = user?.role === "ADMIN";
    const isStaff = user?.role === "STAFF";
    const canManage = isAdmin || isStaff;

    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <h1>Support Our Cause</h1>
                <div className={styles.loginPrompt}>
                    <p>
                        Please log in to view your donations and make contributions to help
                        our animals.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Donations</h1>

            <div className={styles.topBar}>
                <button
                    className={styles.donateBtn}
                    onClick={() => setIsDonationModalOpen(true)}
                >
                    Make a Donation
                </button>
                <button className={styles.refreshBtn} onClick={fetchDonations}>
                    Refresh
                </button>
            </div>

            {/* Statistics for Admin/Staff */}
            {canManage && stats && (
                <div className={styles.statsContainer}>
                    <h2>Donation Statistics</h2>
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
                    </div>

                    {stats.byCause?.length > 0 && (
                        <div className={styles.causeStats}>
                            <h3>Donations by Cause</h3>
                            {stats.byCause.map((cause, index) => (
                                <div key={index} className={styles.causeItem}>
                                    <span>{cause._id}: </span>
                                    <span>
                                        ${cause.total.toFixed(2)} ({cause.count} donations)
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Donations List */}
            <div className={styles.donationsSection}>
                <h2>{canManage ? "All Donations" : "My Donations"}</h2>

                {loading ? (
                    <div className={styles.loading}>Loading donations...</div>
                ) : donations.length > 0 ? (
                    <div className={styles.donationsGrid}>
                        {donations.map((donation) => (
                            <div key={donation._id} className={styles.donationCard}>
                                <div className={styles.cardHeader}>
                                    <h3>${donation.amount.toFixed(2)}</h3>
                                    <span
                                        className={`${styles.status} ${styles[donation.paymentStatus.toLowerCase()]
                                            }`}
                                    >
                                        {donation.paymentStatus}
                                    </span>
                                </div>

                                <div className={styles.cardContent}>
                                    <div>
                                        <strong>Donor:</strong>{" "}
                                        {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                    </div>
                                    <div>
                                        <strong>Cause:</strong> {donation.cause}
                                    </div>
                                    <div>
                                        <strong>Type:</strong> {donation.donationType}
                                    </div>
                                    <div>
                                        <strong>Payment:</strong> {donation.paymentMethod}
                                    </div>
                                    <div>
                                        <strong>Date:</strong>{" "}
                                        {new Date(donation.createdAt).toLocaleDateString()}
                                    </div>

                                    {donation.isRecurring && (
                                        <div className={styles.recurringInfo}>
                                            <div>
                                                <strong>Recurring:</strong>{" "}
                                                {donation.isActive ? "Active" : "Cancelled"}
                                            </div>
                                            {donation.nextDonationDate && (
                                                <div>
                                                    <strong>Next:</strong>{" "}
                                                    {new Date(
                                                        donation.nextDonationDate
                                                    ).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {donation.message && (
                                        <div className={styles.message}>
                                            <strong>Message:</strong> {donation.message}
                                        </div>
                                    )}
                                </div>

                                {/* Cancel recurring donation for own donations */}
                                {!canManage && donation.isRecurring && donation.isActive && (
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.cancelBtn}
                                            onClick={() => cancelRecurringDonation(donation._id)}
                                        >
                                            Cancel Recurring
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noDonations}>
                        {canManage
                            ? "No donations found."
                            : "You haven't made any donations yet."}
                    </div>
                )}
            </div>

            {/* Donation Modal */}
            <Modal
                isOpen={isDonationModalOpen}
                onRequestClose={() => setIsDonationModalOpen(false)}
                contentLabel="Make a Donation"
                className={styles.modal}
                overlayClassName={styles.modalOverlay}
            >
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <h2>Make a Donation</h2>
                        <button
                            onClick={() => setIsDonationModalOpen(false)}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmitDonation} className={styles.donationForm}>
                        <div className={styles.formRow}>
                            <input
                                type="text"
                                name="donorName"
                                placeholder="Your Name"
                                value={donationForm.donorName}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="email"
                                name="donorEmail"
                                placeholder="Email Address"
                                value={donationForm.donorEmail}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <input
                                type="tel"
                                name="donorPhone"
                                placeholder="Phone Number (optional)"
                                value={donationForm.donorPhone}
                                onChange={handleInputChange}
                            />
                            <input
                                type="number"
                                name="amount"
                                placeholder="Donation Amount ($)"
                                value={donationForm.amount}
                                onChange={handleInputChange}
                                min="1"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <select
                                name="cause"
                                value={donationForm.cause}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="General Fund">General Fund</option>
                                <option value="Medical Care">Medical Care</option>
                                <option value="Food & Supplies">Food & Supplies</option>
                                <option value="Shelter Maintenance">Shelter Maintenance</option>
                                <option value="Rescue Operations">Rescue Operations</option>
                                <option value="Emergency Fund">Emergency Fund</option>
                                <option value="Spay/Neuter Program">Spay/Neuter Program</option>
                                <option value="Other">Other</option>
                            </select>

                            <select
                                name="donationType"
                                value={donationForm.donationType}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="One-time">One-time</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>

                        {donationForm.cause === "Other" && (
                            <input
                                type="text"
                                name="customCause"
                                placeholder="Please specify the cause"
                                value={donationForm.customCause}
                                onChange={handleInputChange}
                                maxLength="200"
                            />
                        )}

                        <select
                            name="paymentMethod"
                            value={donationForm.paymentMethod}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>

                        <textarea
                            name="message"
                            placeholder="Optional message or dedication"
                            value={donationForm.message}
                            onChange={handleInputChange}
                            maxLength="500"
                            rows="3"
                        />

                        <div className={styles.checkboxGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="isAnonymous"
                                    checked={donationForm.isAnonymous}
                                    onChange={handleInputChange}
                                />
                                Make this donation anonymous
                            </label>

                            {donationForm.donationType !== "One-time" && (
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isRecurring"
                                        checked={donationForm.isRecurring}
                                        onChange={handleInputChange}
                                    />
                                    Set up recurring donation
                                </label>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setIsDonationModalOpen(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button type="submit" className={styles.donateBtn}>
                                Donate ${donationForm.amount || "0.00"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Donations;
