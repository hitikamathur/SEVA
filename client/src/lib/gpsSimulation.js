import firebase from './firebase'; // Ensure the correct path to your Firebase configuration

let lat = 28.6139; // Initial latitude
let lng = 77.2090; // Initial longitude
const targetLat = 28.6190; // Target latitude
const targetLng = 77.2150; // Target longitude
const step = 0.0001; // Movement increment step

const moveAmbulance = () => {
    setInterval(() => {
        // Compute the difference between the current position and the target
        const deltaLat = targetLat - lat;
        const deltaLng = targetLng - lng;

        // Update current position
        if (Math.abs(deltaLat) > step) {
            lat += deltaLat > 0 ? step : -step;
        }

        if (Math.abs(deltaLng) > step) {
            lng += deltaLng > 0 ? step : -step;
        }

        // Update the Firebase database with the new location
        firebase.database().ref('ambulances/driver001').set({ lat, lng });
    }, 2000);
};

// Start the ambulance movement
moveAmbulance();