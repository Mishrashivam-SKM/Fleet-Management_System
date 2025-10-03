// Debug script to check delivery history collection
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration (same as in config.js)
const firebaseConfig = {
    apiKey: "AIzaSyCoH8BQYNN-Yl8EmLwq5DjQ-Zu4XMAqsWc",
    authDomain: "kf-fleetmanagement.firebaseapp.com",
    projectId: "kf-fleetmanagement",
    storageBucket: "kf-fleetmanagement.firebasestorage.app",
    messagingSenderId: "664266853438",
    appId: "1:664266853438:web:04de9087e04404dd3da35d",
    measurementId: "G-2K3C0L4W9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugDeliveryHistory() {
    try {
        console.log('🔍 Checking delivery history collection...');
        
        // Get all delivery history entries
        const allHistorySnapshot = await getDocs(collection(db, 'deliveryHistory'));
        console.log(`📊 Total delivery history entries: ${allHistorySnapshot.size}`);
        
        // Show all entries
        allHistorySnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📦 Entry ${doc.id}:`, {
                taskId: data.taskId,
                customerId: data.customerId,
                driverEmail: data.driverEmail,
                completedAt: data.completedAt?.toDate?.() || data.completedAt,
                vehicleId: data.vehicleId
            });
        });
        
        // Check for specific driver
        const testDriverEmail = 'driver@example.com';
        console.log(`\n🚛 Checking entries for driver: ${testDriverEmail}`);
        
        const driverQuery = query(
            collection(db, 'deliveryHistory'),
            where('driverEmail', '==', testDriverEmail)
        );
        
        const driverSnapshot = await getDocs(driverQuery);
        console.log(`📊 Driver ${testDriverEmail} has ${driverSnapshot.size} deliveries`);
        
        driverSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`✅ Driver delivery:`, data);
        });
        
        return {
            totalEntries: allHistorySnapshot.size,
            driverEntries: driverSnapshot.size
        };
        
    } catch (error) {
        console.error('❌ Error debugging delivery history:', error);
        return { error: error.message };
    }
}

// Run debug when page loads
window.debugDeliveryHistory = debugDeliveryHistory;
console.log('🔧 Debug functions loaded. Run debugDeliveryHistory() in console.');