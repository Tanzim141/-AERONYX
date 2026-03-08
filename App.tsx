
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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
  BrainCircuit,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  LogOut,
  Maximize2,
  Trash2
} from 'lucide-react';
import { Session, Message, AnalysisOutput, Attachment, User } from './types';
import { analyzeRequest, streamAnalysisRequest } from './services/gemini';
import Login from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    const storedUser = localStorage.getItem('aeronyx_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load sessions when user logs in
  useEffect(() => {
    if (user) {
      const storedSessions = localStorage.getItem(`aeronyx_sessions_${user.id}`);
      if (storedSessions) {
        try {
          const parsed = JSON.parse(storedSessions, (key, value) => {
            if (key === 'timestamp' || key === 'updatedAt') return new Date(value);
            return value;
          });
          setSessions(parsed);
          if (parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
          } else {
            handleNewSession();
          }
        } catch (e) {
          console.error("Failed to parse sessions", e);
          handleNewSession();
        }
      } else {
        handleNewSession();
      }
    }
  }, [user]);

  // Save sessions when they change
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`aeronyx_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('aeronyx_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aeronyx_user');
    setSessions([]);
    setCurrentSessionId(null);
  };

  const handleNewSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: 'New Consultation',
      messages: [],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInputValue('');
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    
    // If we're deleting the current session, switch to another one or create new
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        // If no sessions left, handleNewSession will be triggered by the empty check or we call it manually
        // But since we are setting state, let's just clear it and let the user click "New" or handle it
        setCurrentSessionId(null);
      }
    }
    
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      // Update localStorage immediately for delete
      if (user) {
        localStorage.setItem(`aeronyx_sessions_${user.id}`, JSON.stringify(newSessions));
      }
      return newSessions;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: Attachment[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
        });
        
        reader.readAsDataURL(file);
        const base64 = await base64Promise;
        
        newFiles.push({
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          mimeType: file.type,
          name: file.name,
          data: base64
        });
      }
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const newFiles: Attachment[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
          });

          reader.readAsDataURL(file);
          const base64 = await base64Promise;

          newFiles.push({
            id: crypto.randomUUID(),
            type: 'image',
            mimeType: file.type,
            name: `Pasted Image ${new Date().toLocaleTimeString()}`,
            data: base64
          });
        }
      }
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || !currentSessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      attachments: [...selectedFiles],
      timestamp: new Date()
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage, assistantMessage], 
            title: s.messages.length === 0 ? (inputValue ? inputValue.slice(0, 30) + '...' : 'File Upload') : s.title,
            updatedAt: new Date()
          } 
        : s
    ));
    
    const currentAttachments = [...selectedFiles];
    const currentInput = inputValue;
    setInputValue('');
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      const history = currentSession?.messages.map(m => {
        const parts: any[] = [];
        if (m.attachments) {
          m.attachments.forEach(att => {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data
              }
            });
          });
        }
        if (m.content) {
          parts.push({ text: m.content });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts
        };
      }) || [];

      await streamAnalysisRequest(currentInput, history, currentAttachments, (chunk) => {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { 
                ...s, 
                messages: s.messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: m.content + chunk } 
                    : m
                )
              } 
            : s
        ));
      });
      
    } catch (error) {
      console.error(error);
      // Remove the empty assistant message on error
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.filter(m => m.id !== assistantMessageId)
            } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans relative selection:bg-indigo-500/30">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-700" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-xl hidden md:flex relative z-10 shadow-[20px_0_50px_-10px_rgba(0,0,0,0.5)]">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/10">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">GEOUS</h1>
          </div>
          <button 
            onClick={handleNewSession}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white border border-transparent hover:border-white/5"
          >
            <Plus size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-3 flex items-center gap-2">
            <History size={12} /> Recent Strategies
          </div>
          {sessions.map(session => (
            <div
              key={session.id}
              className={`w-full px-4 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 group relative border ${
                currentSessionId === session.id 
                  ? 'bg-white/5 text-white border-white/10 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border-transparent hover:border-white/5'
              }`}
            >
              <button 
                onClick={() => setCurrentSessionId(session.id)}
                className="flex-1 flex items-center gap-3 min-w-0 text-left"
              >
                <MessageSquare size={18} className={`shrink-0 transition-colors ${currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium truncate">{session.title}</div>
                  <div className="text-[10px] opacity-40 font-mono mt-0.5">{new Date(session.updatedAt).toLocaleDateString()}</div>
                </div>
              </button>
              
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all shrink-0"
                title="Delete Session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors group relative border border-white/5 hover:border-white/10">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-black" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-black">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email || user.phone}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ShieldCheck size={20} className="text-emerald-500 relative z-10" />
              <div className="absolute inset-0 bg-emerald-500/20 blur-lg" />
            </div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-[10px]">Strategy Engine Active</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-full bg-white/5">
              <BrainCircuit size={12} />
              <span>Model: AI-ENGINE v3.0</span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-12">
          {currentSession?.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-colors duration-500" />
                <div className="w-24 h-24 bg-black/50 border border-white/10 rounded-3xl flex items-center justify-center text-indigo-500 relative z-10 shadow-2xl backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
                  <Terminal size={48} className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tight">What is the objective?</h2>
                <p className="text-slate-400 leading-relaxed text-lg max-w-lg mx-auto font-light">
                  GEOUS is a high-performance reasoning engine. Define your goal, and I will 
                  identify constraints, choose a solution strategy, and produce actionable results.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                {[
                  "Draft a technical architecture for a microservices cluster",
                  "Analyze my business model for potential failure points",
                  "Create a step-by-step strategy for product launch",
                  "Optimize this Python code for memory efficiency"
                ].map((hint, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputValue(hint)}
                    className="p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] transition-all text-sm text-left text-slate-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSession?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                
                {message.role === 'user' ? (
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] max-w-full border border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 relative z-10">
                        {message.attachments.map(att => (
                          <div key={att.id} className="relative group cursor-pointer" onClick={() => att.type === 'image' && setLightboxImage(`data:${att.mimeType};base64,${att.data}`)}>
                            {att.type === 'image' ? (
                              <div className="relative overflow-hidden rounded-lg border border-white/20 w-32 h-32 shadow-lg">
                                <img 
                                  src={`data:${att.mimeType};base64,${att.data}`} 
                                  alt={att.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <Maximize2 size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-32 h-32 bg-white/10 rounded-lg flex flex-col items-center justify-center p-2 border border-white/20 hover:bg-white/20 transition-colors shadow-lg backdrop-blur-sm">
                                <FileText size={32} />
                                <span className="text-xs truncate w-full text-center mt-2 font-medium">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-lg leading-relaxed whitespace-pre-wrap relative z-10 font-light">{message.content}</p>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    {/* Assistant Metadata / Reasoning */}
                    {message.analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-colors shadow-lg group">
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-indigo-300 transition-colors">
                            <Target size={14} /> Goal
                          </div>
                          <p className="text-sm text-slate-300 font-medium leading-snug">{message.analysis.goal}</p>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-3 hover:border-emerald-500/30 transition-colors shadow-lg group">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-emerald-300 transition-colors">
                            <ShieldCheck size={14} /> Constraints
                          </div>
                          <ul className="text-xs text-slate-400 space-y-1.5">
                            {message.analysis.constraints.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-3 hover:border-amber-500/30 transition-colors shadow-lg group">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-amber-300 transition-colors">
                            <Lightbulb size={14} /> Strategy
                          </div>
                          <p className="text-xs text-slate-400 italic leading-relaxed">{message.analysis.strategy}</p>
                        </div>
                      </div>
                    )}

                    {/* Main Output */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                      <div className="bg-white/5 px-6 py-3 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                          </div>
                          <span className="ml-4 text-[10px] font-mono text-slate-500 tracking-widest uppercase">Output Buffer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active</span>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="prose prose-invert max-w-none prose-headings:font-sans prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-indigo-400 prose-code:text-amber-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner prose-blockquote:border-l-indigo-500 prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {message.analysis && message.analysis.reasoning && (
                        <div className="bg-black/20 p-6 space-y-6 backdrop-blur-sm">
                           <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                             <ListTodo size={14} /> Execution Roadmap
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reasoning Trace</h4>
                               <ul className="space-y-3">
                                 {message.analysis.reasoning.map((r, i) => (
                                   <li key={i} className="flex gap-3 text-sm text-slate-400 group">
                                     <span className="text-indigo-500/50 font-mono font-bold text-xs mt-0.5 group-hover:text-indigo-400 transition-colors">{(i + 1).toString().padStart(2, '0')}.</span>
                                     <span className="group-hover:text-slate-300 transition-colors">{r}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategic Recommendations</h4>
                               <div className="space-y-2">
                                 {message.analysis.recommendations.map((rec, i) => (
                                   <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 flex gap-3 hover:bg-white/10 hover:border-indigo-500/30 transition-all group">
                                      <ChevronRight size={14} className="text-indigo-500/50 mt-0.5 shrink-0 group-hover:text-indigo-400 transition-colors" />
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
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex items-center gap-5 animate-pulse shadow-lg backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/50 blur-lg rounded-full" />
                  <Loader2 className="animate-spin text-indigo-400 relative z-10" size={24} />
                </div>
                <div className="space-y-2.5">
                  <div className="h-4 w-48 bg-white/10 rounded-full"></div>
                  <div className="h-3 w-32 bg-white/5 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 pt-0 sticky bottom-0 bg-gradient-to-t from-black via-black to-transparent z-20">
          <div className="max-w-4xl mx-auto relative group">
            {/* File Preview Area */}
            {selectedFiles.length > 0 && (
              <div className="absolute bottom-full mb-4 left-0 flex gap-2 overflow-x-auto max-w-full p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                {selectedFiles.map(file => (
                  <div key={file.id} className="relative group/file shrink-0">
                    {file.type === 'image' ? (
                      <img 
                        src={`data:${file.mimeType};base64,${file.data}`} 
                        alt={file.name} 
                        className="w-16 h-16 object-cover rounded-lg border border-white/20"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/5 rounded-lg flex flex-col items-center justify-center p-1 border border-white/10">
                        <FileText size={20} className="text-slate-400" />
                        <span className="text-[8px] text-slate-400 truncate w-full text-center mt-1">{file.name}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 bg-black text-slate-400 hover:text-red-400 rounded-full p-1 border border-white/20 shadow-sm opacity-0 group-hover/file:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-60 animate-pulse" />
            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors group-focus-within:border-indigo-500/30">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Identify a problem or define an objective..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none p-6 pr-24 text-lg text-slate-200 placeholder-slate-600 resize-none min-h-[100px]"
              />
              
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden" 
                    multiple 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all duration-300"
                    title="Attach files"
                  >
                    <Paperclip size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-slate-600 hidden sm:block uppercase tracking-wider">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-500 border border-white/5">SHIFT</span> + <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-500 border border-white/5">ENTER</span> to wrap
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)] active:scale-95 border border-indigo-400/20"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6 text-[10px] text-slate-700 uppercase tracking-[0.2em] font-mono">
            GEOUS High Performance AI Engine // Secure Core Interaction
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
