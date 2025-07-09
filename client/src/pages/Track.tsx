import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MapPin, Phone, Clock, AlertCircle, User, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToAmbulanceLocation } from "@/lib/firebase";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Track() {
  const [location] = useLocation();
  const [ambulanceData, setAmbulanceData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);

  // Extract driverId from URL parameters
  const driverId = new URLSearchParams(location.split('?')[1] || '').get('driverId') || 'driver001';

  useEffect(() => {
    // Load booking data from localStorage
    const savedBooking = localStorage.getItem('currentBooking');
    if (savedBooking) {
      setBookingData(JSON.parse(savedBooking));
    }

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-red-600" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapContainerRef}
                className="w-full h-96 rounded-lg border"
                style={{ minHeight: '400px' }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {bookingData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-600" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Patient:</span>
                    <span className="text-sm">{bookingData.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm">{bookingData.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emergency:</span>
                    <span className="text-sm">{bookingData.emergencyType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">OTP: {bookingData.otp}</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">Share this OTP with the ambulance crew</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ambulance Details</CardTitle>
            </CardHeader>
            <CardContent>
              {ambulanceData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Driver:</span>
                    <span className="text-sm">{ambulanceData.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm">{ambulanceData.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm">{ambulanceData.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className="bg-green-100 text-green-800">En Route</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ETA:</span>
                    <span className="text-sm font-medium text-blue-600">{calculateETA()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading ambulance details...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Stay calm and keep patient comfortable</p>
                <p>• Do not move patient unless necessary</p>
                <p>• Keep airways clear</p>
                <p>• Be ready to provide information to paramedics</p>
                <p>• Have OTP ready for ambulance crew</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
