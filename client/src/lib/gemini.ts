import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Fallback first aid tips for common symptoms
const fallbackTips: Record<string, string> = {
  'chest pain': `• Call emergency services immediately (108)
• Have the person sit down and rest
• Loosen any tight clothing
• If prescribed, help them take nitroglycerin
• Stay with them until help arrives
• Be prepared to perform CPR if needed`,

  'difficulty breathing': `• Call emergency services immediately (108)
• Help the person sit upright
• Loosen tight clothing around neck/chest
• Encourage slow, deep breaths
• If they have an inhaler, help them use it
• Stay calm and reassure them`,

  'unconsciousness': `• Call emergency services immediately (108)
• Check for responsiveness and breathing
• Place in recovery position if breathing
• Clear airway of any obstructions
• Monitor breathing and pulse
• Be prepared to perform CPR if needed`,

  'severe bleeding': `• Call emergency services immediately (108)
• Apply direct pressure with clean cloth
• Elevate the injured area if possible
• Don't remove embedded objects
• Apply pressure to pressure points if needed
• Keep the person warm and lying down`,

  'heart attack': `• Call emergency services immediately (108)
• Help person sit down and rest
• Loosen tight clothing
• Give aspirin if not allergic (chew, don't swallow)
• Stay with them until help arrives
• Be prepared to perform CPR if needed`,

  'stroke': `• Call emergency services immediately (108)
• Note time symptoms started
• Keep person calm and still
• Don't give food or water
• Loosen tight clothing
• Monitor breathing and consciousness`,

  'seizure': `• Call emergency services if seizure lasts >5 minutes
• Clear area of dangerous objects
• Place something soft under their head
• Turn on side to prevent choking
• Don't restrain or put anything in mouth
• Stay with them until they recover`,

  'burns': `• Cool the burn with cold water for 10-20 minutes
• Remove jewelry/clothing before swelling
• Cover with sterile, non-adhesive bandage
• Don't use ice, butter, or home remedies
• For severe burns, call emergency services
• Keep person warm and hydrated`,

  'fracture': `• Don't move the person unless in danger
• Immobilize the injured area
• Apply ice pack wrapped in cloth
• Control any bleeding with direct pressure
• Keep person comfortable and warm
• Call emergency services for severe fractures`,

  'poisoning': `• Call Poison Control immediately
• If conscious, give small sips of water
• Don't induce vomiting unless instructed
• Keep poison container for reference
• Monitor breathing and consciousness
• Be prepared to perform CPR if needed`
};

export const generateFirstAidTips = async (symptom: string): Promise<string> => {
  try {
    if (!genAI) {
      // Use fallback tips if API key is not available
      const normalizedSymptom = symptom.toLowerCase();
      const matchingTip = Object.keys(fallbackTips).find(key => 
        normalizedSymptom.includes(key) || key.includes(normalizedSymptom)
      );

      if (matchingTip) {
        return fallbackTips[matchingTip];
      }

      return `• Call emergency services immediately (108)
• Keep the person calm and comfortable
• Monitor vital signs (breathing, pulse)
• Don't give food or water unless instructed
• Stay with them until help arrives
• Provide basic first aid as appropriate for the situation`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Provide immediate first aid tips for ${symptom}. Keep the response concise, practical, and emergency-focused. Include 3-5 key steps that someone can follow immediately while waiting for medical help. Format as bullet points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating first aid tips:', error);

    // Fallback to basic tips if API fails
    return `• Call emergency services immediately (108)
• Keep the person calm and comfortable
• Monitor vital signs (breathing, pulse)
• Don't give food or water unless instructed
• Stay with them until help arrives
• Provide basic first aid as appropriate for the situation`;
  }
};

// Export alias for compatibility
export const getFirstAidResponse = generateFirstAidTips;