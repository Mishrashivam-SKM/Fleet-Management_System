/**
 * @file Main application controller with enhanced UI/UX integration
 * Features premium SaaS aesthetic with theme support and animations
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
    getCurrentUser,
    fetchExistingRoutes,
    listenForRouteChanges,
    cleanupCompletedRoutes,
    fetchDriverKPIs,
    listenForDriverDeliveryHistory 
} from './api/firestoreService.js';
import { initializeFirestore } from './api/setupFirestore.js';
import { initializeMap, updateVehicleMarkers, updateTaskMarkers, updateAllMarkers, initializeDriverMap, showDriverRoute } from './components/mapView.js';
import { renderDispatcherDashboard } from './components/dispatcherDashboard.js';
import { renderDriverDashboard } from './components/driverDashboard.js';
import { renderDashboardLayout, initializeDashboardLayout, showLoadingOverlay, hideLoadingOverlay } from './components/DashboardLayout.js';
import { renderDriverLayout, initializeDriverLayout, updateLocationStatus } from './components/DriverLayout.js';
import { renderLandingView, initializeLandingView } from './components/LandingView.js';
import { openTaskModal } from './components/TaskFormModal.js';
import { openVehicleModal } from './components/VehicleFormModal.js';
import { renderOptimizedRoutes } from './components/RoutesView.js';
import { optimizeRouteHandler } from './services/optimizationService.js';
import { renderReports } from './components/ReportsView.js';
import { startLocationTracking, stopLocationTracking } from './services/locationService.js';
import { initializeLazyLoading, registerForLazyLoading, addNonDisplacingAnimation } from './utils/lazyLoading.js';
import { themeManager } from './utils/themeManager.js';

// --- State ---
let currentUnsubscribes = [];
let isFirestoreInitialized = false;
let currentView = null; // 'landing', 'login', 'dashboard', or 'driver'
let authReadyPromise = null;
let isAppInitialized = false;

// Global navigation function (available everywhere) - Updated to accept numeric coordinates
window.openExternalNavigation = (lat, lng, originalAddress = null) => {
    console.log("🗺️ Opening external navigation for coordinates:", lat, lng);
    console.log("📍 Original address:", originalAddress);
    console.log("🔍 Coordinate types:", typeof lat, typeof lng);
    
    // Convert to numbers if they're strings
    const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
    const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    // Validate coordinates
    if (!numLat || !numLng || isNaN(numLat) || isNaN(numLng) || 
        numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        console.warn("⚠️ Invalid coordinates for navigation:", numLat, numLng);
        alert('⚠️ Invalid coordinates for navigation');
        return;
    }
    
    // Check if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let mapsUrl;
    
    // Prefer original address for better navigation experience
    if (originalAddress && originalAddress.trim() && originalAddress !== 'Address not available') {
        const encodedAddress = encodeURIComponent(originalAddress.trim());
        if (isMobile) {
            mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        } else {
            mapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
        }
        console.log("🏠 Using original address for navigation:", originalAddress);
    } else {
        // Use numeric coordinates directly
        if (isMobile) {
            mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}`;
        } else {
            mapsUrl = `https://www.google.com/maps/search/${numLat},${numLng}`;
        }
        console.log("📍 Using numeric coordinates for navigation:", numLat, numLng);
    }
    
    console.log("🗺️ Opening URL:", mapsUrl);
    window.open(mapsUrl, '_blank');
};

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

// --- Loading Animation Functions ---
const showFirebaseLoading = () => {
    const loadingScreen = document.getElementById('firebase-loading');
    const appContainer = document.getElementById('app-container');
    
    if (loadingScreen && appContainer) {
        loadingScreen.classList.remove('hidden');
        appContainer.style.display = 'none';
    }
};

const hideFirebaseLoading = () => {
    const loadingScreen = document.getElementById('firebase-loading');
    const appContainer = document.getElementById('app-container');
    
    if (loadingScreen && appContainer) {
        loadingScreen.classList.add('hidden');
        appContainer.style.display = 'block';
    }
};

const updateLoadingProgress = (progress, status) => {
    const progressBar = document.getElementById('loading-progress');
    const statusText = document.getElementById('loading-status');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    if (statusText) {
        statusText.textContent = status;
    }
};

// --- Main Application Controller ---
const main = async () => {
    console.log('🚀 Fleet Command - Application Starting...');
    
    // Show loading animation
    showFirebaseLoading();
    updateLoadingProgress(10, 'Initializing Firebase...');
    
    try {
        // Initialize Firebase and theme first
        initializeFirebase();
        updateLoadingProgress(30, 'Configuring theme system...');
        initializeTheme();
        
        updateLoadingProgress(50, 'Setting up database collections...');
        // Initialize Firestore collections if needed
        await initializeFirebaseCollections();
        
        updateLoadingProgress(70, 'Configuring authentication...');
        // Set up authentication state listener
        onAuthStateChangedHandler(handleAuthStateChange);
        
        updateLoadingProgress(85, 'Initializing lazy loading...');
        // Initialize lazy loading system
        initializeLazyLoading();
        
        updateLoadingProgress(90, 'Loading user interface...');
        
        // Mark app as initialized BEFORE checking auth state
        isAppInitialized = true;
        
        // Create auth ready promise for synchronization - wait longer for Firebase auth
        authReadyPromise = new Promise((resolve) => {
            let hasResolved = false;
            const resolveOnce = (user) => {
                if (!hasResolved) {
                    hasResolved = true;
                    resolve(user);
                }
            };
            
            // Set up temporary listener with timeout fallback
            const unsubscribe = onAuthStateChangedHandler((user) => {
                console.log('🔐 Initial auth state detected:', user?.email || 'No user');
                unsubscribe(); // Remove this temporary listener
                resolveOnce(user);
            });
            
            // Fallback timeout to prevent infinite loading
            setTimeout(() => {
                console.log('⏰ Auth state timeout - proceeding without user');
                resolveOnce(null);
            }, 5000); // 5 second timeout
        });
        
        // Wait for auth state to be determined
        const initialUser = await authReadyPromise;
        
        // Now set up the permanent auth state listener AFTER initial resolution
        onAuthStateChangedHandler(handleAuthStateChange);
        
        // Handle initial user state with robust loading
        if (initialUser) {
            console.log('👤 User already authenticated:', initialUser.email);
            updateLoadingProgress(95, 'Loading user dashboard...');
            await loadDashboard(initialUser);
        } else {
            console.log('👋 No authenticated user, showing landing page');
            updateLoadingProgress(95, 'Loading landing page...');
            loadLandingView();
        }
        
        updateLoadingProgress(100, 'Initialization complete!');
        
        // Hide loading screen after a short delay to show completion
        setTimeout(() => {
            hideFirebaseLoading();
        }, 800);
        
        console.log('✅ Application initialization complete');
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        updateLoadingProgress(100, 'Initialization failed. Please refresh.');
        
        // Show error and hide loading after delay
        setTimeout(() => {
            hideFirebaseLoading();
            showNotification('Failed to initialize application. Please refresh the page.', 'error');
        }, 2000);
    }
};

// --- Firebase Collections Initialization ---
const initializeFirebaseCollections = async () => {
    if (!isFirestoreInitialized) {
        try {
            const db = getFirestore();
            const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
            if (vehiclesSnapshot.empty) {
                console.log("🔧 Initializing Firestore collections...");
                await initializeFirestore();
                console.log("✅ Firestore collections initialized");
            } else {
                console.log("✅ Firestore collections already exist");
            }
            isFirestoreInitialized = true;
        } catch (error) {
            console.error("❌ Error checking/initializing Firestore:", error);
        }
    }
};

// --- Authentication State Change Handler ---
const handleAuthStateChange = async (user) => {
    console.log('🔐 Auth state changed:', user ? user.email : 'No user');
    
    // Prevent race conditions - ensure app is fully initialized
    if (!isAppInitialized) {
        console.log('⏳ App not ready yet, queuing auth state change...');
        // Queue this change for when app is ready
        setTimeout(() => handleAuthStateChange(user), 100);
        return;
    }
    
    // Clean up previous listeners and state
    cleanupPreviousListeners();
    
    try {
        if (user) {
            // User is authenticated - load appropriate dashboard
            console.log('👤 Loading dashboard for authenticated user:', user.email);
            await loadDashboard(user);
        } else {
            // User is not authenticated - show landing page
            console.log('👋 Loading landing page for unauthenticated state');
            loadLandingView();
        }
    } catch (error) {
        console.error('❌ Error handling auth state change:', error);
        // Fallback to landing page on error
        loadLandingView();
    }
};

// --- View Loading Functions ---

/**
 * Loads the landing page for unauthenticated users
 */
