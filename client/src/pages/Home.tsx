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
              Fast, Reliable Ambulance Services Across India
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

      {/* Feature Navigation Buttons */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            {services.map((service) => (
              <Button
                key={service.title}
                onClick={() => setLocation(service.href)}
                variant="outline"
                size="lg"
                className="w-full md:w-auto px-8 py-6 flex items-center justify-center space-x-3 bg-white hover:bg-blue-50 border-2 border-blue-600 text-blue-600 hover:text-blue-700 transition-all duration-300"
              >
                <service.icon className="h-6 w-6" />
                <span className="font-semibold">{service.title}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Horizontal Layout */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Emergency Numbers */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Emergency Contacts</h2>
              <div className="grid grid-cols-1 gap-6">
                {emergencyNumbers.map((contact) => (
                  <div key={contact.number} className="flex items-center p-6 bg-white rounded-lg shadow-md">
                    <contact.icon className={`h-12 w-12 mr-6 ${contact.color}`} />
                    <div>
                      <h3 className="text-xl font-semibold">{contact.label}</h3>
                      <p className={`text-2xl font-bold ${contact.color}`}>{contact.number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
              <div className="grid grid-cols-1 gap-6">
                {services.map((service) => (
                  <div
                    key={service.title}
                    className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(service.href)}
                  >
                    <service.icon className="h-12 w-12 text-blue-600 mr-6 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
