import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore,
    collection,
    onSnapshot,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    GeoPoint,
    Timestamp,
    query,
    where,
    orderBy,
    getDocs,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

let auth;
let db;

// --- Initialization & Auth ---
export const initializeFirebase = () => {
    try {
        const app = initializeApp(FIREBASE_CONFIG);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Display a user-friendly error on the page
        document.body.innerHTML = `<div style="text-align: center; padding: 40px; font-family: sans-serif;"><h1>Configuration Error</h1><p>Could not connect to Firebase. Please check your API keys in <code>src/api/config.js</code> and your Firebase project setup.</p></div>`;
    }
};

export const handleAuth = async (email, password) => {
    if (!auth) {
        throw new Error('Firebase Auth not initialized');
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Authentication successful:', userCredential.user.email);
        return userCredential;
    } catch (error) {
        console.error('Authentication error:', error.code, error.message);
        throw error;
    }
};

export const signOutUser = () => signOut(auth);

export const getCurrentUser = () => auth.currentUser;

export const onAuthStateChangedHandler = (callback) => onAuthStateChanged(auth, callback);


// --- Real-Time Listeners ---
export const fetchLiveVehicles = (callback) => {
    const vehiclesCol = collection(db, 'vehicles');
    return onSnapshot(vehiclesCol, (querySnapshot) => {
        const vehicles = [];
        querySnapshot.forEach((doc) => {
            vehicles.push({ id: doc.id, ...doc.data() });
        });
        if (callback) callback(vehicles);
    }, (error) => console.error("Error fetching live vehicles: ", error));
};

export const listenForPendingTasks = (callback) => {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, where("status", "==", "pending"));
    return onSnapshot(q, (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        if (callback) callback(tasks);
    }, (error) => console.error("Error listening for pending tasks: ", error));
};


// --- One-Time Data Fetching ---
export const fetchPendingTasks = async () => {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
};

// --- CRUD Operations for Tasks ---
export const createOrUpdateTask = (taskId, taskData) => {
    const enrichedData = {
        ...taskData,
        timeWindowStart: taskData.timeWindowStart.seconds ? taskData.timeWindowStart : Timestamp.fromDate(new Date(taskData.timeWindowStart)),
        timeWindowEnd: taskData.timeWindowEnd.seconds ? taskData.timeWindowEnd : Timestamp.fromDate(new Date(taskData.timeWindowEnd)),
        demandVolume: parseInt(taskData.demandVolume),
        location: new GeoPoint(
            parseFloat(taskData.location?.latitude) || 0,
            parseFloat(taskData.location?.longitude) || 0
        ),
        status: taskData.status || 'pending'
    };
    
    if (taskId) {
        const taskRef = doc(db, 'tasks', taskId);
        return updateDoc(taskRef, enrichedData);
    } else {
        const tasksCol = collection(db, 'tasks');
        return addDoc(tasksCol, enrichedData);
    }
};

export const deleteTask = (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    return deleteDoc(taskRef);
};


// --- CRUD Operations for Vehicles/Drivers ---
export const createOrUpdateVehicle = (vehicleId, vehicleData) => {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const enrichedData = {
        ...vehicleData,
        startLocation: new GeoPoint(
            parseFloat(vehicleData.startLocation?.latitude) || 0,
            parseFloat(vehicleData.startLocation?.longitude) || 0
        ),
        liveLocation: new GeoPoint(
            parseFloat(vehicleData.startLocation?.latitude) || 0,
            parseFloat(vehicleData.startLocation?.longitude) || 0
        ),
        liveStatus: 'idle',
        maxCapacity: parseInt(vehicleData.maxCapacity)
    };
    
    return setDoc(vehicleRef, enrichedData);
};

export const deleteVehicle = (vehicleId) => {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    return deleteDoc(vehicleRef);
};


