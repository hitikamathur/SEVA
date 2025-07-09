import { ambulances, requests, hospitals, type Ambulance, type Request, type Hospital, type InsertAmbulance, type InsertRequest, type InsertHospital } from "@shared/schema";

export interface IStorage {
  // Ambulance operations
  getAllAmbulances(): Promise<Ambulance[]>;
  getAmbulanceByDriverId(driverId: string): Promise<Ambulance | undefined>;
  createOrUpdateAmbulance(ambulance: InsertAmbulance): Promise<Ambulance>;
  updateAmbulanceLocation(driverId: string, lat: number, lng: number): Promise<Ambulance | undefined>;
  updateAmbulanceStatus(driverId: string, status: string): Promise<Ambulance | undefined>;

  // Request operations
  getAllRequests(): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(requestId: number, status: string, driverId?: string): Promise<Request | undefined>;

  // Hospital operations
  getAllHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]>;
}

export class MemStorage implements IStorage {
  private ambulances: Map<number, Ambulance>;
  private requests: Map<number, Request>;
  private hospitals: Map<number, Hospital>;
  private currentAmbulanceId: number;
  private currentRequestId: number;
  private currentHospitalId: number;

  constructor() {
    this.ambulances = new Map();
    this.requests = new Map();
    this.hospitals = new Map();
    this.currentAmbulanceId = 1;
    this.currentRequestId = 1;
    this.currentHospitalId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample ambulances
    const sampleAmbulances = [
      {
        driverId: "driver001",
        driverName: "Rajesh Kumar",
        driverEmail: "rajesh@example.com",
        phone: "+91 9876543210",
        lat: 28.6139,
        lng: 77.2090,
        type: "government",
        status: "available",
      },
      {
        driverId: "driver002",
        driverName: "Priya Sharma",
        driverEmail: "priya@example.com",
        phone: "+91 8765432109",
        lat: 28.6200,
        lng: 77.2100,
        type: "private",
        status: "available",
      },
      {
        driverId: "driver003",
        driverName: "Amit Singh",
        driverEmail: "amit@example.com",
        phone: "+91 7654321098",
        lat: 28.6300,
        lng: 77.2200,
        type: "government",
        status: "busy",
      },
    ];

    sampleAmbulances.forEach(ambulance => {
      const id = this.currentAmbulanceId++;
      this.ambulances.set(id, { ...ambulance, id, lastUpdated: new Date() });
    });

    // Sample hospitals - 20+ Delhi hospitals with different specialties
    const sampleHospitals = [
      {
        name: "AIIMS Delhi",
        address: "Ansari Nagar, Delhi",
        phone: "+91 11-2659-3333",
        lat: 28.5672,
        lng: 77.2100,
        rating: 4.8,
        specialties: ["Cardiology", "Trauma", "Neurology", "Emergency"],
        type: "government",
      },
      {
        name: "Apollo Hospital",
        address: "Sarita Vihar, Delhi",
        phone: "+91 11-2692-5858",
        lat: 28.5355,
        lng: 77.2731,
        rating: 4.7,
        specialties: ["Cardiology", "Oncology", "Orthopedic", "Emergency"],
        type: "private",
      },
      {
        name: "Max Hospital Saket",
        address: "Saket, Delhi",
        phone: "+91 11-2651-5050",
        lat: 28.5244,
        lng: 77.2066,
        rating: 4.6,
        specialties: ["Neurology", "Pediatric", "Orthopedic", "Emergency"],
        type: "private",
      },
      {
        name: "Fortis Hospital",
        address: "Shalimar Bagh, Delhi",
        phone: "+91 11-4277-6222",
        lat: 28.7041,
        lng: 77.1025,
        rating: 4.5,
        specialties: ["Cardiology", "Trauma", "Emergency", "Orthopedic"],
        type: "private",
      },
      {
        name: "BLK Hospital",
        address: "Pusa Road, Delhi",
        phone: "+91 11-3040-3040",
        lat: 28.6328,
        lng: 77.1867,
        rating: 4.4,
        specialties: ["Oncology", "Neurology", "Pediatric", "Emergency"],
        type: "private",
      },
      {
        name: "Sir Ganga Ram Hospital",
        address: "Rajinder Nagar, Delhi",
        phone: "+91 11-2525-1111",
        lat: 28.6463,
        lng: 77.1918,
        rating: 4.6,
        specialties: ["Cardiology", "Trauma", "Neurology", "Emergency"],
        type: "private",
      },
      {
        name: "Safdarjung Hospital",
        address: "Ansari Nagar, Delhi",
        phone: "+91 11-2616-5060",
        lat: 28.5682,
        lng: 77.2086,
        rating: 4.2,
        specialties: ["Trauma", "Emergency", "Cardiology", "Neurology"],
        type: "government",
      },
      {
        name: "RML Hospital",
        address: "Connaught Place, Delhi",
        phone: "+91 11-2336-5525",
        lat: 28.6315,
        lng: 77.2167,
        rating: 4.1,
        specialties: ["Emergency", "Trauma", "Cardiology", "Pediatric"],
        type: "government",
      },
      {
        name: "Hindu Rao Hospital",
        address: "Malka Ganj, Delhi",
        phone: "+91 11-2381-3000",
        lat: 28.6772,
        lng: 77.2082,
        rating: 4.0,
        specialties: ["Emergency", "Trauma", "Pediatric", "Cardiology"],
        type: "government",
      },
      {
        name: "Indraprastha Apollo Hospital",
        address: "Mathura Road, Delhi",
        phone: "+91 11-2692-5858",
        lat: 28.5433,
        lng: 77.2525,
        rating: 4.7,
        specialties: ["Cardiology", "Neurology", "Oncology", "Emergency"],
        type: "private",
      },
      {
        name: "Escorts Heart Institute",
        address: "Okhla Road, Delhi",
        phone: "+91 11-2682-5000",
        lat: 28.5355,
        lng: 77.2731,
        rating: 4.5,
        specialties: ["Cardiology", "Emergency", "ICU"],
        type: "private",
      },
      {
        name: "Medanta Hospital",
        address: "Sector 38, Gurgaon",
        phone: "+91 124-414-4444",
        lat: 28.4595,
        lng: 77.0266,
        rating: 4.6,
        specialties: ["Cardiology", "Neurology", "Oncology", "Emergency"],
        type: "private",
      },
      {
        name: "Artemis Hospital",
        address: "Sector 51, Gurgaon",
        phone: "+91 124-451-1111",
        lat: 28.4421,
        lng: 77.0654,
        rating: 4.5,
        specialties: ["Cardiology", "Orthopedic", "Neurology", "Emergency"],
        type: "private",
      },
      {
        name: "Fortis Flt. Lt. Rajan Dhall Hospital",
        address: "Aruna Asaf Ali Marg, Delhi",
        phone: "+91 11-4277-6222",
        lat: 28.5672,
        lng: 77.2100,
        rating: 4.4,
        specialties: ["Emergency", "Trauma", "Cardiology", "Orthopedic"],
        type: "private",
      },
      {
        name: "Max Super Speciality Hospital",
        address: "Patparganj, Delhi",
        phone: "+91 11-2651-5050",
        lat: 28.6139,
        lng: 77.2773,
        rating: 4.5,
        specialties: ["Cardiology", "Neurology", "Orthopedic", "Emergency"],
        type: "private",
      },
      {
        name: "Pushpawati Singhania Hospital",
        address: "Sheikh Sarai, Delhi",
        phone: "+91 11-4651-6555",
        lat: 28.5355,
        lng: 77.2066,
        rating: 4.3,
        specialties: ["Cardiology", "Neurology", "Emergency", "Pediatric"],
        type: "private",
      },
      {
        name: "Venkateshwar Hospital",
        address: "Sector 18A, Dwarka",
        phone: "+91 11-4599-3333",
        lat: 28.5921,
        lng: 77.0460,
        rating: 4.2,
        specialties: ["Emergency", "Trauma", "Cardiology", "Orthopedic"],
        type: "private",
      },
      {
        name: "Primus Super Speciality Hospital",
        address: "Chandragupta Marg, Delhi",
        phone: "+91 11-4060-4040",
        lat: 28.6139,
        lng: 77.2090,
        rating: 4.3,
        specialties: ["Cardiology", "Neurology", "Orthopedic", "Emergency"],
        type: "private",
      },
      {
        name: "Moolchand Hospital",
        address: "Lajpat Nagar, Delhi",
        phone: "+91 11-4225-5555",
        lat: 28.5672,
        lng: 77.2436,
        rating: 4.1,
        specialties: ["Emergency", "Cardiology", "Orthopedic", "Pediatric"],
        type: "private",
      },
      {
        name: "St. Stephen's Hospital",
        address: "Tis Hazari, Delhi",
        phone: "+91 11-2396-7777",
        lat: 28.6772,
        lng: 77.2082,
        rating: 4.2,
        specialties: ["Emergency", "Trauma", "Cardiology", "Neurology"],
        type: "private",
      },
      {
        name: "Lok Nayak Hospital",
        address: "Jawaharlal Nehru Marg, Delhi",
        phone: "+91 11-2336-5525",
        lat: 28.6315,
        lng: 77.2167,
        rating: 4.0,
        specialties: ["Emergency", "Trauma", "Cardiology", "Pediatric"],
        type: "government",
      },
      {
        name: "GTB Hospital",
        address: "Dilshad Garden, Delhi",
        phone: "+91 11-2231-4000",
        lat: 28.6924,
        lng: 77.3125,
        rating: 3.9,
        specialties: ["Emergency", "Trauma", "Cardiology", "Neurology"],
        type: "government",
      },
      {
        name: "Deen Dayal Upadhyay Hospital",
        address: "Hari Nagar, Delhi",
        phone: "+91 11-2559-5000",
        lat: 28.6448,
        lng: 77.1025,
        rating: 3.8,
        specialties: ["Emergency", "Trauma", "Cardiology", "Orthopedic"],
        type: "government",
      },
      {
        name: "Maharaja Agrasen Hospital",
        address: "Punjabi Bagh, Delhi",
        phone: "+91 11-2526-3060",
        lat: 28.6748,
        lng: 77.1310,
        rating: 4.1,
        specialties: ["Emergency", "Cardiology", "Neurology", "Pediatric"],
        type: "private",
      },
      {
        name: "Batra Hospital",
        address: "Tughlakabad, Delhi",
        phone: "+91 11-2958-7000",
        lat: 28.5116,
        lng: 77.2648,
        rating: 4.2,
        specialties: ["Cardiology", "Orthopedic", "Emergency", "Oncology"],
        type: "private",
      },
    ];

    sampleHospitals.forEach(hospital => {
      const id = this.currentHospitalId++;
      this.hospitals.set(id, { ...hospital, id });
    });
  }

