import React, { useState } from 'react';
import { Zap, ArrowRight, Lock, Mail, Phone, User as UserIcon, Chrome } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (name.trim() && (email.trim() || phone.trim()) && password.trim()) {
      onLogin({
        id: crypto.randomUUID(),
        name,
        email: mode === 'email' ? email : undefined,
        phone: mode === 'phone' ? phone : undefined,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
      });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    // In a real app, this would redirect to Google OAuth
    // For now, we simulate a successful login
    setIsLoading(true);
    onLogin({
      id: crypto.randomUUID(),
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=DB4437&color=fff'
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
      {/* 3D Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-700" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-radial-gradient from-white/5 to-transparent opacity-20" />
      </div>

      <div className="w-full max-w-md relative z-10 perspective-1000">
        <div className="text-center mb-10 space-y-4 transform hover:scale-105 transition-transform duration-500">
          <div className="relative inline-flex items-center justify-center p-4 bg-black/40 rounded-3xl mb-4 border border-white/10 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] backdrop-blur-md group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Zap size={40} className="text-indigo-400 relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tighter drop-shadow-sm">
            GEOUS
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-[0.2em] font-medium">
            Advanced Reasoning Engine
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] relative overflow-hidden group">
          {/* Glass Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          {/* Tabs */}
          <div className="flex p-1.5 bg-black/60 rounded-2xl mb-8 border border-white/5 shadow-inner">
            <button
              onClick={() => setMode('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                mode === 'email' 
                  ? 'bg-slate-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={() => setMode('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                mode === 'phone' 
                  ? 'bg-slate-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Phone size={16} />
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group/input">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                Operator Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-900/10 focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] transition-all placeholder-slate-700"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {mode === 'email' ? (
              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-900/10 focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] transition-all placeholder-slate-700"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-900/10 focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] transition-all placeholder-slate-700"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 group/input">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-900/10 focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] transition-all placeholder-slate-700"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] border border-indigo-500/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Initialize Session'}</span>
              {!isLoading && <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0a0a0a] px-3 text-slate-600">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Chrome size={20} className="text-red-600" />
            Sign in with Google
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
              <Lock size={10} />
              <span>Secure Environment v2.5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
