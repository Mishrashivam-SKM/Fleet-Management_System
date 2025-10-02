/**
 * @file Driver Layout Component - Provides consistent layout structure for driver dashboard
 * Features mobile-optimized navigation with location tracking status
 */

import { renderFooter, initializeFooter } from './Footer.js';

export const renderDriverLayout = (userEmail, content) => {
    return `
        <div class="app-bg min-h-screen transition-all duration-300">
            <!-- UNIFIED NAVIGATION HEADER -->
            <nav class="theme-nav sticky top-0 z-40 border-b shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <!-- Logo and Title -->
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg shadow-md">
                                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-lg font-bold theme-text-primary">Fleet Command</h1>
                                <p class="text-xs theme-text-muted hidden sm:block">Driver Navigation</p>
                            </div>
                        </div>

                        <!-- Driver Actions -->
                        <div class="flex items-center space-x-4">
                            <!-- Location Status Indicator -->
                            <div id="nav-location-status" class="hidden sm:flex items-center space-x-3 px-4 py-2 theme-card">
                                <div class="w-2 h-2 bg-gray-500 rounded-full" id="location-indicator"></div>
                                <span class="text-xs theme-text-muted" id="location-status-nav">Tracking Off</span>
                            </div>

                            <!-- User Info -->
                            <div class="hidden md:flex items-center space-x-3 px-4 py-2 theme-card">
                                <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                    <span class="text-white text-sm font-semibold">
                                        ${userEmail.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div class="text-sm">
                                    <div class="theme-text-primary font-medium truncate max-w-32">
                                        ${userEmail.split('@')[0]}
                                    </div>
                                    <div class="theme-text-muted text-xs">Driver</div>
                                </div>
                            </div>

                            <!-- UNIFIED Theme Toggle -->
                            <button id="nav-theme-toggle" class="unified-theme-toggle" title="Toggle Day/Night Mode">
                                <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </button>

                            <!-- Sign Out Button -->
                            <button 
                                id="sign-out-btn" 
                                class="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                            >
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                                </svg>
                                <span class="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mobile Location Status Bar -->
                <div class="sm:hidden theme-nav px-4 py-2 border-t">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" id="mobile-location-indicator"></div>
                            <span class="text-xs theme-text-muted" id="mobile-location-status">Location Tracking: Off</span>
                        </div>
                        <div class="text-xs theme-text-muted">
                            Driver: ${userEmail.split('@')[0]}
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="animate-fade-in">
                ${content}
            </main>

            <!-- Footer -->
            ${renderFooter()}

            <!-- Quick Action FAB (Mobile) -->
            <div class="fixed bottom-6 right-6 sm:hidden">
                <button 
                    id="mobile-location-toggle" 
                    class="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                    title="Toggle Location Tracking"
                >
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            <!-- Loading Overlay -->
            <div id="loading-overlay" class="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center hidden">
                <div class="theme-card p-8 shadow-2xl mx-4 max-w-sm w-full">
                    <div class="flex items-center space-x-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <div class="theme-text-primary font-medium">Loading route...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Initialize driver layout behavior
 */
export const initializeDriverLayout = (onSignOut, onLocationToggle) => {
    // Handle sign out
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            // Add loading animation
            signOutBtn.innerHTML = `
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="hidden sm:inline">Signing out...</span>
            `;
            
            // Clear user role from localStorage
            localStorage.removeItem('userRole');
            
            // Call sign out handler
            onSignOut();
        });
    }

    // Handle mobile location toggle FAB
    const mobileLocationToggle = document.getElementById('mobile-location-toggle');
    if (mobileLocationToggle && onLocationToggle) {
        mobileLocationToggle.addEventListener('click', onLocationToggle);
    }

    // Handle theme toggle
    // Theme toggle handled by unified theme manager
    themeManager.initialize();

    // Initialize location status synchronization
    initializeLocationStatusSync();

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize footer
    initializeFooter();
};

/**
 * Update location tracking status in navigation
 */
export const updateLocationStatus = (isTracking, statusText = null) => {
    // Desktop status
    const locationIndicator = document.getElementById('location-indicator');
    const locationStatusNav = document.getElementById('location-status-nav');
    
    // Mobile status
    const mobileLocationIndicator = document.getElementById('mobile-location-indicator');
    const mobileLocationStatus = document.getElementById('mobile-location-status');
    
    if (isTracking) {
        // Update desktop
        if (locationIndicator) {
            locationIndicator.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
        }
        if (locationStatusNav) {
            locationStatusNav.textContent = statusText || 'Tracking On';
        }
        
        // Update mobile
        if (mobileLocationIndicator) {
            mobileLocationIndicator.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
        }
        if (mobileLocationStatus) {
            mobileLocationStatus.textContent = `Location Tracking: ${statusText || 'On'}`;
        }
    } else {
        // Update desktop
        if (locationIndicator) {
            locationIndicator.className = 'w-2 h-2 bg-gray-500 rounded-full';
        }
        if (locationStatusNav) {
            locationStatusNav.textContent = statusText || 'Tracking Off';
        }
        
        // Update mobile
        if (mobileLocationIndicator) {
            mobileLocationIndicator.className = 'w-2 h-2 bg-gray-500 rounded-full';
        }
        if (mobileLocationStatus) {
            mobileLocationStatus.textContent = `Location Tracking: ${statusText || 'Off'}`;
        }
    }
};

/**
 * Initialize location status synchronization with main dashboard
 */
function initializeLocationStatusSync() {
    // Listen for location status changes from the main dashboard
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'location-status-text') {
                const statusText = mutation.target.textContent;
                const isTracking = statusText.includes('Route') || statusText.includes('Delivering');
                updateLocationStatus(isTracking, statusText);
            }
        });
    });

    // Start observing for changes in location status
    const locationStatusText = document.getElementById('location-status-text');
    if (locationStatusText) {
        observer.observe(locationStatusText, { 
            childList: true, 
            characterData: true, 
            subtree: true 
        });
    }
}

/**
 * Show loading overlay
 */
export const showLoadingOverlay = (message = 'Loading route...') => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.querySelector('.text-white').textContent = message;
        overlay.classList.remove('hidden');
    }
};

/**
 * Hide loading overlay
 */
export const hideLoadingOverlay = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
};

// Import unified theme manager
import { themeManager } from '../utils/themeManager.js';
