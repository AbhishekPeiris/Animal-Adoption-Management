import React, { useEffect, useState } from "react";
import API from "../services/api";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";
import styles from "./volunteers.module.css";

Modal.setAppElement("#root");

const Volunteers = () => {
    const { user, isLoggedIn } = useAuth();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [myProfile, setMyProfile] = useState(null);

    const [volunteerForm, setVolunteerForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
        emergencyContact: {
            name: "",
            phone: "",
            relationship: "",
        },
        skills: [],
        availability: {
            monday: { available: false, times: [] },
            tuesday: { available: false, times: [] },
            wednesday: { available: false, times: [] },
            thursday: { available: false, times: [] },
            friday: { available: false, times: [] },
            saturday: { available: false, times: [] },
            sunday: { available: false, times: [] },
        },
        preferredTasks: [],
        experience: "",
        preferredContactMethod: "Email",
        newsletterSubscribed: true,
        eventNotifications: true,
    });

    const skillOptions = [
        "Animal Care",
        "Dog Walking",
        "Cat Socialization",
        "Administrative",
        "Event Planning",
        "Fundraising",
        "Photography",
        "Social Media",
        "Transportation",
        "Medical Assistance",
        "Cleaning",
        "Construction/Maintenance",
        "Training/Education",
        "Foster Care",
        "Other",
    ];

    const timeSlots = [
        "Morning (8AM-12PM)",
        "Afternoon (12PM-5PM)",
        "Evening (5PM-8PM)",
    ];

    useEffect(() => {
        if (isLoggedIn) {
            fetchVolunteers();
            fetchMyProfile();
            if (user?.role === "ADMIN" || user?.role === "STAFF") {
                fetchStats();
            }
        }
    }, [isLoggedIn, user]);

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

    const fetchMyProfile = async () => {
        try {
            const response = await API.get("/api/volunteers/my-profile");
            setMyProfile(response.data);
        } catch (error) {
            setMyProfile(null);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get("/api/volunteers/stats");
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching volunteer stats:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setVolunteerForm((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === "checkbox" ? checked : value,
                },
            }));
        } else {
            setVolunteerForm((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const handleSkillsChange = (skill) => {
        setVolunteerForm((prev) => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter((s) => s !== skill)
                : [...prev.skills, skill],
        }));
    };

    const handleAvailabilityChange = (day, field, value) => {
        setVolunteerForm((prev) => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    [field]: value,
                },
            },
        }));
    };

    const handleSubmitRegistration = async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            alert("Please log in to register as a volunteer");
            return;
        }

        try {
            const formData = {
                ...volunteerForm,
                email: volunteerForm.email || user?.email || "",
                // Ensure proper data types
                dateOfBirth: volunteerForm.dateOfBirth || null,
                skills: volunteerForm.skills || [],
                availability: volunteerForm.availability || {},
                preferredTasks: volunteerForm.preferredTasks || [],
            };

            // Remove empty fields that might cause validation issues
            Object.keys(formData).forEach((key) => {
                if (formData[key] === "" || formData[key] === null) {
                    delete formData[key];
                }
            });

            await API.post("/api/volunteers", formData);
            alert("Volunteer registration submitted! You will be contacted soon.");
            setIsRegistrationModalOpen(false);
            resetForm();
            fetchVolunteers();
            fetchMyProfile();
        } catch (error) {
            console.error("Error registering volunteer:", error);
            alert(
                "Error registering: " + (error.response?.data?.message || error.message)
            );
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!myProfile) return;

        try {
            const updateData = {
                ...volunteerForm,
                // Ensure proper data types
                skills: volunteerForm.skills || [],
                availability: volunteerForm.availability || {},
                preferredTasks: volunteerForm.preferredTasks || [],
            };

            await API.put(`/api/volunteers/${myProfile._id}`, updateData);
            alert("Profile updated successfully!");
            setIsEditModalOpen(false);
            fetchVolunteers();
            fetchMyProfile();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(
                "Error updating profile: " +
                (error.response?.data?.message || error.message)
            );
        }
    };

    const resetForm = () => {
        setVolunteerForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            dateOfBirth: "",
            emergencyContact: { name: "", phone: "", relationship: "" },
            skills: [],
            availability: {
                monday: { available: false, times: [] },
                tuesday: { available: false, times: [] },
                wednesday: { available: false, times: [] },
                thursday: { available: false, times: [] },
                friday: { available: false, times: [] },
                saturday: { available: false, times: [] },
                sunday: { available: false, times: [] },
            },
            preferredTasks: [],
            experience: "",
            preferredContactMethod: "Email",
            newsletterSubscribed: true,
            eventNotifications: true,
        });
    };

    const openEditModal = () => {
        if (myProfile) {
            setVolunteerForm({
                firstName: myProfile.firstName || "",
                lastName: myProfile.lastName || "",
                email: myProfile.email || "",
                phone: myProfile.phone || "",
                address: myProfile.address || "",
                dateOfBirth: myProfile.dateOfBirth
                    ? new Date(myProfile.dateOfBirth).toISOString().split("T")[0]
                    : "",
                emergencyContact: myProfile.emergencyContact || {
                    name: "",
                    phone: "",
                    relationship: "",
                },
                skills: myProfile.skills || [],
                availability: myProfile.availability || {},
                preferredTasks: myProfile.preferredTasks || [],
                experience: myProfile.experience || "",
                preferredContactMethod: myProfile.preferredContactMethod || "Email",
                newsletterSubscribed: myProfile.newsletterSubscribed !== false,
                eventNotifications: myProfile.eventNotifications !== false,
            });
        }
        setIsEditModalOpen(true);
    };

    const isAdmin = user?.role === "ADMIN";
    const isStaff = user?.role === "STAFF";
    const canManage = isAdmin || isStaff;

    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <h1>Volunteer With Us</h1>
                <div className={styles.loginPrompt}>
                    <p>
                        Please log in to register as a volunteer and help make a difference
                        in animals' lives.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Volunteers</h1>

            <div className={styles.topBar}>
                {!myProfile ? (
                    <button
                        className={styles.registerBtn}
                        onClick={() => setIsRegistrationModalOpen(true)}
                    >
                        Register as Volunteer
                    </button>
                ) : (
                    <button className={styles.editBtn} onClick={openEditModal}>
                        Edit My Profile
                    </button>
                )}
                <button className={styles.refreshBtn} onClick={fetchVolunteers}>
                    Refresh
                </button>
            </div>

            {/* My Profile Section */}
            {myProfile && (
                <div className={styles.myProfileSection}>
                    <h2>My Volunteer Profile</h2>
                    <div className={styles.profileCard}>
                        <div className={styles.profileHeader}>
                            <h3>
                                {myProfile.firstName} {myProfile.lastName}
                            </h3>
                            <span
                                className={`${styles.status} ${styles[myProfile.status?.toLowerCase().replace(" ", "")]
                                    }`}
                            >
                                {myProfile.status}
                            </span>
                        </div>
                        <div className={styles.profileContent}>
                            <div>
                                <strong>Email:</strong> {myProfile.email}
                            </div>
                            <div>
                                <strong>Phone:</strong> {myProfile.phone}
                            </div>
                            <div>
                                <strong>Skills:</strong>{" "}
                                {myProfile.skills?.join(", ") || "None specified"}
                            </div>
                            <div>
                                <strong>Hours Logged:</strong> {myProfile.hoursLogged || 0}
                            </div>
                            <div>
                                <strong>Tasks Completed:</strong>{" "}
                                {myProfile.tasksCompleted || 0}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics for Admin/Staff */}
            {canManage && stats && (
                <div className={styles.statsContainer}>
                    <h2>Volunteer Statistics</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <h3>{stats.totalVolunteers}</h3>
                            <p>Total Volunteers</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{stats.activeVolunteers}</h3>
                            <p>Active Volunteers</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{stats.pendingApproval}</h3>
                            <p>Pending Approval</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>{stats.totalHours}</h3>
                            <p>Total Hours Logged</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Volunteers List for Admin/Staff */}
            {canManage && (
                <div className={styles.volunteersSection}>
                    <h2>All Volunteers</h2>

                    {loading ? (
                        <div className={styles.loading}>Loading volunteers...</div>
                    ) : volunteers.length > 0 ? (
                        <div className={styles.volunteersGrid}>
                            {volunteers.map((volunteer) => (
                                <div key={volunteer._id} className={styles.volunteerCard}>
                                    <div className={styles.cardHeader}>
                                        <h3>
                                            {volunteer.firstName} {volunteer.lastName}
                                        </h3>
                                        <span
                                            className={`${styles.status} ${styles[volunteer.status?.toLowerCase().replace(" ", "")]
                                                }`}
                                        >
                                            {volunteer.status}
                                        </span>
                                    </div>
                                    <div className={styles.cardContent}>
                                        <div>
                                            <strong>Email:</strong> {volunteer.email}
                                        </div>
                                        <div>
                                            <strong>Phone:</strong> {volunteer.phone}
                                        </div>
                                        <div>
                                            <strong>Skills:</strong>{" "}
                                            {volunteer.skills?.join(", ") || "None"}
                                        </div>
                                        <div>
                                            <strong>Hours Logged:</strong>{" "}
                                            {volunteer.hoursLogged || 0}
                                        </div>
                                        <div>
                                            <strong>Tasks Completed:</strong>{" "}
                                            {volunteer.tasksCompleted || 0}
                                        </div>
                                        <div>
                                            <strong>Registered:</strong>{" "}
                                            {new Date(volunteer.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noVolunteers}>No volunteers found.</div>
                    )}
                </div>
            )}

            {/* Registration Modal */}
            <Modal
                isOpen={isRegistrationModalOpen}
                onRequestClose={() => setIsRegistrationModalOpen(false)}
                contentLabel="Volunteer Registration"
                className={styles.modal}
                overlayClassName={styles.modalOverlay}
            >
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <h2>Volunteer Registration</h2>
                        <button
                            onClick={() => setIsRegistrationModalOpen(false)}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmitRegistration}
                        className={styles.volunteerForm}
                    >
                        <div className={styles.formRow}>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={volunteerForm.firstName}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={volunteerForm.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={volunteerForm.email}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number (10 digits)"
                                value={volunteerForm.phone}
                                onChange={handleInputChange}
                                required
                                pattern="[0-9]{10}"
                            />
                        </div>

                        <textarea
                            name="address"
                            placeholder="Full Address"
                            value={volunteerForm.address}
                            onChange={handleInputChange}
                            required
                            rows="3"
                        />

                        <input
                            type="date"
                            name="dateOfBirth"
                            placeholder="Date of Birth"
                            value={volunteerForm.dateOfBirth}
                            onChange={handleInputChange}
                        />

                        <div className={styles.emergencySection}>
                            <h4>Emergency Contact</h4>
                            <div className={styles.formRow}>
                                <input
                                    type="text"
                                    name="emergencyContact.name"
                                    placeholder="Emergency Contact Name"
                                    value={volunteerForm.emergencyContact.name}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="tel"
                                    name="emergencyContact.phone"
                                    placeholder="Emergency Contact Phone"
                                    value={volunteerForm.emergencyContact.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <input
                                type="text"
                                name="emergencyContact.relationship"
                                placeholder="Relationship"
                                value={volunteerForm.emergencyContact.relationship}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className={styles.skillsSection}>
                            <h4>Skills & Interests</h4>
                            <div className={styles.skillsGrid}>
                                {skillOptions.map((skill) => (
                                    <label key={skill} className={styles.skillLabel}>
                                        <input
                                            type="checkbox"
                                            checked={volunteerForm.skills.includes(skill)}
                                            onChange={() => handleSkillsChange(skill)}
                                        />
                                        {skill}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.availabilitySection}>
                            <h4>Availability</h4>
                            {Object.keys(volunteerForm.availability).map((day) => (
                                <div key={day} className={styles.dayAvailability}>
                                    <label className={styles.dayLabel}>
                                        <input
                                            type="checkbox"
                                            checked={volunteerForm.availability[day].available}
                                            onChange={(e) =>
                                                handleAvailabilityChange(
                                                    day,
                                                    "available",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </label>
                                    {volunteerForm.availability[day].available && (
                                        <div className={styles.timeSlots}>
                                            {timeSlots.map((slot) => (
                                                <label key={slot} className={styles.timeSlotLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={volunteerForm.availability[
                                                            day
                                                        ].times.includes(slot)}
                                                        onChange={(e) => {
                                                            const currentTimes =
                                                                volunteerForm.availability[day].times;
                                                            const newTimes = e.target.checked
                                                                ? [...currentTimes, slot]
                                                                : currentTimes.filter((t) => t !== slot);
                                                            handleAvailabilityChange(day, "times", newTimes);
                                                        }}
                                                    />
                                                    {slot}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <textarea
                            name="experience"
                            placeholder="Previous volunteer experience or relevant background"
                            value={volunteerForm.experience}
                            onChange={handleInputChange}
                            rows="4"
                        />

                        <select
                            name="preferredContactMethod"
                            value={volunteerForm.preferredContactMethod}
                            onChange={handleInputChange}
                        >
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                            <option value="Text">Text</option>
                        </select>

                        <div className={styles.checkboxGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="newsletterSubscribed"
                                    checked={volunteerForm.newsletterSubscribed}
                                    onChange={handleInputChange}
                                />
                                Subscribe to newsletter
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="eventNotifications"
                                    checked={volunteerForm.eventNotifications}
                                    onChange={handleInputChange}
                                />
                                Receive event notifications
                            </label>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setIsRegistrationModalOpen(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button type="submit" className={styles.registerBtn}>
                                Register as Volunteer
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => setIsEditModalOpen(false)}
                contentLabel="Edit Volunteer Profile"
                className={styles.modal}
                overlayClassName={styles.modalOverlay}
            >
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <h2>Edit Volunteer Profile</h2>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleUpdateProfile} className={styles.volunteerForm}>
                        {/* Same form fields as registration but for editing */}
                        <div className={styles.formRow}>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={volunteerForm.phone}
                                onChange={handleInputChange}
                                required
                                pattern="[0-9]{10}"
                            />
                        </div>

                        <textarea
                            name="address"
                            placeholder="Full Address"
                            value={volunteerForm.address}
                            onChange={handleInputChange}
                            required
                            rows="3"
                        />

                        <div className={styles.skillsSection}>
                            <h4>Skills & Interests</h4>
                            <div className={styles.skillsGrid}>
                                {skillOptions.map((skill) => (
                                    <label key={skill} className={styles.skillLabel}>
                                        <input
                                            type="checkbox"
                                            checked={volunteerForm.skills.includes(skill)}
                                            onChange={() => handleSkillsChange(skill)}
                                        />
                                        {skill}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <textarea
                            name="experience"
                            placeholder="Previous volunteer experience"
                            value={volunteerForm.experience}
                            onChange={handleInputChange}
                            rows="4"
                        />

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button type="submit" className={styles.registerBtn}>
                                Update Profile
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Volunteers;
