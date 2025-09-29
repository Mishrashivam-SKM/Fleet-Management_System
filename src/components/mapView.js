/**
 * @fileoverview Handles the creation and updating of the Leaflet map.
 */

let mapInstance = null;
let vehicleMarkersLayer = null;

/**
 * Initializes the Leaflet map in a given container.
 * @param {string} containerId - The ID of the HTML element to host the map.
 */
export const initializeMap = (containerId) => {
    console.log(`Attempting to initialize map with container ID: ${containerId}`);
    
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Map container with ID '${containerId}' not found in DOM`);
    }
    
    if (mapInstance) {
        console.log("Removing existing map instance");
        mapInstance.remove();
    }
    
    try {
        // Default view (e.g., centered on a city)
        mapInstance = L.map(containerId).setView([19.2183, 72.9781], 12); // Thane, India

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);
        
        vehicleMarkersLayer = L.layerGroup().addTo(mapInstance);
        console.log("Map initialized successfully.");
        return mapInstance;
    } catch (error) {
        console.error("Error creating map instance:", error);
        throw error;
    }
};

/**
 * Updates vehicle markers on the map. Clears old markers and adds new ones.
 * @param {import('../data/models.js').Vehicle[]} vehicles - An array of vehicle objects.
 */
export const updateVehicleMarkers = (vehicles) => {
    if (!mapInstance || !vehicleMarkersLayer) {
        console.error("Map is not initialized. Cannot update markers.");
        return;
    }

    vehicleMarkersLayer.clearLayers(); // Remove all previous markers

    vehicles.forEach(vehicle => {
        if (vehicle.liveLocation) {
            const { latitude, longitude } = vehicle.liveLocation;
            const marker = L.marker([latitude, longitude]).addTo(vehicleMarkersLayer);
            
            marker.bindPopup(`
                <b>Vehicle:</b> ${vehicle.id}<br>
                <b>Status:</b> ${vehicle.liveStatus || 'N/A'}<br>
                <b>Driver:</b> ${vehicle.driverName || 'Unassigned'}
            `);
        }
    });
};

// Driver-specific map functionality
let driverMapInstance = null;
let driverMarkersLayer = null;

/**
 * Initializes the driver navigation map.
 */
export const initializeDriverMap = () => {
    if (driverMapInstance) {
        driverMapInstance.remove();
    }
    
    driverMapInstance = L.map('driver-map-container').setView([19.2183, 72.9781], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(driverMapInstance);
    
    driverMarkersLayer = L.layerGroup().addTo(driverMapInstance);
    console.log("Driver map initialized.");
    return driverMapInstance;
};

/**
 * Shows the driver's route with navigation markers.
 * @param {Object} route - The route object with tasks
 * @param {Object} currentLocation - Current GPS location {lat, lng}
 */
export const showDriverRoute = (route, currentLocation) => {
    if (!driverMapInstance || !driverMarkersLayer) {
        console.error("Driver map is not initialized.");
        return;
    }

    // Clear existing layers
    driverMarkersLayer.clearLayers();

    if (!route || !route.tasks || route.tasks.length === 0) {
        console.log("No route data to display");
        return;
    }

    const bounds = L.latLngBounds();
    
    // Show current location with truck icon
    if (currentLocation) {
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng])
            .addTo(driverMarkersLayer);
        
        currentMarker.setIcon(L.divIcon({
            html: '<div class="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg">🚚</div>',
            className: 'current-location-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        }));
        
        currentMarker.bindPopup('📍 Your Current Location').openPopup();
        bounds.extend([currentLocation.lat, currentLocation.lng]);
    }

    // Add task markers with sequence numbers
    route.tasks.forEach((task, index) => {
        if (task.coordinates) {
            const isCompleted = task.status === 'completed';
            const marker = L.marker([task.coordinates.lat, task.coordinates.lng])
                .addTo(driverMarkersLayer);

            // Custom numbered marker with status color
            const markerColor = isCompleted ? 'bg-green-500' : 'bg-blue-500';
            marker.setIcon(L.divIcon({
                html: `<div class="${markerColor} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white">${index + 1}</div>`,
                className: 'task-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            }));

            marker.bindPopup(`
                <div class="p-3 min-w-[200px]">
                    <h3 class="font-bold text-lg mb-2">${index + 1}. ${task.customerName}</h3>
                    <p class="text-sm mb-2">${task.address}</p>
                    <p class="text-xs text-gray-600 mb-2">Status: <span class="font-semibold ${isCompleted ? 'text-green-600' : 'text-blue-600'}">${task.status || 'pending'}</span></p>
                    ${task.status !== 'completed' ? 
                        `<button onclick="window.markTaskDelivered('${task.id}')" 
                                class="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors">
                            ✓ Mark Delivered
                        </button>` : 
                        `<div class="mt-2 bg-green-100 text-green-800 px-3 py-1 rounded text-xs">✓ Completed</div>`
                    }
                </div>
            `);

            bounds.extend([task.coordinates.lat, task.coordinates.lng]);
        }
    });

    // Draw route line if we have multiple points
    if (route.tasks.length > 0) {
        const routeCoords = [];
        
        if (currentLocation) {
            routeCoords.push([currentLocation.lat, currentLocation.lng]);
        }
        
        route.tasks
            .filter(task => task.coordinates)
            .forEach(task => {
                routeCoords.push([task.coordinates.lat, task.coordinates.lng]);
            });

        if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
                color: '#3B82F6',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(driverMarkersLayer);
        }
    }

    // Fit map to show all markers with padding
    if (bounds.isValid()) {
        driverMapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
    
    // Update navigation instructions
    updateNavigationInstructions(route, currentLocation);
};

/**
 * Updates the navigation instructions panel
 */
const updateNavigationInstructions = (route, currentLocation) => {
    const instructionsContainer = document.getElementById('navigation-instructions');
    const nextDestination = document.getElementById('next-destination');
    
    if (!instructionsContainer || !nextDestination) return;
    
    // Find the next pending task
    const nextTask = route.tasks.find(task => task.status !== 'completed');
    
    if (nextTask) {
        instructionsContainer.classList.remove('hidden');
        
        // Calculate distance if we have current location
        let distanceText = '';
        if (currentLocation && nextTask.coordinates) {
            const distance = calculateDistance(
                currentLocation.lat, 
                currentLocation.lng, 
                nextTask.coordinates.lat, 
                nextTask.coordinates.lng
            );
            distanceText = `<span class="text-blue-300">📏 ${distance.toFixed(2)} km away</span>`;
        }
        
        nextDestination.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-white">Next: ${nextTask.customerName}</p>
                    <p class="text-blue-200 text-sm">${nextTask.address}</p>
                    ${distanceText}
                </div>
                <button onclick="openExternalNavigation('${nextTask.address}')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                    🗺️ Open in Maps
                </button>
            </div>
        `;
    } else {
        instructionsContainer.classList.add('hidden');
    }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};
