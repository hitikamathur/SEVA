import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function getFirstAidResponse(symptom: string): Promise<string> {
  try {
    const prompt = `You are a medical first aid assistant. Provide immediate, safe, and clear first aid instructions for: ${symptom}. 
    
    Format your response as:
    1. Step-by-step instructions
    2. When to call emergency services (108 in India)
    3. Important warnings about what NOT to do
    
    Keep instructions clear, concise, and safe for untrained individuals.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "For any emergency: 1. Call 108 immediately 2. Stay calm and assess the situation 3. Do not move the person unless necessary 4. Apply basic first aid if trained 5. Wait for professional help to arrive";
  } catch (error) {
    console.error("Error getting first aid response:", error);
    return "For any emergency: 1. Call 108 immediately 2. Stay calm and assess the situation 3. Do not move the person unless necessary 4. Apply basic first aid if trained 5. Wait for professional help to arrive";
  }
}
