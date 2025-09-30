/**
 * @file Dashboard Layout Component - Provides consistent layout structure for dispatcher dashboard
 * Features premium navigation with theme toggle and animations
 */

import { renderFooter, initializeFooter } from './Footer.js';

export const renderDashboardLayout = (userEmail, content) => {
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold theme-text-primary">Fleet Command</h1>
                                <p class="text-sm theme-text-muted hidden sm:block">Dispatcher Control Center</p>
                            </div>
                        </div>

                        <!-- User Info and Actions -->
                        <div class="flex items-center space-x-4">
                            <!-- User Badge -->
                            <div class="hidden md:flex items-center space-x-3 px-4 py-2 theme-card">
                                <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                    <span class="text-white text-sm font-semibold">
                                        ${userEmail.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div class="text-sm">
                                    <div class="theme-text-primary font-medium">${userEmail}</div>
                                    <div class="theme-text-muted">Dispatcher</div>
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span class="hidden sm:inline">Sign Out</span>
                            </button>
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

            <!-- Loading Overlay -->
            <div id="loading-overlay" class="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center hidden">
                <div class="theme-card p-8 shadow-2xl mx-4 max-w-sm w-full">
                    <div class="flex items-center space-x-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <div class="theme-text-primary font-medium">Loading dashboard...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Initialize dashboard layout behavior
 */
export const initializeDashboardLayout = (onSignOut) => {
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

    // Handle theme toggle (if enabled in navigation)
    const navThemeToggle = document.getElementById('nav-theme-toggle');
    if (navThemeToggle) {
        navThemeToggle.addEventListener('click', toggleTheme);
    }

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize footer
    initializeFooter();
};

/**
 * Show loading overlay
 */
export const showLoadingOverlay = (message = 'Loading...') => {
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

/**
 * UNIFIED Theme Toggle - Single Source of Truth
 */
function toggleTheme() {
    const body = document.body;
    const navThemeToggle = document.getElementById('nav-theme-toggle');
    
    if (body.classList.contains('dark')) {
        // Switch to Light Mode
        body.classList.remove('dark');
        body.classList.add('light');
        
        // Update icon to sun (indicating current light mode)
        if (navThemeToggle) {
            navThemeToggle.innerHTML = `
                <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            `;
            navThemeToggle.title = 'Switch to Dark Mode';
        }
        
        localStorage.setItem('theme', 'light');
        console.log('🌞 Switched to Light Mode');
    } else {
        // Switch to Dark Mode
        body.classList.remove('light');
        body.classList.add('dark');
        
        // Update icon to moon (indicating current dark mode)
        if (navThemeToggle) {
            navThemeToggle.innerHTML = `
                <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            `;
            navThemeToggle.title = 'Switch to Light Mode';
        }
        
        localStorage.setItem('theme', 'dark');
        console.log('🌙 Switched to Dark Mode');
    }
    
    // Trigger theme update event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: body.classList.contains('dark') ? 'dark' : 'light' } 
    }));
}

// Initialize theme from localStorage
export const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
    }
};
