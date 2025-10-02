// Debug Route Optimization Data
console.log("🔍 Debugging Route Optimization Data Flow");

// Test the actual API call with debugging
import('./src/services/optimizationService.js').then(async (module) => {
    const { optimizeRouteHandler } = module;
    
    // Mock real-world Firebase data structure
    const mockFirestoreTasks = [
        {
            id: 'task_001',
            customerId: 'CUST001',
            location: { _lat: 19.2429, _long: 72.9825 },  // Firestore GeoPoint format
            demandVolume: 5,
            status: 'pending',
            timeWindowStart: { seconds: Math.floor(Date.now() / 1000) + 3600 },
            timeWindowEnd: { seconds: Math.floor(Date.now() / 1000) + 7200 }
        },
        {
            id: 'task_002', 
            customerId: 'CUST002',
            deliveryLocation: { _lat: 19.2500, _long: 72.9900 },  // Alternative property name
            demandVolume: 3,
            status: 'pending',
            timeWindowStart: { seconds: Math.floor(Date.now() / 1000) + 1800 },
            timeWindowEnd: { seconds: Math.floor(Date.now() / 1000) + 5400 }
        }
    ];
    
    const mockFirestoreVehicles = [
        {
            id: 'vehicle_001',
            maxCapacity: 10,
            startLocation: { _lat: 19.2400, _long: 72.9800 },  // Firestore GeoPoint format
            shiftStart: { seconds: Math.floor(new Date().setHours(8, 0, 0, 0) / 1000) },
            shiftEnd: { seconds: Math.floor(new Date().setHours(18, 0, 0, 0) / 1000) }
        }
    ];
    
    console.log("📋 Input Data:");
    console.log("Tasks:", mockFirestoreTasks.length);
    mockFirestoreTasks.forEach(task => {
        console.log(`- Task ${task.id}: Location format`, task.location || task.deliveryLocation);
    });
    console.log("Vehicles:", mockFirestoreVehicles.length);
    mockFirestoreVehicles.forEach(vehicle => {
        console.log(`- Vehicle ${vehicle.id}: Location format`, vehicle.startLocation);
    });
    
    try {
        console.log("\n🚀 Testing Route Optimization...");
        const result = await optimizeRouteHandler(mockFirestoreTasks, mockFirestoreVehicles);
        
        if (result && result.routes) {
            console.log("✅ SUCCESS: Route optimization completed");
            console.log("Routes generated:", result.routes.length);
            console.log("Route details:", JSON.stringify(result, null, 2));
        } else {
            console.log("❌ FAILED: No routes generated");
            console.log("Result:", result);
        }
        
    } catch (error) {
        console.log("❌ ERROR: Route optimization failed");
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        
        // Check if it's the specific error we were getting
        if (error.message.includes('Invalid location data')) {
            console.log("\n🎯 LOCATION DATA ERROR DETECTED");
            console.log("This confirms the GeoPoint extraction issue");
        }
        
        if (error.message.includes('time window')) {
            console.log("\n⏰ TIME WINDOW ERROR DETECTED");
            console.log("This indicates time validation issues");
        }
        
        if (error.message.includes('API')) {
            console.log("\n🌐 API ERROR DETECTED");  
            console.log("This indicates external API issues");
        }
    }
    
}).catch(error => {
    console.error("Failed to import optimization service:", error.message);
});