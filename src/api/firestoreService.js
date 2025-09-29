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
        
        // Prepare tasks with their IDs
        const tasksWithIds = route.steps.filter(step => step.type === 'job').map(step => ({
             id: step.id.toString(), // Ensure ID is a string
             customerId: step.description || `Customer-${step.id}`,
             deliveryAddress: step.location ? `Lat: ${step.location[1]}, Lng: ${step.location[0]}` : 'Unknown location',
             demandVolume: step.load ? step.load[0] : 0,
             status: 'assigned'
        }));

        batch.set(driverRouteRef, {
            vehicleId: vehicleId,
            driverEmail: driverEmail,
            tasks: tasksWithIds,
            totalDuration: route.duration || 0,
            totalDistance: route.distance || 0,
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
            const routeDoc = await getDocs(query(collection(db, 'driver_routes'), where("vehicleId", "==", tripLogId)));
            
            if (!routeDoc.empty) {
                const routeData = routeDoc.docs[0].data();
                const updatedTasks = routeData.tasks.map(task => 
                    task.id === taskId ? { ...task, status: newStatus } : task
                );
                
                await updateDoc(routeRef, { tasks: updatedTasks });
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
        if (tripLogId) {
            const routeDoc = await getDoc(doc(db, 'driver_routes', tripLogId));
            if (routeDoc.exists()) {
                vehicleId = routeDoc.data().vehicleId || tripLogId;
            }
        }

        const historyEntry = {
            id: `${taskId}_${Date.now()}`,
            taskId,
            customerId: taskData.customerId || 'Unknown Customer',
            vehicleId,
            completedAt,
            deliveryLocation: taskData.deliveryLocation || null,
            demandVolume: taskData.demandVolume || 0,
            // Enhanced time window logic using real customer delivery windows
            isOnTime: (() => {
                if (!taskData.timeWindowEnd) {
                    // No delivery deadline specified - consider on time
                    return true;
                }
                
                const completionTime = completedAt.toDate();
                let deadlineTime;
                
                // Handle different timestamp formats
                if (taskData.timeWindowEnd.toDate) {
                    // Firestore Timestamp
                    deadlineTime = taskData.timeWindowEnd.toDate();
                } else if (typeof taskData.timeWindowEnd === 'string') {
                    // ISO string
                    deadlineTime = new Date(taskData.timeWindowEnd);
                } else {
                    // Direct Date object
                    deadlineTime = new Date(taskData.timeWindowEnd);
                }
                
                console.log(`📅 Delivery Time Check - Completed: ${completionTime.toLocaleString()}, Deadline: ${deadlineTime.toLocaleString()}`);
                
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

        await setDoc(doc(db, 'delivery_history', historyEntry.id), historyEntry);
        console.log('✅ Delivery history entry created:', historyEntry.id);
        
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
        const historySnapshot = await getDocs(collection(db, 'delivery_history'));
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
            collection(db, 'delivery_history'),
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
            collection(db, 'delivery_history'),
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

// Legacy function for compatibility (in case cached version expects it)
export const fetchLiveTripLogs = async () => {
    console.warn('fetchLiveTripLogs is deprecated, use fetchDeliveryHistory instead');
    return await fetchDeliveryHistory();
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
        const historySnapshot = await getDocs(collection(db, 'delivery_history'));
        historySnapshot.docs.forEach(docSnapshot => {
            batch.delete(doc(db, 'delivery_history', docSnapshot.id));
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

// Make reset function available globally for console access
if (typeof window !== 'undefined') {
    window.resetAllSystemData = resetAllSystemData;
    console.log('🔧 Global reset function available: window.resetAllSystemData()');
}

