import { useState, useRef, useEffect } from "react";
import { Send, AlertTriangle, Cross } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateFirstAidTips } from "@/lib/gemini";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function FirstAid() {
  const [symptomInput, setSymptomInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: symptomInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setSymptomInput("");
    setIsLoading(true);

    try {
      const response = await generateFirstAidTips(symptomInput);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting first aid response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble providing guidance right now. Please call 108 for immediate assistance.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">First Aid Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex space-x-4">
              <Input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="e.g., Chest pain, Difficulty breathing, Severe bleeding"
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !symptomInput.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? "Getting Help..." : "Get Help"}
              </Button>
            </div>
          </form>

          <div 
            ref={chatContainerRef}
            className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Cross className="h-16 w-16 mx-auto mb-4" />
                <p>Enter your symptoms above to get immediate first aid guidance</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border'
                    }`}
                  >
                    {message.isUser ? (
                      <p className="text-sm">{message.text}</p>
                    ) : (
                      <div className="text-sm">
                        {message.text.split('\n').map((line, index) => (
                          <div key={index} className="mb-2">
                            {line.match(/^\d+\./) ? (
                              <div className="flex items-start">
                                <span className="font-semibold text-red-600 mr-2 flex-shrink-0">{line.match(/^\d+\./)?.[0]}</span>
                                <span>{line.replace(/^\d+\.\s*/, '')}</span>
                              </div>
                            ) : line.trim() ? (
                              <span>{line}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${
                      message.isUser ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Analyzing symptoms...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This is not a substitute for professional medical advice. 
          In case of severe emergency, call 108 immediately.
        </AlertDescription>
      </Alert>
    </div>
  );
}
