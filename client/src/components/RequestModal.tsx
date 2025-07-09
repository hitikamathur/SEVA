import { useState } from "react";
import { X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createRequest } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestModal({ isOpen, onClose, onSuccess }: RequestModalProps) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    emergency: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      await createRequest({
        ...formData,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        status: 'pending',
      });

      toast({
        title: "Request Submitted",
        description: "Your ambulance request has been submitted successfully.",
      });

      setFormData({ patientName: "", patientPhone: "", emergency: "" });
      onSuccess();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Request Ambulance</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              type="text"
              placeholder="Enter patient name"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="patientPhone">Mobile Number</Label>
            <Input
              id="patientPhone"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.patientPhone}
              onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="emergency">Emergency Description</Label>
            <Textarea
              id="emergency"
              placeholder="e.g., Chest pain, Accident, Breathing difficulty"
              value={formData.emergency}
              onChange={(e) => setFormData({ ...formData, emergency: e.target.value })}
              required
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
