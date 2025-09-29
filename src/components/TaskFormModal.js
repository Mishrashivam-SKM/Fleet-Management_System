/**
 * @file Renders and manages the modal form for creating and editing tasks.
 */

// --- State ---
let onSubmitCallback = null;

/**
 * Opens and injects the task modal into the DOM.
 * @param {function} onSubmit - The callback function to execute when the form is submitted.
 * @param {object} [taskToEdit=null] - The task object to pre-fill the form with for editing.
 */
export const openTaskModal = (onSubmit, taskToEdit = null) => {
    onSubmitCallback = onSubmit;
    const modalRoot = document.getElementById('modal-root');
    const isEditing = taskToEdit !== null;

    // Helper to format date for datetime-local input
    const toDateTimeLocal = (firestoreTimestamp) => {
        if (!firestoreTimestamp) return '';
        const date = new Date(firestoreTimestamp.seconds * 1000);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    };

    const modalHtml = `
        <div id="task-modal-backdrop" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">${isEditing ? 'Edit Task' : 'Create New Task'}</h3>
                <form id="task-form">
                    <div class="space-y-4">
                        <div>
                            <label for="customerId" class="block text-sm font-medium text-gray-700">Customer ID / Name</label>
                            <input type="text" id="customerId" name="customerId" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${taskToEdit?.customerId || ''}">
                        </div>
                        <div>
                            <label for="demandVolume" class="block text-sm font-medium text-gray-700">Demand Volume</label>
                            <input type="number" id="demandVolume" name="demandVolume" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${taskToEdit?.demandVolume || ''}">
                        </div>
                         <div>
                            <label for="deliveryAddress" class="block text-sm font-medium text-gray-700">Delivery Address</label>
                            <input type="text" id="deliveryAddress" name="deliveryAddress" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${taskToEdit?.deliveryAddress || ''}" placeholder="Enter full address">
                            <p class="mt-1 text-sm text-gray-500">Enter complete address for accurate delivery location</p>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="timeWindowStart" class="block text-sm font-medium text-gray-700">Time Window Start</label>
                                <input type="datetime-local" id="timeWindowStart" name="timeWindowStart" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${toDateTimeLocal(taskToEdit?.timeWindowStart)}">
                                <p class="mt-1 text-sm text-gray-500">Earliest acceptable delivery time</p>
                            </div>
                            <div>
                                <label for="timeWindowEnd" class="block text-sm font-medium text-gray-700">Time Window End (Deadline)</label>
                                <input type="datetime-local" id="timeWindowEnd" name="timeWindowEnd" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" value="${toDateTimeLocal(taskToEdit?.timeWindowEnd)}">
                                <p class="mt-1 text-sm text-gray-500">⚠️ Latest acceptable delivery time (deadline)</p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" id="cancel-task-modal" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">${isEditing ? 'Save Changes' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modalRoot.innerHTML = modalHtml;

    // Attach event listeners
    document.getElementById('task-form').addEventListener('submit', (e) => handleFormSubmit(e, taskToEdit?.id));
    document.getElementById('cancel-task-modal').addEventListener('click', closeModal);
    document.getElementById('task-modal-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'task-modal-backdrop') {
            closeModal();
        }
    });
};

import { geocodeAddress } from '../services/geocodingService.js';

/**
 * Handles the form submission logic using the robust FormData API.
 * @private
 */
const handleFormSubmit = async (e, taskId) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        // Get coordinates from address
        const address = formData.get('deliveryAddress');
        const location = await geocodeAddress(address);

        // Convert datetime-local string to Firestore Timestamp
        const startTime = new Date(formData.get('timeWindowStart')).getTime();
        const endTime = new Date(formData.get('timeWindowEnd')).getTime();

        const taskData = {
            customerId: formData.get('customerId'),
            demandVolume: parseInt(formData.get('demandVolume'), 10),
            deliveryAddress: address,
            location: location,
            // Firestore expects seconds and nanoseconds
            timeWindowStart: {
                seconds: Math.floor(startTime / 1000),
                nanoseconds: (startTime % 1000) * 1000000
            },
            timeWindowEnd: {
                seconds: Math.floor(endTime / 1000),
                nanoseconds: (endTime % 1000) * 1000000
            },
            status: 'pending', // Default status
        };
        
        await onSubmitCallback(taskData, taskId);
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

