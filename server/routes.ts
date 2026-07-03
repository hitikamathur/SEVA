import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRequestSchema, insertAmbulanceSchema, insertHospitalSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_seva_secret_key_123456";

// Live SSE Client lists
let ambulanceClients: Response[] = [];
let requestClients: Response[] = [];
let singleAmbulanceClients: { driverId: string; res: Response }[] = [];

// Helper to broadcast updates to SSE connections
function broadcastAmbulanceUpdate(ambulances: any) {
  const data = JSON.stringify(ambulances);
  ambulanceClients.forEach(res => res.write(`data: ${data}\n\n`));
}

function broadcastRequestUpdate(requests: any) {
  const data = JSON.stringify(requests);
  requestClients.forEach(res => res.write(`data: ${data}\n\n`));
}

function broadcastSingleAmbulanceUpdate(driverId: string, location: any) {
  const data = JSON.stringify(location);
  singleAmbulanceClients
    .filter(c => c.driverId === driverId)
    .forEach(c => c.res.write(`data: ${data}\n\n`));
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Custom JWT driver login handler
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const sampleDrivers = {
        "driver1@seva.com": { password: "driver123", uid: "driver001", name: "Rajesh Kumar" },
        "driver2@seva.com": { password: "driver123", uid: "driver002", name: "Priya Sharma" },
        "driver3@seva.com": { password: "driver123", uid: "driver003", name: "Amit Singh" },
        "driver4@seva.com": { password: "driver123", uid: "driver004", name: "Sita Devi" }
      };

      const driver = sampleDrivers[email as keyof typeof sampleDrivers];
      if (!driver || driver.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate a JWT token
      const token = jwt.sign({ uid: driver.uid, email, displayName: driver.name }, JWT_SECRET, { expiresIn: "1d" });
      res.json({ token, uid: driver.uid, email, displayName: driver.name });
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get all ambulances
  app.get("/api/ambulances", async (_req, res) => {
    try {
      const ambulances = await storage.getAllAmbulances();
      res.json(ambulances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ambulances" });
    }
  });

  // Create or update ambulance
  app.post("/api/ambulances", async (req, res) => {
    try {
      const ambulanceData = insertAmbulanceSchema.parse(req.body);
      const ambulance = await storage.createOrUpdateAmbulance(ambulanceData);
      
      // Update real-time streams
      const allAmbulances = await storage.getAllAmbulances();
      broadcastAmbulanceUpdate(allAmbulances);
      broadcastSingleAmbulanceUpdate(ambulance.driverId, ambulance);

      res.json(ambulance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create/update ambulance" });
      }
    }
  });

  // Get ambulance by driver ID
  app.get("/api/ambulances/:driverId", async (req, res) => {
    try {
      const ambulance = await storage.getAmbulanceByDriverId(req.params.driverId);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }
      res.json(ambulance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ambulance" });
    }
  });

  // Update ambulance location
  app.patch("/api/ambulances/:driverId/location", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ error: "Invalid location data" });
      }
      
      const ambulance = await storage.updateAmbulanceLocation(req.params.driverId, lat, lng);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }

      // Update real-time streams
      const allAmbulances = await storage.getAllAmbulances();
      broadcastAmbulanceUpdate(allAmbulances);
      broadcastSingleAmbulanceUpdate(req.params.driverId, ambulance);

      res.json(ambulance);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Update ambulance status
  app.patch("/api/ambulances/:driverId/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (typeof status !== 'string') {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const ambulance = await storage.updateAmbulanceStatus(req.params.driverId, status);
      if (!ambulance) {
        return res.status(404).json({ error: "Ambulance not found" });
      }

      // Update real-time streams
      const allAmbulances = await storage.getAllAmbulances();
      broadcastAmbulanceUpdate(allAmbulances);
      broadcastSingleAmbulanceUpdate(req.params.driverId, ambulance);

      res.json(ambulance);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Get all requests
  app.get("/api/requests", async (_req, res) => {
    try {
      const requests = await storage.getAllRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Create new request
  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertRequestSchema.parse(req.body);
      const request = await storage.createRequest(requestData);

      // Update real-time streams
      const allRequests = await storage.getAllRequests();
      broadcastRequestUpdate(allRequests);

      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create request" });
      }
    }
  });

  // Update request status
  app.patch("/api/requests/:requestId", async (req, res) => {
    try {
      const { status, driverId } = req.body;
      const request = await storage.updateRequestStatus(
        req.params.requestId, 
        status, 
        driverId
      );
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Update real-time streams
      const allRequests = await storage.getAllRequests();
      broadcastRequestUpdate(allRequests);

      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update request" });
    }
  });

  // Get all hospitals
  app.get("/api/hospitals", async (_req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  });

  // Create hospital
  app.post("/api/hospitals", async (req, res) => {
    try {
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create hospital" });
      }
    }
  });

  // secure firstaid AI proxy route
  app.post("/api/firstaid", async (req, res) => {
    try {
      const { symptoms } = req.body;
      if (!symptoms) {
        return res.status(400).json({ error: "Symptoms input is required" });
      }
      const { generateFirstAidTips } = await import("./gemini");
      const tips = await generateFirstAidTips(symptoms);
      res.json({ tips });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to analyze symptoms" });
    }
  });

  // Background Simulator: Automated dispatch matching & GPS route progression
  setInterval(async () => {
    try {
      const requests = await storage.getAllRequests();
      const pending = requests.filter(r => r.status === "pending");

      for (const req of pending) {
        // Find closest available ambulance
        const ambulances = await storage.getAllAmbulances();
        const available = ambulances.filter(a => a.status === "available");
        if (available.length === 0) continue;

        // Auto assign first available driver
        const chosen = available[0];
        await storage.updateAmbulanceStatus(chosen.driverId, "busy");
        await storage.updateRequestStatus(req.id, "accepted", chosen.driverId);

        // Notify client streams
        const updatedAmbulances = await storage.getAllAmbulances();
        broadcastAmbulanceUpdate(updatedAmbulances);
        broadcastRequestUpdate(await storage.getAllRequests());
        
        console.log(`[Simulator] Auto-dispatched Driver ${chosen.driverName} to request ${req.id}`);
      }

      // Progress active bookings along step coordinates
      const activeRequests = requests.filter(r => (r.status === "accepted" || r.status === "en-route") && r.driverId);
      for (const req of activeRequests) {
        const driverId = req.driverId!;
        const ambulance = await storage.getAmbulanceByDriverId(driverId);
        if (!ambulance || !req.lat || !req.lng) continue;

        // Calculate step increments toward patient location
        const distanceLat = req.lat - ambulance.lat;
        const distanceLng = req.lng - ambulance.lng;
        const stepsLeft = Math.max(Math.abs(distanceLat), Math.abs(distanceLng)) / 0.002;

        if (stepsLeft > 1) {
          // Incrementally step towards target coordinates
          const nextLat = ambulance.lat + (distanceLat / stepsLeft);
          const nextLng = ambulance.lng + (distanceLng / stepsLeft);
          const updatedAmb = await storage.updateAmbulanceLocation(driverId, nextLat, nextLng);
          
          broadcastSingleAmbulanceUpdate(driverId, updatedAmb);
        }
      }
    } catch (err) {
      console.error("[Simulator Error]:", err);
    }
  }, 4000); // Check and tick coordinates every 4 seconds


  // ─── Server-Sent Events (SSE) Routes ──────────────────────────────────────────

  // Subscribe to all ambulances
  app.get("/api/sse/ambulances", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial list
    const ambulances = await storage.getAllAmbulances();
    res.write(`data: ${JSON.stringify(ambulances)}\n\n`);

    ambulanceClients.push(res);

    req.on("close", () => {
      ambulanceClients = ambulanceClients.filter(c => c !== res);
    });
  });

  // Subscribe to requests
  app.get("/api/sse/requests", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial list
    const requests = await storage.getAllRequests();
    res.write(`data: ${JSON.stringify(requests)}\n\n`);

    requestClients.push(res);

    req.on("close", () => {
      requestClients = requestClients.filter(c => c !== res);
    });
  });

  // Subscribe to single ambulance location
  app.get("/api/sse/ambulances/:driverId/location", async (req, res) => {
    const { driverId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial details
    const ambulance = await storage.getAmbulanceByDriverId(driverId);
    if (ambulance) {
      res.write(`data: ${JSON.stringify(ambulance)}\n\n`);
    }

    const client = { driverId, res };
    singleAmbulanceClients.push(client);

    req.on("close", () => {
      singleAmbulanceClients = singleAmbulanceClients.filter(c => c !== client);
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