const loadLandingView = () => {
    if (currentView === 'landing') return; // Avoid re-rendering
    
    console.log('🏠 Loading Landing View');
    currentView = 'landing';
    
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error('❌ App container not found');
        return;
    }
    
    // Render landing view
    appContainer.innerHTML = renderLandingView(handleGetStarted);
    
    // Initialize landing view behavior
    initializeLandingView(handleGetStarted);
    
    console.log('✅ Landing View loaded successfully');
};

/**
 * Loads the login view when user clicks "Get Started"
 */
const loadLoginView = () => {
    if (currentView === 'login') return; // Avoid re-rendering
    
    console.log('🔑 Loading Login View');
    currentView = 'login';
    
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error('❌ App container not found');
        return;
    }
    
    // Clear current content and render login interface
    appContainer.innerHTML = `
        <div id="login-container" class="relative min-h-screen flex items-center justify-center p-4">
            <!-- Animated Background -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft" style="animation-delay: 1s;"></div>
            </div>

            <!-- Login Card -->
            <div class="relative w-full max-w-md animate-slide-up">
                <!-- Logo and Header -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl shadow-lg animate-glow">
                        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold theme-text-primary mb-2">Fleet Command</h1>
                    <p class="theme-text-muted font-medium">Advanced Fleet Management Platform</p>
                </div>

                <!-- Login Form Card -->
                <div class="theme-card p-8 shadow-2xl">
                    <form id="login-form" class="space-y-6">
                        <div class="space-y-4">
                            <div class="animate-slide-up" style="animation-delay: 0.1s;">
                                <label for="email" class="block text-sm font-semibold theme-text-muted mb-2">Email Address</label>
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    autocomplete="email" 
                                    required 
                                    placeholder="Enter your email"
                                    class="w-full px-4 py-3 theme-input rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                >
                            </div>

                            <div class="animate-slide-up" style="animation-delay: 0.2s;">
                                <label for="password" class="block text-sm font-semibold theme-text-muted mb-2">Password</label>
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    autocomplete="current-password" 
                                    required 
                                    placeholder="Enter your password"
                                    class="w-full px-4 py-3 theme-input rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                >
                            </div>
                        </div>

                        <div class="animate-slide-up" style="animation-delay: 0.3s;">
                            <button 
                                type="submit" 
                                id="login-btn"
                                class="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <span class="flex items-center justify-center">
                                    <span id="login-text">Sign In</span>
                                    <svg id="login-spinner" class="animate-spin -mr-1 ml-3 h-4 w-4 text-white hidden" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                            </button>
                        </div>

                        <div id="auth-error" class="hidden animate-slide-down">
                            <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p id="auth-error-text" class="text-sm text-red-400"></p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8 animate-slide-up" style="animation-delay: 0.5s;">
                    <p class="theme-text-muted text-sm">
                        Secure • Real-time • Intelligent
                    </p>
                </div>
            </div>
        </div>

        <!-- App Root for dashboards -->
        <div id="app-root" class="hidden"></div>
    `;
    
    // Initialize login form handlers after DOM is ready
    setTimeout(() => {
        initializeLoginHandlers();
    }, 100);
    
    console.log('✅ Login View loaded successfully');
};

/**
 * Loads the appropriate dashboard based on user role with enhanced persistence
 */
