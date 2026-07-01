import { useState, useRef, useEffect } from "react";
import { Send, Cross, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { generateFirstAidTips } from "@/lib/gemini";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Lightweight markdown → HTML converter for AI triage responses
function renderMarkdown(text: string): string {
  return text
    // Strip emojis (broad unicode range, no /u flag needed)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uFE00-\uFEFF]/g, "")
    // H3 headings
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-gray-900 mt-4 mb-1 uppercase tracking-wide border-b border-gray-100 pb-1">$1</h3>')
    // H2 headings
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-gray-900 mt-4 mb-1">$1</h2>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Numbered list items
    .replace(/^(\d+\.\s)(.+)$/gm, '<div class="flex gap-2 my-1"><span class="font-semibold text-red-600 min-w-[20px]">$1</span><span>$2</span></div>')
    // Bullet list items (- item)
    .replace(/^-\s(.+)$/gm, '<div class="flex gap-2 my-0.5 ml-2"><span class="text-gray-400 mt-0.5">·</span><span>$1</span></div>')
    // Blank lines → spacing
    .replace(/\n{2,}/g, '<div class="my-2"></div>')
    // Single newlines
    .replace(/\n/g, '<br/>');
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
  }, [messages, isLoading]);

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
        text: "System was unable to contact AI response pipelines. Please Dial emergency rescue services at 108 immediately.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">AI First Aid Assistant</h1>
        <p className="text-gray-500 mt-1">Get immediate step-by-step medical instructions generated securely by Gemini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="premium-card p-6 bg-red-50/20 border-red-100">
            <div className="flex gap-3 mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0" />
              <h3 className="font-bold text-red-950 text-sm">Critical Warning</h3>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">This chatbot uses automated AI parsing logic. It is meant for auxiliary guidance and is not a substitute for a professional doctor or hospital visit. Dial 108/102 immediately for extreme crises.</p>
          </Card>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col h-[520px]">
            {/* Message Thread */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-red-50 p-4 rounded-full mb-4">
                    <Cross className="h-10 w-10 text-red-500" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-md">Begin Assessment</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">Type in symptoms to receive structured triage and steps.</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${ m.isUser ? 'max-w-sm' : 'max-w-xl' } p-4 rounded-2xl shadow-sm text-sm ${m.isUser ? 'bg-red-600 text-white' : 'bg-gray-50 border border-gray-100 text-gray-800'}`}>
                      {m.isUser ? (
                        <p className="leading-relaxed">{m.text}</p>
                      ) : (
                        <div
                          className="leading-relaxed text-[13px]"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                        />
                      )}
                      <div className="flex items-center justify-end gap-1 text-[10px] mt-2 opacity-60">
                        <Clock className="h-3 w-3" />
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
                    <span className="text-xs text-gray-500">Formulating triage response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="flex gap-3 border-t border-gray-50 pt-4">
              <Input
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                placeholder="Describe symptom (e.g., severe cut bleeding, faint breathing)..."
                disabled={isLoading}
                className="flex-1 rounded-xl py-6"
              />
              <Button type="submit" disabled={isLoading || !symptomInput.trim()} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-6 shadow-sm">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
