// Test Firestore GeoPoint compatibility fixes
console.log("🧪 Testing Firestore GeoPoint Compatibility Fixes\n");

import('./src/services/optimizationService.js').then(async (module) => {
    const optimizationService = module;
    
    console.log("1️⃣ Testing with Firestore GeoPoint format (_lat, _long):");
    
    // Mock tasks with Firestore GeoPoint format
    const firestoreTasks = [{
        id: 'TASK-001',
        customerId: 'Customer A',
        location: {
            _lat: 19.2429,
            _long: 72.9825
        },
        demandVolume: 5,
        status: 'pending',
        timeWindowStart: { seconds: Math.floor(Date.now() / 1000) + 3600 },
        timeWindowEnd: { seconds: Math.floor(Date.now() / 1000) + 7200 }
    }];
    
    // Mock vehicles with Firestore GeoPoint format  
    const firestoreVehicles = [{
        id: 'VAN-001',
        maxCapacity: 10,
        startLocation: {
            _lat: 19.2400,
            _long: 72.9800
        },
        shiftStart: { seconds: Math.floor(new Date().setHours(8, 0, 0, 0) / 1000) },
        shiftEnd: { seconds: Math.floor(new Date().setHours(18, 0, 0, 0) / 1000) }
    }];
    
    try {
        // Test createVroomPayload with Firestore GeoPoint format
        const payload = optimizationService.createVroomPayload(firestoreTasks, firestoreVehicles);
        
        if (payload && payload.jobs && payload.vehicles) {
            console.log("✅ SUCCESS: createVroomPayload handled Firestore GeoPoint format!");
            console.log("Created payload:");
            console.log("- Jobs:", payload.jobs.length);
            console.log("- Vehicles:", payload.vehicles.length);
            console.log("- First job location:", payload.jobs[0].location);
            console.log("- First vehicle start:", payload.vehicles[0].start);
            
            // Verify coordinates are numbers
            const job = payload.jobs[0];
            const vehicle = payload.vehicles[0];
            console.log("- Job location validation:", typeof job.location[0] === 'number' && typeof job.location[1] === 'number' ? "✅ Valid" : "❌ Invalid");
            console.log("- Vehicle start validation:", typeof vehicle.start[0] === 'number' && typeof vehicle.start[1] === 'number' ? "✅ Valid" : "❌ Invalid");
        } else {
            console.log("❌ FAILED: createVroomPayload returned invalid structure");
            console.log("Received:", payload);
        }
        
    } catch (error) {
        console.log("❌ EXCEPTION: createVroomPayload threw an error");
        console.log("Error:", error.message);
        console.log("Stack:", error.stack);
    }
    
    console.log("\n2️⃣ Testing with mixed format (standard lat/lng):");
    
    // Mock tasks with standard lat/lng format
    const standardTasks = [{
        id: 'TASK-002',
        customerId: 'Customer B',
        location: {
            latitude: 19.2429,
            longitude: 72.9825
        },
        demandVolume: 3,
        status: 'pending',
        timeWindowStart: { seconds: Math.floor(Date.now() / 1000) + 3600 },
        timeWindowEnd: { seconds: Math.floor(Date.now() / 1000) + 7200 }
    }];
    
    const standardVehicles = [{
        id: 'VAN-002',
        maxCapacity: 8,
        startLocation: {
            latitude: 19.2400,
            longitude: 72.9800
        },
        shiftStart: { seconds: Math.floor(new Date().setHours(9, 0, 0, 0) / 1000) },
        shiftEnd: { seconds: Math.floor(new Date().setHours(17, 0, 0, 0) / 1000) }
    }];
    
    try {
        const payload = optimizationService.createVroomPayload(standardTasks, standardVehicles);
        
        if (payload && payload.jobs && payload.vehicles) {
            console.log("✅ SUCCESS: createVroomPayload handled standard lat/lng format!");
            console.log("Created payload:");
            console.log("- Jobs:", payload.jobs.length);
            console.log("- Vehicles:", payload.vehicles.length);
        } else {
            console.log("❌ FAILED: createVroomPayload returned invalid structure for standard format");
        }
        
    } catch (error) {
        console.log("❌ EXCEPTION: createVroomPayload threw an error with standard format");
        console.log("Error:", error.message);
    }
    
    console.log("\n3️⃣ Testing edge case - missing location data:");
    
    const badTasks = [{
        id: 'BAD-TASK',
        customerId: 'Customer C',
        location: {}, // Empty location object
        demandVolume: 2,
        status: 'pending',
        timeWindowStart: { seconds: Math.floor(Date.now() / 1000) + 3600 },
        timeWindowEnd: { seconds: Math.floor(Date.now() / 1000) + 7200 }
    }];
    
    try {
        const badResult = optimizationService.createVroomPayload(badTasks, firestoreVehicles);
        console.log("❌ UNEXPECTED: createVroomPayload should have failed with empty location");
        console.log("Received:", badResult);
        
    } catch (error) {
        console.log("✅ SUCCESS: createVroomPayload correctly rejected empty location data");
        console.log("Error message:", error.message);
    }
    
    console.log("\n📋 SUMMARY:");
    console.log("==========");
    console.log("The fixes should now handle:");
    console.log("✓ Firestore GeoPoint format (_lat, _long)");
    console.log("✓ Standard coordinate format (latitude, longitude)");
    console.log("✓ Proper error handling for missing location data");
    console.log("✓ Coordinate validation (type checking and NaN detection)");
    
}).catch(error => {
    console.error("Failed to import optimization service:", error.message);
});