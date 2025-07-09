import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function getFirstAidResponse(symptom: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an emergency medical first aid assistant. A person is experiencing: "${symptom}". 

    Provide specific, immediate first aid instructions for this exact condition. Format your response as exactly 5-6 numbered steps with brief, actionable instructions.

    Requirements:
    - Each step must be specific to the symptom "${symptom}"
    - Keep each step under 25 words
    - Focus on immediate, safe actions for untrained individuals
    - Include when to call 108 (India emergency number)
    - Make it specific to the condition "${symptom}"
    - Include what NOT to do if important

    Format:
    1. [Specific action for this symptom]
    2. [Specific action for this symptom]
    3. [Specific action for this symptom]
    4. [Specific action for this symptom]
    5. [Specific action for this symptom]
    6. Call 108 immediately if [specific warning signs for this condition]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Ensure we have a response and it's relevant
    if (responseText && responseText.length > 50) {
      return responseText;
    }
    
    // Fallback with symptom-specific default
    return getSymptomSpecificFallback(symptom);
  } catch (error) {
    console.error("Error getting first aid response:", error);
    return getSymptomSpecificFallback(symptom);
  }
}

function getSymptomSpecificFallback(symptom: string): string {
  const lowerSymptom = symptom.toLowerCase();
  
  if (lowerSymptom.includes("chest pain") || lowerSymptom.includes("heart")) {
    return `1. Call 108 immediately for suspected heart attack\n2. Have the person sit down and rest\n3. Loosen any tight clothing\n4. Give aspirin if not allergic and conscious\n5. Monitor breathing and pulse\n6. Be prepared to perform CPR if they become unconscious`;
  }
  
  if (lowerSymptom.includes("choking")) {
    return `1. Ask "Are you choking?" If they can't speak, act immediately\n2. Stand behind them, place hands below ribcage\n3. Give 5 sharp back blows between shoulder blades\n4. If unsuccessful, perform 5 abdominal thrusts (Heimlich)\n5. Alternate back blows and abdominal thrusts\n6. Call 108 if object doesn't dislodge after 3 cycles`;
  }
  
  if (lowerSymptom.includes("bleeding") || lowerSymptom.includes("cut")) {
    return `1. Apply direct pressure to wound with clean cloth\n2. Elevate injured area above heart level if possible\n3. Do not remove embedded objects\n4. Apply additional bandages if blood soaks through\n5. Check for signs of shock (pale, weak pulse)\n6. Call 108 for severe bleeding or signs of shock`;
  }
  
  if (lowerSymptom.includes("burn")) {
    return `1. Remove person from heat source immediately\n2. Cool burn with cool (not ice) water for 10-20 minutes\n3. Remove jewelry/clothing before swelling starts\n4. Cover with sterile, non-stick bandage\n5. Do not apply ice, butter, or ointments\n6. Call 108 for burns larger than palm size or on face/hands`;
  }
  
  // Generic fallback
  return `1. Call 108 immediately for ${lowerSymptom} emergency\n2. Keep the person calm and comfortable\n3. Do not leave the person alone\n4. Monitor breathing and consciousness levels\n5. Be ready to provide CPR if trained and needed\n6. Wait for professional medical help to arrive`;
}
