import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: "government" | "private";
  specialty: string[];
  emergency: boolean;
  rating: number;
  distance: number;
}

const sampleHospitals: Hospital[] = [
  {
    id: "1",
    name: "All India Institute of Medical Sciences (AIIMS)",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    phone: "+91 11 2659 3838",
    type: "government",
    specialty: ["Cardiology", "Neurology", "Oncology", "Emergency"],
    emergency: true,
    rating: 4.8,
    distance: 2.5
  },
  {
    id: "2",
    name: "Fortis Healthcare",
    address: "Sector 62, Noida, Uttar Pradesh",
    phone: "+91 120 500 4000",
    type: "private",
    specialty: ["Cardiology", "Orthopedics", "Gastroenterology"],
    emergency: true,
    rating: 4.5,
    distance: 8.2
  },
  {
    id: "3",
    name: "Safdarjung Hospital",
    address: "Safdarjung Enclave, New Delhi",
    phone: "+91 11 2673 0000",
    type: "government",
    specialty: ["General Medicine", "Surgery", "Pediatrics"],
    emergency: true,
    rating: 4.2,
    distance: 3.8
  },
  {
    id: "4",
    name: "Apollo Hospital",
    address: "Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    type: "private",
    specialty: ["Cardiology", "Neurology", "Transplant"],
    emergency: true,
    rating: 4.6,
    distance: 5.1
  },
  {
    id: "5",
    name: "Max Super Specialty Hospital",
    address: "Saket, New Delhi",
    phone: "+91 11 2651 5050",
    type: "private",
    specialty: ["Oncology", "Cardiac Surgery", "Nephrology"],
    emergency: true,
    rating: 4.4,
    distance: 4.7
  },
  {
    id: "6",
    name: "Ram Manohar Lohia Hospital",
    address: "Baba Kharak Singh Marg, New Delhi",
    phone: "+91 11 2336 5525",
    type: "government",
    specialty: ["General Medicine", "Emergency", "Trauma"],
    emergency: true,
    rating: 4.0,
    distance: 6.3
  }
];

export default function Hospitals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "government" | "private">("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");

  // Get unique specialties for filter
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    sampleHospitals.forEach(hospital => {
      hospital.specialty.forEach(spec => specialties.add(spec));
    });
    return Array.from(specialties).sort();
  }, []);

  // Filter and sort hospitals
  const filteredHospitals = useMemo(() => {
    let filtered = sampleHospitals.filter(hospital => {
      // Search filter
      const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hospital.specialty.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const matchesType = typeFilter === "all" || hospital.type === typeFilter;

      // Specialty filter
      const matchesSpecialty = specialtyFilter === "all" || 
                              hospital.specialty.some(spec => spec === specialtyFilter);

      // Emergency filter
      const matchesEmergency = !emergencyOnly || hospital.emergency;

      return matchesSearch && matchesType && matchesSpecialty && matchesEmergency;
    });

    // Sort hospitals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, typeFilter, specialtyFilter, emergencyOnly, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Hospitals</h1>
        <p className="text-gray-600">Find hospitals and medical facilities near you</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search hospitals, specialties, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={typeFilter} onValueChange={(value: "all" | "government" | "private") => setTypeFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Hospital Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>

          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {allSpecialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "distance" | "rating" | "name") => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={emergencyOnly ? "default" : "outline"}
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Emergency Only
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filteredHospitals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No hospitals found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{hospital.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        hospital.type === 'government' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {hospital.type === 'government' ? 'Government' : 'Private'}
                      </span>
                      {hospital.emergency && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Emergency
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{hospital.rating}/5</div>
                    <div className="text-sm text-gray-500">{hospital.distance} km away</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-600">{hospital.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{hospital.phone}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialty.map((spec, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button size="sm" className="flex-1">
                    Get Directions
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Call Hospital
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}