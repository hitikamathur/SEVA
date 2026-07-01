import { useState, useEffect, useRef } from "react";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToAmbulances, subscribeToAmbulanceLocation, subscribeToRequests, createRequest } from "@/lib/api";
import BookingModal from "@/components/BookingModal";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet default icons fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ambulances, setAmbulances] = useState<any>({});
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [bookingData, setBookingData] = useState<any>(null);
  const [activeAmbulance, setActiveAmbulance] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const ambulanceMarkersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const activeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize page & restore booking state
  useEffect(() => {
    // 1. Subscribe to all ambulances
    const unsubscribeAll = subscribeToAmbulances((data) => {
      setAmbulances(data);
    });

    // 2. Restore active booking
    const savedBooking = localStorage.getItem("currentBooking");
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBookingData(parsed);
      } catch (e) {
        localStorage.removeItem("currentBooking");
      }
    }

    // 3. Scan user location on load
    getCurrentLocation();

    return () => {
      unsubscribeAll();
      if (activeUnsubscribeRef.current) activeUnsubscribeRef.current();
    };
  }, []);

  // Set up Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const center = userLocation ? [userLocation.lat, userLocation.lng] : [28.6139, 77.2090];
      mapRef.current = L.map(mapContainerRef.current).setView(center as [number, number], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

  // Subscribe to tracking coordinates if booking is active
  useEffect(() => {
    if (bookingData?.driverId) {
      if (activeUnsubscribeRef.current) activeUnsubscribeRef.current();
      
      activeUnsubscribeRef.current = subscribeToAmbulanceLocation(bookingData.driverId, (data) => {
        setActiveAmbulance(data);
        
        // If the server simulator marked request completed, reset booking state
        if (data && data.status === "available" && bookingData.status === "confirmed") {
          // Booking finished
          localStorage.removeItem("currentBooking");
          setBookingData(null);
          setActiveAmbulance(null);
          if (routeLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
          }
          alert("Ambulance crew has arrived at your location!");
        }
      });
    }
  }, [bookingData]);

  // Synchronize server-allocated driver info
  useEffect(() => {
    if (!bookingData || !bookingData.id) return;

    const unsubscribe = subscribeToRequests((requestsList) => {
      const serverReq = requestsList[bookingData.id];
      if (serverReq && serverReq.driverId && serverReq.driverId !== bookingData.driverId) {
        // Find driver details from ambulances cache
        const matchedAmbulance = ambulances[serverReq.driverId];
        const updated = {
          ...bookingData,
          driverId: serverReq.driverId,
          driverName: matchedAmbulance ? matchedAmbulance.driverName : "Rajesh Kumar",
          driverPhone: matchedAmbulance ? matchedAmbulance.phone : "+91 9876543210",
          status: serverReq.status
        };
        localStorage.setItem("currentBooking", JSON.stringify(updated));
        setBookingData(updated);
      }
    });

    return () => unsubscribe();
  }, [bookingData, ambulances]);

  // Fetch actual driving road coordinates path using free OSRM Routing API
  useEffect(() => {
    if (!activeAmbulance || !userLocation) {
      setRouteCoords(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${activeAmbulance.lng},${activeAmbulance.lat};${userLocation.lng},${userLocation.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM error");
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const geojson = data.routes[0].geometry;
          const coords = geojson.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setRouteCoords(coords);
        }
      } catch (e) {
        console.log("OSRM route fetch failed, using fallback straight path:", e);
        // Fallback straight line
        setRouteCoords([
          [activeAmbulance.lat, activeAmbulance.lng],
          [userLocation.lat, userLocation.lng]
        ]);
      }
    };

    fetchRoute();
  }, [activeAmbulance?.lat, activeAmbulance?.lng, userLocation?.lat, userLocation?.lng]);

  // Render Markers and Paths
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Clear non-active markers
    Object.keys(ambulanceMarkersRef.current).forEach((driverId) => {
      if (!bookingData || bookingData.driverId !== driverId) {
        mapRef.current?.removeLayer(ambulanceMarkersRef.current[driverId]);
        delete ambulanceMarkersRef.current[driverId];
      }
    });
    // 2. Draw User Marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-slate-900/20 rounded-full animate-ping"></div>
              <div class="relative w-7 h-7 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup("Your Location");
      }
    }

    // 3. Draw Ambulances (Or Active tracking)
    if (bookingData && activeAmbulance) {
      // Draw active tracked ambulance
      const driverId = bookingData.driverId;
      if (ambulanceMarkersRef.current[driverId]) {
        ambulanceMarkersRef.current[driverId].setLatLng([activeAmbulance.lat, activeAmbulance.lng]);
      } else {
        const icon = L.divIcon({
          className: 'ambulance-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-10 h-10 bg-red-500/30 rounded-full animate-ping"></div>
              <div class="relative w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        ambulanceMarkersRef.current[driverId] = L.marker([activeAmbulance.lat, activeAmbulance.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`${activeAmbulance.driverName} - En Route`);
      }

      // Draw route path line
      if (userLocation && mapRef.current) {
        const coordinates = routeCoords || [
          [activeAmbulance.lat, activeAmbulance.lng],
          [userLocation.lat, userLocation.lng]
        ];
        if (routeLayerRef.current) {
          routeLayerRef.current.setLatLngs(coordinates as [number, number][]);
          routeLayerRef.current.setStyle({ color: '#2563eb', weight: 6 });
        } else {
          routeLayerRef.current = L.polyline(coordinates as [number, number][], {
            color: '#2563eb',
            weight: 6,
            opacity: 0.9
          }).addTo(mapRef.current);
        }
      }
    } else {
      // Draw all available ambulances
      Object.entries(ambulances).forEach(([driverId, amb]: [string, any]) => {
        if (amb.lat && amb.lng && amb.status === 'available') {
          if (ambulanceMarkersRef.current[driverId]) {
            ambulanceMarkersRef.current[driverId].setLatLng([amb.lat, amb.lng]);
          } else {
            const icon = L.divIcon({
              className: 'ambulance-marker',
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="relative w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>
                  </div>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });
            ambulanceMarkersRef.current[driverId] = L.marker([amb.lat, amb.lng], { icon })
              .addTo(mapRef.current!)
              .bindPopup(`${amb.driverName} - Available`);
          }
        }
      });
    }
  }, [ambulances, bookingData, activeAmbulance, userLocation, routeCoords]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationStatus("Location Synced");
          if (mapRef.current) {
            mapRef.current.setView([loc.lat, loc.lng], 13);
          }
        },
        () => setLocationStatus("Error finding location")
      );
    }
  };

  const handleBookingSubmit = async (data: any) => {
    // Save to server
    try {
      const payload = {
        patientName: data.name,
        patientPhone: data.phone,
        emergency: data.emergencyType,
        lat: userLocation?.lat || null,
        lng: userLocation?.lng || null,
        driverId: selectedDriver?.id || null,
      };
      await createRequest(payload);

      const booking = {
        ...data,
        driverId: selectedDriver?.id,
        driverName: selectedDriver?.name,
        driverPhone: selectedDriver?.phone,
        status: "confirmed",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("currentBooking", JSON.stringify(booking));
      setBookingData(booking);
      setShowBookingModal(false);
    } catch (e) {
      alert("Failed to submit request to server");
    }
  };

  // Straight line distance helper
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">SEVA Command Center</h1>
          <p className="text-gray-500 mt-1">Real-time emergency dispatch and tracking control dashboard</p>
        </div>
        {!bookingData && (
          <Button
            onClick={() => {
              const available = Object.entries(ambulances).filter(([_, a]: [string, any]) => a.status === 'available');
              if (available.length > 0) {
                const [driverId, amb] = available[0] as [string, any];
                setSelectedDriver({ id: driverId, name: amb.driverName, phone: amb.phone });
                setShowBookingModal(true);
              } else {
                alert("All ambulances are busy. Please wait a few moments.");
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl py-6 px-8 text-md font-bold shadow-md shadow-red-500/10 hover:shadow-red-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Dispatch Nearest Ambulance
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div ref={mapContainerRef} className="h-[460px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner" />
          </div>
        </div>

        {/* Sidebar Info */}
        <div>
          {bookingData ? (
            <Card className="premium-card h-full flex flex-col justify-between p-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Active Dispatch</span>
                  <Badge className="bg-green-50 text-green-700 border border-green-100">En Route</Badge>
                </div>

                <div className="space-y-6 mb-8 border-b border-gray-100 pb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Assigned Driver</span>
                    <span className="font-bold text-gray-900">{bookingData.driverName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Driver Phone</span>
                    <span className="font-bold text-gray-900">{bookingData.driverPhone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Estimated ETA</span>
                    <span className="font-bold text-red-600 flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {activeAmbulance && userLocation 
                        ? `${Math.round(calculateDistance(activeAmbulance.lat, activeAmbulance.lng, userLocation.lat, userLocation.lng) * 2)} mins` 
                        : "Calculating..."
                      }
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-5 text-center">
                  <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Verification Passcode</span>
                  <div className="text-3xl font-mono font-black text-yellow-900 mt-1">{bookingData.otp}</div>
                  <p className="text-[11px] text-yellow-700 mt-2">Give this passcode to the paramedic crew upon arrival</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  localStorage.removeItem("currentBooking");
                  setBookingData(null);
                  setActiveAmbulance(null);
                  if (routeLayerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(routeLayerRef.current);
                    routeLayerRef.current = null;
                  }
                }}
                variant="outline"
                className="w-full mt-6 py-6 border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl"
              >
                Cancel Booking
              </Button>
            </Card>
          ) : (
            <Card className="premium-card h-full flex flex-col justify-between p-8">
              <div>
                <h3 className="text-lg font-bold text-gray-950 mb-3">Service Coverage</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">Displaying simulated ambulances currently active in your regional sector.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">
                      {Object.values(ambulances).filter((a: any) => a.status === 'available').length} Active Vehicles Available
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 cursor-pointer">
                      {locationStatus || "GPS coordinates not synced"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400 leading-relaxed">System dispatches nearest ambulance dynamically. For general assistance, consult our First Aid guide.</p>
              </div>
            </Card>
          )}
        </div>
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
