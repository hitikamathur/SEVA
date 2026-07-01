import { z } from "zod";

// ─── Ambulance ────────────────────────────────────────────────────────────────
export const insertAmbulanceSchema = z.object({
  driverId:    z.string(),
  driverName:  z.string(),
  driverEmail: z.string().email(),
  phone:       z.string(),
  lat:         z.number(),
  lng:         z.number(),
  type:        z.string(),
  status:      z.string().optional(),
});

export type InsertAmbulance = z.infer<typeof insertAmbulanceSchema>;

export type Ambulance = InsertAmbulance & {
  id: string;
  status: string;
  lastUpdated: Date;
};

// ─── Request ─────────────────────────────────────────────────────────────────
export const insertRequestSchema = z.object({
  patientName:  z.string(),
  patientPhone: z.string(),
  emergency:    z.string(),
  lat:          z.number().nullable().optional(),
  lng:          z.number().nullable().optional(),
  driverId:     z.string().nullable().optional(),
  status:       z.string().optional(),
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Request = {
  id: string;
  patientName:  string;
  patientPhone: string;
  emergency:    string;
  lat:          number | null;
  lng:          number | null;
  driverId:     string | null;
  status:       string;
  createdAt:    Date;
};

// ─── Hospital ─────────────────────────────────────────────────────────────────
export const insertHospitalSchema = z.object({
  name:        z.string(),
  address:     z.string(),
  phone:       z.string(),
  lat:         z.number(),
  lng:         z.number(),
  rating:      z.number(),
  specialties: z.array(z.string()),
  type:        z.string(),
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Hospital = InsertHospital & { id: string };
