// =======================================================
// /src/api/config.js - FINAL SIMPLE STRUCTURE (V8.0)
// =======================================================

// --- 1. FIREBASE CONFIGURATION (Auth, Real-Time, and ALL Data Storage) ---
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAbnlENPe3fQ0Ngksm6VwcrTuM-8Wo31zg",
    authDomain: "fleet-exam-project.firebaseapp.com",
    projectId: "fleet-exam-project",
    storageBucket: "fleet-exam-project.firebasestorage.app",
    messagingSenderId: "252822637225",
    appId: "1:252822637225:web:4202488a9e3fde47f877b8",
    measurementId: "G-F6PPP4WVFQ"
};

// --- 2. OPENROUTESERVICE CONFIGURATION (DSA Solver) ---
// This key is used for the VRP Heuristic and Distance Matrix.
export const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYxYjk4MDhiZDA0ZTQxZTE4ODk0ZDJmYWIxNDU4OWJiIiwiaCI6Im11cm11cjY0In0=';

// --- 3. GEMINI AI CONFIGURATION (Geocoding & Travel Time Calculations) ---
// This key is used for AI-powered geocoding and intelligent travel time estimation.
export const GEMINI_API_KEY = 'AIzaSyCBm1ZimgRH7zyBiUFibTitLrup2H-xHhw';