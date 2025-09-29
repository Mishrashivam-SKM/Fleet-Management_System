/**
 * @file Service for handling address geocoding using OpenStreetMap Nominatim (completely free).
 */

// Rate limiting helper - ensures we don't exceed OSM's rate limit
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // 1 second between requests as per Nominatim's usage policy

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ensures we respect Nominatim's rate limit
 */
const respectRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
        await wait(MIN_REQUEST_GAP - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
};

/**
 * Makes a rate-limited fetch request to Nominatim
 */
const fetchWithRateLimit = async (url) => {
    await respectRateLimit();
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'FleetManagementApp/1.0' // Required by Nominatim's usage policy
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

/**
 * Formats address for better geocoding results
 * @param {string} address - The original address
 * @returns {string[]} Array of formatted address variations to try
 */
const formatAddressVariations = (address) => {
    // Remove special characters and extra spaces
    const cleanAddress = address.replace(/[()]/g, '')
                               .replace(/\s+/g, ' ')
                               .trim();

    // Extract postal code
    const postalCode = cleanAddress.match(/\d{6}/)?.[0];
    
    // Parse Indian address components
    const parts = cleanAddress.split(',').map(part => part.trim());
    
    // Create variations of the address
    const variations = [];
    
    // If we have a postal code, prioritize search with it
    if (postalCode) {
        // Add city and state if available (assuming last part contains city)
        const cityPart = parts.find(part => part.toLowerCase().includes('thane'));
        if (cityPart) {
            variations.push(`${cityPart}, Maharashtra, India ${postalCode}`);
        }
    }
    
    // Add full address
    variations.push(`${cleanAddress}, Maharashtra, India`);
    
    // Add simplified address
    if (parts.length > 2) {
        variations.push(`${parts[parts.length - 2]}, ${parts[parts.length - 1]}, Maharashtra, India`);
    }
    
    // Add variations without postal code
    variations.push(parts.map(p => p.replace(/[^a-zA-Z\s]/g, '')).join(', ') + ', Maharashtra, India');
    
    return variations;
};

/**
 * Converts an address to latitude and longitude coordinates using OpenStreetMap.
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number}>} The coordinates
 * @throws {Error} If geocoding fails
 */
export const geocodeAddress = async (address) => {
    try {
        if (!address || address.trim() === '') {
            throw new Error('Address cannot be empty');
        }

        // Try different variations of the address
        const addressVariations = formatAddressVariations(address);
        let lastError = null;

        for (const formattedAddress of addressVariations) {
            try {
                const encodedAddress = encodeURIComponent(formattedAddress);
                const data = await fetchWithRateLimit(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`
                );

                if (data && data.length > 0) {
                    // Found a match
                    return {
                        latitude: parseFloat(data[0].lat),
                        longitude: parseFloat(data[0].lon)
                    };
                }
            } catch (error) {
                lastError = error;
                continue; // Try next variation
            }
        }

        // If we get here, no variation worked
        throw new Error('Could not find coordinates for this address. Please try with a simpler address or include major landmarks.');
    } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error(`Geocoding failed: ${error.message}`);
    }
};

/**
 * Reverse geocodes coordinates to an address using OpenStreetMap.
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} The formatted address
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const data = await fetchWithRateLimit(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        
        if (!data || data.error) {
            throw new Error('Location not found');
        }

        return data.display_name;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
};