const loadDashboard = async (user) => {
    const userRole = getUserRole(user.email);
    
    if (currentView === `dashboard-${userRole}`) {
        console.log(`📊 Dashboard already loaded for ${userRole}, refreshing data...`);
        // Refresh data instead of skipping
        try {
            if (userRole === 'dispatcher') {
                await refreshDispatcherData();
            } else {
                await refreshDriverData(user.email);
            }
        } catch (error) {
            console.error('❌ Error refreshing dashboard data:', error);
        }
        return;
    }
    
    console.log(`📊 Loading ${userRole} Dashboard for:`, user.email);
    currentView = `dashboard-${userRole}`;
    
    const loginContainer = document.getElementById('login-container');
    const appRoot = document.getElementById('app-root');
    
    if (!loginContainer || !appRoot) {
        console.error('❌ Required containers not found');
        return;
    }
    
    // Hide login and show app
    loginContainer.classList.add('hidden');
    appRoot.classList.remove('hidden');
    
    // Show loading state while loading dashboard
    appRoot.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gray-900">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p class="text-gray-300">Loading ${userRole} dashboard...</p>
            </div>
        </div>
    `;
    
    try {
        if (userRole === 'dispatcher') {
            await loadDispatcherDashboard(user);
        } else {
            await loadDriverDashboard(user);
        }
        
        console.log(`✅ ${userRole} Dashboard loaded successfully`);
    } catch (error) {
        console.error(`❌ Error loading ${userRole} dashboard:`, error);
        
        // Show error state
        appRoot.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-900">
                <div class="text-center p-6 bg-gray-800 rounded-lg border border-red-500">
                    <div class="text-red-400 text-4xl mb-4">⚠️</div>
                    <h2 class="text-xl font-semibold text-red-400 mb-2">Dashboard Loading Failed</h2>
                    <p class="text-gray-300 mb-4">Unable to load dashboard data. This might be a connectivity issue.</p>
                    <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
};

/**
 * Loads dispatcher dashboard
 */
const loadDispatcherDashboard = async (user) => {
    const dashboardContent = renderDispatcherDashboard(user.email);
    const appRoot = document.getElementById('app-root');
    
    appRoot.innerHTML = renderDashboardLayout(user.email, dashboardContent);
    initializeDashboardLayout(handleSignOut);
    await setupDispatcherDashboard();
};

/**
 * Loads driver dashboard
 */
const loadDriverDashboard = async (user) => {
    const dashboardContent = renderDriverDashboard(user.email);
    const appRoot = document.getElementById('app-root');
    
    appRoot.innerHTML = renderDriverLayout(user.email, dashboardContent);
    initializeDriverLayout(handleSignOut, handleLocationToggle);
    await setupDriverDashboard(user.email);
};

// --- Data Refresh Functions for Persistence ---

/**
 * Refresh dispatcher dashboard data after authentication
 */
const refreshDispatcherData = async () => {
    console.log('🔄 Refreshing dispatcher dashboard data...');
    try {
        // Re-setup dispatcher dashboard to reload all data
        await setupDispatcherDashboard();
    } catch (error) {
        console.error('❌ Error refreshing dispatcher data:', error);
    }
};

/**
 * Refresh driver dashboard data after authentication
 */
const refreshDriverData = async (userEmail) => {
    console.log('🔄 Refreshing driver dashboard data for:', userEmail);
    try {
        // Re-setup driver dashboard to reload route data
        await setupDriverDashboard(userEmail);
    } catch (error) {
        console.error('❌ Error refreshing driver data:', error);
    }
};

// --- Event Handlers ---

/**
 * Handler for "Get Started" button clicks
 */
const handleGetStarted = () => {
    console.log('👆 Get Started clicked - navigating to login');
    loadLoginView();
};

/**
 * Handler for sign out
 */
const handleSignOut = async () => {
    try {
        console.log('👋 Signing out user');
        cleanupPreviousListeners();
        await signOutUser();
        
        // Show notification
        showNotification('Signed out successfully', 'success');
        
        // Navigate back to landing page
        loadLandingView();
        
        console.log('✅ Sign out successful');
    } catch (error) {
        console.error('❌ Sign out error:', error);
        showNotification('Error signing out', 'error');
    }
};

/**
 * Initialize login form handlers
 */
const initializeLoginHandlers = () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.error('❌ Login form not found');
        return;
    }
    
    // Remove existing listeners
    loginForm.replaceWith(loginForm.cloneNode(true));
    const newLoginForm = document.getElementById('login-form');
    
    const errorEl = document.getElementById('auth-error');
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');

    newLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(newLoginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Clear previous errors
        if (errorEl) errorEl.classList.add('hidden');
        
        // Show loading state
        if (loginBtn) loginBtn.disabled = true;
        if (loginText) loginText.textContent = 'Signing in...';
        if (loginSpinner) loginSpinner.classList.remove('hidden');
        
        try {
            await handleAuth(email, password);
            console.log('✅ Login successful:', email);
            showNotification('Login successful!', 'success');
        } catch (error) {
            console.error("❌ Authentication failed:", error);
            
            // Show error with animation
            if (errorEl && document.getElementById('auth-error-text')) {
                const errorTextEl = document.getElementById('auth-error-text');
                errorTextEl.textContent = "Login failed. Please check your credentials.";
                errorEl.classList.remove('hidden');
            }
            
            showNotification('Login failed. Please check your credentials.', 'error');
            
            // Reset button state
            if (loginBtn) loginBtn.disabled = false;
            if (loginText) loginText.textContent = 'Sign In';
            if (loginSpinner) loginSpinner.classList.add('hidden');
        }
    });
    
    console.log('✅ Login handlers initialized');
};

// --- Utility Functions ---

/**
 * Determines user role based on email
 */
const getUserRole = (email) => {
    return email === 'dispatcher@example.com' ? 'dispatcher' : 'driver';
};

// --- Dashboard Setups ---
const setupDispatcherDashboard = async () => {
    console.log("🔧 Starting dispatcher dashboard setup...");
    
    try {
        // Ensure Firebase is ready before setting up listeners
        console.log("📋 Checking Firebase readiness...");
        const currentUser = getCurrentUser();
        console.log("👤 Current user:", currentUser ? currentUser.email : "None");
        
        // Wait a bit longer to ensure Firebase collections are initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize map with lazy loading - immediate setup
        try {
            console.log("Setting up lazy loading for dispatcher map...");
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) {
                console.error("Map container 'map-container' not found in DOM");
            } else {
                // Set up lazy loading for the map
                mapContainer.dataset.lazyComponent = 'map';
                registerForLazyLoading(mapContainer);
                console.log("Map lazy loading registered successfully");
                
                // Set up observer to detect when map is initialized
                const mapObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.target.classList.contains('leaflet-container') && window.pendingMapUpdate) {
                            console.log("Map initialized, applying pending updates");
                            updateAllMarkers(window.pendingMapUpdate.vehicles, window.pendingMapUpdate.tasks);
                            window.pendingMapUpdate = null;
                            mapObserver.disconnect();
                        }
                    });
                });
                
                mapObserver.observe(mapContainer, { attributes: true, attributeFilter: ['class'] });
            }
        } catch (mapError) {
            console.error("Error setting up map lazy loading:", mapError);
            // Fallback to direct initialization
            try {
                const mapInstance = initializeMap('map-container');
                if (mapInstance && window.pendingMapUpdate) {
                    updateAllMarkers(window.pendingMapUpdate.vehicles, window.pendingMapUpdate.tasks);
                    window.pendingMapUpdate = null;
                }
            } catch (fallbackError) {
                console.error("Fallback map initialization also failed:", fallbackError);
            }
        }
        
        // Set up real-time listeners with timeout fallbacks
        console.log("Setting up Firebase listeners for tasks and vehicles...");
        
        // Set up tasks listener with smart update detection
        let tasksLoaded = false;
        let currentTasks = [];
        let previousTasksHash = '';
        const taskUnsubscribe = listenForPendingTasks((tasks) => {
            tasksLoaded = true;
            const newTasksHash = JSON.stringify(tasks.map(t => ({ id: t.id, status: t.status, location: t.location })));
            
            // Only update if tasks actually changed
            if (newTasksHash !== previousTasksHash) {
                currentTasks = tasks;
                window.currentTasks = tasks; // Store globally for optimization refresh
                console.log("Tasks updated:", tasks.length, "tasks");
                renderPendingTasks(tasks);
                // Update map with both vehicles and tasks
                updateMapWithAllData();
                previousTasksHash = newTasksHash;
            } else {
                console.log("Tasks data unchanged, skipping map update");
            }
        });
        
        // Fallback for tasks if not loaded within 3 seconds
        setTimeout(async () => {
            if (!tasksLoaded) {
                console.warn("Tasks not loaded within 3 seconds, trying direct fetch...");
                try {
                    const { fetchPendingTasks } = await import('./api/firestoreService.js');
                    const tasks = await fetchPendingTasks();
                    console.log("📋 Direct fetch got", tasks.length, "tasks");
                    tasksLoaded = true;
                    currentTasks = tasks;
                    renderPendingTasks(tasks);
                    updateMapWithAllData();
                } catch (error) {
                    console.error("❌ Direct task fetch failed:", error);
                    const container = document.getElementById('pending-tasks-list');
                    if (container) {
                        container.innerHTML = `
                            <div class="text-center py-4 text-red-500">
                                <p class="text-sm">❌ Failed to load tasks</p>
                                <p class="text-xs text-gray-400 mt-1">Error: ${error.message}</p>
                            </div>
                        `;
                    }
                }
            }
        }, 3000);
        
        // Set up vehicles listener with smart update detection
        let vehiclesLoaded = false;
        let currentVehicles = [];
        let previousVehiclesHash = '';
        const vehicleUnsubscribe = fetchLiveVehicles((vehicles) => {
            vehiclesLoaded = true;
            const newVehiclesHash = JSON.stringify(vehicles.map(v => ({ id: v.id, liveStatus: v.liveStatus, liveLocation: v.liveLocation })));
            
            // Only update if vehicles actually changed
            if (newVehiclesHash !== previousVehiclesHash) {
                currentVehicles = vehicles;
                console.log("Vehicles updated:", vehicles.length, "vehicles");
                renderVehicleList(vehicles);
                // Update map with both vehicles and tasks
                updateMapWithAllData();
                previousVehiclesHash = newVehiclesHash;
            } else {
                console.log("Vehicles data unchanged, skipping map update");
            }
        });

        // Debounced function to update map with all current data - only when data changes
        let mapUpdateTimeout = null;
        function updateMapWithAllData() {
            // Clear any existing timeout to debounce updates
            if (mapUpdateTimeout) {
                clearTimeout(mapUpdateTimeout);
            }
            
            mapUpdateTimeout = setTimeout(() => {
                const mapContainer = document.getElementById('map-container');
                if (!mapContainer) {
                    console.log("Map container not found, skipping marker update");
                    return;
                }
                
                // Only update if map is initialized
                if (mapContainer.classList.contains('leaflet-container')) {
                    try {
                        console.log(`🗺️ Updating map with ${currentVehicles.length} vehicles and ${currentTasks.length} tasks`);
                        updateAllMarkers(currentVehicles, currentTasks);
                    } catch (error) {
                        console.warn("Error updating markers:", error);
                    }
                } else {
                    console.log("Map not initialized yet, markers will be updated when map loads");
                    // Store the update request for when map is ready
                    window.pendingMapUpdate = { vehicles: currentVehicles, tasks: currentTasks };
                }
                mapUpdateTimeout = null;
            }, 300); // 300ms debounce delay
        }
        
        // Fallback for vehicles if not loaded within 3 seconds  
        setTimeout(async () => {
            if (!vehiclesLoaded) {
                console.warn("Vehicles not loaded within 3 seconds, trying direct fetch...");
                try {
                    // Create a direct fetch function for vehicles
                    const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                    const db = getFirestore();
                    const vehiclesCol = collection(db, 'vehicles');
                    const querySnapshot = await getDocs(vehiclesCol);
                    const vehicles = [];
                    querySnapshot.forEach((doc) => {
                        vehicles.push({ id: doc.id, ...doc.data() });
                    });
                    console.log("🚛 Direct fetch got", vehicles.length, "vehicles");
                    vehiclesLoaded = true;
                    currentVehicles = vehicles;
                    renderVehicleList(vehicles);
                    updateMapWithAllData();
                } catch (error) {
                    console.error("❌ Direct vehicle fetch failed:", error);
                    const container = document.getElementById('fleet-list');
                    if (container) {
                        container.innerHTML = `
                            <div class="text-center py-4 text-red-500">
                                <p class="text-sm">❌ Failed to load fleet</p>
                                <p class="text-xs text-gray-400 mt-1">Error: ${error.message}</p>
                            </div>
                        `;
                    }
                }
            }
        }, 3000);
        
        // Add real-time delivery history listener
        const deliveryHistoryUnsubscribe = listenForDeliveryHistory((deliveries) => {
            // Prevent rendering loops by only updating if DOM container exists
            const historyContainer = document.getElementById('delivery-history-container');
            if (historyContainer) {
                renderDeliveryHistory(deliveries);
            }
        });
        
        // Check if listeners were successfully created
        if (taskUnsubscribe) {
            currentUnsubscribes.push(taskUnsubscribe);
        } else {
            console.error("Failed to create task listener");
        }
        
        if (vehicleUnsubscribe) {
            currentUnsubscribes.push(vehicleUnsubscribe);
        } else {
            console.error("Failed to create vehicle listener");
        }
        
        if (deliveryHistoryUnsubscribe) {
            currentUnsubscribes.push(deliveryHistoryUnsubscribe);
        }
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
    
    // Load existing routes on dashboard initialization
    loadExistingRoutes();
    
    // Set up real-time route status listener for dispatcher
    const routeStatusUnsubscribe = listenForRouteChanges((routes) => {
        console.log('📊 Route status changed, updating display:', routes.length);
        renderOptimizedRoutes(routes);
        
        const statusEl = document.getElementById('optimization-status');
        if (statusEl && routes.length > 0) {
            statusEl.textContent = `✅ ${routes.length} active routes (auto-updated)`;
        }
    });
    
    if (routeStatusUnsubscribe) {
        currentUnsubscribes.push(routeStatusUnsubscribe);
    }

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

    // Set up real-time delivery history listener for this driver
    const driverDeliveryHistoryUnsubscribe = listenForDriverDeliveryHistory(driverEmail, (deliveries) => {
        console.log(`📦 Driver delivery history updated: ${deliveries.length} completed deliveries`);
        renderDriverDeliveryHistory(deliveries);
    });

    // Set up real-time KPI updates for this driver  
    const setupDriverKPIUpdates = async () => {
        try {
            const kpis = await fetchDriverKPIs(driverEmail);
            renderDriverKPIs(kpis);
            
            // Set up periodic KPI updates
            const kpiInterval = setInterval(async () => {
                try {
                    const updatedKpis = await fetchDriverKPIs(driverEmail);
                    renderDriverKPIs(updatedKpis);
                } catch (error) {
                    console.error('Error updating driver KPIs:', error);
                }
            }, 30000); // Update every 30 seconds

            // Store cleanup function
            if (!window.driverCleanupFunctions) window.driverCleanupFunctions = [];
            window.driverCleanupFunctions.push(() => clearInterval(kpiInterval));
            
        } catch (error) {
            console.error('Error setting up driver KPI updates:', error);
        }
    };

    // Initialize KPI updates
    setupDriverKPIUpdates();

    // Initialize driver map with lazy loading and glitch prevention
    try {
        console.log("Setting up lazy loading for driver map...");
        const driverMapContainer = document.getElementById('driver-map-container');
        if (driverMapContainer) {
            // Apply same map glitch fixes as dispatcher dashboard
            driverMapContainer.dataset.lazyComponent = 'driver-map';
            registerForLazyLoading(driverMapContainer);
            
            // Set up observer to detect when driver map is initialized
            const driverMapObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('leaflet-container') && window.pendingDriverMapUpdate) {
                        console.log("Driver map initialized, applying pending updates");
                        showDriverRoute(window.pendingDriverMapUpdate.route, window.pendingDriverMapUpdate.currentLocation);
                        window.pendingDriverMapUpdate = null;
                        driverMapObserver.disconnect();
                    }
                });
            });
            
            driverMapObserver.observe(driverMapContainer, { attributes: true, attributeFilter: ['class'] });
        }
    } catch (mapError) {
        console.error("Error setting up driver map lazy loading:", mapError);
    }

    // Store unsubscribe functions for cleanup
    if (driverDeliveryHistoryUnsubscribe) {
        currentUnsubscribes.push(driverDeliveryHistoryUnsubscribe);
    }
    
    // Setup a real-time listener for the driver's route
    const routeCallback = (route) => {
        console.log("Route callback received for driver:", driverEmail, route ? "Route found" : "No route");
        
        // Store for potential refresh needs
        window.lastDriverRoute = route;
        window.currentDriverRouteCallback = routeCallback;
        
        // Store the driver email for cleanup
        window.currentDriverEmail = driverEmail;
        
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            if (route && route.tasks && route.tasks.length > 0) {
                console.log("🚛 Rendering driver tasks and updating map:", route.tasks);
                renderDriverTasks(route.tasks, route.id); // Pass tripLogId
                currentVehicleId = route.vehicleId;
                
                // Store vehicle ID in DOM for later access
                document.body.dataset.currentVehicleId = currentVehicleId;
                
                // Update vehicle status to 'on_route' when route is assigned
                if (currentVehicleId) {
                    updateVehicleStatus(currentVehicleId, 'on_route');
                }

                // Real-time map update for driver route
                const updateDriverMap = () => {
                    const driverMapContainer = document.getElementById('driver-map-container');
                    if (driverMapContainer && driverMapContainer.classList.contains('leaflet-container')) {
                        try {
                            // Get current location for map centering
                            let currentLocation = { lat: 19.2183, lng: 72.9781 }; // Default location
                            
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        currentLocation = {
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude
                                        };
                                        console.log("📍 Real-time location updated for driver map");
                                        showDriverRoute(route, currentLocation);
                                    },
                                    (error) => {
                                        console.warn("Geolocation error, using default location:", error);
                                        showDriverRoute(route, currentLocation);
                                    },
                                    { timeout: 5000, enableHighAccuracy: false }
                                );
                            } else {
                                showDriverRoute(route, currentLocation);
                            }
                        } catch (error) {
                            console.error("Error updating driver map:", error);
                        }
                    } else {
                        // Store the update request for when map is ready
                        console.log("Driver map not ready, storing update for later");
                        window.pendingDriverMapUpdate = { 
                            route: route, 
                            currentLocation: { lat: 19.2183, lng: 72.9781 } 
                        };
                    }
                };

                // Initial map update
                updateDriverMap();

                // Set up periodic map updates for real-time tracking
                if (window.driverMapUpdateInterval) {
                    clearInterval(window.driverMapUpdateInterval);
                }
                window.driverMapUpdateInterval = setInterval(updateDriverMap, 30000); // Update every 30 seconds
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
    };
    
    const unsubscribe = getDriverRoute(driverEmail, routeCallback);
    
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
        : tasks.map(task => {
            // Geocoding confidence indicator
            let geocodingBadge = '';
            if (task.geocodingConfidence) {
                const confidenceColor = task.geocodingConfidence === 'high' ? 'bg-green-500' : 
                                       task.geocodingConfidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
                const confidenceIcon = task.geocodingConfidence === 'high' ? '✓' : 
                                      task.geocodingConfidence === 'medium' ? '⚠' : '!';
                geocodingBadge = `<span class="${confidenceColor} text-white text-xs px-1 py-0.5 rounded ml-1" title="Geocoding confidence: ${task.geocodingConfidence}">${confidenceIcon}</span>`;
            }
            
            return `
            <li class="p-4 theme-card rounded-lg shadow mb-3">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <span class="font-semibold theme-text-primary">${task.customerId}</span>
                            <span class="text-sm theme-text-secondary ml-2">(Vol: ${task.demandVolume})</span>
                            ${geocodingBadge}
                        </div>
                        <p class="text-sm theme-text-secondary">${task.originalAddress || task.deliveryAddress}</p>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button class="edit-task-btn text-blue-500 hover:text-blue-600 text-sm px-3 py-1.5 border border-blue-500 rounded-md transition-colors" data-task-id="${task.id}">Edit</button>
                        <button class="delete-task-btn text-red-500 hover:text-red-600 text-sm px-3 py-1.5 border border-red-500 rounded-md transition-colors" data-task-id="${task.id}">Delete</button>
                    </div>
                </div>
            </li>
            `;
        }).join('');
    
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
                <li class="p-4 theme-card rounded-lg shadow mb-3">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-semibold text-lg theme-text-primary">${v.id}</span>
                            <span class="text-sm theme-text-secondary ml-2">(${v.driverName})</span>
                        </div>
                        <div class="flex space-x-2">
                            <button class="edit-vehicle-btn text-blue-500 hover:text-blue-600 text-xs px-3 py-1.5 border border-blue-500 rounded-md transition-colors" data-vehicle-id="${v.id}">Edit</button>
                            <button class="delete-vehicle-btn text-red-500 hover:text-red-600 text-xs px-3 py-1.5 border border-red-500 rounded-md transition-colors" data-vehicle-id="${v.id}">Delete</button>
                        </div>
                    </div>
                    <div class="text-sm space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="theme-text-secondary">Status:</span>
                            <span class="${statusColor} font-semibold px-2 py-1 rounded text-xs">${v.liveStatus || 'idle'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="theme-text-secondary">Location:</span>
                            <span class="theme-text-muted text-xs">${locationText}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="theme-text-secondary">Last Update:</span>
                            <span class="theme-text-muted text-xs">${lastUpdate}</span>
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

    // Prepare route object that will be shared with map and instructions
    let route = {
        tasks: tasks.map(task => {
            // Normalize coordinates from multiple possible shapes
            let coordinates = null;
            if (task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number') {
                coordinates = { lat: task.coordinates.lat, lng: task.coordinates.lng };
            } else if (task.location && (task.location.latitude !== undefined && task.location.longitude !== undefined)) {
                const lat = typeof task.location.latitude === 'function' ? task.location.latitude() : task.location.latitude;
                const lng = typeof task.location.longitude === 'function' ? task.location.longitude() : task.location.longitude;
                if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                    coordinates = { lat, lng };
                }
            } else if (task.deliveryLocation && (task.deliveryLocation.latitude !== undefined && task.deliveryLocation.longitude !== undefined)) {
                const lat = typeof task.deliveryLocation.latitude === 'function' ? task.deliveryLocation.latitude() : task.deliveryLocation.latitude;
                const lng = typeof task.deliveryLocation.longitude === 'function' ? task.deliveryLocation.longitude() : task.deliveryLocation.longitude;
                if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                    coordinates = { lat, lng };
                }
            }

            // Preserve original address if available for better Maps navigation
            const originalAddress = task.originalAddress || task.deliveryAddress || task.geocodedAddress || '';

            return {
                id: task.id,
                customerId: task.customerId, // User-entered customer name
                customerName: task.customerId, // For backward compatibility
                address: originalAddress,
                originalAddress,
                coordinates,
                status: task.status
            };
        })
    };
    
    console.log("🐛 DEBUG: Route object prepared for driver:", route);
    console.log("🐛 DEBUG: Sample task:", route.tasks[0]);

    // Initialize driver map after DOM is ready with lazy loading
    setTimeout(() => {
        try {
            console.log("Setting up lazy loading for driver map...");
            const driverMapContainer = document.getElementById('driver-map-container');
            if (driverMapContainer) {
                // Apply non-displacing animation to prevent layout shift
                addNonDisplacingAnimation(driverMapContainer, 'fade-in');
            }
            
            console.log("Initializing driver map...");
            const driverMap = initializeDriverMap();
            
            // route already prepared above
            
            // Show route on map (will get current location automatically)
            if (navigator.geolocation) {
                console.log("🌍 Requesting geolocation permission...");
                navigator.geolocation.getCurrentPosition((position) => {
                    const currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("🎯 Current location obtained:", currentLocation);
                    showDriverRoute(route, currentLocation);
                }, (error) => {
                    console.warn("⚠️ Geolocation error:", error.message);
                    console.log("📍 Using fallback location (Thane, Mumbai)");
                    // Use Thane as fallback location (more accurate for demo)
                    const fallbackLocation = { lat: 19.2183, lng: 72.9781 };
                    showDriverRoute(route, fallbackLocation);
                    
                    // Force map to show markers even without precise location
                    setTimeout(() => {
                        if (route.tasks && route.tasks.length > 0) {
                            const validTasks = route.tasks.filter(t => t.coordinates);
                            console.log(`🗺️ Ensuring ${validTasks.length} task markers are visible`);
                        }
                    }, 1000);
                }, {
                    enableHighAccuracy: false, // More forgiving for demo
                    timeout: 5000, // Shorter timeout
                    maximumAge: 300000 // 5 minutes cache
                });
            } else {
                console.warn("⚠️ Geolocation not supported, using fallback location");
                const fallbackLocation = { lat: 19.2183, lng: 72.9781 };
                showDriverRoute(route, fallbackLocation);
            }
        } catch (error) {
            console.error("Error initializing driver map:", error);
        }
    }, 500);
    
    // Progress bar
    const progressHtml = `
        <div class="mb-4 theme-card rounded-lg p-4">
            <div class="flex justify-between text-sm mb-3">
                <span class="theme-text-primary font-medium">Delivery Progress</span>
                <span class="theme-text-secondary font-medium">${completedTasks}/${totalTasks} completed</span>
            </div>
            <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3">
                <div class="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out" style="width: ${totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0}%"></div>
            </div>
            ${totalTasks > 0 ? `<p class="text-xs theme-text-muted mt-2">${Math.round((completedTasks/totalTasks)*100)}% complete</p>` : ''}
        </div>
    `;
    
    const tasksHtml = tasks.map((task, index) => {
        // Extract coordinates for display (same logic as used for map)
        let coordinates = null;
        let coordinateDisplay = 'Location: Not available';
        
        console.log(`🔍 Debugging coordinates for task ${task.id}:`, task);
        
        // Try different coordinate sources with comprehensive validation
        if (task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number' && 
            !isNaN(task.coordinates.lat) && !isNaN(task.coordinates.lng) && 
            task.coordinates.lat >= -90 && task.coordinates.lat <= 90 && 
            task.coordinates.lng >= -180 && task.coordinates.lng <= 180) {
            coordinates = task.coordinates;
            console.log(`✅ Found valid coordinates in task.coordinates:`, coordinates);
        } else if (task.location && task.location.latitude !== undefined && task.location.longitude !== undefined) {
            // Handle Firebase GeoPoint or plain object
            const lat = typeof task.location.latitude === 'function' ? task.location.latitude() : task.location.latitude;
            const lng = typeof task.location.longitude === 'function' ? task.location.longitude() : task.location.longitude;
            
            if (typeof lat === 'number' && typeof lng === 'number' && 
                !isNaN(lat) && !isNaN(lng) &&
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates = { lat, lng };
                console.log(`✅ Found valid coordinates in task.location:`, coordinates);
            }
        } else if (task.deliveryLocation && task.deliveryLocation.latitude !== undefined && task.deliveryLocation.longitude !== undefined) {
            // Handle alternative location format
            const lat = typeof task.deliveryLocation.latitude === 'function' ? task.deliveryLocation.latitude() : task.deliveryLocation.latitude;
            const lng = typeof task.deliveryLocation.longitude === 'function' ? task.deliveryLocation.longitude() : task.deliveryLocation.longitude;
            
            if (typeof lat === 'number' && typeof lng === 'number' && 
                !isNaN(lat) && !isNaN(lng) &&
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates = { lat, lng };
                console.log(`✅ Found valid coordinates in task.deliveryLocation:`, coordinates);
            }
        } else {
            const coordMatch = task.deliveryAddress?.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/);
            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordinates = { lat, lng };
                    console.log(`✅ Extracted valid coordinates from deliveryAddress:`, coordinates);
                }
            }
            
            if (!coordinates) {
                console.warn(`⚠️ No valid coordinates found for task ${task.id}. Address: ${task.deliveryAddress}. Available fields:`, Object.keys(task));
            }
        }
        
        // Prefer original address for display (cleaner UI)
        const displayAddress = task.originalAddress || task.deliveryAddress;
        
        return `
        <div class="theme-card p-4 rounded-lg shadow mb-3 ${task.status === 'completed' ? 'opacity-75' : ''}">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <h4 class="font-bold text-lg theme-text-primary">${index + 1}. ${task.customerId}</h4>
                    <p class="text-sm theme-text-secondary mt-1">${displayAddress}</p>
                    <p class="text-xs theme-text-muted">Volume: ${task.demandVolume}</p>
                </div>
                <div class="ml-2">
                    ${task.status === 'completed' 
                        ? '<span class="text-green-500 font-semibold text-sm">✅ Done</span>'
                        : '<span class="text-yellow-500 font-semibold text-sm">⏳ Pending</span>'
                    }
                </div>
            </div>
            <div class="mt-3 flex gap-2">
                ${task.status === 'completed' 
                    ? ''
                    : `<button class="flex-1 bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 transition-colors mark-complete-btn" data-task-id="${task.id}" data-trip-log-id="${tripLogId}">📦 Mark as Delivered</button>`
                }
                ${displayAddress && coordinates?.lat && coordinates?.lng ? 
                    `<button onclick="window.openExternalNavigation(${coordinates.lat}, ${coordinates.lng}, '${displayAddress.replace(/'/g, "\\'")}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
                        🗺️ Navigate
                    </button>` : ''
                }
            </div>
        </div>
        `;
    }).join('');
    
    const completionMessage = allCompleted && totalTasks > 0 ? `
        <div class="bg-green-600 text-white p-4 rounded-lg mb-4 text-center border border-green-500">
            <h3 class="text-xl font-bold mb-2">🎉 All Deliveries Complete!</h3>
            <p class="text-sm opacity-90">Excellent work! All ${totalTasks} tasks have been delivered successfully.</p>
        </div>
    ` : '';
    
    container.innerHTML = progressHtml + completionMessage + tasksHtml;

    document.querySelectorAll('.mark-complete-btn').forEach(btn => btn.addEventListener('click', handleMarkComplete));
    
    // Make mark task delivered function globally available for map popups
    window.markTaskDelivered = async (taskId) => {
        try {
            await updateTaskStatus(tripLogId, taskId, 'completed');
            console.log(`Task ${taskId} marked as delivered from map`);
            
            // Update driver KPIs in real-time without page reload
            const currentDriverEmail = window.currentDriverEmail;
            if (currentDriverEmail) {
                console.log('🚛 Updating driver KPIs after map delivery...');
                try {
                    const driverKpis = await fetchDriverKPIs(currentDriverEmail);
                    renderDriverKPIs(driverKpis);
                    showNotification('Delivery completed from map! 🗺️✅', 'success');
                } catch (error) {
                    console.error('Error updating driver KPIs:', error);
                }
            }
            
            // Refresh map and task display without full page reload
            setTimeout(async () => {
                try {
                    // Fetch updated route data to reflect new task status
                    const currentUser = getCurrentUser();
                    if (currentUser && tripLogId) {
                        console.log('🔄 Fetching updated route after task completion...');
                        const updatedRoute = await getDriverRoute(currentUser.email);
                        
                        if (updatedRoute) {
                            // Update stored route data
                            window.lastDriverRoute = updatedRoute;
                            
                            // Refresh route callback with updated data
                            const routeCallback = window.currentDriverRouteCallback;
                            if (routeCallback) {
                                routeCallback(updatedRoute);
                            }
                            
                            // Refresh driver map with updated route to show current task status
                            const currentLocation = { lat: 19.2183, lng: 72.9781 };
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const location = {
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude
                                        };
                                        showDriverRoute(updatedRoute, location);
                                    },
                                    () => showDriverRoute(updatedRoute, currentLocation)
                                );
                            } else {
                                showDriverRoute(updatedRoute, currentLocation);
                            }
                            
                            console.log('✅ Map refreshed with updated task status');
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing route after task completion:', error);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error marking task as delivered:', error);
            showNotification('Failed to mark delivery as completed', 'error');
        }
    };
    
    // Navigation function already defined globally at the top
    
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
            // Update both global and driver-specific KPIs
            const kpis = await fetchCurrentKPIs();
            if (window.updateKPIDisplay) {
                window.updateKPIDisplay(kpis);
            }
            
            // Update driver-specific KPIs if we're in driver dashboard
            const currentDriverEmail = window.currentDriverEmail;
            if (currentDriverEmail) {
                console.log('🚛 Updating driver KPIs after task completion...');
                const driverKpis = await fetchDriverKPIs(currentDriverEmail);
                renderDriverKPIs(driverKpis);
                
                // Show success notification
                showNotification('Delivery completed successfully! 📦✅', 'success');
            }
        } catch (error) {
            console.error('Error refreshing KPIs:', error);
        }
        
        // Refresh the driver task display to reflect completion
        console.log('🔄 Refreshing task display after completion...');
        setTimeout(async () => {
            try {
                // Fetch updated route data to reflect new task status
                const currentUser = getCurrentUser();
                if (currentUser && currentDriverEmail) {
                    console.log('🔄 Fetching updated route after task completion...');
                    const updatedRoute = await getDriverRoute(currentUser.email);
                    
                    if (updatedRoute) {
                        // Update stored route data
                        window.lastDriverRoute = updatedRoute;
                        
                        // Refresh route callback with updated data
                        const routeCallback = window.currentDriverRouteCallback;
                        if (routeCallback) {
                            routeCallback(updatedRoute);
                        }
                        
                        // Refresh driver map with updated route to show current task status
                        console.log('🗺️ Refreshing driver map with updated route after task completion...');
                        const currentLocation = { lat: 19.2183, lng: 72.9781 }; // Default location
                        
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const location = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    };
                                    showDriverRoute(updatedRoute, location);
                                },
                                (error) => {
                                    showDriverRoute(updatedRoute, currentLocation);
                                }
                            );
                        } else {
                            showDriverRoute(updatedRoute, currentLocation);
                        }
                        
                        console.log('✅ Map refreshed with updated task status');
                    }
                }
            } catch (error) {
                console.error('Error refreshing route after task completion:', error);
            }
        }, 1000);
        
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
    const indicatorEl = document.getElementById('optimization-indicator');
    const optimizeBtn = document.getElementById('optimize-routes-btn');
    
    if (!statusEl) return;
    
    // Show loading state
    statusEl.textContent = 'Fetching data...';
    if (indicatorEl) {
        indicatorEl.classList.remove('hidden', 'bg-gray-500');
        indicatorEl.classList.add('bg-blue-400');
    }
    
    if (optimizeBtn) {
        optimizeBtn.disabled = true;
        optimizeBtn.innerHTML = `
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
        `;
    }
    
    try {
        const tasks = await fetchTasksForOptimization();
        
        // Get vehicles data
        let vehiclesPromise = new Promise(resolve => {
            const unsubscribe = fetchLiveVehicles(v => {
                unsubscribe();
                resolve(v);
            });
        });
        
        const vehicles = await vehiclesPromise;

        if (tasks.length === 0 || vehicles.length === 0) {
            statusEl.textContent = "Not enough data to optimize.";
            renderOptimizedRoutes([]);
            showNotification('Add tasks and vehicles before optimizing routes', 'warning');
            return;
        }

        statusEl.textContent = `Optimizing ${tasks.length} tasks for ${vehicles.length} vehicles...`;
        const result = await optimizeRouteHandler(tasks, vehicles);
        const routes = result.routes || [];
        
        console.log('📊 Optimization completed:', { routes, vehicles });
        renderOptimizedRoutes(routes);
        
        statusEl.textContent = 'Saving optimized routes...';
        await saveOptimizedRoutesAsTripLogs(routes, vehicles);
        
        // Update vehicle status for assigned routes
        let assignedVehicles = 0;
        for (const route of routes) {
            const jobSteps = route.steps.filter(step => step.type === 'job');
            if (jobSteps.length > 0) {
                await updateVehicleStatus(route.vehicle, 'assigned');
                assignedVehicles++;
            }
        }
        
        statusEl.textContent = `✅ ${routes.length} routes optimized, ${assignedVehicles} vehicles assigned`;
        
        if (indicatorEl) {
            indicatorEl.classList.remove('bg-blue-400');
            indicatorEl.classList.add('bg-green-400');
        }
        
        showNotification(`Successfully optimized ${routes.length} routes for delivery`, 'success');

    } catch (error) {
        console.error("Optimization failed:", error);
        statusEl.textContent = '❌ Optimization failed - check console for details';
        
        if (indicatorEl) {
            indicatorEl.classList.remove('bg-blue-400');
            indicatorEl.classList.add('bg-red-400');
        }
        
        showNotification('Route optimization failed. Please try again.', 'error');
    } finally {
        // Reset button state
        if (optimizeBtn) {
            optimizeBtn.disabled = false;
            optimizeBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Optimize Routes</span>
            `;
        }
    }
};

