import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "" });

export async function getFirstAidResponse(symptom: string): Promise<string> {
  try {
    const prompt = `You are a medical first aid assistant. Provide immediate, safe, and clear first aid instructions for: ${symptom}. 

    Format your response as exactly 5-6 numbered steps with brief, actionable instructions. Example format:
    1. [Action step]
    2. [Action step]
    3. [Action step]
    4. [Action step]
    5. [Action step]
    6. Call 108 immediately if condition worsens

    Keep each step under 15 words and focus on immediate actions for untrained individuals.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "1. Call 108 immediately for emergency services\n2. Stay calm and assess the situation carefully\n3. Do not move the person unless absolutely necessary\n4. Apply basic first aid if you are trained\n5. Keep the person comfortable and conscious\n6. Wait for professional medical help to arrive";
  } catch (error) {
    console.error("Error getting first aid response:", error);
    return "1. Call 108 immediately for emergency services\n2. Stay calm and assess the situation carefully\n3. Do not move the person unless absolutely necessary\n4. Apply basic first aid if you are trained\n5. Keep the person comfortable and conscious\n6. Wait for professional medical help to arrive";
  }
}
