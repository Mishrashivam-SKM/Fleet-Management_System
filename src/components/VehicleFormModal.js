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
        <div id="vehicle-modal-backdrop" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">${isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                <form id="vehicle-form">
                    <div class="space-y-4">
                        <div>
                            <label for="vehicleId" class="block text-sm font-medium text-gray-700">Vehicle ID (e.g., VAN-01)</label>
                            <input type="text" id="vehicleId" name="vehicleId" required ${isEditing ? 'readonly' : ''} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${isEditing ? 'bg-gray-200' : ''}" value="${vehicleToEdit?.id || ''}">
                        </div>
                        <div>
                            <label for="driverName" class="block text-sm font-medium text-gray-700">Driver Name</label>
                            <input type="text" id="driverName" name="driverName" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${vehicleToEdit?.driverName || ''}">
                        </div>
                        <div>
                            <label for="driverEmail" class="block text-sm font-medium text-gray-700">Driver Login Email</label>
                            <input type="email" id="driverEmail" name="driverEmail" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${vehicleToEdit?.driverEmail || ''}">
                        </div>
                        <div>
                            <label for="maxCapacity" class="block text-sm font-medium text-gray-700">Max Capacity (Volume)</label>
                            <input type="number" id="maxCapacity" name="maxCapacity" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${vehicleToEdit?.maxCapacity || ''}">
                        </div>
                        <div>
                            <label for="startAddress" class="block text-sm font-medium text-gray-700">Start Location Address</label>
                            <input type="text" id="startAddress" name="startAddress" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${vehicleToEdit?.startAddress || ''}" placeholder="Enter vehicle's start location address">
                            <p class="mt-1 text-sm text-gray-500">Enter complete address for accurate vehicle location</p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" id="cancel-vehicle-modal" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">${isEditing ? 'Save Changes' : 'Add Vehicle'}</button>
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