// Load existing routes from Firebase and display them
const loadExistingRoutes = async () => {
    try {
        const existingRoutes = await fetchExistingRoutes(false); // Exclude completed routes
        if (existingRoutes && existingRoutes.length > 0) {
            console.log('📊 Loading existing active routes:', existingRoutes.length);
            renderOptimizedRoutes(existingRoutes);
            
            const statusEl = document.getElementById('optimization-status');
            if (statusEl) {
                statusEl.textContent = `✅ ${existingRoutes.length} active routes loaded`;
            }
        } else {
            console.log('📊 No active routes found');
            const statusEl = document.getElementById('optimization-status');
            if (statusEl) {
                statusEl.textContent = 'No active routes - create tasks and optimize to begin';
            }
        }
    } catch (error) {
        console.error('Error loading existing routes:', error);
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
    window.lastDriverRoute = null;
    window.currentDriverRouteCallback = null;
    window.currentDriverEmail = null;
    if (window.activeLocationTracker) {
        window.activeLocationTracker.stop();
        window.activeLocationTracker = null;
    }
    
    // Clean up driver-specific intervals and functions
    if (window.driverMapUpdateInterval) {
        clearInterval(window.driverMapUpdateInterval);
        window.driverMapUpdateInterval = null;
    }
    
    if (window.driverCleanupFunctions) {
        window.driverCleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('Error running driver cleanup function:', error);
            }
        });
        window.driverCleanupFunctions = [];
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
        container.innerHTML = '<p class="theme-text-muted text-center py-4">No deliveries found for this period.</p>';
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
            <div class="theme-card p-4 rounded-lg mb-3 border-l-4 ${delivery.isOnTime ? 'border-green-500' : 'border-red-500'}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <div class="font-semibold theme-text-primary mb-2">${delivery.customerId}</div>
                        <div class="text-sm theme-text-secondary mb-1">Vehicle: ${delivery.vehicleId}</div>
                        <div class="text-xs theme-text-muted">Completed: ${completedTime.toLocaleString()}</div>
                        <div class="text-xs theme-text-muted">${timeDetail}</div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-4">
                        <div class="px-3 py-1 rounded-full text-xs font-medium mb-2 ${statusBgColor} ${statusTextColor}">
                            ${statusIcon} ${delivery.isOnTime ? 'On Time' : 'Late'}
                        </div>
                        <div class="text-sm theme-text-secondary">${delivery.demandVolume} units</div>
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

