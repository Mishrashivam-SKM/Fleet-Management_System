/**
 * @file Service for handling real-time location tracking
 */
import { updateDoc, doc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let watchId = null;
let isTracking = false;

/**
 * Starts smart location tracking based on driver status
 * @param {string} vehicleId - The vehicle ID to update
 * @param {Object} options - Tracking options
 */
export const startLocationTracking = (vehicleId, options = {}) => {
    if (isTracking) {
        console.log('Location tracking already active');
        return;
    }

    if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return;
    }

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
    };

    let trackingInterval = null;
    let currentDriverStatus = 'idle'; // idle, on_route, delivering
    
    const updateLocation = async (position) => {
        try {
            const { latitude, longitude } = position.coords;
            const db = getFirestore();
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            
            await updateDoc(vehicleRef, {
                liveLocation: {
                    latitude,
                    longitude
                },
                lastLocationUpdate: new Date(),
                locationAccuracy: position.coords.accuracy
            });

            console.log(`📍 Location updated for ${vehicleId} (${currentDriverStatus}): ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            
            // Update driver map if available
            if (typeof window !== 'undefined' && window.updateDriverLocationOnMap) {
                window.updateDriverLocationOnMap({
                    lat: latitude,
                    lng: longitude
                });
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    const handleError = (error) => {
        console.error('Location error:', error.message);
    };

    // Function to adjust tracking frequency based on status
    const setTrackingMode = (status) => {
        currentDriverStatus = status;
        
        // Clear existing interval
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }

        let interval;
        switch (status) {
            case 'idle':
                // No active tracking when idle
                console.log('📍 Location tracking: IDLE mode - stopped');
                return;
            
            case 'on_route':
                // Update every 5 minutes while driving
                interval = 5 * 60 * 1000; // 5 minutes
                console.log('📍 Location tracking: ON_ROUTE mode - 5 minute intervals');
                break;
                
            case 'delivering':
                // More frequent updates during delivery
                interval = 1 * 60 * 1000; // 1 minute
                console.log('📍 Location tracking: DELIVERING mode - 1 minute intervals');
                break;
                
            default:
                interval = 5 * 60 * 1000; // Default to 5 minutes
        }

        // Start periodic location updates
        trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updateLocation, handleError, geoOptions);
        }, interval);

        // Get immediate location update
        navigator.geolocation.getCurrentPosition(updateLocation, handleError, geoOptions);
    };

    // Get initial location
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, geoOptions);
    
    // Start with on_route mode by default
    setTrackingMode('on_route');

    isTracking = true;
    
    // Return control object
    const trackingController = {
        setMode: setTrackingMode,
        stop: () => {
            if (trackingInterval) {
                clearInterval(trackingInterval);
                trackingInterval = null;
            }
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            isTracking = false;
            console.log('📍 Location tracking completely stopped');
        },
        isActive: () => isTracking,
        getCurrentMode: () => currentDriverStatus
    };
    
    return trackingController;
};

/**
 * Stops location tracking
 */
export const stopLocationTracking = () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        isTracking = false;
        console.log('Location tracking stopped');
    }
};
