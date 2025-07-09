import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToAmbulanceLocation } from "@/lib/firebase";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Track() {
  const [location] = useLocation();
  const [ambulanceData, setAmbulanceData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);

  // Extract driverId from URL parameters
  const driverId = new URLSearchParams(location.split('?')[1] || '').get('driverId') || 'driver001';

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }

    // Subscribe to ambulance location
    const unsubscribe = subscribeToAmbulanceLocation(driverId, (data) => {
      setAmbulanceData(data);
    });

    return () => unsubscribe();
  }, [driverId]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && ambulanceData) {
      // Update ambulance marker
      if (ambulanceMarkerRef.current) {
        mapRef.current.removeLayer(ambulanceMarkerRef.current);
      }

      const ambulanceIcon = L.divIcon({
        className: 'ambulance-marker',
        html: `<div class="bg-red-600 text-white rounded-full p-2 text-center animate-pulse">🚑</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      ambulanceMarkerRef.current = L.marker([ambulanceData.lat, ambulanceData.lng], { icon: ambulanceIcon })
        .addTo(mapRef.current)
        .bindPopup(`${ambulanceData.driverName} - En Route`);

      // Add user location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: `<div class="bg-blue-600 text-white rounded-full p-2 text-center">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup('Your Location');

        // Fit map to show both markers
        const group = L.featureGroup([
          ambulanceMarkerRef.current,
          L.marker([userLocation.lat, userLocation.lng])
        ]);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      } else {
        mapRef.current.setView([ambulanceData.lat, ambulanceData.lng], 15);
      }
    }
  }, [ambulanceData, userLocation]);

  const calculateETA = () => {
    if (!ambulanceData || !userLocation) return "Calculating...";
    
    const distance = Math.sqrt(
      Math.pow(ambulanceData.lat - userLocation.lat, 2) + 
      Math.pow(ambulanceData.lng - userLocation.lng, 2)
    );
    
    const eta = Math.round(distance * 100000); // Rough ETA calculation
    return `${eta} minutes`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Live Ambulance Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {ambulanceData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Driver</h3>
                <p className="text-blue-800">{ambulanceData.driverName}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Status</h3>
                <p className="text-green-800">En Route</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900">ETA</h3>
                <p className="text-yellow-800">{calculateETA()}</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapContainerRef}
            className="h-96 rounded-lg overflow-hidden border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Name:</strong> <span>John Doe</span>
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Contact:</strong> <span>+91 9876543210</span>
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Emergency:</strong> <span>Chest pain</span>
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Request Time:</strong> <span>{new Date().toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
