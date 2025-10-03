import { ORS_API_KEY, GEMINI_API_KEY } from '../api/config.js';

/**
 * Transforms application data into the format required by the ORS Vroom API.
 * @param {import('../data/models.js').Task[]} orderedTasks - Array of tasks, prioritized by the             options: {
            g: true, // Request detailed geometry for routes
            c: true, // Request detailed cost information 
            t: true  // Request detailed timing information
        },
        // Add routing profile for proper travel time calculation
        profile: "driving-car",  // Use car routing profile for realistic travel times
        idMaps: { taskIdMap, vehicleIdMap } // Return the ID maps for later use            g: true, // Request detailed geometry for routes
            c: true, // Request detailed cost information 
            t: true  // Request detailed timing information
        },
        // Add routing profile for proper travel time calculation
        profile: "driving-car",  // Use car routing profile for realistic travel times
        idMaps: { taskIdMap, vehicleIdMap } // Return the ID maps for later use@param {import('../data/models.js').Vehicle[]} vehicles - Array of available vehicles.
 * @returns {Object} The JSON payload for the ORS API.
 */
const createVroomPayload = (orderedTasks, vehicles) => {
    // Create maps to store original IDs for later reference
    const taskIdMap = new Map();
    const vehicleIdMap = new Map();
    
    const jobs = orderedTasks.map((task, index) => {
        console.log(`\n🔍 Processing task ${task.id}:`, {
            timeWindowStart: task.timeWindowStart,
            timeWindowEnd: task.timeWindowEnd,
            location: task.location,
            deliveryLocation: task.deliveryLocation,
            coordinates: task.coordinates
        });
        
        // Handle different location property names (location, deliveryLocation, coordinates)
        const taskLocationRaw = task.location || task.deliveryLocation || task.coordinates;
        
        if (!taskLocationRaw) {
            console.error(`Task ${task.id} has no location data`);
            throw new Error(`No location data for task ${task.id || 'unknown'}`);
        }
        
        // Extract coordinates from Firestore GeoPoint or regular object
        let taskLocation;
        if (taskLocationRaw.latitude !== undefined && taskLocationRaw.longitude !== undefined) {
            // Standard lat/lng object
            taskLocation = {
                latitude: taskLocationRaw.latitude,
                longitude: taskLocationRaw.longitude
            };
        } else if (taskLocationRaw._lat !== undefined && taskLocationRaw._long !== undefined) {
            // Firestore GeoPoint object
            taskLocation = {
                latitude: taskLocationRaw._lat,
                longitude: taskLocationRaw._long
            };
        } else if (typeof taskLocationRaw.latitude === 'function' && typeof taskLocationRaw.longitude === 'function') {
            // Firestore GeoPoint with methods (sometimes happens in certain contexts)
            taskLocation = {
                latitude: taskLocationRaw.latitude(),
                longitude: taskLocationRaw.longitude()
            };
        } else {
            console.error(`Task ${task.id} location data:`, taskLocationRaw);
            throw new Error(`Invalid location data for task ${task.id || 'unknown'}: ${JSON.stringify(taskLocationRaw)}`);
        }
        
        // Validate extracted coordinates
        if (typeof taskLocation.latitude !== 'number' || typeof taskLocation.longitude !== 'number' || 
            isNaN(taskLocation.latitude) || isNaN(taskLocation.longitude)) {
            console.error(`Task ${task.id} extracted invalid coordinates:`, taskLocation);
            throw new Error(`Invalid coordinates for task ${task.id || 'unknown'}: lat=${taskLocation.latitude}, lng=${taskLocation.longitude}`);
        }

        // Use index + 1000 as numeric ID (to avoid conflicts with vehicle IDs)
        const numericId = index + 1000;
        taskIdMap.set(numericId, task.id);

        // Handle time windows - convert to timestamp if needed
        let startTime, endTime;
        const now = Math.floor(Date.now() / 1000);
        const todayStart = Math.floor(new Date().setHours(8, 0, 0, 0) / 1000); // 8 AM today
        const todayEnd = Math.floor(new Date().setHours(18, 0, 0, 0) / 1000); // 6 PM today
        
        if (task.timeWindowStart && task.timeWindowStart.seconds) {
            // Already a Firebase Timestamp - but validate it's reasonable
            startTime = task.timeWindowStart.seconds;
            endTime = task.timeWindowEnd.seconds;
            
            // If the timestamps are unreasonable (too far in future/past), use current day
            if (startTime > now + (365 * 24 * 60 * 60) || startTime < now - (365 * 24 * 60 * 60)) {
                console.warn(`Task ${task.id}: Invalid timestamp detected, using safe working hours`);
                startTime = Math.max(now, todayStart);
                endTime = Math.max(startTime + 3600, todayEnd); // Ensure end > start
            }
        } else if (task.timeWindowStart) {
            // Convert ISO string or Date to timestamp
            const startDate = new Date(task.timeWindowStart);
            const endDate = new Date(task.timeWindowEnd);
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                startTime = Math.floor(startDate.getTime() / 1000);
                endTime = Math.floor(endDate.getTime() / 1000);
                
                // Validate reasonable dates
                if (startTime > now + (365 * 24 * 60 * 60) || startTime < now - (365 * 24 * 60 * 60)) {
                    console.warn(`Task ${task.id}: Invalid dates, using safe working hours`);
                    startTime = Math.max(now, todayStart);
                    endTime = Math.max(startTime + 3600, todayEnd); // Ensure end > start
                }
            } else {
                console.warn(`Task ${task.id}: Invalid date format, using safe working hours`);
                startTime = Math.max(now, todayStart);
                endTime = Math.max(startTime + 3600, todayEnd); // Ensure end > start
            }
        } else {
            // Default time window - use safe working hours
            startTime = Math.max(now, todayStart);
            endTime = Math.max(startTime + 3600, todayEnd); // Ensure end > start
        }
        
        // Ensure end time is after start time and reasonable
        if (endTime <= startTime) {
            console.warn(`⚠️ Task ${task.id}: End time (${endTime}) <= start time (${startTime}), fixing...`);
            endTime = startTime + (4 * 60 * 60); // Add 4 hours if end time is invalid
        }
        
        // Additional safety check - ensure minimum reasonable window
        const minWindow = 1800; // 30 minutes minimum
        if (endTime - startTime < minWindow) {
            console.warn(`⚠️ Task ${task.id}: Time window too narrow, extending...`);
            endTime = startTime + minWindow;
        }

        console.log(`Task ${task.id} mapped to job ${numericId}:`);
        console.log(`  📍 Location: [${taskLocation.longitude}, ${taskLocation.latitude}]`);
        console.log(`  ⏰ Time window: [${startTime}, ${endTime}] (${new Date(startTime * 1000).toLocaleString()} - ${new Date(endTime * 1000).toLocaleString()})`);
        console.log(`  📦 Volume: ${task.demandVolume || 1}`);

        return {
            id: numericId,
            location: [taskLocation.longitude, taskLocation.latitude],
            service: 300, // Service time in seconds (e.g., 5 minutes)
            amount: [task.demandVolume || 1],
            time_windows: [[startTime, endTime]],
            // Preserve customer information for route display
            customerId: task.customerId,
            customerName: task.customerName || task.customerId,
            originalAddress: task.originalAddress || task.deliveryAddress
        };
    });

    const vroomVehicles = vehicles.map((vehicle, index) => {
        // Use current GPS location if available, otherwise start location
        const locationRaw = vehicle.currentLocation || vehicle.startLocation;
        
        if (!locationRaw) {
            throw new Error(`No location data for vehicle ${vehicle.id}`);
        }
        
        // Extract coordinates from Firestore GeoPoint or regular object
        let location;
        if (locationRaw.latitude !== undefined && locationRaw.longitude !== undefined) {
            // Standard lat/lng object
            location = {
                latitude: locationRaw.latitude,
                longitude: locationRaw.longitude
            };
        } else if (locationRaw._lat !== undefined && locationRaw._long !== undefined) {
            // Firestore GeoPoint object
            location = {
                latitude: locationRaw._lat,
                longitude: locationRaw._long
            };
        } else if (typeof locationRaw.latitude === 'function' && typeof locationRaw.longitude === 'function') {
            // Firestore GeoPoint with methods
            location = {
                latitude: locationRaw.latitude(),
                longitude: locationRaw.longitude()
            };
        } else {
            throw new Error(`Invalid location data for vehicle ${vehicle.id}: ${JSON.stringify(locationRaw)}`);
        }
        
        // Validate extracted coordinates
        if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number' || 
            isNaN(location.latitude) || isNaN(location.longitude)) {
            throw new Error(`Invalid coordinates for vehicle ${vehicle.id}: lat=${location.latitude}, lng=${location.longitude}`);
        }

        // Default shift times if not provided
        const now = Math.floor(Date.now() / 1000);
        const shiftStart = Math.floor(new Date().setHours(8, 0, 0, 0) / 1000); // 8 AM today
        const shiftEnd = Math.floor(new Date().setHours(18, 0, 0, 0) / 1000); // 6 PM today

        // Use index + 1 as numeric ID (VROOM expects positive integers)
        const numericId = index + 1;
        vehicleIdMap.set(numericId, vehicle.id);

        // Handle vehicle time windows
        let vehicleStartTime, vehicleEndTime;
        
        if (vehicle.shiftStart?.seconds && vehicle.shiftEnd?.seconds) {
            vehicleStartTime = vehicle.shiftStart.seconds;
            vehicleEndTime = vehicle.shiftEnd.seconds;
            
            // Validate reasonable shift times
            if (vehicleStartTime > now + (365 * 24 * 60 * 60) || vehicleStartTime < now - (365 * 24 * 60 * 60)) {
                console.warn(`Vehicle ${vehicle.id}: Invalid shift times, using today's working hours`);
                vehicleStartTime = Math.max(now, shiftStart);
                vehicleEndTime = shiftEnd;
            }
            
            // CRITICAL FIX: Ensure end time is after start time for vehicles
            if (vehicleEndTime <= vehicleStartTime) {
                console.warn(`⚠️ Vehicle ${vehicle.id}: End time (${vehicleEndTime}) <= start time (${vehicleStartTime}), fixing...`);
                vehicleEndTime = vehicleStartTime + (8 * 60 * 60); // Add 8-hour shift
            }
        } else {
            // Use current working hours
            vehicleStartTime = Math.max(now, shiftStart);
            vehicleEndTime = shiftEnd;
            
            // Ensure end time is after start time
            if (vehicleEndTime <= vehicleStartTime) {
                vehicleEndTime = vehicleStartTime + (8 * 60 * 60); // Add 8-hour shift
            }
        }

        console.log(`Vehicle ${vehicle.id} mapped to vehicle ${numericId} with shift [${vehicleStartTime}, ${vehicleEndTime}]`);

        return {
            id: numericId,
            start: [location.longitude, location.latitude], // Use current GPS position
            capacity: [vehicle.maxCapacity],
            time_window: [vehicleStartTime, vehicleEndTime]
        };
    });

    return {
        jobs,
        vehicles: vroomVehicles,
        options: { 
            g: true, // Request geometry for drawing routes on map
            c: true, // Request detailed cost information 
            t: true  // Request detailed timing information
        },
        // Add routing profile for proper travel time calculation
        profile: "car",  // Use car profile for VROOM API (different from regular ORS routing)
        idMaps: { taskIdMap, vehicleIdMap } // Return the ID maps for later use
    };
};/**
 * Orchestrates the route optimization process by calling the ORS Vroom API.
 * @param {import('../data/models.js').Task[]} tasks - An array of task objects.
 * @param {import('../data/models.js').Vehicle[]} vehicles - An array of available vehicle objects.
 * @returns {Promise<Object>} A promise that resolves with the optimized route plan from the API.
 */
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate realistic travel time between two coordinates using Gemini AI
 * @param {number} fromLat - Starting latitude
 * @param {number} fromLng - Starting longitude  
 * @param {number} toLat - Destination latitude
 * @param {number} toLng - Destination longitude
 * @returns {Promise<number>} Travel time in seconds
 */
