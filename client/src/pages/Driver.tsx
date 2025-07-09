import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, LogOut, Check, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { loginDriver, logoutDriver, updateAmbulanceLocation, setAmbulanceStatus, subscribeToRequests, acceptRequest, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Driver() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "", otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [requests, setRequests] = useState<any>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showOtpField, setShowOtpField] = useState(false);
  const { toast } = useToast();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        startLocationUpdates();
        subscribeToDriverRequests();
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn && mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, [isLoggedIn]);

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([driverLocation.lat, driverLocation.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    updateDriverMarker();
  };

  const updateDriverMarker = () => {
    if (!mapRef.current) return;

    if (driverMarkerRef.current) {
      mapRef.current.removeLayer(driverMarkerRef.current);
    }

    const driverIcon = L.divIcon({
      className: 'driver-marker',
      html: `<div class="bg-blue-600 text-white rounded-full p-2 text-center animate-pulse">🚑</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
      .addTo(mapRef.current)
      .bindPopup('Your Location');

    mapRef.current.setView([driverLocation.lat, driverLocation.lng], 15);
  };

  const startLocationUpdates = () => {
    const interval = setInterval(() => {
      // Simulate GPS movement
      const newLat = driverLocation.lat + (Math.random() - 0.5) * 0.001;
      const newLng = driverLocation.lng + (Math.random() - 0.5) * 0.001;

      setDriverLocation({ lat: newLat, lng: newLng });

      if (currentUser) {
        updateAmbulanceLocation(currentUser.uid, newLat, newLng);
      }

      updateDriverMarker();
    }, 2000);

    return () => clearInterval(interval);
  };

  const subscribeToDriverRequests = () => {
    const unsubscribe = subscribeToRequests((requestData) => {
      const pendingRequests = Object.entries(requestData).filter(
        ([_, request]: [string, any]) => request.status === 'pending'
      );
      setRequests(Object.fromEntries(pendingRequests));
    });

    return unsubscribe;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginDriver(loginData.email, loginData.password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      toast({
        title: "Login Successful",
        description: "Welcome back, driver!",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await setAmbulanceStatus(currentUser.uid, 'offline');
      }
      await logoutDriver();
      setLoginData({ email: "", password: "" });
      setIsLoggedIn(false);
      setCurrentUser(null);
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (currentUser) {
        await acceptRequest(requestId, currentUser.uid);
        await setAmbulanceStatus(currentUser.uid, 'busy');
        toast({
          title: "Request Accepted",
          description: "Patient has been notified. Navigate to the location.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    // Remove from local state
    setRequests(prev => {
      const updated = { ...prev };
      delete updated[requestId];
      return updated;
    });

    toast({
      title: "Request Declined",
      description: "The request has been declined.",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Driver Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Sample Login Credentials:</strong><br />
                Email: driver1@seva.com<br />
                Password: driver123<br />
                <br />
                Email: driver2@seva.com<br />
                Password: driver123
              </AlertDescription>
            </Alert>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Processing..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Driver Dashboard</CardTitle>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Online
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Current Location</h3>
              <p className="text-blue-800 flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Status</h3>
              <p className="text-green-800">Available</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Active Requests</h3>
              <p className="text-yellow-800">{Object.keys(requests).length}</p>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="h-96 rounded-lg overflow-hidden border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(requests).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              Object.entries(requests).map(([requestId, request]: [string, any]) => (
                <div key={requestId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Emergency Request</h4>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600">
                        <strong>Patient:</strong> {request.patientName}
                      </p>
                      <p className="text-gray-600">
                        <strong>Contact:</strong> {request.patientPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <strong>Emergency:</strong> {request.emergency}
                      </p>
                      <p className="text-gray-600">
                        <strong>Time:</strong> {new Date(request.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => handleAcceptRequest(requestId)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineRequest(requestId)}
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}