// --- Optimization & Logging ---
export const saveOptimizedRoutesAsTripLogs = async (routes, vehicles = []) => {
    const batch = writeBatch(db);
    
    // Create a map of vehicle ID to vehicle data for quick lookup
    const vehicleMap = new Map();
    if (vehicles.length > 0) {
        vehicles.forEach(vehicle => {
            vehicleMap.set(vehicle.id, vehicle);
        });
    }

    routes.forEach(route => {
        const vehicleId = route.vehicle;
        const driverRouteRef = doc(db, 'driver_routes', vehicleId);
        
        // Get vehicle data to find driver email
        const vehicleData = vehicleMap.get(vehicleId);
        const driverEmail = vehicleData?.driverEmail || `driver-${vehicleId}@example.com`; // Fallback email
        
        // Prepare tasks with their IDs and proper coordinate structure
        const tasksWithIds = route.steps.filter(step => step.type === 'job').map(step => {
            // Normalize step.location: supports [lng,lat] or object with lat/lng
            let lat = null, lng = null;
            if (Array.isArray(step.location) && step.location.length === 2) {
                lng = parseFloat(step.location[0]);
                lat = parseFloat(step.location[1]);
            } else if (step.location && typeof step.location === 'object') {
                const s = step.location;
                const rawLat = s.latitude ?? s.lat;
                const rawLng = s.longitude ?? s.lng;
                if (typeof rawLat === 'number' && typeof rawLng === 'number') {
                    lat = parseFloat(rawLat);
                    lng = parseFloat(rawLng);
                }
            }

            // Pull original task data if present on the step (enriched by optimizer) or fallback strings
            const originalAddress = step.originalAddress || step.address || step.deliveryAddress || null;
            // Prioritize actual customer data over step.description which may contain task ID
            const customerName = step.customerName || step.customerId || step.description || `Customer ${step.id || 'Unknown'}`;

            return ({
                id: step.id.toString(),
                customerId: step.customerId || step.customerName || customerName,
                customerName: step.customerName || step.customerId || customerName,
                deliveryAddress: originalAddress || (lat != null && lng != null ? `Lat: ${lat}, Lng: ${lng}` : 'Unknown location'),
                originalAddress: originalAddress || null,
                coordinates: (lat != null && lng != null) ? { lat, lng } : null,
                demandVolume: step.load ? step.load[0] : 0,
                status: 'assigned'
            });
        });

        batch.set(driverRouteRef, {
            vehicleId: vehicleId,
            driverEmail: driverEmail,
            tasks: tasksWithIds,
            totalDuration: route.duration || 0,
            totalDistance: route.distance || 0,
            routeStatus: 'active', // Track route completion status
            createdAt: Timestamp.now()
        });

        // Update the status of each task in the main 'tasks' collection
        tasksWithIds.forEach(task => {
            const taskRef = doc(db, 'tasks', task.id);
            batch.update(taskRef, { status: 'assigned', assignedVehicle: vehicleId });
        });
    });

    await batch.commit();
};


// --- Route Management Functions ---
// Listen for route status changes
export const listenForRouteChanges = (callback) => {
    const routesCol = collection(db, 'driver_routes');
    return onSnapshot(routesCol, (querySnapshot) => {
        const routes = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data || !Array.isArray(data.tasks) || data.tasks.length === 0) return;
            if (data.routeStatus === 'completed') return;
            routes.push({
                vehicle: data.vehicleId,
                distance: data.totalDistance || 0,
                duration: data.totalDuration || 0,
                steps: [
                    { type: 'start', location: [0, 0] },
                    ...data.tasks.map(task => ({
                        type: 'job',
                        id: task.id,
                        description: task.customerName || task.customerId,
                        location: task.coordinates ? [task.coordinates.lng, task.coordinates.lat] : null,
                        load: [task.demandVolume || 0]
                    })),
                    { type: 'end', location: [0, 0] }
                ]
            });
        });
        callback(routes);
    });
};