async function getGeminiTravelTime(fromLat, fromLng, toLat, toLng) {
    try {
        const distance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
        
        // For very short distances, use minimum time
        if (distance < 0.5) {
            return Math.max(300, distance * 600); // Minimum 5 minutes, or 10 minutes per km for short trips
        }

        const prompt = `Calculate realistic travel time by car in India between these coordinates:
FROM: ${fromLat}, ${fromLng}
TO: ${toLat}, ${toLng}
Distance: ${distance.toFixed(2)} km

Consider:
- Indian road conditions and traffic patterns
- Urban vs highway speeds (Mumbai/Pune region)
- Typical congestion during business hours
- Road quality and infrastructure
- Buffer time for navigation and stops

Provide ONLY a number representing travel time in minutes. No explanation, just the number.

Examples:
- 2 km in dense city: 15
- 50 km highway: 75  
- 125 km intercity: 180`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const timeText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const timeMinutes = parseInt(timeText);

        if (timeMinutes && timeMinutes > 0) {
            console.log(`🤖 Gemini travel time: ${distance.toFixed(1)}km → ${timeMinutes} minutes`);
            return timeMinutes * 60; // Convert to seconds
        } else {
            throw new Error('Invalid Gemini response');
        }

    } catch (error) {
        console.warn(`⚠️ Gemini travel time failed, using fallback:`, error.message);
        
        // Intelligent fallback based on Indian road conditions
        const distance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
        let timeMinutes;
        
        if (distance <= 2) {
            timeMinutes = distance * 8; // 8 minutes per km in dense city traffic
        } else if (distance <= 10) {
            timeMinutes = distance * 4; // 4 minutes per km for mixed city/suburban
        } else if (distance <= 50) {
            timeMinutes = distance * 2; // 2 minutes per km for highway/expressway  
        } else {
            timeMinutes = distance * 1.5; // 1.5 minutes per km for long highway trips
        }
        
        return Math.max(300, timeMinutes * 60); // Minimum 5 minutes, return in seconds
    }
}

