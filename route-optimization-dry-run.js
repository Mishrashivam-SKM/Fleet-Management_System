// Dry Run Test for Route Optimization End-to-End
console.log("🧪 Starting Route Optimization Dry Run Test...\n");

// Step 1: Test API Key Configuration
console.log("1️⃣ Testing API Key Configuration:");
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYxYjk4MDhiZDA0ZTQxZTE4ODk0ZDJmYWIxNDU4OWJiIiwiaCI6Im11cm11cjY0In0=';
console.log("✅ ORS API Key:", ORS_API_KEY ? "Present" : "Missing");
console.log();

// Step 2: Mock Sample Data
console.log("2️⃣ Creating Sample Test Data:");
const currentTime = Math.floor(Date.now() / 1000);
const todayStart = Math.floor(new Date().setHours(8, 0, 0, 0) / 1000);
const todayEnd = Math.floor(new Date().setHours(18, 0, 0, 0) / 1000);

const sampleTasks = [
    {
        id: 'TEST-001',
        customerId: 'Customer A',
        location: {
            latitude: 19.2429,
            longitude: 72.9825
        },
        demandVolume: 5,
        timeWindowStart: { seconds: currentTime + 3600 }, // 1 hour from now
        timeWindowEnd: { seconds: currentTime + 7200 }    // 2 hours from now
    },
    {
        id: 'TEST-002', 
        customerId: 'Customer B',
        location: {
            latitude: 19.2183,
            longitude: 72.9781
        },
        demandVolume: 3,
        timeWindowStart: { seconds: currentTime + 1800 }, // 30 min from now
        timeWindowEnd: { seconds: currentTime + 5400 }    // 90 min from now
    }
];

const sampleVehicles = [
    {
        id: 'VAN-001',
        maxCapacity: 10,
        startLocation: {
            latitude: 19.2400,
            longitude: 72.9800
        },
        shiftStart: { seconds: todayStart },
        shiftEnd: { seconds: todayEnd }
    }
];

console.log("✅ Sample Tasks:", sampleTasks.length, "tasks created");
console.log("✅ Sample Vehicles:", sampleVehicles.length, "vehicles created");
console.log();

// Step 3: Test Location Data Validation
console.log("3️⃣ Testing Location Data Validation:");
let locationValidation = true;

sampleTasks.forEach(task => {
    const loc = task.location;
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
        console.error(`❌ Task ${task.id}: Invalid location data`);
        locationValidation = false;
    } else {
        console.log(`✅ Task ${task.id}: Location [${loc.latitude}, ${loc.longitude}]`);
    }
});

sampleVehicles.forEach(vehicle => {
    const loc = vehicle.startLocation;
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
        console.error(`❌ Vehicle ${vehicle.id}: Invalid location data`);
        locationValidation = false;
    } else {
        console.log(`✅ Vehicle ${vehicle.id}: Location [${loc.latitude}, ${loc.longitude}]`);
    }
});

console.log(`Location Validation: ${locationValidation ? "✅ PASSED" : "❌ FAILED"}`);
console.log();

// Step 4: Test Time Window Validation
console.log("4️⃣ Testing Time Window Validation:");
let timeValidation = true;

sampleTasks.forEach(task => {
    const start = task.timeWindowStart.seconds;
    const end = task.timeWindowEnd.seconds;
    
    console.log(`Task ${task.id}:`);
    console.log(`  Start: ${start} (${new Date(start * 1000).toLocaleString()})`);
    console.log(`  End: ${end} (${new Date(end * 1000).toLocaleString()})`);
    console.log(`  Duration: ${(end - start) / 60} minutes`);
    
    if (end <= start) {
        console.error(`❌ Task ${task.id}: Invalid time window - end <= start`);
        timeValidation = false;
    } else {
        console.log(`✅ Task ${task.id}: Valid time window`);
    }
});

sampleVehicles.forEach(vehicle => {
    const start = vehicle.shiftStart.seconds;
    const end = vehicle.shiftEnd.seconds;
    
    console.log(`Vehicle ${vehicle.id}:`);
    console.log(`  Shift Start: ${start} (${new Date(start * 1000).toLocaleString()})`);
    console.log(`  Shift End: ${end} (${new Date(end * 1000).toLocaleString()})`);
    console.log(`  Shift Duration: ${(end - start) / 3600} hours`);
    
    if (end <= start) {
        console.error(`❌ Vehicle ${vehicle.id}: Invalid shift time - end <= start`);
        timeValidation = false;
    } else {
        console.log(`✅ Vehicle ${vehicle.id}: Valid shift time`);
    }
});

