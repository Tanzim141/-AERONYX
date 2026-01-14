
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisOutput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are a high-performance AI engine built to assist users in achieving real-world results.
For every request:
1. Identify the goal
2. Identify any constraints
3. Choose the best solution strategy
4. Produce the most practical output
5. If information is missing, ask only the most important clarifying questions.

Format your response as a JSON object adhering to this schema:
{
  "goal": "String summary of user's core objective",
  "constraints": ["Array of constraints identified"],
  "strategy": "The chosen methodology for solving the task",
  "practicalOutput": "The main actionable content (Markdown supported)",
  "reasoning": ["Step-by-step breakdown of how you arrived at the result"],
  "recommendations": ["Actionable next steps"],
  "isClarificationNeeded": boolean,
  "clarifyingQuestion": "A single precise question if information is missing"
}

Prefer: Step-by-step reasoning, Actionable recommendations, Real examples, Clear formatting.
Never: Guess, Hallucinate facts, Overcomplicate simple tasks.
`;

export const analyzeRequest = async (prompt: string, history: any[] = []): Promise<AnalysisOutput> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategy: { type: Type.STRING },
            practicalOutput: { type: Type.STRING },
            reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            isClarificationNeeded: { type: Type.BOOLEAN },
            clarifyingQuestion: { type: Type.STRING },
          },
          required: ["goal", "constraints", "strategy", "practicalOutput", "reasoning", "recommendations", "isClarificationNeeded"]
        }
      },
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as AnalysisOutput;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
