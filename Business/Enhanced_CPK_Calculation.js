/**
 * @fileoverview Enhanced Cost Per Kilometer (CPK) Calculation System
 * This module implements dynamic, real-world cost calculation for accurate business intelligence.
 */

/**
 * Enhanced CPK Calculation with Dynamic Cost Components
 * @param {Array} tripLogs - Array of completed trip log objects
 * @param {Array} vehicleProfiles - Array of vehicle-specific cost profiles  
 * @param {Object} operationalParams - Current operational cost parameters
 * @param {Array} maintenanceLogs - Array of maintenance cost records
 * @returns {Object} Detailed CPK analysis with breakdown
 */
export const calculateEnhancedCPK = (tripLogs, vehicleProfiles, operationalParams, maintenanceLogs = []) => {
    if (!tripLogs || tripLogs.length === 0) return { totalCPK: 0, breakdown: {} };

    // Create vehicle cost profile map for quick lookup
    const vehicleMap = new Map();
    vehicleProfiles.forEach(vehicle => {
        vehicleMap.set(vehicle.id, vehicle);
    });

    let totalCosts = {
        fuel: 0,
        driver: 0,
        depreciation: 0,
        maintenance: 0,
        insurance: 0,
        operational: 0
    };

    let totalDistance = 0;

    // Process each trip for dynamic cost calculation
    const tripCosts = tripLogs.map(trip => {
        const vehicle = vehicleMap.get(trip.vehicleId) || getDefaultVehicleProfile();
        const distanceKm = trip.actualDistance / 1000;
        const durationHours = trip.actualDuration / 3600;

        // Dynamic Fuel Cost Calculation
        const fuelCost = calculateFuelCost(distanceKm, vehicle, operationalParams);

        // Driver Cost (Based on actual working time)
        const driverCost = calculateDriverCost(durationHours, trip.driverId, operationalParams);

        // Vehicle Depreciation (Distance + Time based)
        const depreciationCost = calculateDepreciationCost(distanceKm, durationHours, vehicle);

        // Allocated Fixed Costs (Insurance, permits, etc.)
        const fixedCostAllocation = calculateFixedCostAllocation(durationHours, vehicle, operationalParams);

        // Trip-specific operational costs
        const operationalCost = calculateOperationalCost(trip, operationalParams);

        const tripTotalCost = fuelCost + driverCost + depreciationCost + fixedCostAllocation + operationalCost;

        // Accumulate totals
        totalCosts.fuel += fuelCost;
        totalCosts.driver += driverCost;
        totalCosts.depreciation += depreciationCost;
        totalCosts.insurance += fixedCostAllocation;
        totalCosts.operational += operationalCost;
        totalDistance += distanceKm;

        return {
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            distance: distanceKm,
            totalCost: tripTotalCost,
            cpk: tripTotalCost / distanceKm,
            breakdown: {
                fuel: fuelCost,
                driver: driverCost,
                depreciation: depreciationCost,
                fixed: fixedCostAllocation,
                operational: operationalCost
            }
        };
    });

    // Add maintenance costs (allocated across distance)
    const maintenanceCost = calculateMaintenanceCost(maintenanceLogs, totalDistance);
    totalCosts.maintenance = maintenanceCost;

    const totalCost = Object.values(totalCosts).reduce((sum, cost) => sum + cost, 0);
    const overallCPK = totalDistance > 0 ? totalCost / totalDistance : 0;

    return {
        totalCPK: overallCPK,
        totalDistance: totalDistance,
        totalCost: totalCost,
        breakdown: {
            costs: totalCosts,
            percentages: calculateCostPercentages(totalCosts, totalCost),
            tripDetails: tripCosts
        },
        benchmarking: {
            industryAverage: operationalParams.industryBenchmarks?.averageCPK || 0,
            targetCPK: operationalParams.targetCPK || 0,
            efficiency: calculateEfficiencyRating(overallCPK, operationalParams)
        }
    };
};

/**
 * Calculate dynamic fuel cost based on vehicle efficiency and current fuel rates
 */
const calculateFuelCost = (distanceKm, vehicle, operationalParams) => {
    const fuelConsumption = distanceKm / (vehicle.kmpl || 15); // Default 15 kmpl
    const currentFuelRate = operationalParams.currentFuelRate || 100; // ₹100/liter default
    
    // Factor in traffic conditions and route efficiency
    const efficiencyFactor = operationalParams.routeEfficiency || 1.0;
    
    return fuelConsumption * currentFuelRate * efficiencyFactor;
};

/**
 * Calculate driver cost based on actual working hours and driver-specific rates
 */
const calculateDriverCost = (durationHours, driverId, operationalParams) => {
    const driverRate = operationalParams.driverRates?.[driverId] || operationalParams.defaultDriverRate || 200;
    
    // Include overtime calculations
    const regularHours = Math.min(durationHours, 8);
    const overtimeHours = Math.max(durationHours - 8, 0);
    const overtimeRate = driverRate * 1.5;
    
    return (regularHours * driverRate) + (overtimeHours * overtimeRate);
};

/**
 * Calculate vehicle depreciation based on usage patterns
 */
const calculateDepreciationCost = (distanceKm, durationHours, vehicle) => {
    const distanceDepreciation = distanceKm * (vehicle.depreciationPerKm || 2);
    const timeDepreciation = durationHours * (vehicle.depreciationPerHour || 15);
    
    return distanceDepreciation + timeDepreciation;
};

