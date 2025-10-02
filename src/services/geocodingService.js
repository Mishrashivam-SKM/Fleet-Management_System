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
    const cleanAddress = address.replace(/[()\[\]{}]/g, '')
                               .replace(/\s+/g, ' ')
                               .trim();

    // Extract postal code (Indian pincode - 6 digits)
    const postalCode = cleanAddress.match(/\b\d{6}\b/)?.[0];
    
    // Parse address components more intelligently
    const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    // Create variations of the address
    const variations = [];
    
    // 1. Try exact address first
    variations.push(cleanAddress);
    
    // 2. Add with India if not present
    if (!cleanAddress.toLowerCase().includes('india')) {
        variations.push(`${cleanAddress}, India`);
    }
    
    // 3. If we have a postal code, create targeted searches
    if (postalCode) {
        variations.push(`${postalCode}, India`);
        // Try with major cities near the postal code
        const firstThreeDigits = postalCode.substring(0, 3);
        if (['400', '401', '402', '403', '421'].includes(firstThreeDigits)) {
            // Mumbai/Thane region
            variations.push(`${cleanAddress}, Mumbai, Maharashtra, India`);
            variations.push(`${cleanAddress}, Thane, Maharashtra, India`);
        } else if (['110', '111', '121', '122'].includes(firstThreeDigits)) {
            // Delhi region
            variations.push(`${cleanAddress}, Delhi, India`);
        }
    }
    
    // 4. Try with Maharashtra state
    if (!cleanAddress.toLowerCase().includes('maharashtra')) {
        variations.push(`${cleanAddress}, Maharashtra, India`);
    }
    
    // 5. Try simplified versions (last 2-3 parts)
    if (parts.length > 2) {
        variations.push(`${parts.slice(-3).join(', ')}, India`);
        variations.push(`${parts.slice(-2).join(', ')}, India`);
    }
    
    // 6. Try landmark-based search if common keywords found
    const landmarks = ['mall', 'hospital', 'station', 'airport', 'market', 'temple', 'school', 'college'];
    const foundLandmark = landmarks.find(landmark => 
        cleanAddress.toLowerCase().includes(landmark)
    );
    if (foundLandmark) {
        const landmarkPart = parts.find(part => 
            part.toLowerCase().includes(foundLandmark)
        );
        if (landmarkPart) {
            variations.push(`${landmarkPart}, India`);
        }
    }
    
    return [...new Set(variations)]; // Remove duplicates
};

/**
 * Converts an address to latitude and longitude coordinates using OpenStreetMap.
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string, confidence: string}>} The coordinates with metadata
 * @throws {Error} If geocoding fails
 */
export const geocodeAddress = async (address) => {
    try {
        if (!address || address.trim() === '') {
            throw new Error('Address cannot be empty');
        }

        console.log(`🔍 Geocoding address: "${address}"`);

        // Try different variations of the address
        const addressVariations = formatAddressVariations(address);
        let lastError = null;
        let bestResult = null;
        let bestConfidence = 0;

        for (let i = 0; i < addressVariations.length; i++) {
            const formattedAddress = addressVariations[i];
            try {
                console.log(`  📍 Trying variation ${i + 1}/${addressVariations.length}: "${formattedAddress}"`);
                
                const encodedAddress = encodeURIComponent(formattedAddress);
                const data = await fetchWithRateLimit(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&countrycodes=in&addressdetails=1`
                );

                if (data && data.length > 0) {
                    // Calculate confidence based on result quality and variation index
                    const result = data[0];
                    let confidence = parseFloat(result.importance || 0.5);
                    
                    // Boost confidence for earlier variations (more specific)
                    confidence += (addressVariations.length - i) * 0.1;
                    
                    // Boost confidence for exact matches
                    if (result.display_name.toLowerCase().includes(address.toLowerCase().split(',')[0])) {
                        confidence += 0.2;
                    }
                    
                    const geocodeResult = {
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon),
                        formattedAddress: result.display_name,
                        confidence: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
                        rawConfidence: confidence,
                        variation: formattedAddress
                    };
                    
                    console.log(`  ✅ Found result with confidence ${geocodeResult.confidence}: ${result.display_name}`);
                    
                    // Return immediately if high confidence, otherwise keep looking for better
                    if (confidence > 0.8 || i === 0) {
                        return geocodeResult;
                    } else if (!bestResult || confidence > bestConfidence) {
                        bestResult = geocodeResult;
                        bestConfidence = confidence;
                    }
                }
            } catch (error) {
                lastError = error;
                console.log(`  ❌ Variation failed: ${error.message}`);
                continue; // Try next variation
            }
        }

        // Return best result if found
        if (bestResult) {
            console.log(`📍 Best result found: ${bestResult.formattedAddress}`);
            return bestResult;
        }

        // If we get here, no variation worked
        console.error('❌ No geocoding results found for any variation');
        throw new Error('Could not find coordinates for this address. Please try with a more specific address including city/state or major landmarks.');
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
