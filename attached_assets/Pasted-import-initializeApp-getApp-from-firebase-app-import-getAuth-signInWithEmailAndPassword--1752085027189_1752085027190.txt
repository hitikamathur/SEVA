import { initializeApp, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, onValue, push, update } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "seva-emergency"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seva-emergency",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "seva-emergency"}.appspot.com`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || "seva-emergency"}-default-rtdb.firebaseio.com/`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

let app;
try {
  app = getApp();
} catch (error: any) {
  if (error.code === 'app/no-app') {
    app = initializeApp(firebaseConfig);
  } else {
    throw error;
  }
}

export const auth = getAuth(app);
export const database = getDatabase(app);

// Sample driver credentials for demo
const sampleDrivers = {
  "driver1@seva.com": { password: "driver123", uid: "driver001", name: "Rajesh Kumar" },
  "driver2@seva.com": { password: "driver123", uid: "driver002", name: "Priya Sharma" },
  "driver3@seva.com": { password: "driver123", uid: "driver003", name: "Amit Singh" },
  "driver4@seva.com": { password: "driver123", uid: "driver004", name: "Sita Devi" }
};

// Initialize sample ambulance data
export const initializeSampleAmbulances = () => {
  const sampleAmbulances = {
    driver001: {
      driverName: "Rajesh Kumar",
      driverEmail: "driver1@seva.com",
      phone: "+91 9876543210",
      lat: 28.6139,
      lng: 77.2090,
      type: "government",
      status: "available",
      lastUpdated: Date.now()
    },
    driver002: {
      driverName: "Priya Sharma",
      driverEmail: "driver2@seva.com",
      phone: "+91 8765432109",
      lat: 28.6200,
      lng: 77.2100,
      type: "private",
      status: "available",
      lastUpdated: Date.now()
    },
    driver003: {
      driverName: "Amit Singh",
      driverEmail: "driver3@seva.com",
      phone: "+91 7654321098",
      lat: 28.6300,
      lng: 77.2200,
      type: "government",
      status: "busy",
      lastUpdated: Date.now()
    },
    driver004: {
      driverName: "Sita Devi",
      driverEmail: "driver4@seva.com",
      phone: "+91 6543210987",
      lat: 28.6400,
      lng: 77.2300,
      type: "private",
      status: "available",
      lastUpdated: Date.now()
    }
  };

  // Set sample data to Firebase
  const ambulancesRef = ref(database, 'ambulances');
  set(ambulancesRef, sampleAmbulances).catch(console.error);
};

// Demo auth functions (replacing Firebase auth for demo)
export const loginDriver = async (email: string, password: string) => {
  // Check demo credentials
  const driver = sampleDrivers[email as keyof typeof sampleDrivers];
  if (!driver || driver.password !== password) {
    throw new Error("Invalid credentials");
  }

  // Create mock user object
  const mockUser = {
    uid: driver.uid,
    email: email,
    displayName: driver.name
  };

  // Store in localStorage for demo
  localStorage.setItem('currentDriver', JSON.stringify(mockUser));

  return mockUser;
};

export const logoutDriver = async () => {
  localStorage.removeItem('currentDriver');
  return Promise.resolve();
};

// Database functions
export const updateAmbulanceLocation = (driverId: string, lat: number, lng: number) => {
  const ambulanceRef = ref(database, `ambulances/${driverId}`);
  return update(ambulanceRef, { lat, lng, lastUpdated: Date.now() });
};

export const setAmbulanceStatus = (driverId: string, status: string) => {
  const ambulanceRef = ref(database, `ambulances/${driverId}`);
  return update(ambulanceRef, { status });
};

export const createRequest = (requestData: any) => {
  try {
    const requestsRef = ref(database, 'requests');
    return push(requestsRef, {
      ...requestData,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.log('Firebase unavailable, storing locally:', error);
    // Fallback to localStorage for demo purposes
    const requests = JSON.parse(localStorage.getItem('ambulance-requests') || '[]');
    requests.push({ ...requestData, timestamp: Date.now(), id: Date.now().toString() });
    localStorage.setItem('ambulance-requests', JSON.stringify(requests));
    return Promise.resolve();
  }
};

export const acceptRequest = (requestId: string, driverId: string) => {
  const requestRef = ref(database, `requests/${requestId}`);
  return update(requestRef, { driverId, status: 'accepted' });
};

export const subscribeToAmbulances = (callback: (ambulances: any) => void) => {
  const ambulancesRef = ref(database, 'ambulances');
  return onValue(ambulancesRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || {});
  });
};

export const subscribeToRequests = (callback: (requests: any) => void) => {
  const requestsRef = ref(database, 'requests');
  return onValue(requestsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || {});
  });
};

export const subscribeToAmbulanceLocation = (driverId: string, callback: (location: any) => void) => {
  const ambulanceRef = ref(database, `ambulances/${driverId}`);
  return onValue(ambulanceRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

// Initialize sample data on import
setTimeout(() => {
  initializeSampleAmbulances();
}, 1000);