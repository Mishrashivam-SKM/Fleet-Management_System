/**
 * @file Landing View Component - Pre-authentication landing page
 * Features modern SaaS aesthetic with animated hero section and feature showcase
 */

/**
 * Renders the landing page for unauthenticated users
 * @param {function} onGetStarted - Callback function when user clicks "Get Started"
 * @returns {string} HTML string for the landing page
 */
import { renderFooter, initializeFooter } from './Footer.js';
import { themeManager } from '../utils/themeManager.js';

export const renderLandingView = (onGetStarted) => {
    return `
        <div class="app-bg min-h-screen">
            <!-- Hero Section -->
            <div class="relative overflow-hidden">
                <!-- Animated Background -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft"></div>
                    <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft" style="animation-delay: 1s;"></div>
                    <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-soft" style="animation-delay: 2s;"></div>
                </div>

                <!-- Navigation Header -->
                <nav class="relative z-10 theme-nav border-b">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <!-- Logo -->
                            <div class="flex items-center space-x-3">
                                <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg shadow-md animate-glow">
                                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 class="text-xl font-bold theme-text-primary">Fleet Command</h1>
                                    <p class="text-xs theme-text-muted hidden sm:block">Advanced Fleet Management</p>
                                </div>
                            </div>

                            <!-- CTA Buttons -->
                            <div class="flex items-center space-x-4">
                                <button 
                                    id="get-started-btn" 
                                    class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                                >
                                    Get Started
                                </button>
                                
                                <!-- Theme Toggle -->
                                <button id="landing-theme-toggle" class="unified-theme-toggle" title="Toggle Day/Night Mode">
                                    <svg class="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Hero Content -->
                <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
                    <div class="text-center animate-fade-in">
                        <!-- Hero Title -->
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold theme-text-primary mb-6">
                            Smart Fleet Management
                            <span class="block text-primary-500">Powered by AI</span>
                        </h1>
                        
                        <!-- Hero Subtitle -->
                        <p class="text-xl theme-text-muted max-w-3xl mx-auto mb-8">
                            Optimize routes, track vehicles in real-time, and reduce operational costs with our 
                            cloud-native fleet management platform. Built for modern logistics operations.
                        </p>

                        <!-- Hero CTA -->
                        <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <button 
                                id="hero-get-started-btn"
                                class="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 animate-slide-up"
                            >
                                Start Free Trial
                            </button>
                            <button 
                                id="view-demo-btn"
                                class="w-full sm:w-auto theme-btn-secondary px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl"
                            >
                                View Demo
                            </button>
                        </div>

                        <!-- Trust Indicators -->
                        <div class="mt-12 animate-slide-up" style="animation-delay: 0.2s;">
                            <p class="text-sm theme-text-muted mb-4">Trusted by logistics companies worldwide</p>
                            <div class="flex items-center justify-center space-x-8 opacity-60">
                                <div class="px-4 py-2 theme-card">
                                    <span class="font-semibold theme-text-primary">500+ Fleets</span>
                                </div>
                                <div class="px-4 py-2 theme-card">
                                    <span class="font-semibold theme-text-primary">99.9% Uptime</span>
                                </div>
                                <div class="px-4 py-2 theme-card">
                                    <span class="font-semibold theme-text-primary">25% Cost Reduction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Features Section -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-bold theme-text-primary mb-4">
                        Everything you need to manage your fleet
                    </h2>
                    <p class="text-lg theme-text-muted max-w-2xl mx-auto">
                        Advanced route optimization, real-time tracking, and comprehensive analytics 
                        in one powerful platform.
                    </p>
                </div>

                <!-- Feature Grid -->
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Real-Time Tracking -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Real-Time Tracking</h3>
                        <p class="theme-text-muted">
                            Monitor vehicle locations, driver status, and delivery progress with 
                            live GPS tracking and automated updates.
                        </p>
                    </div>

                    <!-- Route Optimization -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style="animation-delay: 0.1s;">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Smart Route Optimization</h3>
                        <p class="theme-text-muted">
                            AI-powered route planning reduces fuel costs by up to 25% while 
                            ensuring on-time deliveries and customer satisfaction.
                        </p>
                    </div>

                    <!-- Analytics Dashboard -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style="animation-delay: 0.2s;">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Analytics & Reports</h3>
                        <p class="theme-text-muted">
                            Comprehensive performance metrics, cost analysis, and operational 
                            insights to drive data-driven decisions.
                        </p>
                    </div>

                    <!-- Driver Management -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style="animation-delay: 0.3s;">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Driver Management</h3>
                        <p class="theme-text-muted">
                            Streamlined driver assignment, mobile-optimized interfaces, and 
                            performance tracking for your entire fleet crew.
                        </p>
                    </div>

                    <!-- Cloud Integration -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style="animation-delay: 0.4s;">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Cloud-Native Platform</h3>
                        <p class="theme-text-muted">
                            Scalable, secure, and always available. Access your fleet data 
                            from anywhere with enterprise-grade reliability.
                        </p>
                    </div>

                    <!-- Cost Optimization -->
                    <div class="theme-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style="animation-delay: 0.5s;">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold theme-text-primary mb-2">Cost Optimization</h3>
                        <p class="theme-text-muted">
                            Reduce operational expenses with intelligent fuel management, 
                            predictive maintenance alerts, and efficiency recommendations.
                        </p>
                    </div>
                </div>
            </div>

            <!-- CTA Section -->
            <div class="theme-nav border-t py-16">
                <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 class="text-3xl font-bold theme-text-primary mb-4">
                        Ready to transform your fleet operations?
                    </h2>
                    <p class="text-lg theme-text-muted mb-8">
                        Join hundreds of companies already saving costs and improving efficiency.
                    </p>
                    <button 
                        id="footer-get-started-btn"
                        class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                    >
                        Start Your Free Trial Today
                    </button>
                </div>
            </div>

            <!-- Footer -->
            ${renderFooter()}
        </div>
    `;
};

/**
 * Initializes the landing page behavior and event handlers
 * @param {function} onGetStarted - Callback function when user clicks any "Get Started" button
 */
export const initializeLandingView = (onGetStarted) => {
    // Handle all "Get Started" buttons
    const getStartedButtons = [
        document.getElementById('get-started-btn'),
        document.getElementById('hero-get-started-btn'),
        document.getElementById('footer-get-started-btn')
    ].filter(btn => btn); // Remove null elements

    getStartedButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', onGetStarted);
        }
    });

    // Handle "View Demo" button
    const viewDemoBtn = document.getElementById('view-demo-btn');
    if (viewDemoBtn) {
        viewDemoBtn.addEventListener('click', () => {
            // For now, redirect to Get Started
            // In a real app, this could show a demo video or guided tour
            onGetStarted();
        });
    }

    // Handle theme toggle with unified theme manager
    themeManager.initialize();

    // Initialize smooth scrolling for any internal links
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize footer
    initializeFooter();

    console.log('✅ Landing View initialized successfully');
};

// Theme functionality now handled by unified ThemeManager
