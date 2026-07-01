// Frontend API caller securely querying the server proxy instead of direct Gemini SDK usage.

export const generateFirstAidTips = async (symptoms: string): Promise<string> => {
  try {
    const response = await fetch("/api/firstaid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms })
    });

    if (!response.ok) {
      throw new Error("Secure proxy request failed");
    }

    const data = await response.json();
    return data.tips;
  } catch (error) {
    console.warn("Secure Gemini request failed. Falling back to local instructions:", error);
    
    // In-memory safety fallback tips
    const fallbackTips: Record<string, string> = {
      'chest pain': `1. Call emergency services immediately (108/102)\n2. Have the person sit down and rest\n3. Loosen any tight clothing\n4. Monitor vital signs and be prepared to perform CPR`,
      'difficulty breathing': `1. Call emergency services immediately (108)\n2. Help the person sit upright\n3. Loosen tight clothing around neck/chest\n4. Encourage slow, deep breaths`,
      'severe bleeding': `1. Call emergency services immediately (108)\n2. Apply direct pressure with clean cloth\n3. Elevate the injured area if possible\n4. Keep the person warm and lying down`
    };

    const normalizedSymptom = symptoms.toLowerCase();
    const matchingKey = Object.keys(fallbackTips).find(key => 
      normalizedSymptom.includes(key) || key.includes(normalizedSymptom)
    );

    return matchingKey ? fallbackTips[matchingKey] : "1. Call emergency services immediately (108)\n2. Keep the person calm and comfortable\n3. Monitor vital signs (breathing, pulse)\n4. Do not leave the patient unattended";
  }
};

export const getFirstAidResponse = generateFirstAidTips;