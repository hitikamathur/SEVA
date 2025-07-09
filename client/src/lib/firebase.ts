import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, onValue, push, update } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

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
