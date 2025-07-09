import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, push } from "firebase/database";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambulanceId?: string;
  driverName?: string;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  ambulanceId, 
  driverName 
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
      // Get current location
      const location = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const bookingData = {
        ...formData,
        ambulanceId: ambulanceId || "auto-assign",
        driverName: driverName || "Auto-assigned",
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        timestamp: Date.now(),
        status: "pending"
      };

      // Save to Firebase
      await push(ref(database, 'ambulance-requests'), bookingData);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Book Ambulance</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Description *</Label>
              <Textarea
                id="emergency"
                value={formData.emergency}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency: e.target.value }))}
                placeholder="Describe the emergency"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter pickup address (current location will be used if empty)"
              />
            </div>

            {ambulanceId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Driver:</strong> {driverName}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Ambulance ID:</strong> {ambulanceId}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}