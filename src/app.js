/**
 * @file This is the main controller for the application.
 * It has been corrected to pass the user's email to the dashboard and to target the correct element IDs.
 */
import { 
    getFirestore, 
    collection, 
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    initializeFirebase, 
    onAuthStateChangedHandler, 
    handleAuth, 
    signOutUser, 
    fetchLiveVehicles, 
    listenForPendingTasks, 
    createOrUpdateTask, 
    deleteTask, 
    createOrUpdateVehicle, 
    deleteVehicle, 
    fetchPendingTasks as fetchTasksForOptimization, 
    saveOptimizedRoutesAsTripLogs, 
    getDriverRoute,
    updateTaskStatus,
    fetchDeliveryHistory,
    fetchCurrentKPIs,
    listenForDeliveryHistory,
    resetAllSystemData,
    getCurrentUser 
} from './api/firestoreService.js';
import { initializeFirestore } from './api/setupFirestore.js';
import { initializeMap, updateVehicleMarkers, initializeDriverMap, showDriverRoute } from './components/mapView.js';
import { renderDispatcherDashboard } from './components/dispatcherDashboard.js';
import { renderDriverDashboard } from './components/driverDashboard.js';
import { openTaskModal } from './components/TaskFormModal.js';
import { openVehicleModal } from './components/VehicleFormModal.js';
import { renderOptimizedRoutes } from './components/RoutesView.js';
import { optimizeRouteHandler } from './services/optimizationService.js';
import { renderReports } from './components/ReportsView.js';
import { startLocationTracking, stopLocationTracking } from './services/locationService.js';

// --- State ---
let currentUnsubscribes = [];
let isFirestoreInitialized = false;

// --- Helper Functions ---
const updateVehicleStatus = async (vehicleId, status) => {
    try {
        const vehicleRef = doc(getFirestore(), 'vehicles', vehicleId);
        await updateDoc(vehicleRef, { 
            liveStatus: status,
            statusUpdatedAt: new Date()
        });
        console.log(`Vehicle ${vehicleId} status updated to: ${status}`);
    } catch (error) {
        console.error('Error updating vehicle status:', error);
    }
};

// --- Main Application Controller ---
const main = async () => {
    // Initialize Firebase and Firestore
    initializeFirebase();
    
    // Only initialize collections if they don't exist
    if (!isFirestoreInitialized) {
        try {
            const db = getFirestore();
            const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
            if (vehiclesSnapshot.empty) {
                console.log("Initializing Firestore collections...");
                await initializeFirestore();
            }
            isFirestoreInitialized = true;
        } catch (error) {
            console.error("Error checking/initializing Firestore:", error);
        }
    }

    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    const errorEl = document.getElementById('auth-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form submission
        const email = e.target.elements.email.value;
        const password = e.target.elements.password.value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        // Clear previous error
        errorEl.classList.add('hidden');
        
        // Disable button during login
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';
        
        try {
            await handleAuth(email, password);
            console.log('Login successful:', email);
        } catch (error) {
            console.error("Authentication failed:", error);
            errorEl.textContent = "Login failed. Please check your credentials.";
            errorEl.classList.remove('hidden');
            
            // Re-enable button on error
            submitButton.disabled = false;
            submitButton.textContent = 'Sign in';
        }
    });

    onAuthStateChangedHandler((user) => {
        const loginContainer = document.getElementById('login-container');
        const appRoot = document.getElementById('app-root');
        
        cleanupPreviousListeners();
        appRoot.innerHTML = '';

        if (user) {
            loginContainer.classList.add('hidden');
            appRoot.classList.remove('hidden');
            
            // Pass the user's email to the appropriate dashboard renderer
            if (user.email === 'dispatcher@example.com') {
                appRoot.innerHTML = renderDispatcherDashboard(user.email);
                setupDispatcherDashboard();
            } else {
                appRoot.innerHTML = renderDriverDashboard(user.email);
                setupDriverDashboard(user.email);
            }
        } else {
            loginContainer.classList.remove('hidden');
            appRoot.classList.add('hidden');
        }
    });
};

