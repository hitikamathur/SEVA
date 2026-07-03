// MySQL-based type definitions (replaces Mongoose schemas)
// Tables are created automatically in db.ts on first boot

export interface IAmbulance {
  id: string;
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

export interface IRequest {
  id: string;
  patientName: string;
  patientPhone: string;
  emergency: string;
  lat: number | null;
  lng: number | null;
  driverId: string | null;
  status: string;
  otp: string | null;
  createdAt: Date;
}

export interface IHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  specialties: string[];
  type: string;
}
