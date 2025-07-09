import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRequestSchema, insertAmbulanceSchema, insertHospitalSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
        parseInt(req.params.requestId), 
        status, 
        driverId
      );
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
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

  // Search hospitals by specialty
  app.get("/api/hospitals/search", async (req, res) => {
    try {
      const { specialty } = req.query;
      const hospitals = await storage.searchHospitalsBySpecialty(specialty as string);
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to search hospitals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
