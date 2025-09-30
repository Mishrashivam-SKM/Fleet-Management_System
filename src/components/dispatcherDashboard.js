/**
 * @file Renders the main dashboard for the Dispatcher role.
 * This is a corrected version that unifies all element IDs with the main app logic.
 */
import { signOutUser } from '../api/firestoreService.js';

export const renderDispatcherDashboard = (userEmail) => {
    return `
        <div class="w-full max-w-screen-2xl mx-auto p-4 md:p-6">
            <!-- Header Section -->
            <div class="mb-8">
                <div class="flex flex-wrap justify-between items-start mb-6 gap-4">
                    <div class="animate-slide-up">
                        <h1 class="text-3xl font-bold text-white mb-2">Fleet Operations Center</h1>
                        <p class="text-gray-400 flex items-center space-x-2">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Real-time fleet monitoring and route optimization</span>
                        </p>
                    </div>
                    <div class="flex gap-3 animate-slide-up" style="animation-delay: 0.1s;">
                        <button id="reset-all-data-btn" class="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span class="hidden sm:inline">Reset System</span>
                        </button>
                    </div>
                </div>
            </div>
                
            <!-- Main Grid Layout -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <!-- Left Column: Map and Routes -->
                <div class="xl:col-span-2 space-y-6">
                    <!-- Live Fleet Map Section -->
                    <section class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.2s;">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">Live Fleet Map</h2>
                                    <p class="text-sm text-gray-400">Real-time vehicle tracking</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 text-sm text-gray-400">
                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Live</span>
                            </div>
                        </div>
                        <div id="map-container" class="h-96 md:h-[600px] rounded-xl bg-dark-700 shadow-inner"></div>
                    </section>

                    <!-- Optimized Routes Section -->
                    <section class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.3s;">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">Optimized Routes</h2>
                                    <p class="text-sm text-gray-400">AI-powered route planning</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span id="optimization-status" class="text-sm text-gray-400 italic"></span>
                                <div id="optimization-indicator" class="w-2 h-2 bg-gray-500 rounded-full hidden animate-pulse"></div>
                            </div>
                        </div>
                        <div id="optimized-routes-container" class="space-y-4">
                            <div class="text-center py-12 text-gray-500">
                                <div class="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p class="font-medium">No routes optimized yet</p>
                                <p class="text-sm mt-1">Click "Optimize Routes" to generate intelligent delivery plans</p>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Right Column: Control Panels -->
                <div class="xl:col-span-1 space-y-6">
                    <!-- Task Management Panel -->
                    <section class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.4s;">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">Task Management</h2>
                                    <p class="text-sm text-gray-400">Delivery assignments</p>
                                </div>
                            </div>
                            <button id="add-task-btn" class="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span class="hidden sm:inline">New Task</span>
                            </button>
                        </div>
                        <div id="pending-tasks-list" class="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-600">
                            <div class="text-center py-6 text-gray-500">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
                                <p class="text-sm">Loading tasks...</p>
                            </div>
                        </div>
                        <button id="optimize-routes-btn" class="btn-primary w-full mt-6 py-3 px-4 text-white font-semibold rounded-xl flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Optimize Routes</span>
                        </button>
                    </section>

                    <!-- Fleet Management Panel -->
                    <section class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.5s;">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">Fleet Management</h2>
                                    <p class="text-sm text-gray-400">Vehicle operations</p>
                                </div>
                            </div>
                            <button id="add-vehicle-btn" class="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span class="hidden sm:inline">Add Vehicle</span>
                            </button>
                        </div>
                        <div id="fleet-list" class="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-600">
                            <div class="text-center py-6 text-gray-500">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
                                <p class="text-sm">Loading fleet...</p>
                            </div>
                        </div>
                    </section>

                    <!-- Delivery History Panel -->
                    <section class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.6s;">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-white">Delivery History</h2>
                                    <p class="text-sm text-gray-400">Completed deliveries</p>
                                </div>
                            </div>
                            <select id="history-filter" class="bg-dark-700 border border-dark-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <div id="delivery-history-container" class="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-600">
                            <div class="text-center py-6 text-gray-500">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
                                <p class="text-sm">Loading delivery history...</p>
                            </div>
                        </div>
                    </section>

                    <!-- Performance Reports Panel -->
                    <section id="reports-container" class="bg-dark-800 rounded-2xl shadow-2xl p-6 card-hover animate-slide-up" style="animation-delay: 0.7s;">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Performance Reports</h2>
                                <p class="text-sm text-gray-400">Analytics & insights</p>
                            </div>
                        </div>
                        <!-- ReportsView.js will render content here -->
                    </section>
                </div>
            </div>
        </div>
    `;
};

