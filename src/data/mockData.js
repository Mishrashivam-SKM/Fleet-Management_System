/**
 * @fileoverview Mock data for demonstrating reporting functionality
 * until Firestore data fetching is fully implemented.
 * NOTE: Firestore Timestamps are simulated here for calculations.
 */

// Helper to simulate Firestore Timestamp object
const createTimestamp = (dateString) => ({
    toDate: () => new Date(dateString),
    toMillis: () => new Date(dateString).getTime()
});

export const MOCK_TRIP_LOGS = [
    {
        tripId: 'TRIP001',
        vehicleId: 'VAN-01',
        driverId: 'DRV001',
        isOTD: true,
        cost: 1250.50, // e.g., in INR
        actualDistance: 150000, // meters
        actualDuration: 7200, // seconds
        actualDepartureTime: createTimestamp('2025-09-27T09:00:00Z'),
        actualArrivalTime: createTimestamp('2025-09-27T11:00:00Z'),
    },
    {
        tripId: 'TRIP002',
        vehicleId: 'VAN-02',
        driverId: 'DRV002',
        isOTD: true,
        cost: 980.00,
        actualDistance: 110000,
        actualDuration: 5400,
        actualDepartureTime: createTimestamp('2025-09-27T10:30:00Z'),
        actualArrivalTime: createTimestamp('2025-09-27T12:00:00Z'),
    },
    {
        tripId: 'TRIP003',
        vehicleId: 'VAN-01',
        driverId: 'DRV001',
        isOTD: false, // This one was late
        cost: 2100.75,
        actualDistance: 250000,
        actualDuration: 10800,
        actualDepartureTime: createTimestamp('2025-09-27T13:00:00Z'),
        actualArrivalTime: createTimestamp('2025-09-27T16:00:00Z'),
    },
     {
        tripId: 'TRIP004',
        vehicleId: 'TRUCK-01',
        driverId: 'DRV003',
        isOTD: true,
        cost: 3500.00,
        actualDistance: 400000,
        actualDuration: 14400,
        actualDepartureTime: createTimestamp('2025-09-28T08:00:00Z'),
        actualArrivalTime: createTimestamp('2025-09-28T12:00:00Z'),
    }
];