// --- Dashboard Setups ---
const setupDispatcherDashboard = async () => {
    try {
        // Wait for DOM to be ready before initializing map
        setTimeout(() => {
            try {
                console.log("Initializing map for dispatcher dashboard...");
                const mapContainer = document.getElementById('map-container');
                if (!mapContainer) {
                    console.error("Map container 'map-container' not found in DOM");
                    return;
                }
                initializeMap('map-container');
                console.log("Map initialized successfully");
            } catch (mapError) {
                console.error("Error initializing map:", mapError);
            }
        }, 500);
        
        // Set up real-time listeners
        const taskUnsubscribe = listenForPendingTasks(renderPendingTasks);
        const vehicleUnsubscribe = fetchLiveVehicles((vehicles) => {
            renderVehicleList(vehicles);
            // Update map markers only if map is initialized
            setTimeout(() => {
                try {
                    updateVehicleMarkers(vehicles);
                } catch (error) {
                    console.log("Map not ready for vehicle markers yet, will try again");
                }
            }, 1000);
        });
        
        // Add real-time delivery history listener
        const deliveryHistoryUnsubscribe = listenForDeliveryHistory((deliveries) => {
            // Prevent rendering loops by only updating if DOM container exists
            const historyContainer = document.getElementById('delivery-history-container');
            if (historyContainer) {
                renderDeliveryHistory(deliveries);
            }
        });
        
        currentUnsubscribes.push(taskUnsubscribe, vehicleUnsubscribe, deliveryHistoryUnsubscribe);
    } catch (error) {
        console.error("Error setting up dispatcher dashboard:", error);
        // Show error to user
        const container = document.getElementById('app-root');
        if (container) {
            container.innerHTML = `
                <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>Error setting up dashboard. Please refresh the page or contact support.</p>
                </div>
            `;
        }
    }
    
    // Load and display current KPIs
    fetchCurrentKPIs().then(kpis => renderReports(kpis));
    
    // Load initial delivery history
    loadDeliveryHistory();

    // Add system status monitoring (for debugging)
    setInterval(() => {
        const activeListeners = currentUnsubscribes.length;
        console.log(`🔍 System Status - Active listeners: ${activeListeners}`);
    }, 30000); // Check every 30 seconds

    document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal(handleTaskFormSubmit));
    document.getElementById('add-vehicle-btn').addEventListener('click', () => openVehicleModal(handleVehicleFormSubmit));
    document.getElementById('optimize-routes-btn').addEventListener('click', handleOptimization);
    
    // Add reset all system data button
    const resetAllBtn = document.getElementById('reset-all-data-btn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', handleCompleteSystemReset);
    }
    
    // Add delivery history filter listener
    const historyFilter = document.getElementById('history-filter');
    if (historyFilter) {
        historyFilter.addEventListener('change', (e) => {
            loadDeliveryHistory(e.target.value);
        });
    }
    
    // Setup sign-out for dispatcher
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => signOutUser());
    }
};

