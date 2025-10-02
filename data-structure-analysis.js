// Real Data Structure Analysis for Route Optimization
console.log("🔬 Real Data Structure Analysis for Route Optimization Issues\n");

// Test 1: Check GeoPoint data structure
console.log("1️⃣ Testing GeoPoint Data Structure:");

// Mock Firestore GeoPoint structure (as it comes from Firestore)
const mockFirestoreTask = {
    id: 'FIRESTORE-001',
    customerId: 'Customer A',
    location: {
        // Firestore GeoPoint structure
        _lat: 19.2429,
        _long: 72.9825,
        latitude: 19.2429,   // May or may not be present
        longitude: 72.9825   // May or may not be present
    },
    demandVolume: 5,
    status: 'pending',
    timeWindowStart: {
        seconds: Math.floor(Date.now() / 1000) + 3600,
        nanoseconds: 0
    },
    timeWindowEnd: {
        seconds: Math.floor(Date.now() / 1000) + 7200,
        nanoseconds: 0
    }
};

const mockFirestoreVehicle = {
    id: 'VAN-001',
    maxCapacity: 10,
    startLocation: {
        // Firestore GeoPoint structure
        _lat: 19.2400,
        _long: 72.9800,
        latitude: 19.2400,   // May or may not be present
        longitude: 72.9800   // May or may not be present
    },
    shiftStart: {
        seconds: Math.floor(new Date().setHours(8, 0, 0, 0) / 1000),
        nanoseconds: 0
    },
    shiftEnd: {
        seconds: Math.floor(new Date().setHours(18, 0, 0, 0) / 1000),
        nanoseconds: 0
    }
};

console.log("Mock Firestore Task Location:", mockFirestoreTask.location);
console.log("Mock Firestore Vehicle Location:", mockFirestoreVehicle.startLocation);
console.log();

// Test 2: Location Extraction Logic
console.log("2️⃣ Testing Location Extraction Logic:");

function extractLocation(locationObj, sourceName) {
    console.log(`\nTesting ${sourceName} location:`, locationObj);
    
    let lat, lng;
    
    // Try different approaches to extract coordinates
    if (locationObj?.latitude !== undefined && locationObj?.longitude !== undefined) {
        lat = locationObj.latitude;
        lng = locationObj.longitude;
        console.log(`✅ Extracted via latitude/longitude: [${lat}, ${lng}]`);
    } else if (locationObj?._lat !== undefined && locationObj?._long !== undefined) {
        lat = locationObj._lat;
        lng = locationObj._long;
        console.log(`✅ Extracted via _lat/_long: [${lat}, ${lng}]`);
    } else if (typeof locationObj?.latitude === 'function' && typeof locationObj?.longitude === 'function') {
        lat = locationObj.latitude();
        lng = locationObj.longitude();
        console.log(`✅ Extracted via function calls: [${lat}, ${lng}]`);
    } else {
        console.error(`❌ Could not extract coordinates from:`, locationObj);
        return null;
    }
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.error(`❌ Invalid coordinates: lat=${lat}, lng=${lng}`);
        return null;
    }
    
    return { latitude: lat, longitude: lng };
}

const taskLocation = extractLocation(mockFirestoreTask.location, "Task");
const vehicleLocation = extractLocation(mockFirestoreVehicle.startLocation, "Vehicle");

// Test 3: Time Window Edge Cases
console.log("\n3️⃣ Testing Time Window Edge Cases:");

function analyzeTimeWindow(timeStart, timeEnd, sourceName) {
    console.log(`\nAnalyzing ${sourceName} time window:`);
    console.log("Start object:", timeStart);
    console.log("End object:", timeEnd);
    
    let startSeconds, endSeconds;
    
    // Extract seconds from Firestore Timestamp
    if (timeStart?.seconds !== undefined) {
        startSeconds = timeStart.seconds;
    } else if (typeof timeStart === 'number') {
        startSeconds = timeStart;
    } else {
        console.error(`❌ Cannot extract start time from:`, timeStart);
        return null;
    }
    
    if (timeEnd?.seconds !== undefined) {
        endSeconds = timeEnd.seconds;
    } else if (typeof timeEnd === 'number') {
        endSeconds = timeEnd;
    } else {
        console.error(`❌ Cannot extract end time from:`, timeEnd);
        return null;
    }
    
    console.log(`Start seconds: ${startSeconds} (${new Date(startSeconds * 1000)})`);
    console.log(`End seconds: ${endSeconds} (${new Date(endSeconds * 1000)})`);
    console.log(`Duration: ${(endSeconds - startSeconds) / 60} minutes`);
    
    // Validate time window
    if (endSeconds <= startSeconds) {
        console.error(`❌ Invalid time window: end (${endSeconds}) <= start (${startSeconds})`);
        console.error(`This would cause: "Invalid time window: [${startSeconds}, ${endSeconds}]"`);
        return { startSeconds, endSeconds, valid: false };
    } else {
        console.log(`✅ Valid time window`);
        return { startSeconds, endSeconds, valid: true };
    }
}

const taskTimeWindow = analyzeTimeWindow(
    mockFirestoreTask.timeWindowStart, 
    mockFirestoreTask.timeWindowEnd, 
    "Task"
);

