export const renderDriverDashboard = (userEmail) => {
    return `
        <div class="min-h-screen bg-gray-900 text-white p-6">
            <!-- Header -->
            <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
                <div>
                    <h1 class="text-4xl font-bold text-white">Driver Dashboard</h1>
                    <p class="text-indigo-400 text-lg mt-1">${userEmail}</p>
                </div>
                <div class="flex space-x-3">
                    <button id="toggle-location-btn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Start Location Tracking
                    </button>
                    <button id="sign-out-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Sign Out
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column: Route Map -->
                <div class="lg:col-span-2">
                    <div class="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                        <h2 class="text-2xl font-semibold text-gray-300 mb-4">📍 Route Navigation</h2>
                        <div id="driver-map-container" class="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
                            <p class="text-gray-400">Map loading...</p>
                        </div>
                        
                        <!-- Navigation Instructions -->
                        <div id="navigation-instructions" class="mt-4 bg-blue-900 rounded-lg p-4 hidden">
                            <h3 class="text-lg font-semibold mb-2">🧭 Navigation</h3>
                            <div id="next-destination" class="text-sm">
                                <p class="text-blue-200">Next delivery point will appear here</p>
                            </div>
                        </div>
                    </div>

                    <!-- Location Status -->
                    <div id="location-status" class="bg-gray-800 rounded-lg shadow-xl p-4 hidden">
                        <div class="flex items-center space-x-3">
                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <p class="text-gray-300">
                                📍 Location tracking: <span id="location-status-text" class="font-semibold text-green-400">Stopped</span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Tasks -->
                <div class="lg:col-span-1">
                    <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 class="text-2xl font-semibold text-gray-300 mb-4">📦 My Route for Today</h2>
                        <div id="driver-tasks-container">
                            <p class="text-gray-500">No route assigned yet. Please check back later.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

