import { useState, useMemo, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: "government" | "private";
  specialties: string[];
  rating: number;
  lat: number;
  lng: number;
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

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
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [hospitalsList, setHospitalsList] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hospitalMarkersRef = useRef<L.Marker[]>([]);

  // Get user's current location on load
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch from database
  useEffect(() => {
    fetch("/api/hospitals")
      .then(res => res.json())
      .then(data => {
        setHospitalsList(data);
        setIsLoadingHospitals(false);
      })
      .catch(err => {
        console.error("Failed to load hospitals:", err);
        setIsLoadingHospitals(false);
      });
  }, []);

  // Setup/Update Interactive Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const center = userLocation ? [userLocation.lat, userLocation.lng] : [28.5672, 77.2100];
      mapRef.current = L.map(mapContainerRef.current).setView(center as [number, number], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

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
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get unique specialties for filter
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    hospitalsList.forEach(hospital => {
      if (Array.isArray(hospital.specialties)) {
        hospital.specialties.forEach(spec => specialties.add(spec));
      }
    });
    return Array.from(specialties).sort();
  }, [hospitalsList]);

  // Calculate distances and filter/sort hospitals
  const filteredHospitals = useMemo(() => {
    const hospitalsWithDistance = hospitalsList.map(hospital => ({
      ...hospital,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
        : 0
    }));

    let filtered = hospitalsWithDistance.filter(hospital => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = searchLower === "" || 
                           hospital.name.toLowerCase().includes(searchLower) ||
                           hospital.address.toLowerCase().includes(searchLower) ||
                           (Array.isArray(hospital.specialties) && hospital.specialties.some(spec => spec.toLowerCase().includes(searchLower)));

      const matchesType = typeFilter === "all" || hospital.type === typeFilter;
      const matchesSpecialty = specialtyFilter === "all" || 
                              (Array.isArray(hospital.specialties) && hospital.specialties.includes(specialtyFilter));

      return matchesSearch && matchesType && matchesSpecialty;
    });

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
  }, [hospitalsList, searchTerm, typeFilter, specialtyFilter, sortBy, userLocation]);

  // Update Map Markers on Filter Change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    hospitalMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
    hospitalMarkersRef.current = [];

    // Add new markers
    filteredHospitals.forEach(hospital => {
      const icon = L.divIcon({
        className: 'hospital-marker-pin',
        html: `<div class="bg-emerald-600 text-white rounded-full p-2 text-center text-xs font-bold shadow-md">🏥</div>`,
        iconSize: [30, 30]
      });
      const m = L.marker([hospital.lat, hospital.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<strong>${hospital.name}</strong><br/>${hospital.address}`);
      hospitalMarkersRef.current.push(m);
    });

    // Zoom map to show all markers
    if (hospitalMarkersRef.current.length > 0 && mapRef.current) {
      const group = L.featureGroup(hospitalMarkersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [filteredHospitals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Hospital Directory</h1>
        <p className="text-gray-500 mt-1">Search, filter, and navigate to emergency centers near you</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Filters and List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search specialty, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="government">Govt</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="rounded-xl w-full">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {allSpecialties.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hospital Directory List */}
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {isLoadingHospitals ? (
              <p className="text-gray-400 text-center py-6">Loading facilities...</p>
            ) : filteredHospitals.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No matching hospitals found.</p>
            ) : (
              filteredHospitals.map(hospital => (
                <Card key={hospital.id} className="premium-card p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-bold text-gray-900 leading-snug">{hospital.name}</h3>
                    <Badge className="bg-red-50 text-red-700 font-semibold border border-red-100 flex-shrink-0">
                      {hospital.rating} ⭐
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{hospital.address}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400 capitalize">{hospital.type} Hospital</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (userLocation) {
                            window.open(`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.lat},${hospital.lng}`, '_blank');
                          } else {
                            alert("Please enable location services");
                          }
                        }}
                        className="rounded-lg text-xs bg-red-600 hover:bg-red-700 text-white"
                      >
                        Navigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${hospital.phone}`, '_self')}
                        className="rounded-lg text-xs border-gray-200 text-gray-600"
                      >
                        Call
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-full min-h-[500px]">
            <div ref={mapContainerRef} className="w-full h-full min-h-[500px] rounded-2xl border border-gray-50 shadow-inner" />
          </div>
        </div>
      </div>
    </div>
  );
}