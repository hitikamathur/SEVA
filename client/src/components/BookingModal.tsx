import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRequest } from "@/lib/api";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooking: (bookingData: any) => void;
  driverName: string;
  driverPhone: string;
  ambulanceId?: string;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onBooking, 
  driverName, 
  driverPhone,
  ambulanceId 
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    emergency: "",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.emergency) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user location
      let userLocation = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.log("Could not get location:", error);
        }
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      const bookingData: {
        id?: string;
        name: string;
        phone: string;
        emergencyType: string;
        address: string;
        ambulanceId: string;
        driverName: string;
        driverPhone: string;
        location: { lat: number; lng: number } | null;
        timestamp: number;
        status: string;
        otp: number;
      } = {
        id: undefined,
        name: formData.patientName,
        phone: formData.phone,
        emergencyType: formData.emergency,
        address: formData.address,
        ambulanceId: ambulanceId || "auto-assign",
        driverName: driverName || "Auto-assigned",
        driverPhone: driverPhone || "N/A",
        location: userLocation,
        timestamp: Date.now(),
        status: "confirmed",
        otp: otp
      };

      // Call backend to store in MongoDB
      try {
        const mongoRequestData = {
          patientName: bookingData.name,
          patientPhone: bookingData.phone,
          emergency: bookingData.emergencyType,
          lat: bookingData.location ? bookingData.location.lat : null,
          lng: bookingData.location ? bookingData.location.lng : null,
          driverId: ambulanceId && ambulanceId !== "auto" ? ambulanceId : null,
          status: "pending",
        };
        const createdReq = await createRequest(mongoRequestData);
        if (createdReq && createdReq.id) {
          bookingData.id = createdReq.id;
          bookingData.ambulanceId = createdReq.driverId || "auto-assign";
        }
      } catch (apiError) {
        console.log("Failed to persist request to MongoDB, caching locally:", apiError);
        const requests = JSON.parse(localStorage.getItem('ambulance-requests') || '[]');
        const localId = Date.now().toString();
        bookingData.id = localId;
        requests.push({ ...bookingData, id: localId });
        localStorage.setItem('ambulance-requests', JSON.stringify(requests));
      }

      // Store booking data in localStorage for tracking page
      localStorage.setItem('currentBooking', JSON.stringify(bookingData));

      // Call the parent callback with booking data
      onBooking(bookingData);

      alert("Ambulance request submitted successfully!");
      setFormData({
        patientName: "",
        phone: "",
        emergency: "",
        address: ""
      });
      onClose();
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-700 px-7 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Request Emergency Ambulance</h2>
            <p className="text-red-200/80 text-xs mt-0.5">Nearest vehicle will be auto-dispatched</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-7 py-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Patient Name *</label>
            <Input
              id="patientName"
              value={formData.patientName}
              onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
              placeholder="Enter patient name"
              className="rounded-xl py-5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 XXXXX XXXXX"
              className="rounded-xl py-5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Type *</label>
            <Textarea
              id="emergency"
              value={formData.emergency}
              onChange={(e) => setFormData(prev => ({ ...prev, emergency: e.target.value }))}
              placeholder="e.g., Cardiac arrest, Road accident, Breathing difficulty..."
              className="rounded-xl resize-none"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pickup Address <span className="text-gray-300 normal-case font-normal">(optional — GPS used if empty)</span></label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street, landmark, or area name"
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl py-5 border-gray-200 text-gray-500">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit as any}
              className="flex-1 rounded-xl py-5 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/10"
            >
              {isSubmitting ? "Dispatching..." : "Dispatch Ambulance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}