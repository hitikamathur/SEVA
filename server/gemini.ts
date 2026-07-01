import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Smart fallback first-aid responses in case Gemini API key is missing or call fails
const fallbackFirstAid = (symptoms: string): string => {
  const query = symptoms.toLowerCase();

  if (query.includes("chest") || query.includes("heart") || query.includes("cardiac") || query.includes("stroke")) {
    return `### Cardiac / Stroke Emergency Protocol

1. Call 108 Immediately: Request an Advanced Life Support (ALS) unit.
2. Rest & Calming: Have the patient sit or lie down in a comfortable position. Keep them calm to reduce heart strain.
3. Loosen Clothing: Undo collars, belts, or tight shirts to help them breathe.
4. Prepare Aspirin: If they are fully conscious and not allergic, they can chew one adult aspirin (325mg).
5. Monitor Vitals: Be ready to perform CPR if they lose consciousness or stop breathing.

### Critical Warnings
- Do NOT leave the patient unattended.
- Do NOT let them walk, exert themselves, or drive to the hospital.`;
  }

  if (query.includes("bleed") || query.includes("cut") || query.includes("wound") || query.includes("blood")) {
    return `### Severe Bleeding Control Protocol

1. Direct Pressure: Place a clean cloth, sterile gauze, or bandage directly over the wound and apply firm, continuous pressure.
2. Elevate: If the injury is on a limb, raise it above the level of the heart while maintaining pressure.
3. Do Not Peek: Keep the pressure applied. If blood leaks through the bandage, do not remove it; place another cloth right on top of it.
4. Pressure Points: If bleeding doesn't slow down, press the artery against the bone (e.g., inside the upper arm or groin).
5. Keep Warm: Lay the patient flat and cover them with a blanket to prevent shock.

### Critical Warnings
- Do NOT remove any embedded objects; stabilize them in place with padding.
- Do NOT use dirty cloths which could introduce infection.`;
  }

  if (query.includes("burn") || query.includes("fire") || query.includes("scald")) {
    return `### Burn Management Protocol

1. Cool Water: Hold the burned area under cool running tap water for 10 to 15 minutes. Do not use ice or freezing water.
2. Remove Constrictions: Gently take off rings, watches, or tight clothing before swelling begins.
3. Cover Loosely: Wrap the area loosely with a sterile, non-adhesive gauze bandage.
4. Hydrate: If the patient is conscious and swallows normally, give them sips of water.

### Critical Warnings
- Do NOT apply butter, toothpaste, oil, or ointments to the burn.
- Do NOT pop blisters, as this increases infection risk.`;
  }

  if (query.includes("chok") || query.includes("throat") || query.includes("strangle")) {
    return `### Choking Emergency Protocol (Heimlich Maneuver)

1. Ask to Cough: If the person is coughing or able to speak, encourage them to keep coughing to clear the airway.
2. Abdominal Thrusts: Stand behind the person, wrap your arms around their waist.
3. Fist Placement: Make a fist with one hand. Place the thumb side of your fist slightly above the person's navel.
4. Quick Thrusts: Grasp the fist with your other hand and press into their abdomen with a quick, upward thrust. Repeat until the object is expelled.
5. Unconscious Protocol: If they pass out, lower them to the floor, call 108, and begin chest compressions (CPR).

### Critical Warnings
- Do NOT perform thrusts if they are coughing strongly.
- Do NOT do a blind finger sweep; you may push the object deeper.`;
  }

  if (query.includes("fracture") || query.includes("bone") || query.includes("sprain") || query.includes("break")) {
    return `### Bone & Joint Injury Protocol

1. Immobilize: Keep the injured limb as still as possible. Do not attempt to realign the bone.
2. R.I.C.E. Protocol:
   - Rest: Avoid using the injured limb.
   - Ice: Apply a cold pack wrapped in a towel for 15-20 minutes.
   - Compress: Wrap gently with an elastic bandage.
   - Elevate: Prop the limb up above heart level if possible.
3. Splinting: If you must move the patient, apply a rigid splint above and below the fracture point.

### Critical Warnings
- Do NOT apply ice directly to the skin.
- Do NOT test the joint or try to push protruding bones back in.`;
  }

  // Default fallback guidance
  return `### Basic Emergency First Aid Guidelines

1. Assess the Scene: Ensure the area is safe for both you and the patient before stepping in.
2. Call 108: If the situation is severe, call emergency services immediately.
3. Check Responsiveness: Tap the person's shoulder and shout, "Are you okay?"
4. Monitor Airway & Breathing: Check if their chest is rising and falling normally.
5. Keep Calm: Comfort the patient, keep them lying flat, warm, and conscious if possible.

### Critical Warnings
- Do NOT give food or drink to an unconscious or drowsy patient.
- Do NOT move the patient if you suspect a head, neck, or spinal injury.`;
};

export async function generateFirstAidTips(symptoms: string): Promise<string> {
  // If API client is not initialized, return the fallback immediately
  if (!ai) {
    console.log("[Gemini API] API key missing. Serving fallback first aid response.");
    return fallbackFirstAid(symptoms);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are SEVA's emergency medical dispatcher AI — a trained paramedic assistant operating in India.
Your job is to provide IMMEDIATE, SPECIFIC, LIFE-SAVING first aid instructions to bystanders or patients in a medical emergency while an ambulance is en-route.

STRICT RULES:
- NEVER give generic advice. Every response must be DIRECTLY tailored to the exact emergency described.
- Always start by identifying the SEVERITY level: CRITICAL / SERIOUS / MODERATE (plain text, no emojis).
- Structure your response in clean markdown with these exact section headings using ###:
  ### Severity Assessment
  ### Immediate Actions
  ### Critical Warnings
  ### Ambulance Prep
- Use numbered lists for Immediate Actions.
- Use bullet points (- ) for warnings.
- Do NOT use emojis anywhere in your response.
- Do NOT use raw ** markers directly in headings — use ### for section titles only.
- You MAY use **bold** inside list items for key action words only.
- Use Indian emergency number 108 for ambulance references.
- If symptoms suggest multiple possible conditions, address the most life-threatening one first.
- Keep language simple, calm, and direct — the reader may be panicking.
- Never recommend medications unless it is aspirin for chest pain in a conscious adult.`,
      },
      contents: `EMERGENCY REPORTED: "${symptoms}"

Provide specific, structured first aid guidance for this exact emergency situation.`,
    });

    return response.text || "No response received from AI.";
  } catch (error) {
    console.error("Gemini API call failed, falling back to static database:", error);
    return fallbackFirstAid(symptoms);
  }
}
