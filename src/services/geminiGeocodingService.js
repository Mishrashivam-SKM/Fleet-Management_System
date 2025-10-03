/**
 * @file Gemini AI-powered geocoding service for accurate Indian address resolution
 * Uses Google's Gemini API to directly convert addresses to coordinates
 */

// You'll need to set your Gemini API key here
const GEMINI_API_KEY = 'AIzaSyA_vSZDP5556pkOsqBwFBUJAhT_Tr2f6JI';
// Updated endpoint for stable Gemini 2.5 Flash model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Fallback to Nominatim if Gemini fails
import { geocodeAddress as nominatimGeocode } from './geocodingService.js';

/**
 * Uses Gemini AI to directly convert address to coordinates
 * @param {string} address - The user-entered address
 * @returns {Promise<Object>} Geocoding result with coordinates and metadata
 */
export const geocodeWithGemini = async (address) => {
    console.log('🤖 Gemini AI Direct Geocoding:', address);
    
    // Validate inputs
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        throw new Error('Invalid address: address must be a non-empty string');
    }
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length === 0) {
        throw new Error('Gemini API key is not configured');
    }
    
    const GEOCODING_PROMPT = `You are a precise geocoding assistant for Indian addresses. Convert the following address to exact latitude and longitude coordinates.

Address to geocode: "{ADDRESS_PLACEHOLDER}"

CRITICAL: Return ONLY coordinates and metadata. DO NOT modify or reformat the original address.

Important instructions:
1. Return ONLY valid JSON without any markdown formatting or code blocks
2. Use high precision coordinates (6+ decimal places) 
3. Ensure coordinates are within India's bounds (6-37°N, 68-97°E)
4. Keep the originalAddress field EXACTLY as provided by user
5. Only populate geocodedAddress if you need to add missing details for clarity

Required JSON format:
{
  "latitude": <precise_decimal_number>,
  "longitude": <precise_decimal_number>, 
  "originalAddress": "<EXACT_USER_INPUT_UNCHANGED>",
  "geocodedAddress": "<only_if_clarification_needed_or_null>",
  "confidence": "<high|medium|low>",
  "city": "<city_name>",
  "state": "<state_name>", 
  "postalCode": "<6_digit_postal_code>",
  "locality": "<area_or_locality>",
  "landmark": "<nearby_landmark_or_null>"
}

Examples:
Input: "Gateway of India, Mumbai"
Output: {"latitude": 18.9220, "longitude": 72.8347, "originalAddress": "Gateway of India, Mumbai", "geocodedAddress": null, "confidence": "high", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "locality": "Colaba", "landmark": "Gateway of India"}

Input: "Hiranandani Meadows, Thane"
Output: {"latitude": 19.2057, "longitude": 72.9750, "originalAddress": "Hiranandani Meadows, Thane", "geocodedAddress": null, "confidence": "high", "city": "Thane", "state": "Maharashtra", "postalCode": "400607", "locality": "Manpada", "landmark": null}`;

    // Construct the actual prompt by replacing the placeholder
    const prompt = GEOCODING_PROMPT.replace('{ADDRESS_PLACEHOLDER}', address);
    
    // Create request payload
    const requestPayload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.1, // Low temperature for consistent, accurate results
            maxOutputTokens: 512,
        }
    };
    
    console.log('🤖 Sending request to Gemini API...');
    console.log('📤 Request payload structure:', JSON.stringify(requestPayload, null, 2));
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API HTTP error:', response.status, response.statusText);
            console.error('❌ Error response body:', errorText);
            throw new Error(`Gemini API HTTP error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        console.log('📥 Gemini API response structure:', JSON.stringify(data, null, 2));
        
        // Validate response structure
        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            console.error('❌ Invalid Gemini API response: missing or empty candidates array');
            console.error('Full response:', data);
            throw new Error('Invalid API response: no candidates found');
        }
        
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
            console.error('❌ Invalid candidate structure:', candidate);
            throw new Error('Invalid API response: malformed candidate structure');
        }
        
        const text = candidate.content.parts[0].text;
        if (!text || typeof text !== 'string') {
            console.error('❌ No text content in response part:', candidate.content.parts[0]);
            throw new Error('Invalid API response: no text content');
        }
        
        console.log('📥 Gemini raw response text:', text);
        
        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        
        let result;
        try {
            result = JSON.parse(jsonText.trim());
        } catch (parseError) {
            console.error('❌ Failed to parse JSON from Gemini response:', parseError);
            console.error('Raw text:', text);
            console.error('Extracted JSON text:', jsonText);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
        }
        
        // Validate the result
        if (!result.latitude || !result.longitude) {
            throw new Error('Invalid response: missing coordinates');
        }
        
        // Validate coordinates are in India
        if (result.latitude < 6 || result.latitude > 37 || 
            result.longitude < 68 || result.longitude > 98) {
            console.warn('⚠️ Coordinates outside India bounds, may be incorrect');
            result.confidence = 'low';
        }
        
        console.log('✅ Gemini geocoding result:', result);
        
        return {
            latitude: result.latitude,
            longitude: result.longitude,
            originalAddress: result.originalAddress || address, // Preserve exact user input
            geocodedAddress: result.geocodedAddress || null, // Only if clarification needed
            formattedAddress: result.originalAddress || address, // Use original for display
            confidence: result.confidence || 'medium',
            variation: 'gemini-direct',
            geocodingMethod: 'gemini-ai',
            parsedComponents: {
                city: result.city,
                state: result.state,
                postalCode: result.postalCode,
                locality: result.locality,
                landmark: result.landmark
            }
        };
        
    } catch (error) {
        console.error('❌ Gemini geocoding failed with error type:', error.constructor.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error:', error);
        console.warn('🔄 Falling back to Nominatim geocoding...');
        
        // Fallback to Nominatim
        try {
            const fallbackResult = await nominatimGeocode(address);
            return {
                ...fallbackResult,
                geocodingMethod: 'nominatim-fallback',
                variation: 'gemini-failed'
            };
        } catch (fallbackError) {
            console.error('❌ Both Gemini and Nominatim failed:', fallbackError);
            throw new Error(`All geocoding methods failed. Gemini: ${error.message}. Nominatim: ${fallbackError.message}`);
        }
    }
};

/**
 * Validate geocoding result
 * @param {Object} result - Geocoding result
 * @param {string} originalAddress - Original user input
 * @returns {Object} Validated result with warnings if needed
 */
export const validateGeocodingResult = (result, originalAddress) => {
    const warnings = [];
    
    // Check if postal code from address matches result
    const postalCodeInAddress = originalAddress.match(/\b\d{6}\b/)?.[0];
    if (postalCodeInAddress && result.parsedComponents?.postalCode) {
        if (postalCodeInAddress !== result.parsedComponents.postalCode) {
            warnings.push('Postal code mismatch between input and result');
            result.confidence = 'medium';
        }
    }
    
    // Check coordinate bounds for India
    const isInIndia = 
        result.latitude >= 6.0 && result.latitude <= 37.0 &&
        result.longitude >= 68.0 && result.longitude <= 98.0;
    
    if (!isInIndia) {
        warnings.push('Coordinates outside India - likely incorrect');
        result.confidence = 'very-low';
    }
    
    if (warnings.length > 0) {
        result.warnings = warnings;
        console.warn('⚠️ Geocoding warnings:', warnings);
    }
    
    return result;
};

export default geocodeWithGemini;
