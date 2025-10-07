import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json();
    const prompt = `
You are a helpful assistant for a trekking website. The user is currently on: ${context.page}
Recent actions: ${context.actions?.join(', ') || 'None'}

Based on this, suggest 3 very short, helpful questions the user might want to ask a chatbot. Each question should be 2-5 words, very concise. Only return a JSON array of strings, no explanation.`;

    let questions: string[] = [
      "How do I book a trek?",
      "What are your office hours?",
      "How do I contact support?"
    ];
    
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ]
        });
        // Try to parse the response as a JSON array
        const match = result.text?.match(/\[[\s\S]*\]/);
        if (match) {
          questions = JSON.parse(match[0]);
        }
      } catch (error) {
        console.error('Gemini API error for suggestions:', error);
        // fallback to defaults
      }
    }
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ questions: ["How do I book a trek?", "What are your office hours?", "How do I contact support?"] }, { status: 200 });
  }
} 