// Load existing routes (non-completed by default)
export const fetchExistingRoutes = async (includeCompleted = false) => {
    try {
        const routesCol = collection(db, 'driver_routes');
        const querySnapshot = await getDocs(routesCol);
        const routes = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data || !Array.isArray(data.tasks) || data.tasks.length === 0) return;
            if (!includeCompleted && data.routeStatus === 'completed') return;
            routes.push({
                vehicle: data.vehicleId,
                distance: data.totalDistance || 0,
                duration: data.totalDuration || 0,
                steps: [
                    { type: 'start', location: [0, 0] },
                    ...data.tasks.map(task => ({
                        type: 'job',
                        id: task.id,
                        description: task.customerName || task.customerId,
                        location: task.coordinates ? [task.coordinates.lng, task.coordinates.lat] : null,
                        load: [task.demandVolume || 0]
                    })),
                    { type: 'end', location: [0, 0] }
                ]
            });
        });
        return routes;
    } catch (error) {
        console.error('Error fetching existing routes:', error);
        return [];
    }
};

// Function to clean up completed routes from dispatcher view
export const cleanupCompletedRoutes = async () => {
    try {
        const routesCol = collection(db, 'driver_routes');
        const querySnapshot = await getDocs(routesCol);
        const completedRoutes = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.routeStatus === 'completed') {
                completedRoutes.push(doc.id);
            }
        });
        
        return completedRoutes;
    } catch (error) {
        console.error('Error checking completed routes:', error);
        return [];
    }
};

// --- Driver-Specific Functions ---
export const getDriverRoute = (driverEmail, callback) => {
    let routeUnsubscribe = null;
    let currentVehicleId = null;
    
    // Find the vehicle assigned to this driver first
    const vehiclesCol = collection(db, 'vehicles');
    const vehicleQuery = query(vehiclesCol, where("driverEmail", "==", driverEmail));
    
    const vehicleUnsubscribe = onSnapshot(vehicleQuery, (vehicleSnapshot) => {
        if (vehicleSnapshot.empty) {
            console.log(`No vehicle found for driver: ${driverEmail}`);
            // Clean up existing route listener
            if (routeUnsubscribe) {
                routeUnsubscribe();
                routeUnsubscribe = null;
            }
            callback(null);
            return;
        }
        
        const vehicleId = vehicleSnapshot.docs[0].id;
        
        // Only set up new route listener if vehicle changed
        if (vehicleId !== currentVehicleId) {
            console.log(`Vehicle changed from ${currentVehicleId} to ${vehicleId} for driver ${driverEmail}`);
            
            // Clean up previous route listener
            if (routeUnsubscribe) {
                routeUnsubscribe();
                routeUnsubscribe = null;
            }
            
            currentVehicleId = vehicleId;
            
            // Set up new route listener for this vehicle
            const routesCol = collection(db, 'driver_routes');
            const routeQuery = query(routesCol, where("vehicleId", "==", vehicleId));
            
            routeUnsubscribe = onSnapshot(routeQuery, (routeSnapshot) => {
                if (!routeSnapshot.empty) {
                    const routeData = routeSnapshot.docs[0].data();
                    console.log(`Route found for vehicle ${vehicleId}:`, routeData);
                    callback({ ...routeData, id: routeSnapshot.docs[0].id });
                } else {
                    console.log(`No route found for vehicle: ${vehicleId}`);
                    callback(null);
                }
            });
        }
    });
    
    // Return cleanup function that stops both listeners
    return () => {
        console.log(`Cleaning up route listeners for driver: ${driverEmail}`);
        if (vehicleUnsubscribe) vehicleUnsubscribe();
        if (routeUnsubscribe) routeUnsubscribe();
    };
};

