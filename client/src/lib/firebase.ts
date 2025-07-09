import { initializeApp, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, onValue, push, update } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    app = getApp('seva-app') || initializeApp(firebaseConfig, 'seva-app');
  } else {
    throw error;
  }
}

export const auth = getAuth(app);
export const database = getDatabase(app);

// Initialize sample ambulance data
export const initializeSampleAmbulances = () => {
  const sampleAmbulances = {
    driver001: {
      driverName: "Rajesh Kumar",
      driverEmail: "rajesh@example.com",
      phone: "+91 9876543210",
      lat: 28.6139,
      lng: 77.2090,
      type: "government",
      status: "available",
      lastUpdated: Date.now()
    },
    driver002: {
      driverName: "Priya Sharma",
      driverEmail: "priya@example.com",
      phone: "+91 8765432109",
      lat: 28.6200,
      lng: 77.2100,
      type: "private",
      status: "available",
      lastUpdated: Date.now()
    },
    driver003: {
      driverName: "Amit Singh",
      driverEmail: "amit@example.com",
      phone: "+91 7654321098",
      lat: 28.6300,
      lng: 77.2200,
      type: "government",
      status: "busy",
      lastUpdated: Date.now()
    },
    driver004: {
      driverName: "Sita Devi",
      driverEmail: "sita@example.com",
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

// Auth functions
export const loginDriver = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutDriver = async () => {
  return await signOut(auth);
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
  const requestsRef = ref(database, 'requests');
  return push(requestsRef, {
    ...requestData,
    timestamp: Date.now(),
  });
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