  // Ambulance operations
  async getAllAmbulances(): Promise<Ambulance[]> {
    return Array.from(this.ambulances.values());
  }

  async getAmbulanceByDriverId(driverId: string): Promise<Ambulance | undefined> {
    return Array.from(this.ambulances.values()).find(
      (ambulance) => ambulance.driverId === driverId
    );
  }

  async createOrUpdateAmbulance(ambulanceData: InsertAmbulance): Promise<Ambulance> {
    const existing = await this.getAmbulanceByDriverId(ambulanceData.driverId);

    if (existing) {
      const updated = { ...existing, ...ambulanceData, lastUpdated: new Date() };
      this.ambulances.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentAmbulanceId++;
      const newAmbulance: Ambulance = {
        ...ambulanceData,
        id,
        status: ambulanceData.status || 'available',
        lastUpdated: new Date(),
      };
      this.ambulances.set(id, newAmbulance);
      return newAmbulance;
    }
  }

  async updateAmbulanceLocation(driverId: string, lat: number, lng: number): Promise<Ambulance | undefined> {
    const ambulance = await this.getAmbulanceByDriverId(driverId);
    if (!ambulance) return undefined;

    const updated = { ...ambulance, lat, lng, lastUpdated: new Date() };
    this.ambulances.set(ambulance.id, updated);
    return updated;
  }