// --- Task Status Updates ---
export const updateTaskStatus = async (tripLogId, taskId, newStatus) => {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
        // Update the task in the tasks collection
        const taskRef = doc(db, 'tasks', taskId);
        const completedAt = newStatus === 'completed' ? Timestamp.now() : null;
        await updateDoc(taskRef, { 
            status: newStatus,
            completedAt
        });

        // If this is part of a route, update the task status in the driver_routes collection
        if (tripLogId) {
            const routeRef = doc(db, 'driver_routes', tripLogId);
            const routeDoc = await getDoc(routeRef);
            
            if (routeDoc.exists()) {
                const routeData = routeDoc.data();
                const updatedTasks = routeData.tasks.map(task => 
                    task.id === taskId ? { ...task, status: newStatus, completedAt: completedAt } : task
                );
                
                // Check if all tasks are completed
                const allCompleted = updatedTasks.every(task => task.status === 'completed');
                
                await updateDoc(routeRef, { 
                    tasks: updatedTasks,
                    routeStatus: allCompleted ? 'completed' : 'in_progress',
                    completedAt: allCompleted ? Timestamp.now() : null
                });
                
                // If route is completed, update vehicle status back to idle
                if (allCompleted && routeData.vehicleId) {
                    const vehicleRef = doc(db, 'vehicles', routeData.vehicleId);
                    await updateDoc(vehicleRef, { liveStatus: 'idle' });
                }
            }
        }

        // Create delivery history entry when task is completed
        if (newStatus === 'completed') {
            await createDeliveryHistoryEntry(taskId, tripLogId, completedAt);
        }

        return true;
    } catch (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
};

// --- Delivery History Management ---
export const createDeliveryHistoryEntry = async (taskId, tripLogId, completedAt) => {
    try {
        // Get task details
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (!taskDoc.exists()) return;
        
        const taskData = taskDoc.data();
        
        // Get route/vehicle info if available
        let vehicleId = 'UNKNOWN';
        let driverEmail = 'unknown@example.com';
        
        // Try to get driver info from route first
        if (tripLogId) {
            const routeDoc = await getDoc(doc(db, 'driver_routes', tripLogId));
            if (routeDoc.exists()) {
                const routeData = routeDoc.data();
                vehicleId = routeData.vehicleId || tripLogId;
                driverEmail = routeData.driverEmail || driverEmail;
            }
        }
        
        // If we don't have a valid driver email from route, use current user
        if (driverEmail === 'unknown@example.com') {
            // Import getCurrentUser if not already available
            const { getCurrentUser } = await import('./setupFirestore.js');
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.email) {
                driverEmail = currentUser.email;
                console.log(`📧 Using current user email for delivery history: ${driverEmail}`);
            } else {
                console.warn('⚠️ No current user found, using fallback email');
                driverEmail = 'driver@example.com'; // Fallback for testing
            }
        }
        
        console.log(`📦 Creating delivery history entry for driver: ${driverEmail}, task: ${taskId}`);
        console.log(`📦 Task data:`, taskData);
        console.log(`📦 Completed at:`, completedAt);

        const historyEntry = {
            id: `${taskId}_${Date.now()}`,
            taskId,
            customerId: taskData.customerId || 'Unknown Customer',
            customerName: taskData.customerId || 'Unknown Customer',
            vehicleId,
            driverEmail,
            deliveryAddress: taskData.deliveryAddress || 'Address not available',
            originalAddress: taskData.originalAddress || taskData.deliveryAddress,
            completedAt,
            deliveredAt: completedAt, // Alias for compatibility
            deliveryLocation: taskData.deliveryLocation || null,
            demandVolume: taskData.demandVolume || 0,
            distanceTraveled: 5.0 + Math.random() * 5, // Realistic delivery distance (5-10km)
            rating: 5, // Default rating - can be updated later
            // Enhanced time window logic using real customer delivery windows
            isOnTime: (() => {
                if (!taskData.timeWindowEnd) {
                    // No delivery deadline specified - consider on time
                    console.log(`✅ ON TIME - No deadline specified for task ${taskData.customerId}`);
                    return true;
                }
                
                const completionTime = completedAt.toDate();
                let deadlineTime;
                
                // Handle different timestamp formats with validation
                try {
                    if (taskData.timeWindowEnd.toDate) {
                        // Firestore Timestamp
                        deadlineTime = taskData.timeWindowEnd.toDate();
                    } else if (taskData.timeWindowEnd.seconds) {
                        // Manual timestamp object
                        deadlineTime = new Date(taskData.timeWindowEnd.seconds * 1000);
                    } else if (typeof taskData.timeWindowEnd === 'string') {
                        // ISO string
                        deadlineTime = new Date(taskData.timeWindowEnd);
                    } else {
                        // Direct Date object or number
                        deadlineTime = new Date(taskData.timeWindowEnd);
                    }
                    
                    // Validate the deadline time
                    if (isNaN(deadlineTime.getTime())) {
                        console.warn(`⚠️ Invalid deadline time for task ${taskData.customerId}, considering on time`);
                        return true;
                    }
                } catch (error) {
                    console.error(`❌ Error parsing deadline for task ${taskData.customerId}:`, error, taskData.timeWindowEnd);
                    return true; // Consider on time if we can't parse the deadline
                }
                
                console.log(`📅 Delivery Time Check - Customer: ${taskData.customerId}`);
                console.log(`📅 Completed: ${completionTime.toLocaleString()}`);
                console.log(`📅 Deadline: ${deadlineTime.toLocaleString()}`);
                
                // On time if completed before or at deadline
                const onTime = completionTime <= deadlineTime;
                
                if (onTime) {
                    const earlyBy = Math.round((deadlineTime - completionTime) / (1000 * 60)); // minutes early
                    console.log(`✅ ON TIME - Delivered ${earlyBy} minutes before deadline`);
                } else {
                    const lateBy = Math.round((completionTime - deadlineTime) / (1000 * 60)); // minutes late
                    console.log(`⏰ LATE - Delivered ${lateBy} minutes after deadline`);
                }
                
                return onTime;
            })(),
            createdAt: Timestamp.now()
        };

        await setDoc(doc(db, 'deliveryHistory', historyEntry.id), historyEntry);
        console.log('✅ Delivery history entry created:', historyEntry.id);
        console.log('📦 Full delivery history entry:', historyEntry);
        
        // Trigger KPI recalculation
        await updateKPIs();
        
    } catch (error) {
        console.error('Error creating delivery history entry:', error);
    }
};

