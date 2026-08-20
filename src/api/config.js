const pickConfigValue = (key) => {
    const envKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
    const value = import.meta.env[envKey];
    return typeof value === 'string' ? value.trim() : '';
};

export const FIREBASE_CONFIG = {
    apiKey: pickConfigValue('FIREBASE_API_KEY'),
    authDomain: pickConfigValue('FIREBASE_AUTH_DOMAIN'),
    projectId: pickConfigValue('FIREBASE_PROJECT_ID'),
    storageBucket: pickConfigValue('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: pickConfigValue('FIREBASE_MESSAGING_SENDER_ID'),
    appId: pickConfigValue('FIREBASE_APP_ID'),
    measurementId: pickConfigValue('FIREBASE_MEASUREMENT_ID')
};

export const ORS_API_KEY = pickConfigValue('ORS_API_KEY');
export const GEMINI_API_KEY = pickConfigValue('GEMINI_API_KEY');

export const DEMO_DATA = {
    driverEmail: pickConfigValue('VITE_DEMO_DRIVER_EMAIL') || 'driver@fleet.test',
    customerId: pickConfigValue('VITE_DEMO_CUSTOMER_ID') || 'sample-customer'
};

export const isFirebaseConfigured = () => {
    return Boolean(
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.authDomain &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.appId
    );
};
