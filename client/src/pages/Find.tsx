import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Route, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToAmbulances } from "@/lib/firebase";
import { useLocation } from "wouter";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Find() {
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ambulances, setAmbulances] = useState<any>({});
  const [locationStatus, setLocationStatus] = useState<string>("");
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to ambulances
    const unsubscribe = subscribeToAmbulances((ambulanceData) => {
      setAmbulances(ambulanceData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add ambulance markers
      updateAmbulanceMarkers();
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      updateAmbulanceMarkers();
    }
  }, [ambulances]);

  const updateAmbulanceMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add ambulance markers
    Object.entries(ambulances).forEach(([driverId, ambulance]: [string, any]) => {
      if (ambulance.lat && ambulance.lng) {
        const ambulanceIcon = L.divIcon({
          className: 'ambulance-marker',
          html: `<div class="bg-red-600 text-white rounded-full p-2 text-center">🚑</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([ambulance.lat, ambulance.lng], { icon: ambulanceIcon })
          .addTo(mapRef.current!)
          .bindPopup(`${ambulance.driverName} - ${ambulance.status}`);
      }
    });

    // Add user location marker if available
    if (userLocation && mapRef.current) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="bg-blue-600 text-white rounded-full p-2 text-center">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('Your Location');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationStatus("Location detected");
          
          if (mapRef.current) {
            mapRef.current.setView([location.lat, location.lng], 13);
            updateAmbulanceMarkers();
          }
        },
        (error) => {
          setLocationStatus("Unable to get location");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setLocationStatus("Geolocation not supported");
    }
  };

  const trackAmbulance = (driverId: string) => {
    setLocation(`/track?driverId=${driverId}`);
  };

  const calculateETA = (ambulanceLat: number, ambulanceLng: number) => {
    if (!userLocation) return "Unknown";
    
    const distance = Math.sqrt(
      Math.pow(ambulanceLat - userLocation.lat, 2) + 
      Math.pow(ambulanceLng - userLocation.lng, 2)
    );
    
    const eta = Math.round(distance * 100000); // Rough ETA calculation
    return `${eta} min`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find Nearby Ambulances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Button onClick={getCurrentLocation} className="bg-blue-600 hover:bg-blue-700">
              <MapPin className="mr-2 h-4 w-4" />
              Get My Location
            </Button>
            {locationStatus && (
              <div className="flex items-center text-green-600 font-semibold">
                <CheckCircle className="mr-2 h-4 w-4" />
                {locationStatus}
              </div>
            )}
          </div>
          
          <div 
            ref={mapContainerRef}
            className="h-96 rounded-lg overflow-hidden border"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(ambulances).map(([driverId, ambulance]: [string, any]) => (
          <Card key={driverId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ambulance.driverName}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  ambulance.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {ambulance.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 flex items-center">
                  <span className="mr-2">🚑</span>
                  {ambulance.type} Ambulance
                </p>
                <p className="text-gray-600 flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {ambulance.phone}
                </p>
                <p className="text-gray-600 flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  ETA: {calculateETA(ambulance.lat, ambulance.lng)}
                </p>
              </div>
              
              <Button
                onClick={() => trackAmbulance(driverId)}
                disabled={ambulance.status !== 'available'}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Route className="mr-2 h-4 w-4" />
                Track Ambulance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
