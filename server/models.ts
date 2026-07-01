import mongoose, { Schema, Document } from "mongoose";

// ─── Ambulance ────────────────────────────────────────────────────────────────
export interface IAmbulance extends Document {
  driverId: string;
  driverName: string;
  driverEmail: string;
  phone: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
  lastUpdated: Date;
}

const AmbulanceSchema = new Schema<IAmbulance>({
  driverId:    { type: String, required: true, unique: true },
  driverName:  { type: String, required: true },
  driverEmail: { type: String, required: true },
  phone:       { type: String, required: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  type:        { type: String, required: true },
  status:      { type: String, required: true, default: "available" },
  lastUpdated: { type: Date, default: Date.now },
});

export const AmbulanceModel = mongoose.model<IAmbulance>("Ambulance", AmbulanceSchema);

// ─── Request ─────────────────────────────────────────────────────────────────
export interface IRequest extends Document {
  patientName:  string;
  patientPhone: string;
  emergency:    string;
  lat:          number | null;
  lng:          number | null;
  driverId:     string | null;
  status:       string;
  createdAt:    Date;
}

const RequestSchema = new Schema<IRequest>({
  patientName:  { type: String, required: true },
  patientPhone: { type: String, required: true },
  emergency:    { type: String, required: true },
  lat:          { type: Number, default: null },
  lng:          { type: Number, default: null },
  driverId:     { type: String, default: null },
  status:       { type: String, required: true, default: "pending" },
  createdAt:    { type: Date, default: Date.now },
});

export const RequestModel = mongoose.model<IRequest>("Request", RequestSchema);

// ─── Hospital ─────────────────────────────────────────────────────────────────
export interface IHospital extends Document {
  name:        string;
  address:     string;
  phone:       string;
  lat:         number;
  lng:         number;
  rating:      number;
  specialties: string[];
  type:        string;
}

const HospitalSchema = new Schema<IHospital>({
  name:        { type: String, required: true },
  address:     { type: String, required: true },
  phone:       { type: String, required: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  rating:      { type: Number, required: true },
  specialties: { type: [String], required: true },
  type:        { type: String, required: true },
});

export const HospitalModel = mongoose.model<IHospital>("Hospital", HospitalSchema);