/**
 * Create optimized routes using Gemini AI for realistic travel time calculations
 * @param {Array} jobs - VROOM jobs array
 * @param {Array} vehicles - VROOM vehicles array
 * @returns {Object} Optimized route result with realistic travel times
 */
async function createGeminiOptimizedRoutes(jobs, vehicles) {
    console.log(`🤖 Gemini optimization: ${jobs.length} jobs, ${vehicles.length} vehicles`);
    
    const routes = [];
    
    for (let vehicleIndex = 0; vehicleIndex < vehicles.length; vehicleIndex++) {
        const vehicle = vehicles[vehicleIndex];
        const route = {
            vehicle: vehicle.id,
            cost: 0,
            distance: 0,
            duration: 0,
            steps: [],
            geometry: ""
        };

        // Start from vehicle location
        let currentLat = vehicle.start[1];
        let currentLng = vehicle.start[0];
        let currentTime = vehicle.time_window[0];
        
        // Simple nearest-neighbor assignment with Gemini travel times
        const remainingJobs = [...jobs];
        
        while (remainingJobs.length > 0) {
            let nearestJob = null;
            let nearestDistance = Infinity;
            let nearestTravelTime = 0;
            
            // Find nearest unassigned job
            for (const job of remainingJobs) {
                const jobLat = job.location[1];
                const jobLng = job.location[0];
                const distance = calculateHaversineDistance(currentLat, currentLng, jobLat, jobLng);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestJob = job;
                }
            }
            
            if (nearestJob) {
                // Get realistic travel time from Gemini
                const jobLat = nearestJob.location[1];
                const jobLng = nearestJob.location[0];
                
                try {
                    nearestTravelTime = await getGeminiTravelTime(currentLat, currentLng, jobLat, jobLng);
                } catch (error) {
                    console.warn(`⚠️ Gemini time failed, using fallback for job ${nearestJob.id}`);
                    nearestTravelTime = nearestDistance * 120; // 2 min/km fallback
                }
                
                // Add step to route
                route.steps.push({
                    type: 'job',
                    location: nearestJob.location,
                    id: nearestJob.id,
                    arrival: currentTime + nearestTravelTime,
                    duration: nearestJob.service || 300,
                    distance: Math.round(nearestDistance * 1000),
                    // Preserve customer information
                    customerId: nearestJob.customerId,
                    customerName: nearestJob.customerName,
                    description: nearestJob.customerName || nearestJob.customerId,
                    originalAddress: nearestJob.originalAddress
                });
                
                // Update route metrics
                route.distance += Math.round(nearestDistance * 1000);
                route.duration += nearestTravelTime + (nearestJob.service || 300);
                route.cost += Math.round(nearestDistance * 8.5); // ₹8.5 per km
                
                // Move to job location and update time
                currentLat = jobLat;
                currentLng = jobLng;
                currentTime += nearestTravelTime + (nearestJob.service || 300);
                
                // Remove job from remaining list
                remainingJobs.splice(remainingJobs.indexOf(nearestJob), 1);
                
                console.log(`  📍 Job ${nearestJob.id}: ${nearestDistance.toFixed(1)}km → ${Math.round(nearestTravelTime/60)}min travel`);
            }
        }
        
        routes.push(route);
        console.log(`✅ Vehicle ${vehicle.id}: ${route.steps.length} jobs, ${Math.round(route.distance/1000)}km, ${Math.round(route.duration/60)}min total`);
    }
    
    return {
        code: 0,
        routes: routes,
        summary: {
            cost: routes.reduce((sum, r) => sum + r.cost, 0),
            routes: routes.length,
            unassigned: []
        }
    };
}

