
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

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

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  mimeType: string;
  name: string;
  data: string; // base64
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  analysis?: AnalysisOutput;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}
