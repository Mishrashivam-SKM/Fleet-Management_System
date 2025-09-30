/**
 * @file Renders and manages the modal form for creating and editing vehicles.
 */

// --- State ---
let onSubmitCallback = null;

/**
 * Opens and injects the vehicle modal into the DOM.
 * @param {function} onSubmit - The callback function to execute when the form is submitted.
 * @param {object} [vehicleToEdit=null] - The vehicle object to pre-fill the form with for editing.
 */
export const openVehicleModal = (onSubmit, vehicleToEdit = null) => {
    onSubmitCallback = onSubmit;
    const modalRoot = document.getElementById('modal-root');
    const isEditing = vehicleToEdit !== null;

    const modalHtml = `
        <div id="vehicle-modal-backdrop" class="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="theme-card rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                <h3 class="text-xl font-semibold mb-4 theme-text-primary">${isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                <form id="vehicle-form">
                    <div class="space-y-4">
                        <div>
                            <label for="vehicleId" class="block text-sm font-medium theme-text-primary">Vehicle ID (e.g., VAN-01)</label>
                            <input type="text" id="vehicleId" name="vehicleId" required ${isEditing ? 'readonly' : ''} class="mt-1 block w-full theme-input rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}" value="${vehicleToEdit?.id || ''}">
                        </div>
                        <div>
                            <label for="driverName" class="block text-sm font-medium theme-text-primary">Driver Name</label>
                            <input type="text" id="driverName" name="driverName" required class="mt-1 block w-full theme-input rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200" value="${vehicleToEdit?.driverName || ''}">
                        </div>
                        <div>
                            <label for="driverEmail" class="block text-sm font-medium theme-text-primary">Driver Login Email</label>
                            <input type="email" id="driverEmail" name="driverEmail" required class="mt-1 block w-full theme-input rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200" value="${vehicleToEdit?.driverEmail || ''}">
                        </div>
                        <div>
                            <label for="maxCapacity" class="block text-sm font-medium theme-text-primary">Max Capacity (Volume)</label>
                            <input type="number" id="maxCapacity" name="maxCapacity" required class="mt-1 block w-full theme-input rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200" value="${vehicleToEdit?.maxCapacity || ''}">
                        </div>
                        <div>
                            <label for="startAddress" class="block text-sm font-medium theme-text-primary">Start Location Address</label>
                            <input type="text" id="startAddress" name="startAddress" required class="mt-1 block w-full theme-input rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200" value="${vehicleToEdit?.startAddress || ''}" placeholder="Enter vehicle's start location address">
                            <p class="mt-1 text-sm theme-text-muted">Enter complete address for accurate vehicle location</p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" id="cancel-vehicle-modal" class="px-4 py-2 rounded-md theme-btn-secondary hover:scale-105 transition-all duration-200">Cancel</button>
                        <button type="submit" class="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium hover:scale-105 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">${isEditing ? 'Save Changes' : 'Add Vehicle'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modalRoot.innerHTML = modalHtml;

    // Attach event listeners
    document.getElementById('vehicle-form').addEventListener('submit', (e) => handleFormSubmit(e, vehicleToEdit?.id));
    document.getElementById('cancel-vehicle-modal').addEventListener('click', closeModal);
    document.getElementById('vehicle-modal-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'vehicle-modal-backdrop') {
            closeModal();
        }
    });
};

import { geocodeAddress } from '../services/geocodingService.js';

/**
 * Handles the form submission logic.
 * @private
 */
const handleFormSubmit = async (e, vehicleId) => {
    e.preventDefault();
    const form = e.target;

    try {
        // Get coordinates from address
        const startAddress = form.startAddress.value;
        const startLocation = await geocodeAddress(startAddress);

        const vehicleData = {
            driverName: form.driverName.value,
            driverEmail: form.driverEmail.value,
            maxCapacity: parseInt(form.maxCapacity.value, 10),
            liveStatus: 'idle',
            startAddress: startAddress,
            startLocation: startLocation,
            liveLocation: startLocation, // Set live location to start location initially
        };
        
        // Use the form field for new vehicles, but the passed ID for edits
        const finalVehicleId = vehicleId || form.vehicleId.value;
        await onSubmitCallback(vehicleData, finalVehicleId);
        closeModal();
    } catch (error) {
        alert(`Error: ${error.message}. Please enter a valid address.`);
    }
};

/**
 * Closes and removes the modal from the DOM.
 * @private
 */
const closeModal = () => {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = '';
};