/**
 * Estimates route distance using Haversine formula when API doesn't provide it
 */
const estimateRouteDistance = (steps) => {
    if (!steps || steps.length < 2) return 1000; // Default 1km
    
    let totalDistance = 0;
    
    for (let i = 0; i < steps.length - 1; i++) {
        const current = steps[i];
        const next = steps[i + 1];
        
        if (current.location && next.location) {
            const [lon1, lat1] = current.location;
            const [lon2, lat2] = next.location;
            
            // Haversine formula for distance calculation
            const R = 6371000; // Earth's radius in meters
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;
            
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                     Math.cos(φ1) * Math.cos(φ2) *
                     Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            totalDistance += R * c;
        }
    }
    
    // Add 20% for road routing vs straight line distance
    return Math.round(totalDistance * 1.2);
};

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
    
    // 1. Create the API payload using current GPS locations
    const payloadData = createVroomPayload(tasks, vehiclesWithCurrentLocation);
    const { idMaps, ...payload } = payloadData;
    const { taskIdMap, vehicleIdMap } = idMaps;
    // Validate the payload for common issues
    console.log("🔍 Validating optimization payload...");
    
    // Check for duplicate locations
    const locations = payload.jobs.map(job => `${job.location[0]},${job.location[1]}`);
    const uniqueLocations = new Set(locations);
    if (locations.length !== uniqueLocations.size) {
        console.warn("⚠️ Warning: Multiple tasks have identical locations. This may affect optimization:");
        const locationCounts = {};
        locations.forEach(loc => {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });
        Object.entries(locationCounts).forEach(([loc, count]) => {
            if (count > 1) {
                console.warn(`  📍 Location [${loc}] has ${count} tasks`);
            }
        });
    }
    
    // Validate and fix time windows BEFORE sending to API
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Fix job time windows
    payload.jobs.forEach((job, index) => {
        let [start, end] = job.time_windows[0];
        let fixed = false;
        
        // Fix critical error: end <= start
        if (end <= start) {
            console.warn(`⚠️ Job ${job.id}: Invalid time window [${start}, ${end}], fixing...`);
            end = start + 3600; // Add 1 hour minimum
            fixed = true;
        }
        
        // Fix if starts too far in the past
        if (start < currentTime - 3600) {
            start = currentTime;
            end = Math.max(end, currentTime + 3600);
            fixed = true;
        }
        
        // Ensure minimum 30-minute window
        if (end - start < 1800) {
            end = start + 1800;
            fixed = true;
        }
        
        if (fixed) {
            job.time_windows[0] = [start, end];
            console.log(`✅ Job ${job.id}: Fixed time window to [${start}, ${end}]`);
        }
    });
    
    // Fix vehicle time windows
    payload.vehicles.forEach((vehicle, index) => {
        let [start, end] = vehicle.time_window;
        let fixed = false;
        
        // Fix critical error: end <= start
        if (end <= start) {
            console.warn(`⚠️ Vehicle ${vehicle.id}: Invalid time window [${start}, ${end}], fixing...`);
            end = start + (8 * 60 * 60); // Add 8-hour shift
            fixed = true;
        }
        
        // Ensure minimum 4-hour shift
        if (end - start < (4 * 60 * 60)) {
            end = start + (8 * 60 * 60); // Standard 8-hour shift
            fixed = true;
        }
        
        if (fixed) {
            vehicle.time_window = [start, end];
            console.log(`✅ Vehicle ${vehicle.id}: Fixed time window to [${start}, ${end}]`);
        }
    });

    // Final validation - ensure no invalid time windows remain
    const invalidJobs = payload.jobs.filter(job => {
        const [start, end] = job.time_windows[0];
        return end <= start;
    });
    
    const invalidVehicles = payload.vehicles.filter(vehicle => {
        const [start, end] = vehicle.time_window;
        return end <= start;
    });
    
    if (invalidJobs.length > 0 || invalidVehicles.length > 0) {
        console.error("❌ CRITICAL: Invalid time windows still found after validation:");
        invalidJobs.forEach(job => {
            const [start, end] = job.time_windows[0];
            console.error(`  💥 Job ${job.id}: [${start}, ${end}]`);
        });
        invalidVehicles.forEach(vehicle => {
            const [start, end] = vehicle.time_window;
            console.error(`  💥 Vehicle ${vehicle.id}: [${start}, ${end}]`);
        });
        throw new Error("Invalid time windows detected - cannot proceed with optimization");
    }
    
    console.log("✅ All time windows validated successfully");

    // 3. Use Gemini AI for intelligent route optimization with realistic travel times
    console.log("🤖 Using Gemini AI for intelligent route optimization...");
    
    try {
        // Create optimized routes using Gemini-powered travel time calculations
        const result = await createGeminiOptimizedRoutes(payload.jobs, payload.vehicles);
        console.log("🚗 Gemini-optimized routes generated:", result);
        console.log("Gemini routes:", result.routes);
        
        // Process and validate Gemini-generated routes
        if (result.routes && Array.isArray(result.routes)) {
            result.routes.forEach((route, index) => {
                console.log(`Route ${index + 1} for vehicle ${route.vehicle}:`);
                console.log(`  - Distance: ${route.distance}m (${(route.distance/1000).toFixed(2)}km)`);
                console.log(`  - Duration: ${route.duration}s (${Math.round(route.duration/60)}min)`);
                console.log(`  - Cost: ${route.cost || 'N/A'}`);
                console.log(`  - Steps: ${route.steps.length}`);
                console.log(`  - Jobs in route: ${route.steps.filter(s => s.type === 'job').length}`);
                
                // Fix distance issues - ensure we have meaningful values
                if (!route.distance || route.distance === 0 || isNaN(route.distance)) {
                    console.warn(`Route ${index + 1}: Invalid distance (${route.distance}), calculating estimate...`);
                    const estimatedDistance = estimateRouteDistance(route.steps);
                    route.distance = Math.max(estimatedDistance, 1000); // Minimum 1km
                    console.log(`  ✅ Updated distance to: ${route.distance}m (${(route.distance/1000).toFixed(2)}km)`);
                }
                
                // Only recalculate duration if ORS completely failed to provide it
                if (!route.duration || route.duration === 0 || isNaN(route.duration)) {
                    console.warn(`Route ${index + 1}: ORS didn't return duration, using fallback calculation...`);
                    
                    const jobCount = route.steps.filter(s => s.type === 'job').length;
                    
                    // Simple fallback - let ORS handle the real routing
                    const estimatedDuration = (route.distance / 1000) * 180 + (jobCount * 600); // 3min/km + 10min/stop
                    route.duration = Math.max(estimatedDuration, 900); // Minimum 15 minutes
                    
                    console.log(`  ⚠️ Fallback duration: ${route.duration}s (${Math.round(route.duration/60)} min)`);
                } else {
                    console.log(`  ✅ Using ORS calculated duration: ${route.duration}s (${Math.round(route.duration/60)} min)`);
                }
                
                // Ensure cost is calculated if missing
                if (!route.cost || route.cost === 0) {
                    // Simple cost model: distance cost + time cost
                    route.cost = Math.round((route.distance / 1000) * 8.5 + (route.duration / 3600) * 25);
                }
            });
        }
        
        // Analyze time window conflicts before processing unassigned tasks
        const hasTimeWindowConflicts = result.unassigned && result.unassigned.length > 0 && 
            vehicles.some(vehicle => {
                const vStart = vehicle.shiftStart?.seconds || vehicle.shiftStart || 0;
                const vEnd = vehicle.shiftEnd?.seconds || vehicle.shiftEnd || 0;
                return tasks.some(task => {
                    const tStart = task.timeWindowStart?.seconds || task.timeWindowStart || 0;
                    const tEnd = task.timeWindowEnd?.seconds || task.timeWindowEnd || 0;
                    // Check if there's no overlap between vehicle shift and task time window
                    return (tStart >= vEnd || tEnd <= vStart);
                });
            });

        if (hasTimeWindowConflicts) {
            console.warn("⏰ TIME WINDOW CONFLICT DETECTED:");
            console.warn("Tasks require delivery outside of vehicle operating hours.");
            console.warn("Vehicle schedules:", vehicles.map(v => ({
                id: v.id,
                shift: `${new Date((v.shiftStart?.seconds || v.shiftStart) * 1000).toLocaleString()} - ${new Date((v.shiftEnd?.seconds || v.shiftEnd) * 1000).toLocaleString()}`
            })));
            console.warn("Task time windows:", tasks.map(t => ({
                id: t.id,
                window: `${new Date((t.timeWindowStart?.seconds || t.timeWindowStart) * 1000).toLocaleString()} - ${new Date((t.timeWindowEnd?.seconds || t.timeWindowEnd) * 1000).toLocaleString()}`
            })));
        }

        // Debug unassigned tasks with detailed analysis
        if (result.unassigned && result.unassigned.length > 0) {
            console.warn("⚠️ Unassigned tasks found:", result.unassigned);
            result.unassigned.forEach(unassigned => {
                // Convert back to original task ID for better debugging
                const originalTaskId = taskIdMap.get(unassigned.id) || unassigned.id;
                const originalTask = tasks.find(t => t.id === originalTaskId);
                
                // Provide detailed reason analysis
                let reason = unassigned.description || unassigned.reason || 'No specific reason provided';
                
                // Common reasons and their explanations
                if (reason.includes('time_window') || reason.includes('time')) {
                    reason = 'Time window constraint violation - task deadline cannot be met by any vehicle';
                } else if (reason.includes('capacity') || reason.includes('amount')) {
                    reason = 'Capacity constraint violation - task volume exceeds vehicle capacity';
                } else if (reason.includes('location') || reason.includes('distance')) {
                    reason = 'Location constraint - task location is too far or unreachable';
                } else if (reason === 'Unknown' || !reason) {
                    reason = 'Optimization constraint - task cannot be feasibly assigned to any vehicle';
                }
                
                console.warn(`❌ Task ${originalTaskId} (job ${unassigned.id}) unassigned.`);
                console.warn(`  📋 Reason: ${reason}`);
                
                if (originalTask) {
                    // Find the corresponding job in the payload for better debugging
                    const job = payload.jobs?.find(j => j.id === unassigned.id);
                    console.warn(`  📊 Task details:`, {
                        customer: originalTask.customerName || originalTask.customerId,
                        volume: originalTask.demandVolume,
                        location: originalTask.location || originalTask.deliveryLocation || originalTask.coordinates,
                        coordinates: job ? `[${job.location[0]}, ${job.location[1]}]` : 'Unknown',
                        timeWindow: job ? 
                            `${new Date(job.time_windows[0][0] * 1000).toLocaleString()} - ${new Date(job.time_windows[0][1] * 1000).toLocaleString()}` : 
                            'No time window'
                    });
                    
                    if (job) {
                        console.warn(`  ⏰ Time window (seconds): [${job.time_windows[0][0]}, ${job.time_windows[0][1]}]`);
                        console.warn(`  📦 Demand: ${job.amount[0]} units`);
                    }
                }
                
                console.warn(`  🚛 Available vehicles: ${vehicles.length}`);
                console.warn(`  📈 Total fleet capacity: ${vehicles.reduce((sum, v) => sum + v.maxCapacity, 0)} units`);
                
                // Additional analysis
                if (vehicles.length > 0 && payload.vehicles && payload.vehicles.length > 0) {
                    const firstVehicle = payload.vehicles[0];
                    console.warn(`  🚚 Vehicle 1 details:`, {
                        id: firstVehicle.id,
                        capacity: firstVehicle.capacity[0],
                        location: firstVehicle.start,
                        timeWindow: `${new Date(firstVehicle.time_window[0] * 1000).toLocaleString()} - ${new Date(firstVehicle.time_window[1] * 1000).toLocaleString()}`
                    });
                }
            });
        } else {
            console.log("✅ All tasks successfully assigned to vehicles");
        }
        
        // If no routes were generated but we have tasks and vehicles, create deadline-aware distance-optimized manual assignment
        if ((!result.routes || result.routes.length === 0) && tasks.length > 0 && vehicles.length > 0) {
            console.warn("🔧 No routes generated by VRP solver. Creating deadline-aware distance-optimized manual assignment...");
            console.log("🐛 DEBUG: Using NEW distance-based algorithm (MinHeap removed from manual routes)");
            console.log("🐛 DEBUG: Input tasks:", tasks.map(t => ({ id: t.id, customerId: t.customerId, location: t.location })));
            
            const manualRoutes = [];
            const unassignedTasks = [...tasks];
            
            // Categorize tasks by urgency (deadline within 2 hours = urgent)
            const now = Math.floor(Date.now() / 1000);
            const urgentThreshold = now + (2 * 60 * 60); // 2 hours from now
            
            const categorizeTasks = () => {
                const urgent = [];
                const normal = [];
                unassignedTasks.forEach(task => {
                    const deadline = task.timeWindowEnd?.seconds || task.timeWindowEnd || (now + 8 * 60 * 60); // default 8 hours
                    if (deadline <= urgentThreshold) {
                        urgent.push(task);
                    } else {
                        normal.push(task);
                    }
                });
                console.log(`📊 Task categorization: ${urgent.length} urgent, ${normal.length} normal`);
                return { urgent, normal };
            };
            
            // For each vehicle, assign tasks using deadline-aware nearest-neighbor heuristic
            vehicles.forEach(vehicle => {
                const vehicleLocationRaw = vehicle.currentLocation || vehicle.startLocation;
                
                // Extract coordinates from Firestore GeoPoint or regular object
                let vehicleLocation;
                if (!vehicleLocationRaw) {
                    console.warn(`⚠️ Vehicle ${vehicle.id} has no location data, skipping`);
                    return;
                } else if (vehicleLocationRaw.latitude !== undefined && vehicleLocationRaw.longitude !== undefined) {
                    vehicleLocation = vehicleLocationRaw;
                } else if (vehicleLocationRaw._lat !== undefined && vehicleLocationRaw._long !== undefined) {
                    vehicleLocation = {
                        latitude: vehicleLocationRaw._lat,
                        longitude: vehicleLocationRaw._long
                    };
                } else {
                    console.warn(`⚠️ Vehicle ${vehicle.id} has invalid location format, skipping:`, vehicleLocationRaw);
                    return;
                }
                
                const route = {
                    vehicle: vehicle.id,
                    cost: 0,
                    duration: 0,
                    distance: 0,
                    steps: []
                };
                
                // Current position for nearest-neighbor search
                let currentLat = vehicleLocation.latitude;
                let currentLng = vehicleLocation.longitude;
                let currentCapacity = 0;
                
                // PHASE 1: Assign urgent tasks first (deadline-critical)
                const { urgent, normal } = categorizeTasks();
                let taskPool = urgent.length > 0 ? urgent : normal;
                let phase = urgent.length > 0 ? 'urgent' : 'normal';
                
                console.log(`🚛 Vehicle ${vehicle.id}: Starting with ${taskPool.length} ${phase} tasks`);
                
                // Assign tasks to this vehicle using nearest-neighbor until capacity reached
                while (unassignedTasks.length > 0 && currentCapacity < vehicle.maxCapacity) {
                    // Switch to normal tasks if urgent tasks are exhausted
                    if (taskPool.length === 0 && phase === 'urgent') {
                        const remaining = categorizeTasks();
                        taskPool = remaining.normal;
                        phase = 'normal';
                        if (taskPool.length > 0) {
                            console.log(`   ✅ All urgent tasks assigned. Moving to ${taskPool.length} normal tasks.`);
                        }
                    }
                    
                    if (taskPool.length === 0) break; // No more tasks
                    if (taskPool.length === 0) break; // No more tasks
                    
                    let nearestTaskIndex = -1;
                    let nearestDistance = Infinity;
                    let nearestGlobalIndex = -1;
                    
                    // Find nearest unassigned task from current pool that fits capacity
                    taskPool.forEach((task, poolIndex) => {
                        const taskLocation = task.location || task.deliveryLocation || task.coordinates;
                        if (!taskLocation) return;
                        
                        // Extract task coordinates from Firestore GeoPoint or regular object
                        let taskLat, taskLng;
                        if (taskLocation.latitude !== undefined && taskLocation.longitude !== undefined) {
                            taskLat = taskLocation.latitude;
                            taskLng = taskLocation.longitude;
                        } else if (taskLocation._lat !== undefined && taskLocation._long !== undefined) {
                            taskLat = taskLocation._lat;
                            taskLng = taskLocation._long;
                        } else if (taskLocation.lat !== undefined && taskLocation.lng !== undefined) {
                            taskLat = taskLocation.lat;
                            taskLng = taskLocation.lng;
                        } else {
                            return; // Skip tasks with invalid location data
                        }
                        
                        if (typeof taskLat !== 'number' || typeof taskLng !== 'number' || isNaN(taskLat) || isNaN(taskLng)) return;
                        
                        // Check if task fits in remaining capacity
                        if (currentCapacity + (task.demandVolume || 1) > vehicle.maxCapacity) return;
                        
                        // Calculate distance using Haversine formula
                        const R = 6371; // Earth radius in km
                        const dLat = (taskLat - currentLat) * Math.PI / 180;
                        const dLng = (taskLng - currentLng) * Math.PI / 180;
                        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                Math.cos(currentLat * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
                                Math.sin(dLng/2) * Math.sin(dLng/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        const distance = R * c;
                        
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestTaskIndex = poolIndex;
                            // Find this task's index in the global unassignedTasks array
                            nearestGlobalIndex = unassignedTasks.findIndex(t => t.id === task.id);
                        }
                    });
                    
                    // If no task found (capacity constraint), break
                    if (nearestTaskIndex === -1 || nearestGlobalIndex === -1) break;
                    
                    // Assign the nearest task
                    const task = taskPool[nearestTaskIndex];
                    taskPool.splice(nearestTaskIndex, 1); // Remove from pool
                    unassignedTasks.splice(nearestGlobalIndex, 1); // Remove from global list
                    
                    const taskLocation = task.location || task.deliveryLocation || task.coordinates;
                    currentCapacity += (task.demandVolume || 1);
                    
                    // Normalize location to array format [lon, lat] to match ORS schema
                    let normalizedLocation = null;
                    if (Array.isArray(taskLocation) && taskLocation.length === 2) {
                        normalizedLocation = [parseFloat(taskLocation[0]), parseFloat(taskLocation[1])];
                    } else if (taskLocation && typeof taskLocation === 'object') {
                        // Support GeoPoint-like or {lat,lng} / {latitude,longitude}
                        const lat = typeof taskLocation.latitude === 'function' ? taskLocation.latitude() : (taskLocation.latitude ?? taskLocation.lat);
                        const lng = typeof taskLocation.longitude === 'function' ? taskLocation.longitude() : (taskLocation.longitude ?? taskLocation.lng);
                        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                            normalizedLocation = [parseFloat(lng), parseFloat(lat)];
                            // Update current position for next nearest-neighbor search
                            currentLat = lat;
                            currentLng = lng;
                        }
                    }

                    // Add distance to route metrics
                    route.distance += Math.round(nearestDistance * 1000); // Convert km to meters
                    
                    // Simple service time addition (let ORS handle travel time calculation)
                    route.duration += 600; // 10 minutes service time per stop (ORS will add travel time)
                    
                    route.cost += Math.round(nearestDistance * 8.5); // Cost per km

                    // Log assignment with reasoning
                    const deadline = task.timeWindowEnd?.seconds || task.timeWindowEnd || now;
                    const isUrgent = deadline <= urgentThreshold;
                    const minutesToDeadline = Math.round((deadline - now) / 60);
                    console.log(`   📦 Assigned ${task.customerId}: ${nearestDistance.toFixed(2)}km away, ${isUrgent ? '🔴 URGENT' : '🟢 normal'} (${minutesToDeadline}min to deadline)`);

                    route.steps.push({
                        type: 'job',
                        id: task.id,
                        job: task.id,
                        arrival: Math.floor(Date.now() / 1000) + (route.steps.length * 600), // 10 min intervals
                        duration: 300,
                        location: normalizedLocation, // always [lon, lat]
                        load: [task.demandVolume || 1],
                        // Preserve customer information
                        customerId: task.customerId,
                        customerName: task.customerName || task.customerId,
                        description: task.customerName || task.customerId,
                        originalAddress: task.originalAddress || task.deliveryAddress
                    });
                }
                
                // Only add route if it has tasks
                if (route.steps.length > 0) {
                    manualRoutes.push(route);
                    const urgentCount = route.steps.filter((_, idx) => idx === 0 || urgent.some(u => u.id === route.steps[idx].id)).length;
                    console.log(`✅ Vehicle ${vehicle.id}: Assigned ${route.steps.length} tasks (${urgentCount} urgent) - ${route.distance}m, ${Math.round(route.duration/60)}min`);
                }
            });
            
            result.routes = manualRoutes;
            
            // Report any unassigned tasks
            if (unassignedTasks.length > 0) {
                console.warn(`⚠️ ${unassignedTasks.length} tasks could not be assigned due to capacity constraints:`);
                unassignedTasks.forEach(task => {
                    console.warn(`  - ${task.customerId}: ${task.demandVolume} units`);
                });
            }
            
            console.log(`✅ Created ${manualRoutes.length} deadline-aware distance-optimized routes for ${tasks.length - unassignedTasks.length} tasks`);
            console.log(`📊 Algorithm: Urgent tasks (deadline < 2hrs) assigned first, then normal tasks using nearest-neighbor heuristic`);
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

// Export for testing
export { createVroomPayload };


