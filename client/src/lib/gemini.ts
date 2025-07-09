import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "" });

export async function getFirstAidResponse(symptom: string): Promise<string> {
  try {
    const prompt = `You are an emergency medical first aid assistant. A person is experiencing: "${symptom}". 

    Provide specific, immediate first aid instructions for this exact condition. Format your response as exactly 5-6 numbered steps with brief, actionable instructions.

    Requirements:
    - Each step must be specific to the symptom "${symptom}"
    - Keep each step under 20 words
    - Focus on immediate, safe actions for untrained individuals
    - Include when to call 108 (India emergency number)
    - Avoid generic advice - make it specific to the condition
    - Include what NOT to do if important

    Format:
    1. [Specific action for this symptom]
    2. [Specific action for this symptom]
    3. [Specific action for this symptom]
    4. [Specific action for this symptom]
    5. [Specific action for this symptom]
    6. Call 108 immediately if [specific warning signs for this condition]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    
    // Ensure we have a response and it's specific to the symptom
    if (responseText && responseText.length > 50 && responseText.includes(symptom.toLowerCase())) {
      return responseText;
    }
    
    // Fallback with symptom-specific default
    return `1. Call 108 immediately for ${symptom.toLowerCase()} emergency\n2. Stay calm and keep the person comfortable\n3. Do not leave the person alone\n4. Monitor breathing and consciousness\n5. Be ready to provide CPR if trained\n6. Wait for professional medical help to arrive`;
  } catch (error) {
    console.error("Error getting first aid response:", error);
    return `1. Call 108 immediately for ${symptom.toLowerCase()} emergency\n2. Stay calm and keep the person comfortable\n3. Do not leave the person alone\n4. Monitor breathing and consciousness\n5. Be ready to provide CPR if trained\n6. Wait for professional medical help to arrive`;
  }
}
