import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MapPin, Phone, Clock, AlertCircle, User, Shield, Navigation } from "lucide-react";
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [actualETA, setActualETA] = useState<string>("Calculating...");
  const [distance, setDistance] = useState<string>("Calculating...");
  const [animationIndex, setAnimationIndex] = useState<number>(0);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchPositionRef = useRef<number | null>(null);

  // Get driverId from URL params or booking data
  const getDriverId = () => {
    const urlDriverId = new URLSearchParams(location.split('?')[1] || '').get('driverId');
    
    // If we have URL parameter, use it
    if (urlDriverId) {
      return urlDriverId;
    }
    
    // If no URL parameter, try to get from booking data
    const savedBooking = localStorage.getItem('currentBooking');
    if (savedBooking) {
      const booking = JSON.parse(savedBooking);
      return booking.driverId;
    }
    
    // Last resort fallback
    return 'driver001';
  };

  const [driverId, setDriverId] = useState<string>(getDriverId());

  // Enhanced geolocation function with better error handling
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache location for 1 minute
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log('User location obtained:', { lat: latitude, lng: longitude });
      setUserLocation({
        lat: latitude,
        lng: longitude
      });
      setLocationError(null);
    };

    const error = (err: GeolocationPositionError) => {
      console.error('Geolocation error:', err);
      let errorMessage = "Unable to get your location. ";
      
      switch(err.code) {
        case err.PERMISSION_DENIED:
          errorMessage += "Location access denied. Please enable location services.";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable.";
          break;
        case err.TIMEOUT:
          errorMessage += "Location request timed out.";
          break;
        default:
          errorMessage += "An unknown error occurred.";
          break;
      }
      
      setLocationError(errorMessage);
      
      // Fallback to a default location (Delhi) if geolocation fails
      setUserLocation({
        lat: 28.6139,
        lng: 77.2090
      });
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(success, error, options);

    // Also watch for position changes (in case user moves)
    watchPositionRef.current = navigator.geolocation.watchPosition(success, error, options);
  };

  // Fetch route from OpenRouteService (free alternative to Google Maps)
  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      // Using OSRM (Open Source Routing Machine) - free and no API key required
      const osrmResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
      const osrmData = await osrmResponse.json();

      if (osrmData.routes && osrmData.routes.length > 0) {
        const route = osrmData.routes[0];
        return {
          coordinates: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]), // Convert to [lat, lng]
          distance: route.distance,
          duration: route.duration
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }

    // Fallback to straight line if routing fails
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: calculateStraightLineDistance(startLat, startLng, endLat, endLng) * 1000,
      duration: calculateStraightLineDistance(startLat, startLng, endLat, endLng) * 1000 / 30 * 3.6 // Rough estimate
    };
  };

  // Calculate straight line distance (Haversine formula)
  const calculateStraightLineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Animate ambulance movement along route - INCREASED SPEED
  const animateAmbulance = () => {
    if (!routeData || !routeData.coordinates || !ambulanceMarkerRef.current) return;

    const coordinates = routeData.coordinates;
    const totalPoints = coordinates.length;

    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    let currentIndex = 0;
    animationIntervalRef.current = setInterval(() => {
      if (currentIndex >= totalPoints - 1) {
        clearInterval(animationIntervalRef.current!);
        return;
      }

      const currentPoint = coordinates[currentIndex];
      const nextPoint = coordinates[currentIndex + 1];

      // Smooth interpolation between points - INCREASED STEPS FOR SMOOTHER ANIMATION
      const steps = 15; // Increased from 10 to 15 for smoother movement
      let step = 0;

      const moveStep = () => {
        if (step >= steps) {
          currentIndex++;
          return;
        }

        const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * (step / steps);
        const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * (step / steps);

        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng([lat, lng]);
        }

        step++;
        setTimeout(moveStep, 30); // DECREASED from 100ms to 30ms for faster micro-steps
      };

      moveStep();
    }, 300); // DECREASED from 1000ms to 300ms for faster movement between major points
  };

  const calculateETA = () => {
    if (!ambulanceData || !userLocation) return "Calculating...";

    const distance = Math.sqrt(
      Math.pow(ambulanceData.lat - userLocation.lat, 2) + 
      Math.pow(ambulanceData.lng - userLocation.lng, 2)
    );

    const eta = Math.round(distance * 100000); // Rough ETA calculation
    return `${eta} minutes`;
  };

  // Initialize data
  useEffect(() => {
    // Load booking data from localStorage
    const savedBooking = localStorage.getItem('currentBooking');
    if (savedBooking) {
      const booking = JSON.parse(savedBooking);
      setBookingData(booking);
      
      // Update driverId if it's different from what we have
      if (booking.driverId && booking.driverId !== driverId) {
        setDriverId(booking.driverId);
      }
    }

    // Get user location with enhanced error handling
    getUserLocation();

    // Cleanup function
    return () => {
      if (watchPositionRef.current) {
        navigator.geolocation.clearWatch(watchPositionRef.current);
      }
    };
  }, []);

  // Subscribe to ambulance location - separate effect for driverId changes
  useEffect(() => {
    console.log('Subscribing to ambulance location for driverId:', driverId);
    
    // Clear previous ambulance data when changing drivers
    setAmbulanceData(null);
    setRouteData(null);
    setActualETA("Calculating...");
    setDistance("Calculating...");

    // Clear any existing animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    // Subscribe to new ambulance location
    const unsubscribe = subscribeToAmbulanceLocation(driverId, (data) => {
      console.log('Received ambulance data for', driverId, ':', data);
      setAmbulanceData(data);
    });

    return () => {
      unsubscribe();
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [driverId]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Use user location if available, otherwise default to Delhi
      const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] : [28.6139, 77.2090];
      mapRef.current = L.map(mapContainerRef.current).setView(initialCenter as [number, number], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

  // Update route when ambulance or user location changes
  useEffect(() => {
    if (ambulanceData && userLocation) {
      console.log('Fetching route from ambulance to user location');
      fetchRoute(ambulanceData.lat, ambulanceData.lng, userLocation.lat, userLocation.lng)
        .then(route => {
          if (route) {
            setRouteData(route);
            setDistance(`${(route.distance / 1000).toFixed(1)} km`);
            setActualETA(`${Math.round(route.duration / 60)} min`);
          }
        });
    }
  }, [ambulanceData, userLocation]);

  // Update map markers and route
  useEffect(() => {
    if (mapRef.current && ambulanceData && userLocation) {
      // Clear previous animation
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }

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
        .bindPopup(`${ambulanceData.driverName} - En Route to You`);

      // Add user location marker
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="bg-blue-600 text-white rounded-full p-2 text-center">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('Your Location');

      // Add route if available - solid black line
      if (routeData && routeData.coordinates) {
        if (routeLayerRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }
        routeLayerRef.current = L.polyline(routeData.coordinates, {
          color: '#000000',
          weight: 3,
          opacity: 0.8
        }).addTo(mapRef.current);

        // Start animation
        animateAmbulance();
      }

      // Fit map to show both markers
      const group = L.featureGroup([
        ambulanceMarkerRef.current,
        userMarkerRef.current
      ]);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    } else if (mapRef.current && userLocation) {
      // Show only user location if ambulance data is not available
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="bg-blue-600 text-white rounded-full p-2 text-center">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('Your Location');
    }
  }, [ambulanceData, userLocation, routeData]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambulance Tracking</h1>
        <p className="text-gray-600">Real-time location and route tracking</p>
        {/* Debug info - remove in production */}
        <p className="text-sm text-gray-500">Tracking Driver ID: {driverId}</p>
        {locationError && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {locationError}
          </div>
        )}
        {userLocation && (
          <p className="text-xs text-green-600 mt-1">
            Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-red-600" />
                Live Tracking
                <Badge className="ml-auto bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></div>
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapContainerRef}
                className="w-full h-96 rounded-lg border shadow-inner"
                style={{ minHeight: '400px' }}
              />

              {/* Route Info Bar */}
              <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Distance: {distance}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium">ETA: {actualETA}</span>
                </div>
              </div>
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
                    <span className="text-sm font-medium">Assigned Driver:</span>
                    <span className="text-sm">{bookingData.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Driver Phone:</span>
                    <span className="text-sm">{bookingData.driverPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="mr-2 h-5 w-5 text-yellow-600" />
                      <span className="text-lg font-bold text-yellow-800">OTP</span>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-mono font-bold text-yellow-900 bg-yellow-100 px-3 py-1 rounded">
                        {bookingData.otp}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2 text-center">Share this OTP with the ambulance crew for verification</p>
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
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Loading ambulance details...</p>
                  <p className="text-xs text-gray-400">Driver ID: {driverId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
                Emergency Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm">Stay calm and keep patient comfortable</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm">Do not move patient unless absolutely necessary</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm">Keep airways clear and monitor breathing</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm">Be ready to provide information to paramedics</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm">Have OTP ready for ambulance crew verification</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-red-700 font-medium">Emergency: Call 102 if situation becomes critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}