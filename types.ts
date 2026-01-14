
export interface AnalysisOutput {
  goal: string;
  constraints: string[];
  strategy: string;
  practicalOutput: string;
  reasoning: string[];
  recommendations: string[];
  isClarificationNeeded: boolean;
  clarifyingQuestion?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: AnalysisOutput;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}
