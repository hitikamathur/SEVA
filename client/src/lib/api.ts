// Custom API integration replacing Firebase realtime engine with HTTP/SSE

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  token?: string;
}

// REST call to login
export const loginDriver = async (email: string, password: string): Promise<MockUser> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Authentication failed");
  }

  const data = await response.json();
  localStorage.setItem("currentDriver", JSON.stringify(data));
  return data;
};

export const logoutDriver = async (): Promise<void> => {
  localStorage.removeItem("currentDriver");
  return Promise.resolve();
};

// Database REST Actions
export const updateAmbulanceLocation = async (driverId: string, lat: number, lng: number): Promise<any> => {
  const response = await fetch(`/api/ambulances/${driverId}/location`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });
  return response.json();
};

export const setAmbulanceStatus = async (driverId: string, status: string): Promise<any> => {
  const response = await fetch(`/api/ambulances/${driverId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return response.json();
};

export const createRequest = async (requestData: any): Promise<any> => {
  const response = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  return response.json();
};

export const acceptRequest = async (requestId: string, driverId: string): Promise<any> => {
  const response = await fetch(`/api/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "accepted", driverId }),
  });
  return response.json();
};

// Server-Sent Events subscriptions to replace onValue real-time database listeners
export const subscribeToAmbulances = (callback: (ambulances: any) => void) => {
  const eventSource = new EventSource("/api/sse/ambulances");

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Map list back to standard object map format expected by frontend
      const mapped: Record<string, any> = {};
      if (Array.isArray(data)) {
        data.forEach(amb => {
          mapped[amb.driverId] = amb;
        });
      }
      callback(mapped);
    } catch (e) {
      console.error("SSE parse error for ambulances:", e);
    }
  };

  return () => {
    eventSource.close();
  };
};

export const subscribeToRequests = (callback: (requests: any) => void) => {
  const eventSource = new EventSource("/api/sse/requests");

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const mapped: Record<string, any> = {};
      if (Array.isArray(data)) {
        data.forEach(req => {
          mapped[req.id] = req;
        });
      }
      callback(mapped);
    } catch (e) {
      console.error("SSE parse error for requests:", e);
    }
  };

  return () => {
    eventSource.close();
  };
};

export const subscribeToAmbulanceLocation = (driverId: string, callback: (location: any) => void) => {
  const eventSource = new EventSource(`/api/sse/ambulances/${driverId}/location`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (e) {
      console.error("SSE parse error for ambulance location:", e);
    }
  };

  return () => {
    eventSource.close();
  };
};
