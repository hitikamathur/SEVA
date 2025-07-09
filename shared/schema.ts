import { pgTable, text, serial, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ambulances = pgTable("ambulances", {
  id: serial("id").primaryKey(),
  driverId: text("driver_id").notNull(),
  driverName: text("driver_name").notNull(),
  driverEmail: text("driver_email").notNull(),
  phone: text("phone").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  type: text("type").notNull(), // 'government' or 'private'
  status: text("status").notNull().default('available'), // 'available', 'busy', 'offline'
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  emergency: text("emergency").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  driverId: text("driver_id"),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  rating: real("rating").notNull(),
  specialties: text("specialties").array().notNull(),
  type: text("type").notNull(), // 'government', 'private'
});

export const insertAmbulanceSchema = createInsertSchema(ambulances).omit({
  id: true,
  lastUpdated: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
});

export type InsertAmbulance = z.infer<typeof insertAmbulanceSchema>;
export type Ambulance = typeof ambulances.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;
