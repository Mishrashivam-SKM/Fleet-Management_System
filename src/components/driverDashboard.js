export const renderDriverDashboard = (userEmail) => {
    return `
        <div class="w-full max-w-screen-2xl mx-auto p-4 md:p-6">
            <!-- Header Section -->
            <div class="mb-8">
                <div class="animate-slide-up">
                    <h1 class="text-3xl font-bold theme-text-primary mb-2">Driver Navigation Center</h1>
                    <p class="theme-text-muted flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>GPS-guided route navigation and delivery tracking</span>
                    </p>
                </div>
            </div>

            <!-- Main Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column: Route Map and Navigation -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Route Navigation Section -->
                    <section class="theme-card p-6 card-hover animate-slide-up" style="animation-delay: 0.2s;">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold theme-text-primary">Route Navigation</h2>
                                    <p class="text-sm theme-text-muted">GPS-guided delivery route</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 text-sm theme-text-muted">
                                <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <span>Interactive</span>
                            </div>
                        </div>
                                                <div id="driver-map-container" class="h-96 bg-dark-700 rounded-xl shadow-inner lazy-placeholder">
                            <div class="h-full flex items-center justify-center text-gray-500">
                                <div class="text-center">
                                    <div class="animate-pulse inline-block w-8 h-8 text-4xl mb-2">🗺️</div>
                                    <p>Navigation map will load when route is assigned</p>
                                    <p class="text-sm mt-1">Real-time GPS tracking and turn-by-turn directions</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Instructions Panel -->
                        <div id="navigation-instructions" class="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 hidden animate-slide-down">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-white">Next Destination</h3>
                            </div>
                            <div id="next-destination" class="text-sm text-blue-100">
                                <p>Next delivery point will appear here when route is active</p>
                            </div>
                        </div>
                    </section>

                    <!-- Location Tracking Status -->
                    <section id="location-status" class="theme-card p-4 card-hover hidden animate-slide-up" style="animation-delay: 0.3s;">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <div class="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                    <p class="theme-text-primary font-semibold">Location Tracking Active</p>
                                    <p class="text-sm theme-text-muted">
                                        Status: <span id="location-status-text" class="font-medium text-green-400">Stopped</span>
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs text-gray-500">Last Update</div>
                                <div class="text-sm text-gray-300" id="last-update-time">Just now</div>
                            </div>
                        </div>
                    </section>

                    <!-- Location Tracking Control -->
                    <section class="theme-card p-6 card-hover animate-slide-up" style="animation-delay: 0.4s;">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold theme-text-primary">GPS Tracking</h3>
                                    <p class="text-sm theme-text-muted">Enable real-time location updates</p>
                                </div>
                            </div>
                            <button id="toggle-location-btn" class="btn-primary py-3 px-6 text-white font-semibold rounded-xl flex items-center space-x-2 transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                                </svg>
                                <span>Start Tracking</span>
                            </button>
                        </div>
                    </section>
                </div>

                <!-- Right Column: Tasks and Route Info -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- My Route Today Section -->
                    <section class="theme-card p-6 card-hover animate-slide-up" style="animation-delay: 0.5s;">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold theme-text-primary">My Route Today</h2>
                                <p class="text-sm theme-text-muted">Delivery assignments & progress</p>
                            </div>
                        </div>
                        <div id="driver-tasks-container" class="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-600">
                            <div class="text-center py-8 text-gray-500">
                                <div class="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <p class="font-medium mb-2">No route assigned yet</p>
                                <p class="text-sm text-gray-400">Your delivery route will appear here once the dispatcher assigns tasks and optimizes routes</p>
                            </div>
                        </div>
                    </section>

                    <!-- Driver Performance KPI Section -->
                    <section class="theme-card p-6 card-hover animate-slide-up" style="animation-delay: 0.6s;">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold theme-text-primary">My Performance</h2>
                                <p class="text-sm theme-text-muted">Today's delivery metrics</p>
                            </div>
                        </div>
                        <div id="driver-kpi-container" class="space-y-3">
                            <div class="flex justify-between items-center p-3 bg-dark-600/50 rounded-lg">
                                <span class="text-sm theme-text-muted">Deliveries Today</span>
                                <span id="kpi-deliveries-today" class="font-semibold theme-text-primary">--</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-dark-600/50 rounded-lg">
                                <span class="text-sm theme-text-muted">Total Distance</span>
                                <span id="kpi-total-distance" class="font-semibold theme-text-primary">-- km</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-dark-600/50 rounded-lg">
                                <span class="text-sm theme-text-muted">Average Rating</span>
                                <span id="kpi-avg-rating" class="font-semibold theme-text-primary">--/5</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-dark-600/50 rounded-lg">
                                <span class="text-sm theme-text-muted">On-Time Rate</span>
                                <span id="kpi-ontime-rate" class="font-semibold theme-text-primary">--%</span>
                            </div>
                        </div>
                    </section>

                    <!-- Real-Time Delivery History Section -->
                    <section class="theme-card p-6 card-hover animate-slide-up" style="animation-delay: 0.7s;">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold theme-text-primary">My Delivery History</h2>
                                    <p class="text-sm theme-text-muted">Recent completed deliveries</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 text-sm text-gray-400">
                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Live Updates</span>
                            </div>
                        </div>
                        <div id="driver-delivery-history-container" class="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-600">
                            <div class="text-center py-6 text-gray-500">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
                                <p class="text-sm">Loading delivery history...</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;
};

