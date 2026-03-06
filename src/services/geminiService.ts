import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Transcribe the Urdu or Roman Urdu speech in this audio into Roman Urdu text. Only provide the transcription in Roman Urdu. Do not add any other text or explanations.",
          },
        ],
      },
    ],
  });

  return response.text || "";
}

export async function translateToEnglish(romanUrduText: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `Translate the following Roman Urdu text into English: "${romanUrduText}". Only provide the English translation.`,
          },
        ],
      },
    ],
  });

  return response.text || "";
}
