/**
 * @fileoverview Handles the creation and updating of the Leaflet map.
 */

let mapInstance = null;
let vehicleMarkersLayer = null;
let taskMarkersLayer = null;

/**
 * Init                                        <button onclick="window.openExternalNavigation(${latitude}, ${longitude}, '${(task.originalAddress || task.deliveryAddress)?.replace(/'/g, "\\'")||''}')"
                           class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors">lizes the Leaflet map in a given container.
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
        
        // Create separate layers for vehicles and tasks
        vehicleMarkersLayer = L.layerGroup().addTo(mapInstance);
        taskMarkersLayer = L.layerGroup().addTo(mapInstance);
        console.log("Map initialized successfully.");
        return mapInstance;
    } catch (error) {
        console.error("Error creating map instance:", error);
        throw error;
    }
};

// Store last update data to prevent unnecessary re-rendering
let lastVehicleData = null;
let lastTaskData = null;

/**
 * Updates vehicle markers on the map. Clears old markers and adds new ones.
 * @param {import('../data/models.js').Vehicle[]} vehicles - An array of vehicle objects.
 */
export const updateVehicleMarkers = (vehicles) => {
    if (!mapInstance || !vehicleMarkersLayer) {
        console.error("Map is not initialized. Cannot update markers.");
        return;
    }

    // Check if vehicle data actually changed to prevent unnecessary updates
    const vehicleHash = JSON.stringify(vehicles.map(v => ({
        id: v.id,
        lat: v.liveLocation?.latitude,
        lng: v.liveLocation?.longitude,
        status: v.liveStatus
    })));
    
    if (lastVehicleData === vehicleHash) {
        console.log("🚫 Vehicle data unchanged, skipping marker update");
        return;
    }
    
    lastVehicleData = vehicleHash;
    vehicleMarkersLayer.clearLayers(); // Remove all previous markers

    const bounds = L.latLngBounds();
    let hasMarkers = false;

    vehicles.forEach(vehicle => {
        if (vehicle.liveLocation) {
            const { latitude, longitude } = vehicle.liveLocation;
            
            // Create custom vehicle icon
            const vehicleIcon = L.divIcon({
                html: '<div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg">🚚</div>',
                className: 'vehicle-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            
            const marker = L.marker([latitude, longitude], { icon: vehicleIcon }).addTo(vehicleMarkersLayer);
            
            marker.bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold text-lg mb-1">🚚 Vehicle: ${vehicle.id}</h3>
                    <p class="text-sm mb-1"><strong>Status:</strong> <span class="capitalize">${vehicle.liveStatus || 'N/A'}</span></p>
                    <p class="text-sm mb-1"><strong>Driver:</strong> ${vehicle.driverName || 'Unassigned'}</p>
                    <p class="text-xs text-gray-600">📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
                </div>
            `);
            
            bounds.extend([latitude, longitude]);
            hasMarkers = true;
        }
    });

    // Auto-fit map to show all vehicle markers if any exist
    if (hasMarkers && bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
};

/**
 * Updates task markers on the map. Shows delivery locations.
 * @param {Array} tasks - An array of task objects with location data.
 */
export const updateTaskMarkers = (tasks) => {
    if (!mapInstance || !taskMarkersLayer) {
        console.error("Map is not initialized. Cannot update task markers.");
        return;
    }

    // Check if task data actually changed to prevent unnecessary updates
    const taskHash = JSON.stringify(tasks.map(t => ({
        id: t.id,
        lat: t.location?.latitude || t.deliveryLocation?.latitude,
        lng: t.location?.longitude || t.deliveryLocation?.longitude,
        status: t.status
    })));
    
    if (lastTaskData === taskHash) {
        console.log("🚫 Task data unchanged, skipping marker update");
        return;
    }
    
    lastTaskData = taskHash;
    console.log(`🗺️ Updating task markers for ${tasks.length} tasks`);
    taskMarkersLayer.clearLayers(); // Remove all previous task markers

    const bounds = L.latLngBounds();
    let hasMarkers = false;

    tasks.forEach((task, index) => {
        // Handle different location property names with enhanced validation
        const taskLocation = task.location || task.deliveryLocation || task.coordinates;
        
        if (taskLocation && 
            typeof taskLocation.latitude === 'number' && 
            typeof taskLocation.longitude === 'number' &&
            !isNaN(taskLocation.latitude) && 
            !isNaN(taskLocation.longitude) &&
            taskLocation.latitude >= -90 && taskLocation.latitude <= 90 &&
            taskLocation.longitude >= -180 && taskLocation.longitude <= 180) {
            
            const { latitude, longitude } = taskLocation;
            console.log(`📍 Adding dispatcher task marker ${index + 1} at [${latitude}, ${longitude}]`);
            
            // Create custom task icon with different colors based on status
            const statusColor = task.status === 'completed' ? 'bg-green-500' : 
                               task.status === 'assigned' ? 'bg-orange-500' : 'bg-red-500';
            
            const taskIcon = L.divIcon({
                html: `<div class="${statusColor} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">${index + 1}</div>`,
                className: 'task-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            const marker = L.marker([latitude, longitude], { icon: taskIcon }).addTo(taskMarkersLayer);
            
            marker.bindPopup(`
                <div class="p-2 min-w-[200px]">
                    <h3 class="font-bold text-lg mb-2">📦 Task ${index + 1}: ${task.customerId}</h3>
                    <p class="text-sm mb-1"><strong>Address:</strong> ${task.deliveryAddress || 'Not specified'}</p>
                    <p class="text-sm mb-1"><strong>Volume:</strong> ${task.demandVolume || 0} units</p>
                    <p class="text-sm mb-1"><strong>Status:</strong> <span class="capitalize font-semibold">${task.status || 'pending'}</span></p>
                    <p class="text-xs text-gray-600 mt-2">📍 ${task.originalAddress || task.deliveryAddress}</p>
                                        <button onclick="window.openExternalNavigation(${latitude}, ${longitude}, '${(task.originalAddress || task.deliveryAddress)?.replace(/'/g, "\\'") || ''}')" 
                           class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors">
                        🗺️ Navigate
                    </button>
                </div>
            `);
            
            bounds.extend([latitude, longitude]);
            hasMarkers = true;
            
            console.log(`✅ Added task marker ${index + 1}: ${task.customerId} at [${latitude}, ${longitude}]`);
        } else {
            console.warn(`⚠️ Skipping dispatcher task ${index + 1} (${task.id}) due to invalid coordinates:`, taskLocation);
            console.warn(`   Task details:`, { 
                id: task.id, 
                customerId: task.customerId, 
                deliveryAddress: task.deliveryAddress,
                taskLocation: taskLocation,
                location: task.location,
                deliveryLocation: task.deliveryLocation,
                coordinates: task.coordinates
            });
        }
    });

    // Auto-fit map to show all task markers if any exist
    if (hasMarkers && bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [30, 30] });
        console.log(`🎯 Map view adjusted to show ${tasks.length} task locations`);
    } else {
        console.log("ℹ️ No valid task locations to display");
    }
};

/**
 * Updates both vehicle and task markers and fits the map to show all locations
 * @param {Array} vehicles - Array of vehicle objects
 * @param {Array} tasks - Array of task objects
 */
export const updateAllMarkers = (vehicles, tasks) => {
    console.log(`🗺️ Updating all markers: ${vehicles.length} vehicles, ${tasks.length} tasks`);
    
    if (!mapInstance) {
        console.error("Map is not initialized. Cannot update markers.");
        return;
    }

    // Update both layers
    updateVehicleMarkers(vehicles);
    updateTaskMarkers(tasks);

    // Fit map to show all markers
    const allBounds = L.latLngBounds();
    let hasAnyMarkers = false;

    // Add vehicle locations to bounds
    vehicles.forEach(vehicle => {
        if (vehicle.liveLocation) {
            allBounds.extend([vehicle.liveLocation.latitude, vehicle.liveLocation.longitude]);
            hasAnyMarkers = true;
        }
    });

    // Add task locations to bounds
    tasks.forEach(task => {
        const taskLocation = task.location || task.deliveryLocation || task.coordinates;
        if (taskLocation && taskLocation.latitude && taskLocation.longitude) {
            allBounds.extend([taskLocation.latitude, taskLocation.longitude]);
            hasAnyMarkers = true;
        }
    });

    // Fit map to show all locations
    if (hasAnyMarkers && allBounds.isValid()) {
        mapInstance.fitBounds(allBounds, { padding: [40, 40] });
        console.log("🎯 Map view adjusted to show all vehicles and tasks");
    }
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
    
    // Show current location with truck icon - always show even if approximate
    if (currentLocation && typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number') {
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng])
            .addTo(driverMarkersLayer);
        
        currentMarker.setIcon(L.divIcon({
            html: '<div class="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-lg">🚚</div>',
            className: 'current-location-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        }));
        
        const isApproximate = currentLocation.lat === 19.2183 && currentLocation.lng === 72.9781;
        currentMarker.bindPopup(`📍 ${isApproximate ? 'Approximate Location (Demo)' : 'Your Current Location'}`).openPopup();
        bounds.extend([currentLocation.lat, currentLocation.lng]);
        console.log(`✅ Driver location marker added at [${currentLocation.lat}, ${currentLocation.lng}]`);
    } else {
        console.warn('⚠️ Invalid current location for driver marker:', currentLocation);
    }

    // Add task markers with sequence numbers and coordinate validation
    // Only show pending/in-progress tasks - completed tasks should not appear on map
    const pendingTasks = route.tasks.filter(task => task.status !== 'completed');
    let pendingIndex = 0;
    
    route.tasks.forEach((task, index) => {
        // Enhanced coordinate validation to prevent NaN errors
        if (task.coordinates && 
            typeof task.coordinates.lat === 'number' && 
            typeof task.coordinates.lng === 'number' &&
            !isNaN(task.coordinates.lat) && 
            !isNaN(task.coordinates.lng) &&
            task.coordinates.lat >= -90 && task.coordinates.lat <= 90 &&
            task.coordinates.lng >= -180 && task.coordinates.lng <= 180) {
            
            const isCompleted = task.status === 'completed';
            
            // Skip completed tasks - they should not show on the map
            if (isCompleted) {
                console.log(`✅ Skipping completed task ${index + 1} (${task.customerId}) - removed from map`);
                return;
            }
            
            pendingIndex++;
            console.log(`📍 Adding pending task marker ${pendingIndex} at [${task.coordinates.lat}, ${task.coordinates.lng}]`);
            
            const marker = L.marker([task.coordinates.lat, task.coordinates.lng])
                .addTo(driverMarkersLayer);

            // Custom numbered marker for pending tasks only
            marker.setIcon(L.divIcon({
                html: `<div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white">${pendingIndex}</div>`,
                className: 'task-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            }));

            // Prepare display values with null safety for pending tasks
            const displayName = task.customerName || task.customerId || 'Customer';
            const displayAddress = task.originalAddress || task.address || task.deliveryAddress || 'Address not available';
            const safeDisplayAddress = displayAddress ? displayAddress.replace(/'/g, "\\'") : 'Address not available';
            
            marker.bindPopup(`
                <div class="p-3 min-w-[200px]">
                    <h3 class="font-bold text-lg mb-2">${pendingIndex}. ${displayName}</h3>
                    <p class="text-sm mb-2">${displayAddress}</p>
                    <p class="text-xs text-gray-600 mb-2">Status: <span class="font-semibold text-blue-600">Pending Delivery</span></p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="window.markTaskDelivered('${task.id}')" 
                                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors">
                            ✓ Mark Delivered
                        </button>
                        <button onclick="window.openExternalNavigation(${task.coordinates.lat}, ${task.coordinates.lng}, '${safeDisplayAddress}')" 
                               class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors">
                            🗺️ Navigate
                        </button>
                    </div>
                </div>
            `);

            bounds.extend([task.coordinates.lat, task.coordinates.lng]);
        } else {
            console.warn(`⚠️ Skipping task ${index + 1} due to invalid coordinates:`, task.coordinates);
            console.warn(`   Task details:`, { id: task.id, customerName: task.customerName, coordinates: task.coordinates });
        }
    });

    // Draw route line only for pending tasks (exclude completed ones)
    const pendingTasksWithCoords = route.tasks
        .filter(task => task.status !== 'completed' && // Only pending tasks
            task.coordinates && 
            typeof task.coordinates.lat === 'number' && 
            typeof task.coordinates.lng === 'number' &&
            !isNaN(task.coordinates.lat) && 
            !isNaN(task.coordinates.lng));
    
    if (pendingTasksWithCoords.length > 0) {
        const routeCoords = [];
        
        // Start from current location
        if (currentLocation) {
            routeCoords.push([currentLocation.lat, currentLocation.lng]);
        }
        
        // Add only pending task locations
        pendingTasksWithCoords.forEach(task => {
            routeCoords.push([task.coordinates.lat, task.coordinates.lng]);
        });

        // Only draw line if we have at least 2 points (current location + 1 pending task)
        if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
                color: '#3B82F6',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(driverMarkersLayer);
            
            console.log(`🗺️ Route line drawn for ${pendingTasksWithCoords.length} pending tasks`);
        } else {
            console.log('🏁 No route line needed - all deliveries completed!');
        }
    } else {
        console.log('🎉 All tasks completed - no route lines to display');
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
        
        // Use original address for cleaner display with null safety
        const displayAddress = nextTask.originalAddress || nextTask.address || nextTask.deliveryAddress || 'Address not available';
        const displayName = nextTask.customerName || nextTask.customerId || 'Customer';
        const safeDisplayAddress = displayAddress ? displayAddress.replace(/'/g, "\\'") : 'Address not available';
        
        nextDestination.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-white">Next: ${displayName}</p>
                    <p class="text-blue-200 text-sm">${displayAddress}</p>
                    ${distanceText}
                </div>
                <button onclick="window.openExternalNavigation(${nextTask.coordinates?.lat || 0}, ${nextTask.coordinates?.lng || 0}, '${safeDisplayAddress}')" 
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
