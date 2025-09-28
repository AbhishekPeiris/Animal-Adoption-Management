export const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Get all unique keys from all objects
    const allKeys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);

    // Create CSV content
    const csvContent = [
        // Headers
        headers.join(','),
        // Data rows
        ...data.map(item =>
            headers.map(header => {
                let value = item[header];

                // Handle nested objects
                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        value = value.join('; ');
                    } else {
                        value = JSON.stringify(value);
                    }
                }

                // Handle null/undefined
                if (value === null || value === undefined) {
                    value = '';
                }

                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    value = `"${value}"`;
                }

                return value;
            }).join(',')
        )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const formatDataForCSV = (data, type) => {
    if (!data || data.length === 0) return [];

    switch (type) {
        case 'pets':
            return data.map(pet => ({
                'Pet ID': pet.petId,
                'Pet Name': pet.petName,
                'Species': pet.petSpecies,
                'Breed': pet.petBreed,
                'Age': pet.petAge,
                'Gender': pet.petGender,
                'Status': pet.petStatus,
                'Description': pet.petDescription,
                'Image URL': pet.imageUrl,
                'Created Date': new Date(pet.createdAt).toLocaleDateString(),
                'Updated Date': new Date(pet.updatedAt).toLocaleDateString(),
            }));

        case 'rescued-pets':
            return data.map(pet => ({
                'Rescued Pet ID': pet.rescuedPetId,
                'Pet Name': pet.rescuedPetName,
                'Species': pet.species,
                'Breed': pet.breed,
                'Age': pet.rescuedPetAge,
                'Gender': pet.rescuedPetGender,
                'Health Status': pet.healthStatus,
                'Rescue Location': pet.rescueLocation,
                'Rescue Date': new Date(pet.rescuedDate).toLocaleDateString(),
                'Adoption Status': pet.adoptionStatus,
                'Adoption Readiness': pet.adoptionReadiness,
                'Description': pet.description,
                'Initial Condition': pet.initialCondition,
                'Recovery Progress': pet.recoveryProgress,
                'Medical Notes': pet.medicalNotes,
                'Is Confirmed': pet.isConfirmed ? 'Yes' : 'No',
                'Is Archived': pet.isArchived ? 'Yes' : 'No',
                'Archive Reason': pet.archiveReason || '',
                'Created Date': new Date(pet.createdAt).toLocaleDateString(),
                'Updated Date': new Date(pet.updatedAt).toLocaleDateString(),
            }));

        case 'volunteers':
            return data.map(volunteer => ({
                'Volunteer ID': volunteer._id,
                'First Name': volunteer.firstName,
                'Last Name': volunteer.lastName,
                'Email': volunteer.email,
                'Phone': volunteer.phone,
                'Address': volunteer.address,
                'Status': volunteer.status,
                'Skills': volunteer.skills?.join(', ') || '',
                'Experience': volunteer.experience || '',
                'Background Check Status': volunteer.backgroundCheckStatus,
                'Training Completed': volunteer.trainingCompleted ? 'Yes' : 'No',
                'Orientation Completed': volunteer.orientationCompleted ? 'Yes' : 'No',
                'Hours Logged': volunteer.hoursLogged || 0,
                'Tasks Completed': volunteer.tasksCompleted || 0,
                'Emergency Contact Name': volunteer.emergencyContact?.name || '',
                'Emergency Contact Phone': volunteer.emergencyContact?.phone || '',
                'Emergency Contact Relationship': volunteer.emergencyContact?.relationship || '',
                'Approved By': volunteer.approvedBy?.name || '',
                'Approved Date': volunteer.approvedAt ? new Date(volunteer.approvedAt).toLocaleDateString() : '',
                'Applied Date': new Date(volunteer.createdAt).toLocaleDateString(),
                'Notes': volunteer.notes || '',
            }));

        case 'adoption-requests':
            return data.map(request => ({
                'Request ID': request._id,
                'Adopter Name': request.adopterName,
                'Adopter Email': request.adopterEmail,
                'Adopter Phone': request.adopterPhone,
                'Adopter Address': request.adopterAddress,
                'Pet Name': request.petId?.petName || 'Unknown',
                'Pet ID': request.petId?.petId || 'Unknown',
                'Home Type': request.homeType,
                'Has Yard': request.hasYard ? 'Yes' : 'No',
                'Other Pets': request.otherPets || '',
                'Experience': request.experience || '',
                'Reason for Adoption': request.reasonForAdoption,
                'Form Status': request.formStatus,
                'Admin Notes': request.adminNotes || '',
                'Reviewed By': request.reviewedBy?.name || '',
                'Reviewed Date': request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '',
                'Submitted Date': new Date(request.createdAt).toLocaleDateString(),
            }));

        case 'donations':
            return data.map(donation => ({
                'Donation ID': donation._id,
                'Donor Name': donation.isAnonymous ? 'Anonymous' : donation.donorName,
                'Donor Email': donation.isAnonymous ? 'Anonymous' : donation.donorEmail,
                'Donor Phone': donation.isAnonymous ? 'Anonymous' : (donation.donorPhone || ''),
                'Amount': donation.amount,
                'Cause': donation.cause,
                'Custom Cause': donation.customCause || '',
                'Donation Type': donation.donationType,
                'Payment Method': donation.paymentMethod,
                'Payment Status': donation.paymentStatus,
                'Is Anonymous': donation.isAnonymous ? 'Yes' : 'No',
                'Is Recurring': donation.isRecurring ? 'Yes' : 'No',
                'Is Active': donation.isActive ? 'Yes' : 'No',
                'Message': donation.message || '',
                'Next Donation Date': donation.nextDonationDate ? new Date(donation.nextDonationDate).toLocaleDateString() : '',
                'Donation Date': new Date(donation.createdAt).toLocaleDateString(),
            }));

        default:
            return data;
    }
};
