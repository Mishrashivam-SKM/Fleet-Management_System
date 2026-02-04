// =======================================================
// /src/api/config.js - FINAL SIMPLE STRUCTURE (V8.0)
// =======================================================

// --- 1. FIREBASE CONFIGURATION (Auth, Real-Time, and ALL Data Storage) ---
export const FIREBASE_CONFIG = {
    apiKey: "Enter your api key",
    authDomain: "fleet-exam-project.firebaseapp.com",
    projectId: "fleet-exam-project",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// --- 2. OPENROUTESERVICE CONFIGURATION (DSA Solver) ---
// This key is used for the VRP Heuristic and Distance Matrix.
export const ORS_API_KEY = '';

// --- 3. GEMINI AI CONFIGURATION (Geocoding & Travel Time Calculations) ---
// This key is used for AI-powered geocoding and intelligent travel time estimation.
export const GEMINI_API_KEY = '';