/**
 * Calculate allocated fixed costs (insurance, permits, parking, etc.)
 */
const calculateFixedCostAllocation = (durationHours, vehicle, operationalParams) => {
    const dailyFixedCost = vehicle.dailyFixedCost || operationalParams.defaultDailyFixedCost || 500;
    const hourlyRate = dailyFixedCost / 8; // Assume 8-hour standard day
    
    return durationHours * hourlyRate;
};

/**
 * Calculate trip-specific operational costs (tolls, parking, etc.)
 */
const calculateOperationalCost = (trip, operationalParams) => {
    let operationalCost = 0;
    
    // Toll costs based on route
    operationalCost += trip.tollCosts || 0;
    
    // Parking fees
    operationalCost += trip.parkingCosts || 0;
    
    // Route-specific charges
    operationalCost += trip.routeSpecificCosts || 0;
    
    return operationalCost;
};

/**
 * Calculate maintenance cost allocation
 */
const calculateMaintenanceCost = (maintenanceLogs, totalDistance) => {
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    return totalMaintenanceCost; // Can be allocated per km if needed
};

/**
 * Calculate cost breakdown percentages
 */
const calculateCostPercentages = (costs, totalCost) => {
    const percentages = {};
    if (totalCost > 0) {
        Object.keys(costs).forEach(key => {
            percentages[key] = (costs[key] / totalCost) * 100;
        });
    }
    return percentages;
};

/**
 * Calculate efficiency rating compared to benchmarks
 */
const calculateEfficiencyRating = (actualCPK, operationalParams) => {
    const targetCPK = operationalParams.targetCPK || 12;
    const industryAverage = operationalParams.industryBenchmarks?.averageCPK || 15;
    
    let rating = 'Average';
    if (actualCPK <= targetCPK) {
        rating = 'Excellent';
    } else if (actualCPK <= industryAverage) {
        rating = 'Good';
    } else if (actualCPK <= industryAverage * 1.2) {
        rating = 'Below Average';
    } else {
        rating = 'Poor';
    }
    
    return {
        rating,
        vsTarget: ((actualCPK - targetCPK) / targetCPK * 100).toFixed(1),
        vsIndustry: ((actualCPK - industryAverage) / industryAverage * 100).toFixed(1)
    };
};

/**
 * Get default vehicle profile for cases where specific vehicle data is unavailable
 */
const getDefaultVehicleProfile = () => ({
    id: 'default',
    kmpl: 15,
    depreciationPerKm: 2,
    depreciationPerHour: 15,
    dailyFixedCost: 500
});

/**
 * Generate CPK optimization recommendations
 */
export const generateCPKRecommendations = (cpkAnalysis, historicalData) => {
    const recommendations = [];
    
    const { breakdown, totalCPK, benchmarking } = cpkAnalysis;
    
    // Fuel efficiency recommendations
    if (breakdown.percentages.fuel > 45) {
        recommendations.push({
            type: 'fuel_optimization',
            priority: 'high',
            message: 'Fuel costs represent >45% of CPK. Consider route optimization and driver training.',
            potentialSaving: '15-25%',
            actions: ['Route optimization analysis', 'Driver eco-driving training', 'Vehicle maintenance check']
        });
    }
    
    // Driver productivity recommendations
    if (breakdown.percentages.driver > 35) {
        recommendations.push({
            type: 'driver_productivity',
            priority: 'medium',
            message: 'Driver costs are high. Focus on reducing idle time and improving efficiency.',
            potentialSaving: '10-20%',
            actions: ['Route planning improvement', 'Task scheduling optimization', 'Driver performance review']
        });
    }
    
    // Vehicle utilization recommendations
    if (breakdown.percentages.depreciation + breakdown.percentages.insurance > 30) {
        recommendations.push({
            type: 'asset_utilization',
            priority: 'medium',
            message: 'Fixed asset costs are high. Increase vehicle utilization.',
            potentialSaving: '8-15%',
            actions: ['Increase daily trips', 'Optimize shift scheduling', 'Consider fleet rightsizing']
        });
    }
    
    // Benchmarking recommendations
    if (benchmarking.efficiency.rating === 'Poor' || benchmarking.efficiency.rating === 'Below Average') {
        recommendations.push({
            type: 'overall_efficiency',
            priority: 'high',
            message: `CPK is ${benchmarking.efficiency.vsIndustry}% above industry average.`,
            potentialSaving: '20-35%',
            actions: ['Comprehensive operational audit', 'Technology upgrade consideration', 'Process reengineering']
        });
    }
    
    return recommendations;
};

/**
 * Export enhanced CPK data for reporting and analytics
 */
export const exportCPKAnalytics = (cpkAnalysis) => {
    return {
        summary: {
            totalCPK: cpkAnalysis.totalCPK.toFixed(2),
            totalDistance: cpkAnalysis.totalDistance.toFixed(1),
            totalCost: cpkAnalysis.totalCost.toFixed(0),
            efficiencyRating: cpkAnalysis.benchmarking.efficiency.rating
        },
        costBreakdown: cpkAnalysis.breakdown.percentages,
        benchmarking: cpkAnalysis.benchmarking,
        recommendations: generateCPKRecommendations(cpkAnalysis),
        exportTimestamp: new Date().toISOString()
    };
};
