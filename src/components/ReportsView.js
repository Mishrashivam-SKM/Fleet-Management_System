/**
 * @file Renders the Performance KPIs section.
 * This component takes calculated metrics and displays them.
 */

/**
 * Renders the reports into the designated container.
 * It's now "defensive" and will show default values if data is missing.
 * @param {object} [kpis={}] - The object containing performance metrics.
 */
export const renderReports = (kpis = {}) => {
    const container = document.getElementById('reports-container');
    if (!container) return;

    // Use default values (0) if properties on the kpis object are missing.
    // This prevents the 'toFixed of undefined' error.
    const onTimeRate = ((kpis.onTimeRate || 0) * 100).toFixed(1);
    const costPerKm = (kpis.costPerKm || 0).toFixed(2);
    const utilizationRate = ((kpis.utilizationRate || 0) * 100).toFixed(1);

    // The rest of the HTML structure for displaying the reports.
    container.innerHTML = `
        <h3 class="text-lg font-semibold mb-2 text-gray-300">Performance KPIs</h3>
        <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center">
                <span class="text-gray-400">On-Time Delivery</span>
                <span class="font-semibold text-white">${onTimeRate}%</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-400">Avg. Cost / Km</span>
                <span class="font-semibold text-white">₹${costPerKm}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-400">Vehicle Utilization</span>
                <span class="font-semibold text-white">${utilizationRate}%</span>
            </div>
        </div>
    `;
};

