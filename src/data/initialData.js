// Initial data setup for Firestore collections
export const initialVehicles = [
    {
        id: "VAN-01",
        driverName: "Priya Sharma",
        driverEmail: "priya@example.com",
        maxCapacity: 100,
        startLocation: { latitude: 19.2183, longitude: 72.9781 },
        liveLocation: { latitude: 19.2183, longitude: 72.9781 },
        liveStatus: "idle",
        shiftStart: new Date("2025-09-29T09:00:00").toISOString(),
        shiftEnd: new Date("2025-09-29T17:00:00").toISOString()
    }
];

export const initialTasks = [
    {
        id: "TASK-001",
        customerId: "Croma",
        demandVolume: 70,
        deliveryLocation: { latitude: 19.2582, longitude: 72.9735 },
        status: "pending",
        timeWindowStart: new Date("2025-09-29T09:00:00").toISOString(),
        timeWindowEnd: new Date("2025-09-29T12:00:00").toISOString()
    }
];
