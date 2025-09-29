import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const checkSystemStatus = async () => {
    const db = getFirestore();
    const status = {
        collections: {
            vehicles: false,
            tasks: false,
            driver_routes: false
        },
        errors: []
    };

    try {
        // Check each required collection
        const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
        status.collections.vehicles = !vehiclesSnapshot.empty;

        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        status.collections.tasks = !tasksSnapshot.empty;

        const routesSnapshot = await getDocs(collection(db, 'driver_routes'));
        status.collections.driver_routes = !routesSnapshot.empty;

        return status;
    } catch (error) {
        status.errors.push(error.message);
        return status;
    }
};