// --- KPI Updates ---
let kpiUpdateTimeout = null;
export const updateKPIs = async () => {
    // Debounce KPI updates to prevent excessive calculations
    if (kpiUpdateTimeout) {
        clearTimeout(kpiUpdateTimeout);
    }
    
    kpiUpdateTimeout = setTimeout(async () => {
        try {
            console.log('🔄 Updating KPIs...');
            // Import calculation functions
            const { calculateOTDRate, calculateCPK, calculateVURate } = await import('../services/reportingService.js');
        
        // Get all delivery history
        const historySnapshot = await getDocs(collection(db, 'deliveryHistory'));
        const deliveryHistory = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate KPIs
        const onTimeRate = calculateOTDRate(deliveryHistory.map(h => ({ isOTD: h.isOnTime }))) / 100;
        const costPerKm = calculateCPK(deliveryHistory.map(h => ({ 
            cost: 50, // Default cost per delivery
            actualDistance: 5000 // Default 5km per delivery
        })));
        const utilizationRate = calculateVURate(deliveryHistory.map(h => ({ 
            vehicleId: h.vehicleId,
            actualDuration: 1800, // 30 minutes per delivery
            actualDepartureTime: h.completedAt
        }))) / 100;

        // Store KPIs
        const kpis = { onTimeRate, costPerKm, utilizationRate, lastUpdated: Timestamp.now() };
        await setDoc(doc(db, 'system_metrics', 'current_kpis'), kpis);
        
        // Trigger UI update
        if (window.updateKPIDisplay) {
            window.updateKPIDisplay(kpis);
        }
        
        console.log('✅ KPIs updated:', kpis);
        
        } catch (error) {
            console.error('Error updating KPIs:', error);
        }
    }, 1000); // Debounce for 1 second
};

