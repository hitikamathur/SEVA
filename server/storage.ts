import { pool } from "./db";
import { type Ambulance, type Request, type Hospital, type InsertAmbulance, type InsertRequest, type InsertHospital } from "@shared/schema";

const uuidv4 = () => crypto.randomUUID();

// ─── Helper: map raw MySQL row → typed objects ────────────────────────────────

function mapAmbulance(row: any): Ambulance {
  return {
    id: row.id,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverEmail: row.driver_email,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    status: row.status,
    lastUpdated: row.last_updated,
  };
}

function mapRequest(row: any): Request {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    emergency: row.emergency,
    lat: row.lat,
    lng: row.lng,
    driverId: row.driver_id,
    status: row.status,
    otp: row.otp,
    createdAt: row.created_at,
  };
}

function mapHospital(row: any): Hospital {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    specialties: typeof row.specialties === "string" ? JSON.parse(row.specialties) : row.specialties,
    type: row.type,
  };
}

// ─── IStorage Interface ───────────────────────────────────────────────────────

export interface IStorage {
  getAllAmbulances(): Promise<Ambulance[]>;
  getAmbulanceByDriverId(driverId: string): Promise<Ambulance | undefined>;
  createOrUpdateAmbulance(ambulance: InsertAmbulance): Promise<Ambulance>;
  updateAmbulanceLocation(driverId: string, lat: number, lng: number): Promise<Ambulance | undefined>;
  updateAmbulanceStatus(driverId: string, status: string): Promise<Ambulance | undefined>;

  getAllRequests(): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(requestId: string, status: string, driverId?: string): Promise<Request | undefined>;

  getAllHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]>;
}

// ─── MySQL Storage Implementation ─────────────────────────────────────────────

export class MySQLStorage implements IStorage {
  constructor() {
    // Defer seeding slightly to ensure DB pool is ready
    setTimeout(() => this.initializeSampleData(), 2000);
  }