const vehicleTimeWindow = analyzeTimeWindow(
    mockFirestoreVehicle.shiftStart, 
    mockFirestoreVehicle.shiftEnd, 
    "Vehicle"
);

// Test 4: Common Error Scenarios
console.log("\n4️⃣ Testing Common Error Scenarios:");

// Scenario 1: Shift end time before current time
const currentTime = Math.floor(Date.now() / 1000);
const problemVehicle = {
    ...mockFirestoreVehicle,
    shiftEnd: { seconds: currentTime - 3600 } // 1 hour ago
};

console.log("\nScenario 1: Vehicle shift ended in the past");
analyzeTimeWindow(problemVehicle.shiftStart, problemVehicle.shiftEnd, "Problem Vehicle");

// Scenario 2: Task with past time window
const problemTask = {
    ...mockFirestoreTask,
    timeWindowStart: { seconds: currentTime - 7200 }, // 2 hours ago
    timeWindowEnd: { seconds: currentTime - 3600 }    // 1 hour ago
};

console.log("\nScenario 2: Task time window in the past");
analyzeTimeWindow(problemTask.timeWindowStart, problemTask.timeWindowEnd, "Problem Task");

// Scenario 3: Missing location properties
console.log("\nScenario 3: Missing location properties");
const badLocationTask = {
    ...mockFirestoreTask,
    location: {} // Empty location
};
extractLocation(badLocationTask.location, "Bad Location Task");

// Test 5: Actual Optimization Payload Creation
console.log("\n5️⃣ Testing Actual Payload Creation with Real Data:");

function createRealPayload(tasks, vehicles) {
    console.log("\nCreating payload with real Firestore data structure...");
    
    try {
        const jobs = tasks.map((task, index) => {
            console.log(`\nProcessing Task ${task.id}:`);
            
            // Extract location using the same logic as optimization service
            const taskLocation = task.location || task.deliveryLocation || task.coordinates;
            
            if (!taskLocation || typeof taskLocation.latitude === 'undefined' || typeof taskLocation.longitude === 'undefined') {
                // Try alternative extraction methods
                const extracted = extractLocation(taskLocation, `Task ${task.id}`);
                if (!extracted) {
                    throw new Error(`Invalid location data for task ${task.id}: ${JSON.stringify(taskLocation)}`);
                }
            }
            
            // Extract time windows
            let startTime = task.timeWindowStart?.seconds || task.timeWindowStart;
            let endTime = task.timeWindowEnd?.seconds || task.timeWindowEnd;
            
            // Apply fixes
            if (endTime <= startTime) {
                console.warn(`⚠️ Fixing time window for task ${task.id}`);
                endTime = startTime + 3600;
            }
            
            const job = {
                id: index + 1000,
                location: [taskLocation.longitude || taskLocation._long, taskLocation.latitude || taskLocation._lat],
                service: 300,
                amount: [task.demandVolume || 1],
                time_windows: [[startTime, endTime]]
            };
            
            console.log(`✅ Created job:`, job);
            return job;
        });
        
        const vroomVehicles = vehicles.map((vehicle, index) => {
            console.log(`\nProcessing Vehicle ${vehicle.id}:`);
            
            const location = vehicle.startLocation;
            const extracted = extractLocation(location, `Vehicle ${vehicle.id}`);
            if (!extracted) {
                throw new Error(`Invalid location data for vehicle ${vehicle.id}`);
            }
            
            let startTime = vehicle.shiftStart?.seconds || vehicle.shiftStart;
            let endTime = vehicle.shiftEnd?.seconds || vehicle.shiftEnd;
            
            if (endTime <= startTime) {
                console.warn(`⚠️ Fixing shift time for vehicle ${vehicle.id}`);
                endTime = startTime + (8 * 60 * 60);
            }
            
            const vroomVehicle = {
                id: index + 1,
                profile: 'driving-car',
                start: [extracted.longitude, extracted.latitude],
                capacity: [vehicle.maxCapacity || 10],
                time_window: [startTime, endTime]
            };
            
            console.log(`✅ Created vehicle:`, vroomVehicle);
            return vroomVehicle;
        });
        
        return { jobs, vehicles: vroomVehicles };
        
    } catch (error) {
        console.error(`❌ Error creating payload:`, error.message);
        return null;
    }
}

const testPayload = createRealPayload([mockFirestoreTask], [mockFirestoreVehicle]);

if (testPayload) {
    console.log("\n✅ Successfully created payload with real data structure");
    console.log("Jobs:", testPayload.jobs.length);
    console.log("Vehicles:", testPayload.vehicles.length);
} else {
    console.log("\n❌ Failed to create payload - this indicates the source of optimization errors");
}

console.log("\n📋 ANALYSIS SUMMARY:");
console.log("===================");
console.log("The most likely causes of route optimization errors:");
console.log("1. Firestore GeoPoint extraction - location.latitude vs location._lat");
console.log("2. Time window validation - end time before start time"); 
console.log("3. Timestamp extraction - timestamp.seconds vs direct number");
console.log("4. Missing or invalid location data from Firestore");
console.log("5. Vehicle shift times that have already passed");
console.log("\n🔧 Check the actual data from Firestore to see which issue is occurring!");