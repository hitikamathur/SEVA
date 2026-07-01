import { AmbulanceModel, RequestModel, HospitalModel } from "./models";
import { type Ambulance, type Request, type Hospital, type InsertAmbulance, type InsertRequest, type InsertHospital } from "@shared/schema";

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
  updateRequestStatus(requestId: string, status: string, driverId?: string): Promise<Request | undefined>;

  // Hospital operations
  getAllHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]>;
}

function mapAmbulance(doc: any): Ambulance {
  return {
    id: doc._id.toString(),
    driverId: doc.driverId,
    driverName: doc.driverName,
    driverEmail: doc.driverEmail,
    phone: doc.phone,
    lat: doc.lat,
    lng: doc.lng,
    type: doc.type,
    status: doc.status,
    lastUpdated: doc.lastUpdated,
  };
}

function mapRequest(doc: any): Request {
  return {
    id: doc._id.toString(),
    patientName: doc.patientName,
    patientPhone: doc.patientPhone,
    emergency: doc.emergency,
    lat: doc.lat,
    lng: doc.lng,
    driverId: doc.driverId,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function mapHospital(doc: any): Hospital {
  return {
    id: doc._id.toString(),
    name: doc.name,
    address: doc.address,
    phone: doc.phone,
    lat: doc.lat,
    lng: doc.lng,
    rating: doc.rating,
    specialties: doc.specialties,
    type: doc.type,
  };
}

export class MongoStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      const ambulanceCount = await AmbulanceModel.countDocuments();
      if (ambulanceCount === 0) {
        const sampleAmbulances = [
          {
            driverId: "driver001",
            driverName: "Rajesh Kumar",
            driverEmail: "driver1@seva.com",
            phone: "+91 9876543210",
            lat: 28.6139,
            lng: 77.2090,
            type: "government",
            status: "available",
            lastUpdated: new Date()
          },
          {
            driverId: "driver002",
            driverName: "Priya Sharma",
            driverEmail: "driver2@seva.com",
            phone: "+91 8765432109",
            lat: 28.6200,
            lng: 77.2100,
            type: "private",
            status: "available",
            lastUpdated: new Date()
          },
          {
            driverId: "driver003",
            driverName: "Amit Singh",
            driverEmail: "driver3@seva.com",
            phone: "+91 7654321098",
            lat: 28.6300,
            lng: 77.2200,
            type: "government",
            status: "busy",
            lastUpdated: new Date()
          },
          {
            driverId: "driver004",
            driverName: "Sita Devi",
            driverEmail: "driver4@seva.com",
            phone: "+91 6543210987",
            lat: 28.6400,
            lng: 77.2300,
            type: "private",
            status: "available",
            lastUpdated: new Date()
          }
        ];
        await AmbulanceModel.insertMany(sampleAmbulances);
        console.log("Seeded sample ambulances");
      }

      const hospitalCount = await HospitalModel.countDocuments();
      if (hospitalCount === 0) {
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
          }
        ];
        await HospitalModel.insertMany(sampleHospitals);
        console.log("Seeded sample hospitals");
      }
    } catch (err) {
      console.error("Error initializing sample data:", err);
    }
  }

  async getAllAmbulances(): Promise<Ambulance[]> {
    const docs = await AmbulanceModel.find();
    return docs.map(mapAmbulance);
  }

  async getAmbulanceByDriverId(driverId: string): Promise<Ambulance | undefined> {
    const doc = await AmbulanceModel.findOne({ driverId });
    return doc ? mapAmbulance(doc) : undefined;
  }

  async createOrUpdateAmbulance(ambulanceData: InsertAmbulance): Promise<Ambulance> {
    const existing = await AmbulanceModel.findOne({ driverId: ambulanceData.driverId });
    if (existing) {
      Object.assign(existing, ambulanceData, { lastUpdated: new Date() });
      await existing.save();
      return mapAmbulance(existing);
    } else {
      const newDoc = new AmbulanceModel({
        ...ambulanceData,
        status: ambulanceData.status || "available",
        lastUpdated: new Date()
      });
      await newDoc.save();
      return mapAmbulance(newDoc);
    }
  }

  async updateAmbulanceLocation(driverId: string, lat: number, lng: number): Promise<Ambulance | undefined> {
    const doc = await AmbulanceModel.findOneAndUpdate(
      { driverId },
      { lat, lng, lastUpdated: new Date() },
      { new: true }
    );
    return doc ? mapAmbulance(doc) : undefined;
  }

  async updateAmbulanceStatus(driverId: string, status: string): Promise<Ambulance | undefined> {
    const doc = await AmbulanceModel.findOneAndUpdate(
      { driverId },
      { status, lastUpdated: new Date() },
      { new: true }
    );
    return doc ? mapAmbulance(doc) : undefined;
  }

  async getAllRequests(): Promise<Request[]> {
    const docs = await RequestModel.find();
    return docs.map(mapRequest);
  }

  async createRequest(requestData: InsertRequest): Promise<Request> {
    const newDoc = new RequestModel({
      ...requestData,
      status: requestData.status || "pending",
      driverId: requestData.driverId || null,
      lat: requestData.lat || null,
      lng: requestData.lng || null,
      createdAt: new Date()
    });
    await newDoc.save();
    return mapRequest(newDoc);
  }

  async updateRequestStatus(requestId: string, status: string, driverId?: string): Promise<Request | undefined> {
    const updateData: any = { status };
    if (driverId) {
      updateData.driverId = driverId;
    }
    const doc = await RequestModel.findByIdAndUpdate(requestId, updateData, { new: true });
    return doc ? mapRequest(doc) : undefined;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    const docs = await HospitalModel.find();
    return docs.map(mapHospital);
  }

  async createHospital(hospitalData: InsertHospital): Promise<Hospital> {
    const newDoc = new HospitalModel(hospitalData);
    await newDoc.save();
    return mapHospital(newDoc);
  }

  async searchHospitalsBySpecialty(specialty: string): Promise<Hospital[]> {
    if (!specialty) return this.getAllHospitals();
    const docs = await HospitalModel.find({
      specialties: { $elemMatch: { $regex: specialty, $options: "i" } }
    });
    return docs.map(mapHospital);
  }
}

export const storage = new MongoStorage();