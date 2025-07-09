import { useState, useEffect } from "react";
import { MapPin, Phone, Star, ExternalLink, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Hospital {
  id: number;
  name: string;
  address: string;
  phone: string;
  rating: number;
  specialties: string[];
  type: string;
  distance?: number;
}

const delhiHospitals: Hospital[] = [
  {
    id: 1,
    name: "AIIMS Delhi",
    address: "Ansari Nagar, Delhi",
    phone: "+91 11-2659-3333",
    rating: 4.8,
    specialties: ["Cardiology", "Trauma", "Neurology", "Emergency"],
    type: "government",
  },
  {
    id: 2,
    name: "Apollo Hospital",
    address: "Sarita Vihar, Delhi",
    phone: "+91 11-2692-5858",
    rating: 4.7,
    specialties: ["Cardiology", "Oncology", "Orthopedic", "Emergency"],
    type: "private",
  },
  {
    id: 3,
    name: "Max Hospital Saket",
    address: "Saket, Delhi",
    phone: "+91 11-2651-5050",
    rating: 4.6,
    specialties: ["Neurology", "Pediatric", "Orthopedic", "Emergency"],
    type: "private",
  },
  {
    id: 4,
    name: "Fortis Hospital",
    address: "Shalimar Bagh, Delhi",
    phone: "+91 11-4277-6222",
    rating: 4.5,
    specialties: ["Cardiology", "Trauma", "Emergency", "Orthopedic"],
    type: "private",
  },
  {
    id: 5,
    name: "BLK Hospital",
    address: "Pusa Road, Delhi",
    phone: "+91 11-3040-3040",
    rating: 4.4,
    specialties: ["Oncology", "Neurology", "Pediatric", "Emergency"],
    type: "private",
  },
  {
    id: 6,
    name: "Sir Ganga Ram Hospital",
    address: "Rajinder Nagar, Delhi",
    phone: "+91 11-2525-1111",
    rating: 4.6,
    specialties: ["Cardiology", "Trauma", "Neurology", "Emergency"],
    type: "private",
  },
  {
    id: 7,
    name: "Safdarjung Hospital",
    address: "Ansari Nagar, Delhi",
    phone: "+91 11-2616-5060",
    rating: 4.2,
    specialties: ["Trauma", "Emergency", "Cardiology", "Neurology"],
    type: "government",
  },
  {
    id: 8,
    name: "RML Hospital",
    address: "Connaught Place, Delhi",
    phone: "+91 11-2336-5525",
    rating: 4.1,
    specialties: ["Emergency", "Trauma", "Cardiology", "Pediatric"],
    type: "government",
  },
  {
    id: 9,
    name: "Hindu Rao Hospital",
    address: "Malka Ganj, Delhi",
    phone: "+91 11-2381-3000",
    rating: 4.0,
    specialties: ["Emergency", "Trauma", "Pediatric", "Cardiology"],
    type: "government",
  },
  {
    id: 10,
    name: "Indraprastha Apollo Hospital",
    address: "Mathura Road, Delhi",
    phone: "+91 11-2692-5858",
    rating: 4.7,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency"],
    type: "private",
  },
  {
    id: 11,
    name: "Escorts Heart Institute",
    address: "Okhla Road, Delhi",
    phone: "+91 11-2682-5000",
    rating: 4.5,
    specialties: ["Cardiology", "Cardiac Surgery", "Emergency"],
    type: "private",
  },
  {
    id: 12,
    name: "Medanta Hospital",
    address: "Sector 38, Gurgaon",
    phone: "+91 124-414-4444",
    rating: 4.6,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency"],
    type: "private",
  },
  {
    id: 13,
    name: "Artemis Hospital",
    address: "Sector 51, Gurgaon",
    phone: "+91 124-451-1111",
    rating: 4.5,
    specialties: ["Cardiology", "Orthopedic", "Neurology", "Emergency"],
    type: "private",
  },
  {
    id: 14,
    name: "Fortis Flt. Lt. Rajan Dhall Hospital",
    address: "Aruna Asaf Ali Marg, Delhi",
    phone: "+91 11-4277-6222",
    rating: 4.4,
    specialties: ["Emergency", "Trauma", "Cardiology", "Orthopedic"],
    type: "private",
  },
  {
    id: 15,
    name: "Max Super Speciality Hospital",
    address: "Patparganj, Delhi",
    phone: "+91 11-2651-5050",
    rating: 4.5,
    specialties: ["Cardiology", "Neurology", "Orthopedic", "Emergency"],
    type: "private",
  },
  {
    id: 16,
    name: "Pushpawati Singhania Hospital",
    address: "Sheikh Sarai, Delhi",
    phone: "+91 11-4651-6555",
    rating: 4.3,
    specialties: ["Cardiology", "Neurology", "Emergency", "Pediatric"],
    type: "private",
  },
  {
    id: 17,
    name: "Venkateshwar Hospital",
    address: "Sector 18A, Dwarka",
    phone: "+91 11-4599-3333",
    rating: 4.2,
    specialties: ["Emergency", "Trauma", "Cardiology", "Orthopedic"],
    type: "private",
  },
  {
    id: 18,
    name: "Primus Super Speciality Hospital",
    address: "Chandragupta Marg, Delhi",
    phone: "+91 11-4060-4040",
    rating: 4.3,
    specialties: ["Cardiology", "Neurology", "Orthopedic", "Emergency"],
    type: "private",
  },
  {
    id: 19,
    name: "Moolchand Hospital",
    address: "Lajpat Nagar, Delhi",
    phone: "+91 11-4225-5555",
    rating: 4.1,
    specialties: ["Emergency", "Cardiology", "Orthopedic", "Pediatric"],
    type: "private",
  },
  {
    id: 20,
    name: "St. Stephen's Hospital",
    address: "Tis Hazari, Delhi",
    phone: "+91 11-2396-7777",
    rating: 4.2,
    specialties: ["Emergency", "Trauma", "Cardiology", "Neurology"],
    type: "private",
  },
];

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>(delhiHospitals);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>(delhiHospitals);
  const [selectedEmergency, setSelectedEmergency] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    filterHospitals();
  }, [selectedEmergency]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  const filterHospitals = () => {
    if (!selectedEmergency || selectedEmergency === "all") {
      setFilteredHospitals(hospitals);
      return;
    }

    const filtered = hospitals.filter(hospital => 
      hospital.specialties.some(specialty => 
        specialty.toLowerCase().includes(selectedEmergency.toLowerCase())
      )
    );
    setFilteredHospitals(filtered);
  };

  const openInMaps = (hospitalName: string) => {
    const query = encodeURIComponent(`${hospitalName} Delhi`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: { [key: string]: string } = {
      "Cardiology": "bg-red-100 text-red-800",
      "Neurology": "bg-green-100 text-green-800",
      "Trauma": "bg-blue-100 text-blue-800",
      "Pediatric": "bg-pink-100 text-pink-800",
      "Orthopedic": "bg-blue-100 text-blue-800",
      "Oncology": "bg-purple-100 text-purple-800",
      "Emergency": "bg-yellow-100 text-yellow-800",
    };
    return colors[specialty] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find Nearby Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Button onClick={getCurrentLocation} className="bg-blue-600 hover:bg-blue-700">
                <Target className="mr-2 h-4 w-4" />
                Get My Location
              </Button>
            </div>
            <div>
              <Select value={selectedEmergency} onValueChange={setSelectedEmergency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  <SelectItem value="cardiac">Cardiac Emergency</SelectItem>
                  <SelectItem value="trauma">Trauma/Accident</SelectItem>
                  <SelectItem value="neuro">Neurological</SelectItem>
                  <SelectItem value="pediatric">Pediatric</SelectItem>
                  <SelectItem value="orthopedic">Orthopedic</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="emergency">General Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital) => (
          <Card key={hospital.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{hospital.name}</CardTitle>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm text-gray-600">{hospital.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {hospital.address}
                </p>
                <p className="text-gray-600 flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {hospital.phone}
                </p>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.slice(0, 3).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant="secondary"
                      className={getSpecialtyColor(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                  {hospital.specialties.length > 3 && (
                    <Badge variant="outline">
                      +{hospital.specialties.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                onClick={() => openInMaps(hospital.name)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Maps
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