  private async initializeSampleData() {
    try {
      const [ambRows] = await pool.execute("SELECT COUNT(*) as count FROM ambulances") as any;
      if (ambRows[0].count === 0) {
        const sampleAmbulances = [
          { id: uuidv4(), driver_id: "driver001", driver_name: "Rajesh Kumar",  driver_email: "driver1@seva.com", phone: "+91 9876543210", lat: 28.6139, lng: 77.2090, type: "government", status: "available" },
          { id: uuidv4(), driver_id: "driver002", driver_name: "Priya Sharma",  driver_email: "driver2@seva.com", phone: "+91 8765432109", lat: 28.6200, lng: 77.2100, type: "private",    status: "available" },
          { id: uuidv4(), driver_id: "driver003", driver_name: "Amit Singh",    driver_email: "driver3@seva.com", phone: "+91 7654321098", lat: 28.6300, lng: 77.2200, type: "government", status: "busy"      },
          { id: uuidv4(), driver_id: "driver004", driver_name: "Sita Devi",     driver_email: "driver4@seva.com", phone: "+91 6543210987", lat: 28.6400, lng: 77.2300, type: "private",    status: "available" },
        ];
        for (const a of sampleAmbulances) {
          await pool.execute(
            "INSERT INTO ambulances (id, driver_id, driver_name, driver_email, phone, lat, lng, type, status) VALUES (?,?,?,?,?,?,?,?,?)",
            [a.id, a.driver_id, a.driver_name, a.driver_email, a.phone, a.lat, a.lng, a.type, a.status]
          );
        }
        console.log("✅ Seeded sample ambulances");
      }

      const [hospRows] = await pool.execute("SELECT COUNT(*) as count FROM hospitals") as any;
      if (hospRows[0].count === 0) {
        const sampleHospitals = [
          { name: "AIIMS Delhi",                    address: "Ansari Nagar, Delhi",           phone: "+91 11-2659-3333", lat: 28.5672, lng: 77.2100, rating: 4.8, specialties: ["Cardiology","Trauma","Neurology","Emergency"],          type: "government" },
          { name: "Apollo Hospital",                 address: "Sarita Vihar, Delhi",           phone: "+91 11-2692-5858", lat: 28.5355, lng: 77.2731, rating: 4.7, specialties: ["Cardiology","Oncology","Orthopedic","Emergency"],        type: "private"    },
          { name: "Max Hospital Saket",              address: "Saket, Delhi",                  phone: "+91 11-2651-5050", lat: 28.5244, lng: 77.2066, rating: 4.6, specialties: ["Neurology","Pediatric","Orthopedic","Emergency"],        type: "private"    },
          { name: "Fortis Hospital",                 address: "Shalimar Bagh, Delhi",          phone: "+91 11-4277-6222", lat: 28.7041, lng: 77.1025, rating: 4.5, specialties: ["Cardiology","Trauma","Emergency","Orthopedic"],         type: "private"    },
          { name: "BLK Hospital",                   address: "Pusa Road, Delhi",              phone: "+91 11-3040-3040", lat: 28.6328, lng: 77.1867, rating: 4.4, specialties: ["Oncology","Neurology","Pediatric","Emergency"],          type: "private"    },
          { name: "Sir Ganga Ram Hospital",          address: "Rajinder Nagar, Delhi",         phone: "+91 11-2525-1111", lat: 28.6463, lng: 77.1918, rating: 4.6, specialties: ["Cardiology","Trauma","Neurology","Emergency"],          type: "private"    },
          { name: "Safdarjung Hospital",             address: "Ansari Nagar, Delhi",           phone: "+91 11-2616-5060", lat: 28.5682, lng: 77.2086, rating: 4.2, specialties: ["Trauma","Emergency","Cardiology","Neurology"],          type: "government" },
          { name: "RML Hospital",                   address: "Connaught Place, Delhi",        phone: "+91 11-2336-5525", lat: 28.6315, lng: 77.2167, rating: 4.1, specialties: ["Emergency","Trauma","Cardiology","Pediatric"],          type: "government" },
          { name: "Medanta Hospital",                address: "Sector 38, Gurgaon",            phone: "+91 124-414-4444", lat: 28.4595, lng: 77.0266, rating: 4.6, specialties: ["Cardiology","Neurology","Oncology","Emergency"],        type: "private"    },
          { name: "Artemis Hospital",                address: "Sector 51, Gurgaon",            phone: "+91 124-451-1111", lat: 28.4421, lng: 77.0654, rating: 4.5, specialties: ["Cardiology","Orthopedic","Neurology","Emergency"],      type: "private"    },
          { name: "Indraprastha Apollo Hospital",    address: "Mathura Road, Delhi",           phone: "+91 11-2692-5858", lat: 28.5433, lng: 77.2525, rating: 4.7, specialties: ["Cardiology","Neurology","Oncology","Emergency"],        type: "private"    },
          { name: "Escorts Heart Institute",         address: "Okhla Road, Delhi",             phone: "+91 11-2682-5000", lat: 28.5355, lng: 77.2731, rating: 4.5, specialties: ["Cardiology","Emergency","ICU"],                        type: "private"    },
          { name: "Lok Nayak Hospital",              address: "Jawaharlal Nehru Marg, Delhi",  phone: "+91 11-2336-5525", lat: 28.6315, lng: 77.2167, rating: 4.0, specialties: ["Emergency","Trauma","Cardiology","Pediatric"],          type: "government" },
          { name: "GTB Hospital",                   address: "Dilshad Garden, Delhi",         phone: "+91 11-2231-4000", lat: 28.6924, lng: 77.3125, rating: 3.9, specialties: ["Emergency","Trauma","Cardiology","Neurology"],          type: "government" },
          { name: "Batra Hospital",                 address: "Tughlakabad, Delhi",            phone: "+91 11-2958-7000", lat: 28.5116, lng: 77.2648, rating: 4.2, specialties: ["Cardiology","Orthopedic","Emergency","Oncology"],       type: "private"    },
        ];
        for (const h of sampleHospitals) {
          await pool.execute(
            "INSERT INTO hospitals (id, name, address, phone, lat, lng, rating, specialties, type) VALUES (UUID(),?,?,?,?,?,?,?,?)",
            [h.name, h.address, h.phone, h.lat, h.lng, h.rating, JSON.stringify(h.specialties), h.type]
          );
        }
        console.log("✅ Seeded sample hospitals");
      }
    } catch (err) {
      console.error("Error seeding sample data:", err);
    }
  }

  // ─── Ambulance ──────────────────────────────────────────────────────────────

  async getAllAmbulances(): Promise<Ambulance[]> {
    const [rows] = await pool.execute("SELECT * FROM ambulances") as any;
    return rows.map(mapAmbulance);
  }

