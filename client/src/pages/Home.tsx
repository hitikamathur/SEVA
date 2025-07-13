import { useState } from "react";
import { useLocation } from "wouter";
import { PlusCircle, Ambulance, Shield, Flame, SearchIcon, Route, Cross, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestModal from "@/components/RequestModal";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const emergencyNumbers = [
    { icon: Ambulance, label: "Ambulance", number: "108", color: "text-red-600" },
    { icon: Flame, label: "Fire Brigade", number: "101", color: "text-red-600" },
    { icon: Shield, label: "Police", number: "100", color: "text-blue-600" },
  ];

  const services = [
    {
      icon: SearchIcon,
      title: "Find Nearby Ambulance",
      description: "Locate ambulances in your area instantly",
      href: "/find",
    },
    {
      icon: Route,
      title: "Track Ambulance",
      description: "Real-time tracking of your ambulance",
      href: "/track",
    },
    {
      icon: Cross,
      title: "First Aid Tips",
      description: "Get immediate first aid guidance",
      href: "/firstaid",
    },
    {
      icon: Hospital,
      title: "Hospital Finder",
      description: "Find nearby hospitals and specialties",
      href: "/hospitals",
    },
  ];

  const handleRequestSuccess = () => {
    setShowRequestModal(false);
    setLocation("/find");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              SEVA Emergency Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Your Emergency, Our Priority
            </p>
            <Button
              onClick={() => setShowRequestModal(true)}
              size="lg"
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold animate-pulse"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Request Ambulance
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Emergency Services */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">Quick Emergency Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-red-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setLocation("/find")}>
              <SearchIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Find Nearby Ambulance</h3>
              <p className="text-gray-600 text-sm mb-4">Locate available ambulances in your area</p>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                Search Now
              </Button>
            </div>
            
            <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setLocation("/track")}>
              <Route className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Track Ambulance</h3>
              <p className="text-gray-600 text-sm mb-4">Real-time tracking of your ambulance</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Track Now
              </Button>
            </div>
            
            <div className="bg-white border-2 border-green-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setLocation("/firstaid")}>
              <Cross className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">AI First Aid</h3>
              <p className="text-gray-600 text-sm mb-4">Get instant first aid guidance</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Get Help
              </Button>
            </div>
            
            <div className="bg-white border-2 border-purple-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setLocation("/hospitals")}>
              <Hospital className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Find Hospitals</h3>
              <p className="text-gray-600 text-sm mb-4">Locate nearby emergency hospitals</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Find Hospitals
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SEVA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SEVA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ambulance className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Response</h3>
              <p className="text-gray-600">Quick ambulance booking with real-time tracking and ETA updates</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Services</h3>
              <p className="text-gray-600">All ambulances and drivers are verified and regularly monitored</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cross className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assistance</h3>
              <p className="text-gray-600">Get instant first aid guidance powered by advanced AI technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {emergencyNumbers.map((contact) => (
              <div key={contact.number} className="text-center p-6 bg-gray-50 rounded-lg">
                <contact.icon className={`h-16 w-16 mx-auto mb-4 ${contact.color}`} />
                <h3 className="text-xl font-semibold mb-2">{contact.label}</h3>
                <p className={`text-3xl font-bold ${contact.color}`}>{contact.number}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
