import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Route, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToAmbulances, initializeSampleAmbulances } from "@/lib/firebase";
import { useLocation } from "wouter";
import BookingModal from "@/components/BookingModal";

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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<{id: string, name: string, phone: string} | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize sample ambulances if none exist
    initializeSampleAmbulances();
    
    // Subscribe to ambulances
    const unsubscribe = subscribeToAmbulances((ambulanceData) => {
      console.log("Ambulance data received:", ambulanceData);
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

  const bookAmbulance = (driverId: string) => {
    const ambulance = ambulances[driverId];
    if (ambulance) {
      setSelectedDriver({
        id: driverId,
        name: ambulance.driverName || 'Unknown Driver',
        phone: ambulance.phone || 'N/A'
      });
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = async (bookingData: any) => {
    console.log('Booking data:', bookingData);
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store booking data in localStorage for tracking page
    localStorage.setItem('currentBooking', JSON.stringify({
      ...bookingData,
      driverId: selectedDriver?.id,
      driverName: selectedDriver?.name,
      driverPhone: selectedDriver?.phone,
      otp: otp,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    }));
    
    // Close modal and redirect to tracking page
    setShowBookingModal(false);
    setLocation(`/track?driverId=${selectedDriver?.id}`);
  };

  const calculateETA = (ambulanceLat: number, ambulanceLng: number) => {
    if (!userLocation) return "Unknown";
    
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = (ambulanceLat - userLocation.lat) * Math.PI / 180;
    const dLng = (ambulanceLng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(ambulanceLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    // Assume average speed of 40 km/h for ambulance in city traffic
    const averageSpeed = 40; // km/h
    const eta = Math.round((distance / averageSpeed) * 60); // Convert to minutes
    
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
        {Object.keys(ambulances).length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No ambulances found. Loading...</p>
          </div>
        ) : (
          Object.entries(ambulances).map(([driverId, ambulance]: [string, any]) => (
            <Card key={driverId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ambulance.driverName || 'Unknown Driver'}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    ambulance.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {ambulance.status || 'Unknown'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 flex items-center">
                    <span className="mr-2">🚑</span>
                    {ambulance.type || 'Standard'} Ambulance
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    {ambulance.phone || 'N/A'}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    ETA: {calculateETA(ambulance.lat, ambulance.lng)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => trackAmbulance(driverId)}
                    disabled={ambulance.status !== 'available'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Route className="mr-2 h-4 w-4" />
                    Track Ambulance
                  </Button>
                  
                  <Button
                    onClick={() => bookAmbulance(driverId)}
                    disabled={ambulance.status !== 'available'}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Book Ambulance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedDriver && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBooking={handleBookingSubmit}
          driverName={selectedDriver.name}
          driverPhone={selectedDriver.phone}
        />
      )}
    </div>
  );
}