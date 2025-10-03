/**
 * @file Lazy loading utilities for improving performance and reducing content displacement
 */

/**
 * Intersection Observer for lazy loading elements
 */
let lazyObserver = null;

/**
 * Initialize lazy loading observer
 */
export const initializeLazyLoading = () => {
    if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, falling back to immediate loading');
        return;
    }

    lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Handle different types of lazy loading
                if (element.dataset.lazyComponent) {
                    loadLazyComponent(element);
                } else if (element.dataset.lazyContent) {
                    loadLazyContent(element);
                } else if (element.dataset.lazySrc) {
                    loadLazyImage(element);
                }
                
                // Stop observing this element
                lazyObserver.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading 50px before element comes into view
        threshold: 0.1
    });

    console.log('✅ Lazy loading observer initialized');
};

/**
 * Register an element for lazy loading
 */
export const registerForLazyLoading = (element) => {
    if (lazyObserver && element) {
        // Add loading placeholder if not present
        if (!element.classList.contains('lazy-placeholder')) {
            element.classList.add('lazy-placeholder');
        }
        
        lazyObserver.observe(element);
    } else {
        // Fallback: load immediately
        if (element.dataset.lazyComponent) {
            loadLazyComponent(element);
        } else if (element.dataset.lazyContent) {
            loadLazyContent(element);
        }
    }
};

/**
 * Load a lazy component
 */
const loadLazyComponent = async (element) => {
    const componentName = element.dataset.lazyComponent;
    
    try {
        element.classList.add('lazy-loading');
        
        // Simulate component loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load component based on name
        switch (componentName) {
            case 'map':
                await loadMapComponent(element);
                break;
            case 'driver-map':
                await loadDriverMapComponent(element);
                break;
            case 'reports':
                await loadReportsComponent(element);
                break;
            case 'vehicle-list':
                await loadVehicleListComponent(element);
                break;
            case 'task-list':
                await loadTaskListComponent(element);
                break;
            default:
                console.warn(`Unknown lazy component: ${componentName}`);
        }
        
        element.classList.remove('lazy-loading', 'lazy-placeholder');
        element.classList.add('lazy-loaded');
        
    } catch (error) {
        console.error(`Error loading lazy component ${componentName}:`, error);
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
    }
};

/**
 * Load lazy content (HTML content)
 */
const loadLazyContent = (element) => {
    const content = element.dataset.lazyContent;
    
    try {
        element.classList.add('lazy-loading');
        
        // Decode and insert content
        element.innerHTML = decodeURIComponent(content);
        
        element.classList.remove('lazy-loading', 'lazy-placeholder');
        element.classList.add('lazy-loaded');
        
    } catch (error) {
        console.error('Error loading lazy content:', error);
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
    }
};

/**
 * Load lazy image
 */
const loadLazyImage = (element) => {
    const imageSrc = element.dataset.lazySrc;
    
    element.classList.add('lazy-loading');
    
    const img = new Image();
    img.onload = () => {
        element.src = imageSrc;
        element.classList.remove('lazy-loading', 'lazy-placeholder');
        element.classList.add('lazy-loaded');
    };
    
    img.onerror = () => {
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
    };
    
    img.src = imageSrc;
};

/**
 * Component loaders
 */
const loadMapComponent = async (element) => {
    // Initialize map if container exists
    const { initializeMap } = await import('../components/mapView.js');
    if (element.id) {
        initializeMap(element.id);
    }
};

const loadDriverMapComponent = async (element) => {
    // Initialize driver map if container exists
    const { initializeDriverMap } = await import('../components/mapView.js');
    if (element.id) {
        try {
            console.log(`🗺️ Initializing driver map for element: ${element.id}`);
            initializeDriverMap();
        } catch (error) {
            console.error('Error initializing driver map:', error);
        }
    }
};

const loadReportsComponent = async (element) => {
    // Load reports data and render
    const { renderReports } = await import('../components/ReportsView.js');
    const { fetchCurrentKPIs } = await import('../api/firestoreService.js');
    
    try {
        const kpis = await fetchCurrentKPIs();
        element.innerHTML = ''; // Clear placeholder
        renderReports(kpis);
    } catch (error) {
        element.innerHTML = '<p class="text-red-500">Error loading reports</p>';
    }
};

const loadVehicleListComponent = async (element) => {
    // This would be handled by the existing vehicle list rendering
    element.innerHTML = '<p class="text-gray-500">Loading vehicles...</p>';
};

const loadTaskListComponent = async (element) => {
    // This would be handled by the existing task list rendering
    element.innerHTML = '<p class="text-gray-500">Loading tasks...</p>';
};

/**
 * Create a lazy loading placeholder
 */
export const createLazyPlaceholder = (type, options = {}) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-placeholder animate-pulse bg-gray-200 rounded';
    
    // Set dimensions based on type
    switch (type) {
        case 'map':
            placeholder.style.height = '400px';
            placeholder.innerHTML = `
                <div class="h-full flex items-center justify-center text-gray-500">
                    <div class="text-center">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
                        <p class="mt-2">Loading map...</p>
                    </div>
                </div>
            `;
            break;
            
        case 'list':
            placeholder.style.height = options.height || '200px';
            placeholder.innerHTML = `
                <div class="p-4">
                    <div class="animate-pulse space-y-3">
                        <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                </div>
            `;
            break;
            
        case 'card':
            placeholder.style.height = options.height || '150px';
            placeholder.innerHTML = `
                <div class="p-4">
                    <div class="animate-pulse">
                        <div class="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
                        <div class="h-4 bg-gray-300 rounded w-full mb-2"></div>
                        <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                </div>
            `;
            break;
            
        default:
            placeholder.style.height = '100px';
            placeholder.innerHTML = `
                <div class="h-full flex items-center justify-center text-gray-500">
                    <div class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
                </div>
            `;
    }
    
    return placeholder;
};

/**
 * Cleanup lazy loading observer
 */
export const cleanupLazyLoading = () => {
    if (lazyObserver) {
        lazyObserver.disconnect();
        lazyObserver = null;
    }
};

/**
 * Non-displacing animation classes for elements that are already sized
 */
export const addNonDisplacingAnimation = (element, animationType = 'fade-in') => {
    // Ensure element has fixed dimensions to prevent layout shift
    const computedStyle = window.getComputedStyle(element);
    if (!element.style.height && computedStyle.height !== 'auto') {
        element.style.height = computedStyle.height;
    }
    
    // Add animation class
    element.classList.add(`animate-${animationType}-non-displacing`);
    
    // Remove animation class after animation completes
    setTimeout(() => {
        element.classList.remove(`animate-${animationType}-non-displacing`);
    }, 500);
};

// Initialize when module is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeLazyLoading();
});