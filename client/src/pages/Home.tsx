import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  PlusCircle, MapPin, Brain, Hospital, Phone, ArrowRight,
  ShieldCheck, Activity, Flame, Shield, Headphones, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingModal from "@/components/BookingModal";
import { subscribeToAmbulances } from "@/lib/api";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [ambulances, setAmbulances] = useState<any>({});
  const [selectedDriver] = useState<any>({ id: "auto", name: "Nearest Available", phone: "108" });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestInfo, setNearestInfo] = useState<{ distance: number; eta: number } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAmbulances((data) => {
      setAmbulances(data);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }

    return () => unsubscribe();
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    if (!userLocation) return;
    const availableAmbs = Object.values(ambulances).filter((a: any) => a.status === "available" && a.lat && a.lng);
    
    if (availableAmbs.length > 0) {
      let minDistance = Infinity;
      availableAmbs.forEach((amb: any) => {
        const d = calculateDistance(userLocation.lat, userLocation.lng, amb.lat, amb.lng);
        if (d < minDistance) minDistance = d;
      });
      const finalDist = Math.max(0.5, minDistance);
      setNearestInfo({
        distance: finalDist,
        eta: Math.max(2, Math.round(finalDist * 2))
      });
    } else {
      setNearestInfo(null);
    }
  }, [ambulances, userLocation]);

  const handleBookingSubmit = (data: any) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const booking = {
      ...data,
      driverId: "auto",
      driverName: data.driverName || "Nearest Available",
      driverPhone: data.driverPhone || "108",
      otp,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("currentBooking", JSON.stringify(booking));
    setShowModal(false);
    setLocation("/dashboard");
  };

  const services = [
    { icon: MapPin,    label: "Find & Dispatch",    desc: "Auto-assign closest responder to your location", href: "/dashboard", bg: "bg-red-50",     tc: "text-red-600" },
    { icon: Brain,     label: "AI First Aid",        desc: "Get instant AI-powered first aid guidance",     href: "/firstaid",  bg: "bg-violet-50",  tc: "text-violet-600" },
    { icon: Hospital,  label: "Hospital Directory",  desc: "Find verified specialty hospitals near you",  href: "/hospitals", bg: "bg-blue-50",    tc: "text-blue-600" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white text-slate-900 overflow-y-auto">
      
      {/* ── HERO BANNER (Full-width Transparent Light Red Background) ── */}
      <div className="w-full bg-red-50/80 border-b border-red-100/40 py-10 px-6 flex-shrink-0 relative">
        {/* Subtle grid pattern background under hero */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fde8e8_1px,transparent_1px),linear-gradient(to_bottom,#fde8e8_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
          {/* Left Side Content (7 cols) */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                Fast. Reliable. Life-Saving.
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Emergency Medical Help,<br />
              <span className="text-red-600">Seconds</span> Away.
            </h1>

            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xl">
              SEVA connects you to the nearest emergency responder with real-time GPS tracking and AI-powered assistance.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                id="request-ambulance-btn"
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 rounded-2xl text-sm shadow-lg shadow-red-500/15 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Request Ambulance Now
              </Button>
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="border-gray-200 text-gray-700 font-semibold px-8 py-6 rounded-2xl text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-red-600" />
                Live Tracking Map <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Trust points */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              <span>Verified Responders</span>
              <span className="text-gray-200">•</span>
              <span>24/7 Availability</span>
              <span className="text-gray-200">•</span>
              <span>Secure & Reliable</span>
            </div>
          </div>

          {/* Right Side Status Card (5 cols) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white border border-gray-100/80 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] w-full max-w-sm">
              <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="bg-red-50 p-4 rounded-full text-red-600 flex-shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nearest Ambulance</span>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {nearestInfo ? nearestInfo.distance.toFixed(1) : "1.8"}{" "}
                    <span className="text-red-600">km</span>{" "}
                    <span className="text-sm font-semibold text-gray-400">away</span>
                  </p>
                  <div className="inline-block bg-green-50 text-green-700 font-black text-[10px] px-2.5 py-0.5 rounded-full mt-1.5">
                    ETA: {nearestInfo ? nearestInfo.eta : "4"} mins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <div>
                  <span className="block text-xs font-bold text-slate-900">Live GPS Tracking</span>
                  <span className="block text-[10px] text-gray-400">Real-time location updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOWER CONTENT SECTIONS (White Background) ───────────────── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col justify-between space-y-6">
        
        {/* Mid Section (How We Can Help) */}
        <div className="w-full text-center space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">How We Can Help</h2>
            <p className="text-xs text-gray-400 mt-1">Access critical emergency services in just one click</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map(({ icon: Icon, label, desc, href, bg, tc }) => (
              <div
                key={label}
                onClick={() => setLocation(href)}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer flex items-start gap-4 text-left h-28"
              >
                <div className={`${bg} ${tc} p-3.5 rounded-full flex-shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-none">{label}</h3>
                  <p className="text-slate-400 text-xs leading-normal line-clamp-2">{desc}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-600 tracking-wider pt-1.5">
                    Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats / Hotlines Horizontal Card */}
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.01)] grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {[
              { label: "AMBULANCES", value: "108", desc: "Available", icon: Activity, bg: "bg-red-50", text: "text-red-600" },
              { label: "FIRE", value: "101", desc: "Emergency", icon: Flame, bg: "bg-orange-50", text: "text-orange-600" },
              { label: "POLICE", value: "100", desc: "At Your Service", icon: Shield, bg: "bg-blue-50", text: "text-blue-600" },
              { label: "HELPLINE", value: "24/7", desc: "Always Open", icon: Headphones, bg: "bg-emerald-50", text: "text-emerald-600" },
            ].map(({ label, value, desc, icon: Icon, bg, text }) => (
              <div key={label} className="flex items-center gap-4 border-r border-gray-100 last:border-0 pr-4">
                <div className={`${bg} ${text} p-3.5 rounded-full flex-shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[8px] font-black text-gray-400 tracking-wider">{label}</span>
                  <span className={`block text-xl font-black leading-none ${text}`}>{value}</span>
                  <span className="block text-[10px] text-gray-400 font-medium">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Row */}
        <div className="w-full">
          <div className="bg-red-50/40 border border-red-100/60 rounded-2xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 text-red-600 p-2.5 rounded-full">
                <Heart className="h-5 w-5 fill-red-500/20" />
              </div>
              <div>
                <p className="text-red-700 text-sm font-black">Every second counts.</p>
                <p className="text-red-600/80 text-xs">SEVA is here to ensure help reaches you, when it matters most.</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50/50 hover:text-red-700 rounded-xl px-6 py-4 text-xs font-bold gap-2 flex-shrink-0 bg-white"
            >
              Learn More About SEVA <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

      </div>

      {showModal && (
        <BookingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onBooking={handleBookingSubmit}
          driverName={selectedDriver.name}
          driverPhone={selectedDriver.phone}
          ambulanceId={selectedDriver.id}
        />
      )}
    </div>
  );
}
