
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisOutput, Attachment } from "../types";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export const analyzeRequest = async (prompt: string, history: any[] = [], attachments: Attachment[] = []): Promise<AnalysisOutput> => {
  try {
    const parts: any[] = [];
    
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
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

export const streamAnalysisRequest = async (
  prompt: string, 
  history: any[] = [], 
  attachments: Attachment[], 
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const parts: any[] = [];
    
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
    
    parts.push({ text: prompt });

    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: `You are a high-performance AI engine. 
        Provide a response that is fast, accurate, and beautifully formatted using Markdown.
        Use headers, lists, and code blocks where appropriate to make the answer easy to read.
        Start directly with the answer.`,
      },
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};
