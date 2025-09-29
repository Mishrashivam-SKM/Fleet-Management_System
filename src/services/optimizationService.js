import { MinHeap } from './minHeap.js';
import { ORS_API_KEY } from '../api/config.js';

/**
 * Transforms application data into the format required by the ORS Vroom API.
 * @param {import('../data/models.js').Task[]} orderedTasks - Array of tasks, prioritized by the Min-Heap.
 * @param {import('../data/models.js').Vehicle[]} vehicles - Array of available vehicles.
 * @returns {Object} The JSON payload for the ORS API.
 */
const createVroomPayload = (orderedTasks, vehicles) => {
    // Create maps to store original IDs for later reference
    const taskIdMap = new Map();
    const vehicleIdMap = new Map();
    
    const jobs = orderedTasks.map((task, index) => {
        if (!task.location || typeof task.location.latitude === 'undefined' || typeof task.location.longitude === 'undefined') {
            throw new Error(`Invalid location data for task ${task.id || 'unknown'}: ${JSON.stringify(task.location)}`);
        }

        // Use index + 1000 as numeric ID (to avoid conflicts with vehicle IDs)
        const numericId = index + 1000;
        taskIdMap.set(numericId, task.id);

        return {
            id: numericId,
            location: [task.location.longitude, task.location.latitude],
            service: 300, // Service time in seconds (e.g., 5 minutes)
            amount: [task.demandVolume],
            time_windows: [[
                task.timeWindowStart.seconds,
                task.timeWindowEnd.seconds
            ]]
        };
    });

    const vroomVehicles = vehicles.map((vehicle, index) => {
        // Use current GPS location if available, otherwise start location
        const location = vehicle.currentLocation || vehicle.startLocation;
        
        if (!location || typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
            throw new Error(`Invalid location data for vehicle ${vehicle.id}: ${JSON.stringify(location)}`);
        }

        // Default shift times if not provided
        const now = Math.floor(Date.now() / 1000);
        const endOfDay = Math.floor(new Date().setHours(23, 59, 59) / 1000);

        // Use index + 1 as numeric ID (VROOM expects positive integers)
        const numericId = index + 1;
        vehicleIdMap.set(numericId, vehicle.id);

        return {
            id: numericId,
            profile: 'driving-car', // or driving-hgv for trucks
            start: [location.longitude, location.latitude], // Use current GPS position
            capacity: [vehicle.maxCapacity],
            time_window: [
                vehicle.shiftStart?.seconds || now,
                vehicle.shiftEnd?.seconds || endOfDay
            ]
        };
    });

    return {
        jobs,
        vehicles: vroomVehicles,
        options: { g: true }, // Request geometry for drawing routes on map
        idMaps: { taskIdMap, vehicleIdMap } // Return the ID maps for later use
    };
};/**
 * Orchestrates the route optimization process by calling the ORS Vroom API.
 * @param {import('../data/models.js').Task[]} tasks - An array of task objects.
 * @param {import('../data/models.js').Vehicle[]} vehicles - An array of available vehicle objects.
 * @returns {Promise<Object>} A promise that resolves with the optimized route plan from the API.
 */
/**
 * Gets current GPS location for a vehicle or falls back to start location
 */
const getCurrentVehicleLocation = (vehicle) => {
    // Use live location if it's recent (within last 10 minutes), otherwise use start location
    const now = new Date();
    const lastUpdate = vehicle.lastLocationUpdate ? new Date(vehicle.lastLocationUpdate.seconds * 1000) : null;
    const isRecentLocation = lastUpdate && (now - lastUpdate) < 10 * 60 * 1000; // 10 minutes
    
    if (isRecentLocation && vehicle.liveLocation) {
        console.log(`Using live GPS location for vehicle ${vehicle.id}`);
        return vehicle.liveLocation;
    } else {
        console.log(`Using start location for vehicle ${vehicle.id} (GPS not recent or unavailable)`);
        return vehicle.startLocation;
    }
};

export const optimizeRouteHandler = async (tasks, vehicles) => {
    console.log("Starting optimization process with real GPS locations...");
    console.log("Input tasks:", tasks);
    console.log("Input vehicles:", vehicles);
    
    // Update vehicle locations to current GPS positions
    const vehiclesWithCurrentLocation = vehicles.map(vehicle => ({
        ...vehicle,
        currentLocation: getCurrentVehicleLocation(vehicle)
    }));
    
    console.log("Vehicle locations updated for optimization:", 
        vehiclesWithCurrentLocation.map(v => ({
            id: v.id,
            startLocation: v.startLocation,
            currentLocation: v.currentLocation,
            isLiveGPS: v.currentLocation === v.liveLocation
        }))
    );
    
    // 1. Prioritize tasks using Min-Heap
    const taskPriorityQueue = new MinHeap('timeWindowEnd');
    tasks.forEach(task => taskPriorityQueue.insert(task));
    const orderedTasks = [];
    while (!taskPriorityQueue.isEmpty()) {
        orderedTasks.push(taskPriorityQueue.extractMin());
    }
    console.log("Tasks prioritized by deadline:", orderedTasks);

    // 2. Create the API payload using current GPS locations
    const payloadData = createVroomPayload(orderedTasks, vehiclesWithCurrentLocation);
    const { idMaps, ...payload } = payloadData;
    const { taskIdMap, vehicleIdMap } = idMaps;
    console.log("ORS Vroom API Payload (with GPS locations):", JSON.stringify(payload, null, 2));

    // 3. Call the ORS Vroom API
    const VROOM_API_URL = 'https://api.openrouteservice.org/optimization';
    try {
        const response = await fetch(VROOM_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json, application/geo+json, multipart/form-data'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ORS API Error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log("ORS Vroom API Response:", result);
        console.log("Routes in response:", result.routes);
        
        // Debug unassigned tasks
        if (result.unassigned && result.unassigned.length > 0) {
            console.warn("⚠️ Unassigned tasks found:", result.unassigned);
            result.unassigned.forEach(unassigned => {
                console.warn(`Task ${unassigned.id} unassigned. Reason: ${unassigned.description || 'Unknown'}`);
            });
        }
        
        // Convert numeric IDs back to original IDs in the response
        if (result.routes && Array.isArray(result.routes)) {
            result.routes = result.routes.map(route => ({
                ...route,
                vehicle: vehicleIdMap.get(route.vehicle) || route.vehicle,
                steps: route.steps.map(step => ({
                    ...step,
                    id: step.id >= 1000 ? taskIdMap.get(step.id) || step.id : step.id
                }))
            }));
        } else {
            console.warn("No routes found in API response or routes is not an array");
        }
        
        return result;

    } catch (error) {
        console.error("Failed to fetch optimized routes:", error);
        throw error; // Propagate error to be handled in the UI
    }
};


