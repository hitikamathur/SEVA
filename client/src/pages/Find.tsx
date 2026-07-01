import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Route, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToAmbulances } from "@/lib/api";
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
    mapRef.current.eachLayer((layer: L.Layer) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nearby Ambulance Map</h1>
        <p className="text-gray-500 mt-1">Real-time GPS tracker displaying active emergency response vehicles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div 
              ref={mapContainerRef}
              className="h-[420px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner"
            />
          </div>
        </div>

        <div>
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950 mb-3">GPS Detection</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">Enable geographic location coordinates detection for automatic route assignment.</p>
              
              <Button onClick={getCurrentLocation} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 font-bold shadow-sm shadow-red-500/10 transition-all duration-300">
                <MapPin className="mr-2 h-4 w-4" />
                Scan Current Location
              </Button>
            </div>

            {locationStatus && (
              <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 font-semibold text-sm">
                <CheckCircle className="h-4 w-4" />
                {locationStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Available Vehicles</h2>
        <Button
          onClick={() => {
            // Find closest available vehicle
            const entries = Object.entries(ambulances);
            const available = entries.filter(([_, amb]: [string, any]) => amb.status === 'available');
            if (available.length > 0) {
              // Select the first one
              const [driverId, ambulance] = available[0] as [string, any];
              setSelectedDriver({
                id: driverId,
                name: ambulance.driverName,
                phone: ambulance.phone
              });
              setShowBookingModal(true);
            } else {
              alert("All ambulances are currently busy. Please try again in a few seconds.");
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm px-6"
        >
          Request Nearest Ambulance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(ambulances).length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No ambulances found. Loading...</p>
          </div>
        ) : (
          Object.entries(ambulances).map(([driverId, ambulance]: [string, any]) => (
            <Card key={driverId} className="premium-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-bold text-gray-900">{ambulance.driverName || 'Unknown Driver'}</CardTitle>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    ambulance.status === 'available' 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {ambulance.status === 'available' ? 'Available' : 'Busy'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2 text-md">🚑</span>
                    <span className="capitalize">{ambulance.type || 'Standard'} Ambulance</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    {ambulance.phone || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    Estimated ETA: {calculateETA(ambulance.lat, ambulance.lng)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showBookingModal && selectedDriver && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBooking={handleBookingSubmit}
          driverName={selectedDriver.name}
          driverPhone={selectedDriver.phone}
          ambulanceId={selectedDriver.id}
        />
      )}
    </div>
  );
}