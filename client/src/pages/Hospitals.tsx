import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Phone, Clock, Filter, Navigation } from "lucide-react";
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
  lat: number;
  lng: number;
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const sampleHospitals: Hospital[] = [
  {
    id: "1",
    name: "All India Institute of Medical Sciences (AIIMS)",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    phone: "+91 11 2659 3838",
    type: "government",
    specialty: ["Cardiology", "Neurology", "Oncology", "Emergency", "General Medicine"],
    emergency: true,
    rating: 4.8,
    lat: 28.5672,
    lng: 77.2100
  },
  {
    id: "2",
    name: "Fortis Healthcare",
    address: "Sector 62, Noida, Uttar Pradesh",
    phone: "+91 120 500 4000",
    type: "private",
    specialty: ["Cardiology", "Orthopedics", "Gastroenterology", "Emergency", "Surgery"],
    emergency: true,
    rating: 4.5,
    lat: 28.6067,
    lng: 77.3667
  },
  {
    id: "3",
    name: "Safdarjung Hospital",
    address: "Safdarjung Enclave, New Delhi",
    phone: "+91 11 2673 0000",
    type: "government",
    specialty: ["General Medicine", "Surgery", "Pediatrics", "Emergency", "Trauma"],
    emergency: true,
    rating: 4.2,
    lat: 28.5672,
    lng: 77.2016
  },
  {
    id: "4",
    name: "Apollo Hospital",
    address: "Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    type: "private",
    specialty: ["Cardiology", "Neurology", "Transplant", "Emergency", "Nephrology"],
    emergency: true,
    rating: 4.6,
    lat: 28.5355,
    lng: 77.2883
  },
  {
    id: "5",
    name: "Max Super Specialty Hospital",
    address: "Saket, New Delhi",
    phone: "+91 11 2651 5050",
    type: "private",
    specialty: ["Oncology", "Cardiology", "Nephrology", "Emergency", "Orthopedics"],
    emergency: true,
    rating: 4.4,
    lat: 28.5245,
    lng: 77.2066
  },
  {
    id: "6",
    name: "Ram Manohar Lohia Hospital",
    address: "Baba Kharak Singh Marg, New Delhi",
    phone: "+91 11 2336 5525",
    type: "government",
    specialty: ["General Medicine", "Emergency", "Trauma", "Surgery", "Pediatrics"],
    emergency: true,
    rating: 4.0,
    lat: 28.6328,
    lng: 77.2197
  },
  {
    id: "7",
    name: "Delhi Heart & Lung Institute",
    address: "Panchsheel Park, New Delhi",
    phone: "+91 11 4225 5555",
    type: "private",
    specialty: ["Cardiology", "Pulmonology", "Neurology"],
    emergency: false,
    rating: 4.3,
    lat: 28.5562,
    lng: 77.2410
  },
  {
    id: "8",
    name: "Lady Hardinge Medical College",
    address: "Connaught Place, New Delhi",
    phone: "+91 11 2336 1436",
    type: "government",
    specialty: ["Pediatrics", "Gynecology", "General Medicine", "Emergency"],
    emergency: true,
    rating: 3.9,
    lat: 28.6315,
    lng: 77.2167
  },
  {
    id: "9",
    name: "Medanta - The Medicity",
    address: "Sector 38, Gurugram, Haryana",
    phone: "+91 124 414 4444",
    type: "private",
    specialty: ["Cardiology", "Neurology", "Oncology", "Transplant", "Emergency"],
    emergency: true,
    rating: 4.7,
    lat: 28.4421,
    lng: 77.0936
  },
  {
    id: "10",
    name: "BLK Super Specialty Hospital",
    address: "Pusa Road, New Delhi",
    phone: "+91 11 3040 3040",
    type: "private",
    specialty: ["Gastroenterology", "Orthopedics", "Nephrology", "Emergency", "Surgery"],
    emergency: true,
    rating: 4.5,
    lat: 28.6562,
    lng: 77.1917
  },
  {
    id: "11",
    name: "Sir Ganga Ram Hospital",
    address: "Rajinder Nagar, New Delhi",
    phone: "+91 11 2575 1111",
    type: "private",
    specialty: ["Gastroenterology", "Pulmonology", "Nephrology", "Emergency", "General Medicine"],
    emergency: true,
    rating: 4.4,
    lat: 28.6362,
    lng: 77.1917
  },
  {
    id: "12",
    name: "Lok Nayak Hospital",
    address: "Jawaharlal Nehru Marg, New Delhi",
    phone: "+91 11 2323 4242",
    type: "government",
    specialty: ["Trauma", "Emergency", "General Medicine", "Surgery", "Orthopedics"],
    emergency: true,
    rating: 3.8,
    lat: 28.6562,
    lng: 77.2410
  },
  {
    id: "13",
    name: "Indraprastha Apollo Hospital",
    address: "Mathura Road, New Delhi",
    phone: "+91 11 2692 5858",
    type: "private",
    specialty: ["Transplant", "Oncology", "Neurology", "Emergency", "Cardiology"],
    emergency: true,
    rating: 4.6,
    lat: 28.5355,
    lng: 77.2883
  },
  {
    id: "14",
    name: "Kalawati Saran Children's Hospital",
    address: "Ansari Nagar, New Delhi",
    phone: "+91 11 2659 4104",
    type: "government",
    specialty: ["Pediatrics", "Emergency", "General Medicine"],
    emergency: true,
    rating: 4.1,
    lat: 28.5672,
    lng: 77.2100
  },
  {
    id: "15",
    name: "Primus Super Specialty Hospital",
    address: "Chankyapuri, New Delhi",
    phone: "+91 11 4060 4040",
    type: "private",
    specialty: ["Orthopedics", "Pulmonology", "Gastroenterology", "Emergency"],
    emergency: true,
    rating: 4.2,
    lat: 28.5953,
    lng: 77.1872
  },
  {
    id: "16",
    name: "Fortis Escorts Heart Institute",
    address: "Okhla Road, New Delhi",
    phone: "+91 11 4713 5000",
    type: "private",
    specialty: ["Cardiology", "Emergency"],
    emergency: true,
    rating: 4.7,
    lat: 28.5355,
    lng: 77.2883
  },
  {
    id: "17",
    name: "Maulana Azad Medical College",
    address: "Bahadur Shah Zafar Marg, New Delhi",
    phone: "+91 11 2323 7126",
    type: "government",
    specialty: ["General Medicine", "Surgery", "Pediatrics", "Emergency", "Trauma"],
    emergency: true,
    rating: 3.7,
    lat: 28.6562,
    lng: 77.2410
  },
  {
    id: "18",
    name: "Artemis Hospital",
    address: "Sector 51, Gurugram, Haryana",
    phone: "+91 124 451 1111",
    type: "private",
    specialty: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Emergency"],
    emergency: true,
    rating: 4.5,
    lat: 28.4421,
    lng: 77.0936
  },
  {
    id: "19",
    name: "Hindu Rao Hospital",
    address: "Malka Ganj, New Delhi",
    phone: "+91 11 2381 4441",
    type: "government",
    specialty: ["General Medicine", "Emergency", "Trauma", "Surgery"],
    emergency: true,
    rating: 3.6,
    lat: 28.6667,
    lng: 77.2167
  },
  {
    id: "20",
    name: "Jaypee Hospital",
    address: "Sector 128, Noida, Uttar Pradesh",
    phone: "+91 120 468 4444",
    type: "private",
    specialty: ["Cardiology", "Neurology", "Nephrology", "Emergency", "Transplant"],
    emergency: true,
    rating: 4.3,
    lat: 28.5400,
    lng: 77.3900
  }
];

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function Hospitals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "government" | "private">("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's current location
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Get unique specialties for filter
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    sampleHospitals.forEach(hospital => {
      hospital.specialty.forEach(spec => specialties.add(spec));
    });
    return Array.from(specialties).sort();
  }, []);

  // Calculate distances and filter/sort hospitals
  const filteredHospitals = useMemo(() => {
    // First, calculate distances if user location is available
    const hospitalsWithDistance = sampleHospitals.map(hospital => ({
      ...hospital,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
        : 0
    }));

    // Filter hospitals
    let filtered = hospitalsWithDistance.filter(hospital => {
      // Search filter
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = searchLower === "" || 
                           hospital.name.toLowerCase().includes(searchLower) ||
                           hospital.address.toLowerCase().includes(searchLower) ||
                           hospital.specialty.some(spec => spec.toLowerCase().includes(searchLower));

      // Type filter
      const matchesType = typeFilter === "all" || hospital.type === typeFilter;

      // Specialty filter
      const matchesSpecialty = specialtyFilter === "all" || 
                              hospital.specialty.includes(specialtyFilter);

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
  }, [searchTerm, typeFilter, specialtyFilter, emergencyOnly, sortBy, userLocation]);

  // Active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (typeFilter !== "all") filters.push(`Type: ${typeFilter}`);
    if (specialtyFilter !== "all") filters.push(`Specialty: ${specialtyFilter}`);
    if (emergencyOnly) filters.push("Emergency Only");
    if (searchTerm.trim()) filters.push(`Search: "${searchTerm}"`);
    return filters;
  }, [typeFilter, specialtyFilter, emergencyOnly, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Hospitals</h1>
        <p className="text-gray-600">Find hospitals and medical facilities near you</p>
      </div>

      {/* Location Status */}
      <div className="mb-6">
        {isLoadingLocation && (
          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Navigation className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Getting your location...</span>
          </div>
        )}
        
        {locationError && (
          <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <span className="text-sm">{locationError}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={getUserLocation}
              className="text-red-600 border-red-300 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        )}
        
        {userLocation && !isLoadingLocation && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Navigation className="h-4 w-4" />
            <span className="text-sm">
              Location found: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={getUserLocation}
              className="text-green-600 border-green-300 hover:bg-green-100 ml-auto"
            >
              Refresh Location
            </Button>
          </div>
        )}
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

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredHospitals.length} of {sampleHospitals.length} hospitals
          {sortBy !== "distance" && ` (sorted by ${sortBy})`}
          {!userLocation && " (distances not available - enable location)"}
        </p>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filteredHospitals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-2">No hospitals found matching your criteria.</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms.</p>
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
                    <div className="text-sm text-gray-500">
                      {userLocation 
                        ? `${hospital.distance.toFixed(1)} km away`
                        : "Distance unavailable"
                      }
                    </div>
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
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded text-xs ${
                            specialtyFilter === spec 
                              ? 'bg-blue-200 text-blue-800 font-medium' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      if (userLocation) {
                        // Open Google Maps with directions
                        const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.lat},${hospital.lng}`;
                        window.open(url, '_blank');
                      }
                    }}
                    disabled={!userLocation}
                  >
                    Get Directions
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      window.open(`tel:${hospital.phone}`, '_self');
                    }}
                  >
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