// --- Driver-Specific Rendering Functions ---

/**
 * Render driver-specific delivery history
 * @param {Array} deliveries - Array of completed deliveries for the driver
 */
const renderDriverDeliveryHistory = (deliveries) => {
    const container = document.getElementById('driver-delivery-history-container');
    if (!container) return;

    if (!deliveries || deliveries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <div class="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="font-medium mb-1">No deliveries yet</p>
                <p class="text-sm text-gray-400">Your completed deliveries will appear here</p>
            </div>
        `;
        return;
    }

    // Show recent deliveries (limit to 10)
    const recentDeliveries = deliveries.slice(0, 10);
    
    container.innerHTML = recentDeliveries.map((delivery, index) => {
        const deliveredAt = delivery.deliveredAt?.toDate ? 
            delivery.deliveredAt.toDate() : 
            new Date(delivery.deliveredAt);
        
        const timeStr = deliveredAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const dateStr = deliveredAt.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });

        return `
            <div class="bg-dark-600/50 rounded-lg p-4 border-l-4 border-green-500 animate-slide-up" style="animation-delay: ${index * 0.1}s;">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-semibold theme-text-primary">${delivery.customerId || delivery.customerName || 'Customer'}</h4>
                        <p class="text-sm theme-text-muted">${delivery.deliveryAddress || 'Address not available'}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs theme-text-muted">${dateStr}</div>
                        <div class="text-sm font-medium text-green-400">${timeStr}</div>
                    </div>
                </div>
                <div class="flex justify-between items-center text-xs theme-text-muted">
                    <span>${delivery.distanceTraveled ? `${delivery.distanceTraveled.toFixed(1)}km` : 'Distance N/A'}</span>
                    <div class="flex items-center space-x-2">
                        ${delivery.onTime !== false ? 
                            '<span class="text-green-400">⏱️ On Time</span>' : 
                            '<span class="text-orange-400">⏰ Delayed</span>'
                        }
                        <span class="text-yellow-400">${'⭐'.repeat(delivery.rating || 5)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

/**
 * Render driver-specific KPIs
 * @param {Object} kpis - Driver performance metrics
 */
const renderDriverKPIs = (kpis) => {
    // Update individual KPI elements with animation
    const updateKPIElement = (id, value, suffix = '') => {
        const element = document.getElementById(id);
        if (element) {
            const currentValue = element.textContent;
            const newValue = `${value}${suffix}`;
            
            if (currentValue !== newValue) {
                element.style.transform = 'scale(1.1)';
                element.style.transition = 'transform 0.2s ease';
                element.textContent = newValue;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        }
    };

    // Update each KPI with validation
    updateKPIElement('kpi-deliveries-today', kpis.deliveriesToday || 0);
    updateKPIElement('kpi-total-distance', kpis.totalDistance || '0.0', ' km');
    updateKPIElement('kpi-avg-rating', kpis.averageRating || '5.0', '/5');
    updateKPIElement('kpi-ontime-rate', kpis.onTimeRate || 100, '%');

    console.log('📊 Driver KPIs updated:', kpis);
};

// === UNIFIED THEME MANAGEMENT SYSTEM (Now using centralized ThemeManager) ===
const initializeTheme = () => themeManager.initialize();
const initializeThemeToggle = () => {}; // No longer needed - handled by ThemeManager

// --- Driver Location Toggle Handler ---
const handleLocationToggle = () => {
    const toggleBtn = document.getElementById('toggle-location-btn');
    if (toggleBtn) {
        toggleBtn.click(); // Trigger the existing location toggle logic
    }
};

// --- Enhanced UI Utilities ---
const showNotification = (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-slide-down ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${type === 'success' ? 
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' :
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
                }
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('animate-slide-up');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Make notification function globally available
window.showNotification = showNotification;

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', main);

