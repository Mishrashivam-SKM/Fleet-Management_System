/**
 * @file Renders the main dashboard for the Dispatcher role.
 * This is a corrected version that unifies all element IDs with the main app logic.
 */
import { signOutUser } from '../api/firestoreService.js';

export const renderDispatcherDashboard = (userEmail) => {
    return `
        <div class="bg-gray-900 text-white min-h-screen font-sans">
            <div class="w-full max-w-screen-2xl mx-auto p-4 md:p-6">
                <header class="flex flex-wrap justify-between items-center mb-6 border-b border-gray-700 pb-4 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-white">Dispatcher Dashboard</h1>
                        <p class="text-indigo-400">${userEmail || ''}</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="reset-all-data-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                            🗑️ Reset All System Data
                        </button>
                        <button id="sign-out-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md">
                            Sign Out
                        </button>
                    </div>
                </header>
                
                <main class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    <!-- Left Column: Map and Routes -->
                    <div class="xl:col-span-2 space-y-6">
                        <section class="bg-gray-800 rounded-lg shadow-xl p-4">
                            <h2 class="text-xl font-semibold text-gray-300 mb-4">Live Fleet Map</h2>
                            <div id="map-container" class="h-96 md:h-[600px] rounded-md bg-gray-700"></div>
                        </section>
                        <section class="bg-gray-800 rounded-lg shadow-xl p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold text-gray-300">Optimized Routes</h2>
                                <span id="optimization-status" class="text-sm text-gray-500"></span>
                            </div>
                            <div id="optimized-routes-container">
                                <p class="text-gray-500">Click "Optimize Routes" to generate a plan.</p>
                            </div>
                        </section>
                    </div>

                    <!-- Right Column: Actions and Data -->
                    <div class="xl:col-span-1 space-y-6">
                        <section class="bg-gray-800 rounded-lg shadow-xl p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold text-gray-300">Task Management</h2>
                                <button id="add-task-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
                                    + New Task
                                </button>
                            </div>
                            <ul id="pending-tasks-list" class="space-y-3 max-h-60 overflow-y-auto">
                                <p class="text-gray-500">Loading tasks...</p>
                            </ul>
                            <button id="optimize-routes-btn" class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md">
                                Optimize Routes
                            </button>
                        </section>

                        <section class="bg-gray-800 rounded-lg shadow-xl p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold text-gray-300">Fleet Management</h2>
                                <button id="add-vehicle-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                                    + Add Vehicle
                                </button>
                            </div>
                            <ul id="fleet-list" class="space-y-3 max-h-96 overflow-y-auto">
                                <p class="text-gray-500">Loading fleet...</p>
                            </ul>
                        </section>

                        <section class="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold text-gray-300">📊 Delivery History</h2>
                                <select id="history-filter" class="bg-gray-700 text-white px-3 py-1 rounded text-sm">
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                            <div id="delivery-history-container" class="max-h-60 overflow-y-auto">
                                <p class="text-gray-500">Loading delivery history...</p>
                            </div>
                        </section>

                        <section id="reports-container" class="bg-gray-800 rounded-lg shadow-xl p-6">
                            <h2 class="text-xl font-semibold text-gray-300 mb-4">Performance Reports</h2>
                            <!-- ReportsView.js will render content here -->
                        </section>
                    </div>
                </main>
            </div>
        </div>
    `;
};