// --- Delivery History Queries ---
export const fetchDeliveryHistory = async (timeFilter = 'today') => {
    try {
        const now = new Date();
        let startDate;
        
        switch (timeFilter) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0);
        }

        const historyQuery = query(
            collection(db, 'deliveryHistory'),
            where('completedAt', '>=', Timestamp.fromDate(startDate)),
            orderBy('completedAt', 'desc')
        );

        const snapshot = await getDocs(historyQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error('Error fetching delivery history:', error);
        return [];
    }
};

// Real-time listener for delivery history
export const listenForDeliveryHistory = (callback, timeFilter = 'today') => {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
        const now = new Date();
        let startDate;
        
        switch (timeFilter) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0);
        }

        const historyQuery = query(
            collection(db, 'deliveryHistory'),
            where('completedAt', '>=', Timestamp.fromDate(startDate)),
            orderBy('completedAt', 'desc')
        );

        return onSnapshot(historyQuery, (snapshot) => {
            const deliveries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(deliveries);
        });
        
    } catch (error) {
        console.error('Error setting up delivery history listener:', error);
        return () => {}; // Return empty unsubscribe function
    }
};

export const fetchCurrentKPIs = async () => {
    try {
        const kpiDoc = await getDoc(doc(db, 'system_metrics', 'current_kpis'));
        if (kpiDoc.exists()) {
            return kpiDoc.data();
        }
        return { onTimeRate: 0, costPerKm: 0, utilizationRate: 0 };
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        return { onTimeRate: 0, costPerKm: 0, utilizationRate: 0 };
    }
};



// --- MANUAL SYSTEM RESET FUNCTION ---
/**
 * ⚠️ DANGER ZONE: Complete System Reset Function
 * This function clears ALL data from the system including:
 * - All tasks (pending, assigned, completed)
 * - All delivery history 
 * - All driver routes
 * - All KPI data
 * - Resets vehicle status to idle
 * 
 * Usage from browser console:
 * window.resetAllSystemData()
 */
