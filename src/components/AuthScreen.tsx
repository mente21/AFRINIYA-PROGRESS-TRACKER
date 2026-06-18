import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
        setSuccess('Registration successful. You can now log in!');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto flex items-center justify-center mb-4 overflow-visible">
            <img src="/logo.png" alt="Afrinias Logo" className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.4)] scale-[2]" />
          </div>
          <h1 className="font-display text-5xl font-extrabold text-white tracking-tight mt-6">Afrinias</h1>
          <p className="font-mono text-xs text-primary font-bold uppercase tracking-widest mt-3">Operative Login</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl bg-[#131b2e]/80">
          <h2 className="font-display text-xl font-bold text-white mb-6">
            {isLogin ? 'Welcome Back, Agent' : 'Initialize New Account'}
          </h2>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {error}
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest font-bold">Agent Name</label>
                  <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-lg">badge</span>
                    <input 
                      type="text" 
                      required={!isLogin}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#0b1326] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secure Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-lg">mail</span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@afrinias.com"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest font-bold">Passcode</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-lg pointer-events-none">lock</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white font-mono text-[11px] tracking-widest font-extrabold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <><span className="animate-spin material-symbols-outlined text-sm">sync</span> Processing...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">login</span> {isLogin ? 'ACCESS MAINFRAME' : 'REGISTER CRENDENTIALS'}</>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="font-mono text-[10px] text-gray-500 uppercase font-bold tracking-widest">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full mt-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-sans text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="font-sans text-xs text-gray-500">
              {isLogin ? "Don't have an access code?" : "Already have clearance?"}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-mono text-[10px] text-primary font-bold uppercase tracking-wider hover:text-secondary transition-colors"
              >
                {isLogin ? 'Register Now' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