const setupDriverDashboard = async (driverEmail) => {
    console.log(`Setting up dashboard for driver: ${driverEmail}`);
    
    // Prevent multiple setups for the same driver
    if (window.driverDashboardActive === driverEmail) {
        console.log(`Dashboard already active for ${driverEmail}, skipping setup`);
        return;
    }
    window.driverDashboardActive = driverEmail;
    
    let locationTrackingCleanup = null;
    let currentVehicleId = null;
    
    // Setup a real-time listener for the driver's route
    const unsubscribe = getDriverRoute(driverEmail, (route) => {
        console.log("Route callback received for driver:", driverEmail, route ? "Route found" : "No route");
        
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            if (route && route.tasks && route.tasks.length > 0) {
                console.log("Rendering driver tasks:", route.tasks);
                renderDriverTasks(route.tasks, route.id); // Pass tripLogId
                currentVehicleId = route.vehicleId;
                
                // Store vehicle ID in DOM for later access
                document.body.dataset.currentVehicleId = currentVehicleId;
                
                // Update vehicle status to 'on_route' when route is assigned
                if (currentVehicleId) {
                    updateVehicleStatus(currentVehicleId, 'on_route');
                }
            } else if (route) {
                console.log("Route found but no tasks:", route);
                const container = document.getElementById('driver-tasks-container');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-8">
                            <div class="text-6xl mb-4">📋</div>
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">Route Assigned But No Tasks</h3>
                            <p class="text-gray-500 mb-4">Your route exists but contains no delivery tasks.</p>
                        </div>
                    `;
                }
            } else {
                console.log("No route found for this driver.");
                const container = document.getElementById('driver-tasks-container');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-8">
                            <div class="text-6xl mb-4">🚐</div>
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">No Route Assigned Yet</h3>
                            <p class="text-gray-500 mb-4">You'll see your deliveries here once the dispatcher assigns you tasks.</p>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                <p class="text-sm text-blue-700">
                                    <strong>What happens next:</strong><br>
                                    1. Dispatcher creates delivery tasks<br>
                                    2. System optimizes routes<br>
                                    3. Your route appears here automatically<br>
                                    4. Start location tracking when ready
                                </p>
                            </div>
                        </div>
                    `;
                }
                
                // Try to find vehicle ID even without route
                if (!currentVehicleId) {
                    fetchLiveVehicles((vehicles) => {
                        const vehicle = vehicles.find(v => v.driverEmail === driverEmail);
                        if (vehicle) {
                            currentVehicleId = vehicle.id;
                            console.log(`Found vehicle ${currentVehicleId} for driver ${driverEmail}`);
                        }
                    });
                }
            }
        }, 100); // Small delay to ensure DOM is ready
    });
    
    if (unsubscribe) {
        currentUnsubscribes.push(unsubscribe);
    }
    
    // Setup location tracking toggle
    const setupLocationTracking = () => {
        const toggleBtn = document.getElementById('toggle-location-btn');
        const statusDiv = document.getElementById('location-status');
        const statusText = document.getElementById('location-status-text');
        
        if (!toggleBtn) return;
        
        toggleBtn.addEventListener('click', async () => {
            if (!currentVehicleId) {
                // Try to find vehicle ID from driver email
                try {
                    const vehicles = await new Promise(resolve => {
                        const unsubscribe = fetchLiveVehicles(v => {
                            unsubscribe();
                            resolve(v);
                        });
                    });
                    const vehicle = vehicles.find(v => v.driverEmail === driverEmail);
                    if (vehicle) {
                        currentVehicleId = vehicle.id;
                    } else {
                        alert('No vehicle found for this driver');
                        return;
                    }
                } catch (error) {
                    alert('Error finding vehicle information');
                    return;
                }
            }
            
            if (!locationTrackingCleanup) {
                // Start smart tracking
                locationTrackingCleanup = startLocationTracking(currentVehicleId);
                window.activeLocationTracker = locationTrackingCleanup; // Store globally for task completion
                
                toggleBtn.textContent = 'Stop Tracking';
                toggleBtn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md';
                statusDiv.classList.remove('hidden');
                statusText.textContent = 'On Route (5min intervals)';
                statusText.className = 'font-semibold text-green-400';
                
                // Update vehicle status to on_route
                updateVehicleStatus(currentVehicleId, 'on_route');
            } else {
                // Stop tracking
                locationTrackingCleanup.stop();
                locationTrackingCleanup = null;
                window.activeLocationTracker = null;
                
                toggleBtn.textContent = 'Start Tracking';
                toggleBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md';
                statusText.textContent = 'Stopped';
                statusText.className = 'font-semibold text-red-400';
                
                // Update vehicle status to idle
                updateVehicleStatus(currentVehicleId, 'idle');
            }
        });
    };
    
    // Setup sign-out functionality
    const setupSignOut = () => {
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                // Clean up dashboard state
                window.driverDashboardActive = null;
                if (locationTrackingCleanup) {
                    locationTrackingCleanup.stop();
                }
                if (window.activeLocationTracker) {
                    window.activeLocationTracker.stop();
                    window.activeLocationTracker = null;
                }
                signOutUser();
            });
        }
    };
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        setupLocationTracking();
        setupSignOut();
    }, 100);
};


