/**
 * @fileoverview Implements the core business logic for calculating performance metrics.
 * These functions operate on data retrieved from Firestore.
 */

/**
 * Calculates the On-Time Delivery (OTD) rate.
 * OTD is the percentage of trips that were completed on time.
 * @param {import('../data/models.js').TripLog[]} tripLogs - An array of trip log objects.
 * @returns {number} The OTD rate as a percentage (e.g., 95.5). Returns 0 if no logs are provided.
 */
export const calculateOTDRate = (tripLogs) => {
    if (!tripLogs || tripLogs.length === 0) return 0;

    const onTimeTrips = tripLogs.filter(log => log.isOTD).length;
    return (onTimeTrips / tripLogs.length) * 100;
};

/**
 * Calculates the Cost Per Kilometer (CPK).
 * CPK measures the total average cost (fuel, maintenance, etc.) to travel one kilometer.
 * @param {import('../data/models.js').TripLog[]} tripLogs - An array of trip log objects.
 * @param {Object[]} [maintenanceLogs=[]] - An array of maintenance log objects, each with a 'cost' property.
 * @returns {number} The average cost per kilometer. Returns 0 if distance is zero.
 */
export const calculateCPK = (tripLogs, maintenanceLogs = []) => {
    if (!tripLogs || tripLogs.length === 0) return 0;

    const totalOperationalCost = tripLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalCost = totalOperationalCost + totalMaintenanceCost;

    const totalDistanceMeters = tripLogs.reduce((sum, log) => sum + (log.actualDistance || 0), 0);
    const totalDistanceKm = totalDistanceMeters / 1000;

    if (totalDistanceKm === 0) return 0;

    return totalCost / totalDistanceKm;
};

/**
 * Calculates the Vehicle Utilization Rate (VUR).
 * VUR measures how effectively the fleet's available time is being used for operations.
 * @param {import('../data/models.js').TripLog[]} tripLogs - An array of trip log objects.
 * @returns {number} The VUR as a percentage. Returns 0 if no logs are provided.
 */
export const calculateVURate = (tripLogs) => {
    if (!tripLogs || tripLogs.length === 0) return 0;

    // Total duration vehicles were actually on a trip
    const totalOperatingDurationSeconds = tripLogs.reduce((sum, log) => sum + (log.actualDuration || 0), 0);
    
    // Find the number of unique vehicles that were active during the period
    const uniqueVehicleIds = new Set(tripLogs.map(log => log.vehicleId));
    const vehicleCount = uniqueVehicleIds.size;
    if (vehicleCount === 0) return 0;

    // Assuming a standard 8-hour operational day for calculating available time.
    // In a real-world scenario, this would come from vehicle schedules.
    const workdaySeconds = 8 * 60 * 60;
    
    // Determine the number of unique days covered by the logs
    const uniqueDays = new Set(tripLogs.map(log => log.actualDepartureTime.toDate().toISOString().split('T')[0]));
    const daysOfOperation = uniqueDays.size;

    if (daysOfOperation === 0) return 0;

    // Total time the fleet was available for work
    const totalAvailableTimeSeconds = vehicleCount * daysOfOperation * workdaySeconds;
    
    if (totalAvailableTimeSeconds === 0) return 0;

    return (totalOperatingDurationSeconds / totalAvailableTimeSeconds) * 100;
};