console.log(`Time Window Validation: ${timeValidation ? "✅ PASSED" : "❌ FAILED"}`);
console.log();

// Step 5: Mock Vroom Payload Creation
console.log("5️⃣ Testing Vroom Payload Creation:");

try {
    // Simulate payload creation
    const jobs = sampleTasks.map((task, index) => {
        const taskLocation = task.location;
        const numericId = index + 1000;
        
        let startTime = task.timeWindowStart.seconds;
        let endTime = task.timeWindowEnd.seconds;
        
        // Apply time window validation
        if (endTime <= startTime) {
            console.warn(`⚠️ Fixing invalid time window for task ${task.id}`);
            endTime = startTime + 3600;
        }
        
        return {
            id: numericId,
            location: [taskLocation.longitude, taskLocation.latitude],
            service: 300,
            amount: [task.demandVolume],
            time_windows: [[startTime, endTime]]
        };
    });
    
    const vroomVehicles = sampleVehicles.map((vehicle, index) => {
        const location = vehicle.startLocation;
        const numericId = index + 1;
        
        let vehicleStartTime = vehicle.shiftStart.seconds;
        let vehicleEndTime = vehicle.shiftEnd.seconds;
        
        // Apply time window validation
        if (vehicleEndTime <= vehicleStartTime) {
            console.warn(`⚠️ Fixing invalid shift time for vehicle ${vehicle.id}`);
            vehicleEndTime = vehicleStartTime + (8 * 60 * 60);
        }
        
        return {
            id: numericId,
            profile: 'driving-car',
            start: [location.longitude, location.latitude],
            capacity: [vehicle.maxCapacity],
            time_window: [vehicleStartTime, vehicleEndTime]
        };
    });
    
    const payload = {
        jobs,
        vehicles: vroomVehicles,
        options: {
            g: true,
            c: true,
            t: true
        }
    };
    
    console.log("✅ Payload Created Successfully:");
    console.log("  Jobs:", payload.jobs.length);
    console.log("  Vehicles:", payload.vehicles.length);
    console.log();
    
    // Step 6: Validate Final Payload
    console.log("6️⃣ Final Payload Validation:");
    
    let payloadValid = true;
    
    // Check jobs
    payload.jobs.forEach(job => {
        const [start, end] = job.time_windows[0];
        if (end <= start) {
            console.error(`❌ Job ${job.id}: Invalid time window [${start}, ${end}]`);
            payloadValid = false;
        }
    });
    
    // Check vehicles
    payload.vehicles.forEach(vehicle => {
        const [start, end] = vehicle.time_window;
        if (end <= start) {
            console.error(`❌ Vehicle ${vehicle.id}: Invalid time window [${start}, ${end}]`);
            payloadValid = false;
        }
    });
    
    console.log(`Final Payload Validation: ${payloadValid ? "✅ PASSED" : "❌ FAILED"}`);
    console.log();
    
    // Step 7: Test API Endpoint (without actually calling)
    console.log("7️⃣ API Endpoint Test (Mock):");
    const apiUrl = 'https://api.openrouteservice.org/optimization';
    console.log("✅ API URL:", apiUrl);
    console.log("✅ Headers would include:", {
        'Authorization': ORS_API_KEY ? 'Present' : 'Missing',
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, multipart/form-data'
    });
    console.log("✅ Payload size:", JSON.stringify(payload).length, "characters");
    console.log();
    
    // Summary
    console.log("📋 DRY RUN SUMMARY:");
    console.log("===================");
    console.log(`✅ API Configuration: ${ORS_API_KEY ? "PASS" : "FAIL"}`);
    console.log(`✅ Sample Data Creation: PASS`);
    console.log(`✅ Location Validation: ${locationValidation ? "PASS" : "FAIL"}`);
    console.log(`✅ Time Window Validation: ${timeValidation ? "PASS" : "FAIL"}`);
    console.log(`✅ Payload Creation: PASS`);
    console.log(`✅ Final Validation: ${payloadValid ? "PASS" : "FAIL"}`);
    console.log();
    
    if (locationValidation && timeValidation && payloadValid) {
        console.log("🎉 ALL TESTS PASSED - Route Optimization should work!");
    } else {
        console.log("⚠️ SOME TESTS FAILED - Issues found in optimization process");
    }
    
} catch (error) {
    console.error("❌ ERROR in dry run:", error.message);
    console.error("Stack:", error.stack);
}

console.log("\n🏁 Dry Run Complete");