// --- UI Rendering ---
const renderPendingTasks = (tasks) => {
    const container = document.getElementById('pending-tasks-list');
    if (!container) return;
    container.innerHTML = tasks.length === 0 
        ? '<p class="text-gray-500">No pending tasks.</p>'
        : tasks.map(task => `
            <li class="flex justify-between items-center p-2 bg-gray-700 rounded text-white">
                <div>
                    <span class="font-semibold">${task.customerId}</span>
                    <span class="text-sm text-gray-400">(Vol: ${task.demandVolume})</span>
                </div>
                <div>
                    <button class="edit-task-btn text-indigo-400 hover:text-indigo-300 text-sm mr-2" data-task-id="${task.id}">Edit</button>
                    <button class="delete-task-btn text-red-400 hover:text-red-300 text-sm" data-task-id="${task.id}">Del</button>
                </div>
            </li>
        `).join('');
    
    document.querySelectorAll('.edit-task-btn').forEach(btn => btn.addEventListener('click', (e) => handleEditTask(e, tasks)));
    document.querySelectorAll('.delete-task-btn').forEach(btn => btn.addEventListener('click', handleDeleteTask));
};

const renderVehicleList = (vehicles) => {
    // Corrected to target '#fleet-list' which is now the single, correct ID
    const container = document.getElementById('fleet-list');
    if (!container) return;
    container.innerHTML = vehicles.length === 0
        ? '<p class="text-gray-500">No vehicles in the fleet.</p>'
        : vehicles.map(v => {
            const statusColor = v.liveStatus === 'on_route' ? 'text-green-400' : 
                               v.liveStatus === 'idle' ? 'text-yellow-400' : 
                               v.liveStatus === 'delivering' ? 'text-blue-400' : 'text-gray-400';
            
            const locationText = v.liveLocation ? 
                `📍 ${v.liveLocation.latitude.toFixed(4)}, ${v.liveLocation.longitude.toFixed(4)}` : 
                '📍 No location';
                
            const lastUpdate = v.statusUpdatedAt ? 
                new Date(v.statusUpdatedAt.toDate()).toLocaleTimeString() : 
                'Never';
            
            return `
                <li class="p-3 bg-gray-700 rounded text-white mb-2">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="font-semibold text-lg">${v.id}</span>
                            <span class="text-sm text-gray-400 ml-2">(${v.driverName})</span>
                        </div>
                        <div class="flex space-x-2">
                            <button class="edit-vehicle-btn text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 border border-indigo-400 rounded" data-vehicle-id="${v.id}">Edit</button>
                            <button class="delete-vehicle-btn text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-400 rounded" data-vehicle-id="${v.id}">Del</button>
                        </div>
                    </div>
                    <div class="text-xs space-y-1">
                        <div class="flex justify-between">
                            <span>Status:</span>
                            <span class="${statusColor} font-semibold">${v.liveStatus || 'idle'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Location:</span>
                            <span class="text-gray-400 text-xs">${locationText}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Last Update:</span>
                            <span class="text-gray-500">${lastUpdate}</span>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    
    document.querySelectorAll('.edit-vehicle-btn').forEach(btn => btn.addEventListener('click', (e) => handleEditVehicle(e, vehicles)));
    document.querySelectorAll('.delete-vehicle-btn').forEach(btn => btn.addEventListener('click', handleDeleteVehicle));
};

const renderDriverTasks = (tasks, tripLogId) => {
    console.log("renderDriverTasks called with:", tasks, "tripLogId:", tripLogId);
    const container = document.getElementById('driver-tasks-container');
    if (!container) {
        console.error("driver-tasks-container not found!");
        return;
    }
    console.log("Container found, rendering tasks...");
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;
    const allCompleted = completedTasks === totalTasks;

    // Initialize driver map after DOM is ready
    setTimeout(() => {
        try {
            console.log("Initializing driver map...");
            const driverMap = initializeDriverMap();
            
            // Convert tasks to route format for map display
            const route = {
                tasks: tasks.map(task => ({
                    id: task.id,
                    customerName: task.customerId,
                    address: task.deliveryAddress,
                    coordinates: task.coordinates,
                    status: task.status
                }))
            };
            
            // Show route on map (will get current location automatically)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("Current location:", currentLocation);
                    showDriverRoute(route, currentLocation);
                }, (error) => {
                    console.log("Could not get current location, showing route without current position");
                    showDriverRoute(route, null);
                });
            } else {
                showDriverRoute(route, null);
            }
        } catch (error) {
            console.error("Error initializing driver map:", error);
        }
    }, 500);
    
    // Progress bar
    const progressHtml = `
        <div class="mb-4 bg-gray-700 rounded-lg p-3">
            <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-300">Progress</span>
                <span class="text-gray-300">${completedTasks}/${totalTasks} completed</span>
            </div>
            <div class="w-full bg-gray-600 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: ${(completedTasks/totalTasks)*100}%"></div>
            </div>
        </div>
    `;
    
    const tasksHtml = tasks.map((task, index) => `
        <div class="bg-gray-700 p-4 rounded-lg shadow mb-3 text-white ${task.status === 'completed' ? 'opacity-75' : ''}">
            <h4 class="font-bold text-lg">${index + 1}. ${task.customerId}</h4>
            <p class="text-sm text-gray-400">${task.deliveryAddress}</p>
            <p class="text-sm text-gray-400">Volume: ${task.demandVolume}</p>
            <div class="mt-2">
                ${task.status === 'completed' 
                    ? '<span class="text-green-400 font-semibold">✅ Completed!</span>'
                    : `<button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mark-complete-btn" data-task-id="${task.id}" data-trip-log-id="${tripLogId}">📦 Mark as Delivered</button>`
                }
            </div>
        </div>
    `).join('');
    
    const completionMessage = allCompleted ? `
        <div class="bg-green-600 text-white p-4 rounded-lg mb-4 text-center">
            <h3 class="text-xl font-bold mb-2">🎉 All Deliveries Complete!</h3>
            <p class="text-sm">Great job! All tasks have been delivered. Location tracking will stop automatically.</p>
        </div>
    ` : '';
    
    container.innerHTML = progressHtml + completionMessage + tasksHtml;

    document.querySelectorAll('.mark-complete-btn').forEach(btn => btn.addEventListener('click', handleMarkComplete));
    
    // Make mark task delivered function globally available for map popups
    window.markTaskDelivered = async (taskId) => {
        try {
            await updateTaskStatus(tripLogId, taskId, 'completed');
            console.log(`Task ${taskId} marked as delivered from map`);
            // Refresh the display
            location.reload();
        } catch (error) {
            console.error('Error marking task as delivered:', error);
        }
    };
    
    // Make external navigation function globally available
    window.openExternalNavigation = (address) => {
        // Encode the address for URL
        const encodedAddress = encodeURIComponent(address);
        
        // Check if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Try to open in native maps app
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
            window.open(googleMapsUrl, '_blank');
        } else {
            // Open in Google Maps web version
            const webMapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
            window.open(webMapsUrl, '_blank');
        }
    };
    
    // Update driver location on map in real-time
    window.updateDriverLocationOnMap = (newLocation) => {
        if (window.driverMapInstance && window.currentRoute) {
            showDriverRoute(window.currentRoute, newLocation);
        }
    };
    
    // Store route for real-time updates
    window.currentRoute = route;
};

// --- Event Handlers ---
const handleMarkComplete = async (e) => {
    const { taskId, tripLogId } = e.target.dataset;
    const button = e.target;
    button.disabled = true;
    button.textContent = '📍 Confirming delivery...';
    
    try {
        // Update tracking mode to delivering (more frequent updates)
        if (window.activeLocationTracker) {
            window.activeLocationTracker.setMode('delivering');
        }
        
        await updateTaskStatus(tripLogId, taskId, 'completed');
        
        // Manually trigger KPI update to ensure it's refreshed
        console.log('🔄 Triggering KPI update after task completion...');
        try {
            const kpis = await fetchCurrentKPIs();
            if (window.updateKPIDisplay) {
                window.updateKPIDisplay(kpis);
            }
        } catch (error) {
            console.error('Error refreshing KPIs:', error);
        }
        
        // Check if all tasks are completed
        setTimeout(() => {
            const completedButtons = document.querySelectorAll('.mark-complete-btn');
            if (completedButtons.length === 0) {
                // All tasks completed - stop location tracking
                console.log('🎉 All deliveries complete! Stopping location tracking.');
                if (window.activeLocationTracker) {
                    window.activeLocationTracker.stop();
                    window.activeLocationTracker = null;
                }
                
                // Update vehicle status to idle when all deliveries are complete
                // Try to get vehicle ID from multiple sources
                let vehicleId = document.body.dataset.currentVehicleId;
                
                if (!vehicleId) {
                    // Fallback: get from tripLogId (usually matches vehicleId)
                    vehicleId = tripLogId;
                }
                
                if (vehicleId) {
                    console.log(`🔄 Updating vehicle ${vehicleId} status to idle...`);
                    updateVehicleStatus(vehicleId, 'idle').then(() => {
                        console.log(`✅ Vehicle ${vehicleId} status updated to idle - all deliveries complete`);
                    }).catch(error => {
                        console.error(`❌ Failed to update vehicle status:`, error);
                    });
                } else {
                    console.warn('⚠️ Could not determine vehicle ID for status update');
                }
                
                // Update UI
                const toggleBtn = document.getElementById('toggle-location-btn');
                const statusText = document.getElementById('location-status-text');
                if (toggleBtn) {
                    toggleBtn.textContent = 'All Deliveries Complete';
                    toggleBtn.disabled = true;
                    toggleBtn.className = 'bg-gray-500 text-white font-bold py-2 px-4 rounded-md cursor-not-allowed';
                }
                if (statusText) {
                    statusText.textContent = 'Route Completed';
                    statusText.className = 'font-semibold text-blue-400';
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error("Failed to update task status:", error);
        button.disabled = false;
        button.textContent = '📦 Mark as Delivered';
    }
};

const handleTaskFormSubmit = async (taskData, taskId) => {
    try {
        await createOrUpdateTask(taskId, taskData);
    } catch (error) {
        console.error("Error saving task:", error);
        alert("Error saving task. See console for details.");
    }
};

const handleVehicleFormSubmit = async (vehicleData, vehicleId) => {
    try {
        await createOrUpdateVehicle(vehicleId, vehicleData);
    } catch (error) {
        console.error("Error saving vehicle:", error);
        alert("Error saving vehicle. See console for details.");
    }
};

const handleEditTask = (e, tasks) => {
    const taskId = e.target.dataset.taskId;
    const taskToEdit = tasks.find(t => t.id === taskId);
    openTaskModal(handleTaskFormSubmit, taskToEdit);
};

const handleDeleteTask = async (e) => {
    const taskId = e.target.dataset.taskId;
    if (confirm('Are you sure you want to delete this task?')) {
        await deleteTask(taskId);
    }
};

const handleEditVehicle = (e, vehicles) => {
    const vehicleId = e.target.dataset.vehicleId;
    const vehicleToEdit = vehicles.find(v => v.id === vehicleId);
    openVehicleModal(handleVehicleFormSubmit, vehicleToEdit);
};

const handleDeleteVehicle = async (e) => {
    const vehicleId = e.target.dataset.vehicleId;
    if (confirm('Are you sure you want to remove this vehicle?')) {
        await deleteVehicle(vehicleId);
    }
};

const handleOptimization = async () => {
    const statusEl = document.getElementById('optimization-status');
    if (!statusEl) return;
    statusEl.textContent = 'Fetching data...';
    try {
        const tasks = await fetchTasksForOptimization();
        
        // Correctly get a promise of vehicles
        let vehiclesPromise = new Promise(resolve => {
            const unsubscribe = fetchLiveVehicles(v => {
                unsubscribe(); // Stop listening once we have the data
                resolve(v);
            });
        });
        
        const vehicles = await vehiclesPromise;

        if (tasks.length === 0 || vehicles.length === 0) {
            statusEl.textContent = "Not enough data to optimize.";
            renderOptimizedRoutes([]);
            return;
        }

        statusEl.textContent = 'Optimizing routes...';
        const result = await optimizeRouteHandler(tasks, vehicles);
        const routes = result.routes || [];
        console.log('📊 Optimization completed:', { routes, vehicles });
        renderOptimizedRoutes(routes);
        
        console.log('💾 Saving routes to Firebase...');
        await saveOptimizedRoutesAsTripLogs(routes, vehicles);
        console.log('✅ Routes saved to Firebase successfully');
        
        // Update vehicle status for assigned routes
        for (const route of routes) {
            const jobSteps = route.steps.filter(step => step.type === 'job');
            if (jobSteps.length > 0) {
                await updateVehicleStatus(route.vehicle, 'assigned');
            }
        }
        
        statusEl.textContent = 'Optimization complete. Routes assigned to drivers.';

    } catch (error) {
        console.error("Optimization failed:", error);
        statusEl.textContent = 'Optimization failed. See console.';
    }
};

// Handle complete system reset
const handleCompleteSystemReset = async () => {
    const confirmed = confirm(
        'Are you sure you want to reset ALL system data?\n\n' +
        'This will permanently delete:\n' +
        '• All delivery tasks and history\n' +
        '• All vehicle routes and assignments\n' +
        '• All KPI data and metrics\n' +
        '• Vehicle status (will reset to available)\n\n' +
        'This action cannot be undone!'
    );
    
    if (confirmed) {
        try {
            console.log('Starting complete system reset...');
            await resetAllSystemData();
            alert('System reset complete! All data has been cleared.');
            
            // Force refresh the dispatcher dashboard to show empty state
            const appRoot = document.getElementById('app-root');
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.email === 'dispatcher@example.com') {
                appRoot.innerHTML = renderDispatcherDashboard(currentUser.email);
                setupDispatcherDashboard();
            }
        } catch (error) {
            console.error('Error during system reset:', error);
            alert('Error during system reset: ' + error.message);
        }
    }
};

// --- Utilities ---
const cleanupPreviousListeners = () => {
    console.log(`Cleaning up ${currentUnsubscribes.length} listeners`);
    currentUnsubscribes.forEach(unsubscribe => {
        try {
            unsubscribe();
        } catch (error) {
            console.error('Error cleaning up listener:', error);
        }
    });
    currentUnsubscribes = [];
    
    // Clean up driver dashboard state
    window.driverDashboardActive = null;
    if (window.activeLocationTracker) {
        window.activeLocationTracker.stop();
        window.activeLocationTracker = null;
    }
};

// --- Delivery History Functions ---
const loadDeliveryHistory = async (timeFilter = 'today') => {
    try {
        const history = await fetchDeliveryHistory(timeFilter);
        renderDeliveryHistory(history);
    } catch (error) {
        console.error("Error loading delivery history:", error);
    }
};

const renderDeliveryHistory = (deliveries) => {
    const container = document.getElementById('delivery-history-container');
    if (!container) return;

    if (deliveries.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No deliveries found for this period.</p>';
        return;
    }

    const historyHtml = deliveries.map(delivery => {
        const completedTime = new Date(delivery.completedAt.toDate());
        const statusColor = delivery.isOnTime ? 'text-green-400' : 'text-red-400';
        const statusIcon = delivery.isOnTime ? '✅' : '⏰';
        const statusBgColor = delivery.isOnTime ? 'bg-green-100' : 'bg-red-100';
        const statusTextColor = delivery.isOnTime ? 'text-green-800' : 'text-red-800';
        
        // Calculate time difference if deadline exists
        let timeDetail = '';
        try {
            // Try to get original task data to show deadline comparison
            // For now, show completion time and status
            timeDetail = delivery.isOnTime ? 'Delivered on schedule' : 'Delivered past deadline';
        } catch (error) {
            timeDetail = 'Time data unavailable';
        }
        
        return `
            <div class="bg-gray-700 p-3 rounded-lg mb-2 border-l-4 ${delivery.isOnTime ? 'border-green-400' : 'border-red-400'}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <div class="font-semibold text-white mb-1">${delivery.customerId}</div>
                        <div class="text-sm text-gray-300 mb-1">Vehicle: ${delivery.vehicleId}</div>
                        <div class="text-xs text-gray-400">Completed: ${completedTime.toLocaleString()}</div>
                        <div class="text-xs text-gray-400">${timeDetail}</div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-3">
                        <div class="px-2 py-1 rounded-full text-xs font-medium mb-1 ${statusBgColor} ${statusTextColor}">
                            ${statusIcon} ${delivery.isOnTime ? 'On Time' : 'Late'}
                        </div>
                        <div class="text-sm text-gray-400">${delivery.demandVolume} units</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = historyHtml;
};

// Global KPI update function
window.updateKPIDisplay = (kpis) => {
    renderReports(kpis);
    console.log('📊 KPI display updated:', kpis);
};

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', main);

