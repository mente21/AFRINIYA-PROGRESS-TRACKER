import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Quest, Habit } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'afrina';
  text: string;
}

interface AiCompanionDrawerProps {
  userProfile: UserProfile;
  quests: Quest[];
  habits: Habit[];
  totalXp: number;
}

export default function AiCompanionDrawer({
  userProfile,
  quests,
  habits,
  totalXp,
}: AiCompanionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'afrina',
      text: "Salutations, Operative! I am Afrina, your AI Tactical Productivity Coordinator. I have loaded your live metrics: Level " + userProfile.level + " with a Productivity Score of " + userProfile.productivityScore + "%. How can I calibrate your routine or optimize your quests list today?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsTyping(true);

    try {
      // Assemble core user stats to ground the AI model on real user data
      const userStats = {
        level: userProfile.level,
        currentXp: userProfile.currentXp,
        xpToNextLevel: userProfile.xpToNextLevel,
        productivityScore: userProfile.productivityScore,
        totalXp: totalXp
      };

      // Package client messages for historical context
      const chatHistory = messages.map(m => ({
        sender: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/gemini/coach-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: chatHistory,
          userStats: userStats
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseMsg: Message = {
          id: `msg_a_${Date.now()}`,
          sender: 'afrina',
          text: data.reply || "Calibration complete. Signal matches recommended parameters."
        };
        setMessages(prev => [...prev, responseMsg]);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Cognitive sync failure.');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'afrina',
          text: `Tactical Sync Failure: ${err.message || 'Make sure you have added your GEMINI_API_KEY inside the Secrets panel!'}`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <>
      {/* Floating Sparkle Avatar Button Launcher in bottom right */}
      <div className="fixed bottom-6 right-6 z-55">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-xl ${
            isOpen 
              ? 'bg-purple-600 border border-purple-400 text-white rotate-90' 
              : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-primary text-white border border-purple-500/30'
          } shadow-purple-900/40 relative group text-glow`}
        >
          {isOpen ? (
            <span className="material-symbols-outlined text-2xl font-bold">close</span>
          ) : (
            <span className="material-symbols-outlined text-2xl font-bold animate-pulse">psychology</span>
          )}
          
          {/* Pulsing trigger ring */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full border-2 border-purple-500/20 animate-ping pointer-events-none"></span>
          )}
        </button>
      </div>

      {/* Floating Slider Companion Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full bg-[#0d1627]/98 border-l border-white/5 shadow-2x shadow-black z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header HUD */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-950/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ddb7ff] text-xl">psychology</span>
            <div>
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Afrina Tactical Coordinator</h3>
              <p className="font-mono text-[8px] text-green-400 flex items-center gap-1 uppercase tracking-widest font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Offline Database Synced
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full"
          >
            <span className="material-symbols-outlined text-md">chevron_right</span>
          </button>
        </div>

        {/* Live Profile Quick Glance */}
        <div className="px-4 py-2 bg-purple-950/10 border-b border-purple-500/5 flex items-center justify-between font-mono text-[9px] text-[#ddb7ff]">
          <span>LEVEL: {userProfile.level}</span>
          <span>SCORE: {userProfile.productivityScore}/100</span>
          <span>ACTIVE INDEX: {quests.filter(q=>q.status==='in_progress').length} IN FLIGHT</span>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-[11.5px] leading-relaxed font-semibold ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-indigo-950/30 border border-indigo-500/10 text-gray-300 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="font-mono text-[8px] text-gray-550 mt-1 block uppercase">
                {m.sender === 'user' ? 'Operative' : 'Afrina'}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex flex-col max-w-[85%] items-start animate-pulse">
              <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 text-gray-500 text-[11px] rounded-tl-none flex items-center gap-1.5">
                <span className="animate-spin material-symbols-outlined text-xs">sync</span>
                Synthesizing response strategy...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-purple-950/5 border-t border-white/5 space-y-2 select-none">
          <span className="font-mono text-[8px] text-gray-500 block uppercase tracking-wider font-bold">Quick Directives</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickPrompt("Assess my active quests list and suggest daily priorities.")}
              className="py-1 px-2 rounded-lg bg-[#11192a] border border-white/5 hover:border-purple-500/50 text-[9px] text-gray-400 hover:text-[#ddb7ff] font-sans font-bold cursor-pointer transition-colors"
            >
              🎯 Prioritize Quests
            </button>
            <button
              onClick={() => handleQuickPrompt("How can I build focus habits today to maximize XP?")}
              className="py-1 px-2 rounded-lg bg-[#11192a] border border-white/5 hover:border-purple-500/50 text-[9px] text-gray-400 hover:text-[#ddb7ff] font-sans font-bold cursor-pointer transition-colors"
            >
              ⚡ Maximize Focus
            </button>
            <button
              onClick={() => handleQuickPrompt("Introduce a custom elite Scout challenge.")}
              className="py-1 px-2 rounded-lg bg-[#11192a] border border-white/5 hover:border-purple-500/50 text-[9px] text-gray-400 hover:text-[#ddb7ff] font-sans font-bold cursor-pointer transition-colors"
            >
              🏆 Level 42 Challenge
            </button>
          </div>
        </div>

        {/* Chat Input form footer */}
        <div className="p-3 border-t border-white/5 bg-[#0b1220]">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Afrina about your productivity agenda..."
              className="w-full bg-[#11192a] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-sans pr-10"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isTyping}
              className="absolute right-2 top-2 text-purple-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
