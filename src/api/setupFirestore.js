import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { FIREBASE_CONFIG } from './config.js';
import { initialVehicles, initialTasks } from '../data/initialData.js';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Function to initialize collections
export const initializeFirestore = async () => {
    try {
        // Initialize vehicles collection
        console.log("Initializing vehicles collection...");
        for (const vehicle of initialVehicles) {
            await setDoc(doc(db, "vehicles", vehicle.id), vehicle);
        }
        
        // Initialize tasks collection
        console.log("Initializing tasks collection...");
        for (const task of initialTasks) {
            await setDoc(doc(db, "tasks", task.id), task);
        }
        
        // Initialize empty driver_routes collection
        console.log("Initializing driver_routes collection...");
        await setDoc(doc(db, "driver_routes", "_init"), {
            initialized: true,
            timestamp: new Date().toISOString()
        });

        console.log("Firestore initialization complete!");
        return true;
    } catch (error) {
        console.error("Error initializing Firestore:", error);
        return false;
    }
};