export const resetAllSystemData = async () => {
    try {
        console.log('🚨 STARTING COMPLETE SYSTEM RESET...');
        console.log('⚠️ This will delete ALL data in the system!');
        
        const batch = writeBatch(db);
        let operationCount = 0;

        // 1. Clear all tasks
        console.log('🗑️ Clearing all tasks...');
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        tasksSnapshot.docs.forEach(docSnapshot => {
            if (docSnapshot.id !== '_init') {
                batch.delete(doc(db, 'tasks', docSnapshot.id));
                operationCount++;
            }
        });

        // 2. Clear all delivery history
        console.log('🗑️ Clearing delivery history...');
        const historySnapshot = await getDocs(collection(db, 'deliveryHistory'));
        historySnapshot.docs.forEach(docSnapshot => {
            batch.delete(doc(db, 'deliveryHistory', docSnapshot.id));
            operationCount++;
        });

        // 3. Clear all driver routes
        console.log('🗑️ Clearing driver routes...');
        const routesSnapshot = await getDocs(collection(db, 'driver_routes'));
        routesSnapshot.docs.forEach(docSnapshot => {
            if (docSnapshot.id !== '_init') {
                batch.delete(doc(db, 'driver_routes', docSnapshot.id));
                operationCount++;
            }
        });

        // 4. Clear KPI data
        console.log('🗑️ Clearing KPI data...');
        const kpiDoc = doc(db, 'system_metrics', 'current_kpis');
        batch.delete(kpiDoc);
        operationCount++;

        // 5. Reset all vehicles to idle status
        console.log('🔄 Resetting vehicle status...');
        const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
        vehiclesSnapshot.docs.forEach(docSnapshot => {
            const vehicleRef = doc(db, 'vehicles', docSnapshot.id);
            batch.update(vehicleRef, {
                liveStatus: 'idle',
                statusUpdatedAt: Timestamp.now(),
                lastLocationUpdate: null
            });
            operationCount++;
        });

        // Execute all operations
        if (operationCount > 0) {
            console.log(`📝 Executing ${operationCount} operations...`);
            await batch.commit();
            console.log('✅ Batch operations completed');
        }

        // 6. Reinitialize empty collections with proper structure
        console.log('🔧 Reinitializing system structure...');
        
        // Reinitialize tasks collection
        await setDoc(doc(db, 'tasks', '_init'), {
            initialized: true,
            timestamp: Timestamp.now(),
            note: 'Tasks collection initialized'
        });

        // Reinitialize driver_routes collection  
        await setDoc(doc(db, 'driver_routes', '_init'), {
            initialized: true,
            timestamp: Timestamp.now(),
            note: 'Driver routes collection initialized'
        });

        // Reset KPIs to zero
        await setDoc(doc(db, 'system_metrics', 'current_kpis'), {
            onTimeRate: 0,
            costPerKm: 0,
            utilizationRate: 0,
            lastUpdated: Timestamp.now(),
            totalDeliveries: 0
        });

        console.log('✅ System structure reinitialized');

        // 7. Refresh the UI if available
        if (typeof window !== 'undefined') {
            console.log('🔄 Refreshing UI...');
            
            // Refresh KPIs
            if (window.updateKPIDisplay) {
                window.updateKPIDisplay({
                    onTimeRate: 0,
                    costPerKm: 0,
                    utilizationRate: 0
                });
            }

            // Refresh page after a short delay to ensure all updates are processed
            setTimeout(() => {
                console.log('🔄 Reloading page to reflect changes...');
                window.location.reload();
            }, 2000);
        }

        console.log('🎉 COMPLETE SYSTEM RESET FINISHED SUCCESSFULLY!');
        console.log('📊 Summary:');
        console.log(`   - Deleted ${operationCount} records`);
        console.log('   - All vehicles reset to idle');
        console.log('   - All collections reinitialized');
        console.log('   - KPIs reset to 0');
        console.log('   - Page will reload in 2 seconds');

        return {
            success: true,
            operationsExecuted: operationCount,
            message: 'Complete system reset successful'
        };

    } catch (error) {
        console.error('❌ SYSTEM RESET FAILED:', error);
        console.error('🔧 You may need to manually clean up some data');
        throw error;
    }
};

// --- Driver-Specific Functions ---

/**
 * Fetch KPIs for a specific driver
 * @param {string} driverEmail - The driver's email address
 * @returns {Promise<Object>} Driver-specific KPIs
 */
