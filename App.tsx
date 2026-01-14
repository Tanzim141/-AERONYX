
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, 
  Plus, 
  MessageSquare, 
  History, 
  Settings, 
  Send, 
  Loader2, 
  ShieldCheck, 
  Target, 
  ListTodo, 
  Lightbulb,
  ChevronRight,
  Terminal,
  BrainCircuit
} from 'lucide-react';
import { Session, Message, AnalysisOutput } from './types';
import { analyzeRequest } from './services/gemini';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    if (sessions.length === 0) {
      const newSession: Session = {
        id: crypto.randomUUID(),
        title: 'New Consultation',
        messages: [],
        updatedAt: new Date()
      };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, [sessions.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages]);

  const handleNewSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: 'New Consultation',
      messages: [],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? inputValue.slice(0, 30) + '...' : s.title } 
        : s
    ));
    setInputValue('');
    setIsLoading(true);

    try {
      const history = currentSession?.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })) || [];

      const analysis = await analyzeRequest(inputValue, history);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: analysis.isClarificationNeeded ? (analysis.clarifyingQuestion || '') : analysis.practicalOutput,
        analysis,
        timestamp: new Date()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date() } 
          : s
      ));
    } catch (error) {
      console.error(error);
      // Basic error handling in UI could be added here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">AERONYX</h1>
          </div>
          <button 
            onClick={handleNewSession}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Plus size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
            <History size={14} /> Recent Strategies
          </div>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${
                currentSessionId === session.id 
                  ? 'bg-slate-800 text-white shadow-lg shadow-black/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={18} className={currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-500'} />
              <div className="flex-1 truncate">
                <div className="text-sm font-medium truncate">{session.title}</div>
                <div className="text-[10px] opacity-50">{session.updatedAt.toLocaleDateString()}</div>
              </div>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'text-indigo-400' : ''}`} />
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
              OP
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Operator</div>
              <div className="text-xs text-slate-500">Tier: Prime</div>
            </div>
            <Settings size={16} className="text-slate-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span className="text-sm font-medium text-slate-300">Strategy Engine Active</span>
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <BrainCircuit size={14} />
              <span>Model: GEMINI-3-PRO</span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-12">
          {currentSession?.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center text-indigo-500 mb-4 animate-pulse">
                <Terminal size={40} />
              </div>
              <h2 className="text-3xl font-bold">What is the objective?</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                AERONYX is a high-performance reasoning engine. Define your goal, and I will 
                identify constraints, choose a solution strategy, and produce actionable results.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                {[
                  "Draft a technical architecture for a microservices cluster",
                  "Analyze my business model for potential failure points",
                  "Create a step-by-step strategy for product launch",
                  "Optimize this Python code for memory efficiency"
                ].map((hint, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputValue(hint)}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-sm text-left text-slate-300"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSession?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                
                {message.role === 'user' ? (
                  <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-xl">
                    <p className="text-lg leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Assistant Metadata / Reasoning */}
                    {message.analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 hover:border-indigo-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                            <Target size={14} /> Goal
                          </div>
                          <p className="text-sm text-slate-300 font-medium">{message.analysis.goal}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 hover:border-emerald-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                            <ShieldCheck size={14} /> Constraints
                          </div>
                          <ul className="text-xs text-slate-400 space-y-1">
                            {message.analysis.constraints.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 hover:border-amber-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
                            <Lightbulb size={14} /> Strategy
                          </div>
                          <p className="text-xs text-slate-400 italic leading-relaxed">{message.analysis.strategy}</p>
                        </div>
                      </div>
                    )}

                    {/* Main Output */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="ml-4 text-xs font-mono text-slate-500 tracking-tighter uppercase">Practical Output Buffer</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Status: Success</span>
                      </div>
                      <div className="p-8 prose prose-invert max-w-none">
                        <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {message.content}
                        </div>
                      </div>
                      
                      {message.analysis && message.analysis.reasoning && (
                        <div className="border-t border-slate-800 bg-slate-950/50 p-6 space-y-4">
                           <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                             <ListTodo size={14} /> Execution Roadmap
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <h4 className="text-xs font-semibold text-slate-500 uppercase">Step-by-Step Reasoning</h4>
                               <ul className="text-sm text-slate-400 space-y-2">
                                 {message.analysis.reasoning.map((r, i) => (
                                   <li key={i} className="flex gap-3">
                                     <span className="text-indigo-500 font-mono font-bold">{i + 1}.</span>
                                     <span>{r}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="space-y-2">
                               <h4 className="text-xs font-semibold text-slate-500 uppercase">Recommendations</h4>
                               <div className="space-y-2">
                                 {message.analysis.recommendations.map((rec, i) => (
                                   <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex gap-2">
                                      <ChevronRight size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                                      {rec}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 animate-pulse">
                <Loader2 className="animate-spin text-indigo-500" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-slate-800 rounded"></div>
                  <div className="h-3 w-32 bg-slate-800/50 rounded"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 pt-0 sticky bottom-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Identify a problem or define an objective..."
                className="w-full bg-transparent border-none focus:ring-0 p-6 pr-24 text-lg text-slate-100 placeholder-slate-600 resize-none min-h-[100px]"
              />
              <div className="absolute right-4 bottom-4 flex items-center gap-3">
                <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">SHIFT</span> + <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">ENTER</span> to wrap
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-4 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
            AERONYX High Performance AI Engine // Secure Core Interaction
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