  async getAmbulanceByDriverId(driverId: string): Promise<Ambulance | undefined> {
    const [rows] = await pool.execute("SELECT * FROM ambulances WHERE driver_id = ?", [driverId]) as any;
    return rows.length > 0 ? mapAmbulance(rows[0]) : undefined;
  }

  async createOrUpdateAmbulance(data: InsertAmbulance): Promise<Ambulance> {
    await pool.execute(`
      INSERT INTO ambulances (id, driver_id, driver_name, driver_email, phone, lat, lng, type, status)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        driver_name = VALUES(driver_name),
        driver_email = VALUES(driver_email),
        phone = VALUES(phone),
        lat = VALUES(lat),
        lng = VALUES(lng),
        type = VALUES(type),
        status = VALUES(status),
        last_updated = CURRENT_TIMESTAMP
    `, [data.driverId, data.driverName, data.driverEmail, data.phone, data.lat, data.lng, data.type, data.status || "available"]);
    const result = await this.getAmbulanceByDriverId(data.driverId);
    return result!;
  }

  async updateAmbulanceLocation(driverId: string, lat: number, lng: number): Promise<Ambulance | undefined> {
    await pool.execute(
      "UPDATE ambulances SET lat = ?, lng = ?, last_updated = CURRENT_TIMESTAMP WHERE driver_id = ?",
      [lat, lng, driverId]
    );
    return this.getAmbulanceByDriverId(driverId);
  }

  async updateAmbulanceStatus(driverId: string, status: string): Promise<Ambulance | undefined> {
    await pool.execute(
      "UPDATE ambulances SET status = ?, last_updated = CURRENT_TIMESTAMP WHERE driver_id = ?",
      [status, driverId]
    );
    return this.getAmbulanceByDriverId(driverId);
  }

  // ─── Requests ───────────────────────────────────────────────────────────────

  async getAllRequests(): Promise<Request[]> {
    const [rows] = await pool.execute("SELECT * FROM requests ORDER BY created_at DESC") as any;
    return rows.map(mapRequest);
  }

  async createRequest(data: InsertRequest): Promise<Request> {
    const id = uuidv4();
    await pool.execute(
      "INSERT INTO requests (id, patient_name, patient_phone, emergency, lat, lng, driver_id, status, otp) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, data.patientName, data.patientPhone, data.emergency, data.lat ?? null, data.lng ?? null, data.driverId ?? null, data.status || "pending", (data as any).otp ?? null]
    );
    const [rows] = await pool.execute("SELECT * FROM requests WHERE id = ?", [id]) as any;
    return mapRequest(rows[0]);
  }

  async updateRequestStatus(requestId: string, status: string, driverId?: string): Promise<Request | undefined> {
    if (driverId) {
      await pool.execute(
        "UPDATE requests SET status = ?, driver_id = ? WHERE id = ?",
        [status, driverId, requestId]
      );
    } else {
      await pool.execute(
        "UPDATE requests SET status = ? WHERE id = ?",
        [status, requestId]
      );
    }
    const [rows] = await pool.execute("SELECT * FROM requests WHERE id = ?", [requestId]) as any;
    return rows.length > 0 ? mapRequest(rows[0]) : undefined;
  }

  // ─── Hospitals ──────────────────────────────────────────────────────────────

  async getAllHospitals(): Promise<Hospital[]> {
    const [rows] = await pool.execute("SELECT * FROM hospitals") as any;
    return rows.map(mapHospital);
  }

  async createHospital(data: InsertHospital): Promise<Hospital> {
    const [result] = await pool.execute(
      "INSERT INTO hospitals (id, name, address, phone, lat, lng, rating, specialties, type) VALUES (UUID(),?,?,?,?,?,?,?,?)",
      [data.name, data.address, data.phone, data.lat, data.lng, data.rating, JSON.stringify(data.specialties), data.type]
    ) as any;
    const [rows] = await pool.execute("SELECT * FROM hospitals WHERE name = ? ORDER BY rowid DESC LIMIT 1", [data.name]) as any;
    return mapHospital(rows[0]);
  }

  async searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]> {
    if (!specialty) return this.getAllHospitals();
    const [rows] = await pool.execute(
      "SELECT * FROM hospitals WHERE JSON_SEARCH(specialties, 'one', ?) IS NOT NULL",
      [`%${specialty}%`]
    ) as any;
    return rows.map(mapHospital);
  }
}

export const storage = new MySQLStorage();