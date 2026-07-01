import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, LogOut, Check, MapPin, Activity, User, Phone, AlertTriangle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  loginDriver,
  logoutDriver,
  updateAmbulanceLocation,
  setAmbulanceStatus,
  subscribeToRequests,
} from "@/lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Driver() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const { toast } = useToast();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const locationRef = useRef(driverLocation);
  locationRef.current = driverLocation;

  useEffect(() => {
    const saved = localStorage.getItem("currentDriver");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsLoggedIn(true);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem("currentDriver");
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const stopLocation = startLocationUpdates();
    const unsubReqs = subscribeToDriverTrip();
    return () => { stopLocation(); unsubReqs(); };
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    if (isLoggedIn && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([driverLocation.lat, driverLocation.lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
      const icon = L.divIcon({
        className: "driver-marker",
        html: `<div class="bg-slate-800 text-white rounded-full p-2 shadow-lg">🚑</div>`,
        iconSize: [36, 36],
      });
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup("Your Location");
    }
  }, [isLoggedIn]);

  const startLocationUpdates = () => {
    const interval = setInterval(() => {
      const loc = locationRef.current;
      // Only do minor location jitter if en-route, otherwise keep static
      if (activeRequest && activeRequest.status === "en-route") {
        const newLat = loc.lat + (Math.random() - 0.5) * 0.0003;
        const newLng = loc.lng + (Math.random() - 0.5) * 0.0003;
        setDriverLocation({ lat: newLat, lng: newLng });
        if (currentUser) updateAmbulanceLocation(currentUser.uid, newLat, newLng);
        if (driverMarkerRef.current) driverMarkerRef.current.setLatLng([newLat, newLng]);
        if (mapRef.current) mapRef.current.setView([newLat, newLng]);
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  const subscribeToDriverTrip = () => {
    return subscribeToRequests((data) => {
      // Find request assigned to this driver that is currently accepted or en-route
      const trip = Object.values(data).find(
        (r: any) => r.driverId === currentUser?.uid && (r.status === "accepted" || r.status === "en-route")
      );
      setActiveRequest(trip || null);
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginDriver(loginData.email, loginData.password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      toast({ title: "Access Granted", description: `Welcome, ${user.displayName}` });
    } catch (err: any) {
      toast({ title: "Authentication Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (currentUser) await setAmbulanceStatus(currentUser.uid, "offline");
    await logoutDriver();
    setIsLoggedIn(false);
    setCurrentUser(null);
    mapRef.current = null;
    toast({ title: "Logged Out", description: "Session terminated." });
  };

  // Paramedic Manual Actions
  const handleStartTransit = async () => {
    if (!activeRequest) return;
    try {
      await fetch(`/api/requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "en-route", driverId: currentUser.uid })
      });
      toast({ title: "Transit Initiated", description: "GPS mapping is broadcasting live telemetry." });
    } catch {
      toast({ title: "Error", description: "Could not update status to server", variant: "destructive" });
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeRequest) return;
    try {
      await fetch(`/api/requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", driverId: currentUser.uid })
      });
      await setAmbulanceStatus(currentUser.uid, "available");
      setOtpInput("");
      setOtpError("");
      setOtpVerified(false);
      toast({ title: "Mission Complete", description: "Patient delivered. Availability reset." });
    } catch {
      toast({ title: "Error", description: "Could not update status to server", variant: "destructive" });
    }
  };

  const handleVerifyOtp = () => {
    const expected = String(activeRequest?.otp || "").trim();
    const entered = otpInput.trim();
    if (!entered) {
      setOtpError("Please enter the OTP provided by the patient.");
      return;
    }
    if (entered === expected) {
      setOtpVerified(true);
      setOtpError("");
      toast({ title: "OTP Verified", description: "Identity confirmed. Completing mission..." });
      handleCompleteTrip();
    } else {
      setOtpError("Incorrect OTP. Please ask the patient to check their booking confirmation.");
      setOtpInput("");
    }
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 fade-in">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex bg-red-50 p-4 rounded-2xl mb-4">
              <Activity className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-950">Driver Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Authenticate your SEVA dispatch credentials</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-sm text-gray-700">
              <p className="font-bold mb-1 text-gray-800">Test Credentials</p>
              <p className="font-mono text-xs text-gray-600">driver1@seva.com / driver123</p>
              <p className="font-mono text-xs text-gray-600">driver2@seva.com / driver123</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <Input
                  type="email"
                  placeholder="driver@seva.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="rounded-xl py-5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="rounded-xl py-5 pr-12"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 font-bold shadow-sm shadow-red-500/10 mt-2"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── DRIVER DASHBOARD ────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-950">Driver Dashboard</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-1.5">
            Active Ambulance: <span className="font-semibold text-gray-700">{currentUser?.displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 font-semibold">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online
          </Badge>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div ref={mapContainerRef} className="h-[420px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner" />
          </div>
        </div>

        {/* Dispatch Controls & Active Trip */}
        <div className="space-y-6">
          {/* Status Stats Panel */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="font-bold text-gray-900 text-sm tracking-wider uppercase">Ambulance Telemetry</h3>
            
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <MapPin className="h-4 w-4 text-slate-500 mb-2" />
                <p className="text-[10px] font-semibold text-slate-500 uppercase">GPS Location</p>
                <p className="text-sm font-bold text-slate-800 truncate">{driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <Activity className="h-4 w-4 text-green-600 mb-2" />
                <p className="text-[10px] font-semibold text-green-700 uppercase">Current Status</p>
                <p className="text-sm font-bold text-green-900">
                  {activeRequest 
                    ? activeRequest.status === "en-route" 
                      ? "In Route to Emergency" 
                      : "Job Assigned (Awaiting Dispatch)" 
                    : "Available / Waiting"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Active Dispatch Request details */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-950">Active Emergency Job</h2>

            {!activeRequest ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <p className="text-gray-400 text-sm font-semibold">No active dispatches</p>
                <p className="text-gray-300 text-xs mt-1 leading-relaxed">System dispatches will stream here instantly when patient bookings are confirmed</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.025)] border-l-4 border-l-red-600 space-y-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-red-50 text-red-700 border border-red-100 font-semibold text-xs">
                    {activeRequest.status === "accepted" ? "Awaiting Acceptance" : "En-Route"}
                  </Badge>
                  <span className="text-xs text-gray-400">GPS Linked</span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase leading-none">Patient Name</span>
                      <span className="text-gray-800 font-bold">{activeRequest.patientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase leading-none">Contact Number</span>
                      <span className="text-gray-600 font-medium">{activeRequest.patientPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase leading-none">Reported Emergency</span>
                      <span className="text-red-700 font-bold">{activeRequest.emergency}</span>
                    </div>
                  </div>
                </div>

                {/* Job Action Buttons */}
                <div className="space-y-3 pt-2">
                  {activeRequest.status === "accepted" ? (
                    <Button
                      onClick={handleStartTransit}
                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 font-bold shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Start Navigation (Go En-Route)
                    </Button>
                  ) : (
                    // En-route: OTP verification required before completing
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">Patient Verification Required</p>
                        <p className="text-xs text-amber-600">Ask the patient for the 6-digit OTP from their booking confirmation to complete this mission.</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value.replace(/\D/g, ""));
                            setOtpError("");
                          }}
                          placeholder="Enter 6-digit OTP"
                          className="rounded-xl text-center text-lg font-bold tracking-[0.3em] py-5"
                        />
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={otpInput.length !== 6}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 font-bold shadow-md shadow-green-500/10 flex-shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                      {otpError && (
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {otpError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}