  async updateAmbulanceStatus(driverId: string, status: string): Promise<Ambulance | undefined> {
    const ambulance = await this.getAmbulanceByDriverId(driverId);
    if (!ambulance) return undefined;

    const updated = { ...ambulance, status, lastUpdated: new Date() };
    this.ambulances.set(ambulance.id, updated);
    return updated;
  }

  // Request operations
  async getAllRequests(): Promise<Request[]> {
    return Array.from(this.requests.values());
  }

  async createRequest(requestData: InsertRequest): Promise<Request> {
    const id = this.currentRequestId++;
    const newRequest: Request = {
      ...requestData,
      id,
      status: requestData.status || 'pending',
      driverId: requestData.driverId || null,
      lat: requestData.lat || null,
      lng: requestData.lng || null,
      createdAt: new Date(),
    };
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequestStatus(requestId: number, status: string, driverId?: string): Promise<Request | undefined> {
    const request = this.requests.get(requestId);
    if (!request) return undefined;

    const updated = { ...request, status, ...(driverId && { driverId }) };
    this.requests.set(requestId, updated);
    return updated;
  }

  // Hospital operations
  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async createHospital(hospitalData: InsertHospital): Promise<Hospital> {
    const id = this.currentHospitalId++;
    const newHospital: Hospital = {
      ...hospitalData,
      id,
    };
    this.hospitals.set(id, newHospital);
    return newHospital;
  }

  async searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]> {
    if (!specialty) return this.getAllHospitals();

    return Array.from(this.hospitals.values()).filter(hospital =>
      hospital.specialties.some(s => 
        s.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  }
}

export const storage = new MemStorage();