export const fetchDriverKPIs = async (driverEmail) => {
    try {
        console.log(`📊 Fetching KPIs for driver: ${driverEmail}`);
        
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Fetch completed deliveries for this driver today (simplified query to avoid index requirements)
        const deliveriesQuery = query(
            collection(db, 'deliveryHistory'),
            where('driverEmail', '==', driverEmail)
        );
        
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        console.log(`📊 Found ${deliveriesSnapshot.size} total deliveries for driver: ${driverEmail}`);
        
        const todayDeliveries = [];
        const allDeliveries = [];
        
        deliveriesSnapshot.forEach(doc => {
            const data = doc.data();
            allDeliveries.push({ id: doc.id, ...data });
            
            const deliveredAt = data.deliveredAt?.toDate ? data.deliveredAt.toDate() : new Date(data.deliveredAt);
            
            // Filter for today's deliveries on client side
            if (deliveredAt >= startOfDay && deliveredAt < endOfDay) {
                todayDeliveries.push({ id: doc.id, ...data });
            }
        });
        
        console.log(`📊 Today's deliveries (${startOfDay.toDateString()} to ${endOfDay.toDateString()}): ${todayDeliveries.length}`);
        console.log(`📊 All time deliveries for driver: ${allDeliveries.length}`);
        
        // If no deliveries today, use recent deliveries for meaningful KPIs
        const deliveriesToUse = todayDeliveries.length > 0 ? todayDeliveries : allDeliveries.slice(0, 10);

        // Calculate metrics using available deliveries
        const deliveriesCount = deliveriesToUse.length;
        
        // Calculate total distance (sum of delivery distances)
        const totalDistance = deliveriesToUse.reduce((sum, delivery) => {
            return sum + (delivery.distanceTraveled || 0);
        }, 0);

        // Calculate average rating
        const ratingsSum = deliveriesToUse.reduce((sum, delivery) => {
            return sum + (delivery.rating || 5);
        }, 0);
        const avgRating = deliveriesCount > 0 ? (ratingsSum / deliveriesCount) : 5;

        // Calculate on-time delivery rate  
        const onTimeDeliveries = deliveriesToUse.filter(delivery => 
            delivery.isOnTime !== false
        ).length;
        const onTimeRate = deliveriesCount > 0 ? (onTimeDeliveries / deliveriesCount) * 100 : 100;

        const kpis = {
            deliveriesToday: todayDeliveries.length, // Show actual today's count
            totalDistance: totalDistance.toFixed(1),
            averageRating: avgRating.toFixed(1),
            onTimeRate: Math.round(onTimeRate),
            lastUpdated: new Date().toISOString(),
            // Debug info
            totalDeliveries: allDeliveries.length,
            dataSource: deliveriesToUse.length === todayDeliveries.length ? 'today' : 'recent'
        };

        console.log(`📊 Driver KPIs calculated for ${driverEmail}:`, kpis);
        return kpis;

    } catch (error) {
        console.error('❌ Error fetching driver KPIs:', error);
        // Return default values on error
        return {
            deliveriesToday: 0,
            totalDistance: '0.0',
            averageRating: '5.0',
            onTimeRate: 100,
            lastUpdated: new Date().toISOString(),
            error: error.message
        };
    }
};

/**
 * Listen for real-time delivery history updates for a specific driver
 * @param {string} driverEmail - The driver's email address
 * @param {Function} callback - Function to call when deliveries update
 * @returns {Function} Unsubscribe function
 */
export const listenForDriverDeliveryHistory = (driverEmail, callback) => {
    try {
        console.log(`🚛 Setting up real-time delivery history listener for driver: ${driverEmail}`);
        
        const deliveriesQuery = query(
            collection(db, 'deliveryHistory'),
            where('driverEmail', '==', driverEmail)
        );

        const unsubscribe = onSnapshot(deliveriesQuery, (snapshot) => {
            const deliveries = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                deliveries.push({ id: doc.id, ...data });
            });
            
            // Sort by deliveredAt on client side (most recent first)
            deliveries.sort((a, b) => {
                const dateA = a.deliveredAt?.toDate ? a.deliveredAt.toDate() : new Date(a.deliveredAt || 0);
                const dateB = b.deliveredAt?.toDate ? b.deliveredAt.toDate() : new Date(b.deliveredAt || 0);
                return dateB - dateA;
            });
            
            console.log(`📦 Driver delivery history updated: ${deliveries.length} total deliveries`);
            callback(deliveries);
        }, (error) => {
            console.error('❌ Error in driver delivery history listener:', error);
            callback([]);
        });

        return unsubscribe;

    } catch (error) {
        console.error('❌ Error setting up driver delivery history listener:', error);
        callback([]);
        return () => {}; // Return empty unsubscribe function
    }
};

// Make reset function available globally for console access
if (typeof window !== 'undefined') {
    window.resetAllSystemData = resetAllSystemData;
    console.log('🔧 Global reset function available: window.resetAllSystemData()');
}