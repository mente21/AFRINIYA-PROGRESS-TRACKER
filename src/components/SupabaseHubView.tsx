import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Shield, 
  UploadCloud, 
  Terminal, 
  Lightbulb, 
  Play, 
  RefreshCw, 
  PlusCircle, 
  Key,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { Habit, Quest, UserProfile } from '../types';

interface SupabaseHubViewProps {
  habits: Habit[];
  quests: Quest[];
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  setFeed: React.Dispatch<React.SetStateAction<any[]>>;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  onSyncWithBackend: () => void;
}

export default function SupabaseHubView({
  habits,
  quests,
  userProfile,
  setUserProfile,
  setQuests,
  setFeed,
  totalXp,
  setTotalXp,
  onSyncWithBackend
}: SupabaseHubViewProps) {
  // Local lists fetched from full synced state
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [storageBuckets, setStorageBuckets] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Scout');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadBucket, setUploadBucket] = useState('profile_images');
  const [selectedImageUrl, setSelectedImageUrl] = useState('https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150');

  // AI Counselor state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    analysis: string[];
    suggestedQuest: {
      title: string;
      description: string;
      category: 'Development' | 'Design' | 'Strategic' | 'Marketing';
      deadline: string;
      xpReward: number;
    } | null;
  } | null>(null);

  // Presets of avatars for easy upload testing
  const avatarPresets = [
    { name: 'Cyber Rogue', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150' },
    { name: 'Technomancer', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' },
    { name: 'System Arch', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
    { name: 'Elite Sentinel', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' }
  ];

  // Load database metadata directly from full backend API state
  const loadSupabaseData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/db/get');
      const data = await res.json();
      if (data) {
        setAuthUsers(data.supabaseAuthUsers || []);
        setStorageBuckets(data.supabaseStorageBuckets || []);
        setDbLogs(data.supabaseDbLogs || []);
      }
    } catch (e) {
      console.error('Error loading Supabase tables:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Handle Supabase Auth simulator form submit
  const handleCreateAuthUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('Valid email coordinate is required for Supabase registration.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/supabase/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole })
      });
      const resData = await res.json();
      if (resData.success) {
        // Update profile in parent from server return
        setUserProfile(resData.data.userProfile);
        setAuthUsers(resData.data.supabaseAuthUsers || []);
        setDbLogs(resData.data.supabaseDbLogs || []);
        
        setFeed(prev => [
          {
            id: `f_s_auth_${Date.now()}`,
            type: 'achievement',
            title: `Supabase User Registered`,
            description: `Provisioned user "${newEmail}" role: ${newRole} to supabase postgres auth scheme.`,
            timeAgo: 'Just now'
          },
          ...prev
        ]);

        alert(`SUPABASE AUTH SIGNUP SUCCESS:\n- Email: ${newEmail}\n- Table auth.users updated!\n- Profile loaded onto active workspace.`);
        setNewEmail('');
        onSyncWithBackend(); // Make sure other views sync
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Supabase Storage Mock Upload
  const handleUploadAsset = async () => {
    if (!uploadFilename.trim()) {
      alert('Ident coordinate (Filename) is required for bucket upload.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        filename: uploadFilename.includes('.') ? uploadFilename : `${uploadFilename}.png`,
        bucket: uploadBucket,
        contentType: 'image/png',
        size: `${Math.floor(Math.random() * 800 + 40)}KB`,
        url: selectedImageUrl
      };

      const res = await fetch('/api/supabase/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStorageBuckets(data.data.supabaseStorageBuckets || []);
        setDbLogs(data.data.supabaseDbLogs || []);
        
        // Spawn feedback item
        setFeed(prev => [
          {
            id: `f_s_store_${Date.now()}`,
            type: 'achievement',
            title: `Asset Stored: ${payload.filename}`,
            description: `Uploaded avatar token to Supabase storage bucket "${uploadBucket}" successfully. Added to Inventory.`,
            timeAgo: 'Just now'
          },
          ...prev
        ]);

        alert(`UPLOAD SEQUENCE COMPLETE:\n- Bucket: ${uploadBucket}\n- Object saved: ${payload.filename}\n- Relational inventory link established.`);
        setUploadFilename('');
        onSyncWithBackend(); // Sync inventory
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Call premium Gemini counselor
  const handleConsultAI = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/ai/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits,
          quests,
          userProfile
        })
      });
      const result = await response.json();
      setAiReport(result);
      
      // Seed newest logs onto terminal console
      loadSupabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // Inject dynamic quest spawned by AI counselor into active lists
  const handleAcceptAiQuest = async () => {
    if (!aiReport || !aiReport.suggestedQuest) return;

    const newQuest: Quest = {
      id: `q_ai_${Date.now()}`,
      title: aiReport.suggestedQuest.title,
      description: aiReport.suggestedQuest.description,
      category: aiReport.suggestedQuest.category,
      taskType: 'one_time',
      status: 'todo',
      isGolden: true,
      deadline: aiReport.suggestedQuest.deadline,
      xpReward: aiReport.suggestedQuest.xpReward
    };

    setQuests(prev => [newQuest, ...prev]);

    // Force synchronize the complete workspace array to express database JSON block
    setTimeout(async () => {
      try {
        await fetch('/api/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quests: [newQuest, ...quests]
          })
        });
        loadSupabaseData(); // update logs
      } catch (err) {
        console.error(err);
      }
    }, 100);

    setFeed(prev => [
      {
        id: `f_ai_spawn_${Date.now()}`,
        type: 'challenge',
        title: `AI Quest Sync active: "${newQuest.title}"`,
        description: `Successfully accepted tactical directive from Sentinel counselor, reward set at ${newQuest.xpReward} XP.`,
        timeAgo: 'Just now'
      },
      ...prev
    ]);

    alert(`DIRECTIVE DEPLOYED:\n- Accepted Quest: "${newQuest.title}"\n- Added to your main Active Quests backlog!\n- Synced to Supabase Tables directly.`);
    setAiReport(null);
  };

  // Reset the Database to initial defaults
  const handleHardResetDatabase = async () => {
    if (!confirm('WARNING: Are you sure you want to hard reset the database storage? All custom routines, users and logs will revert to defaults.')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('SUPABASE POSTGRES CONSOLE: Database truncated, tables successfully reconstructed with seed data.');
        loadSupabaseData();
        onSyncWithBackend();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-emerald-950/40 via-[#10192e] to-indigo-950/20 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3ecf8e]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2">
            <Database className="text-[#3ecf8e] w-6 h-6 animate-pulse" />
            <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#3ecf8e] border border-emerald-500/20">
              SUPABASE PG ACTIVE
            </span>
          </div>
          <h1 className="font-display text-2.5xl font-extrabold tracking-tighter text-white mt-1.5">
            Supabase Engineering Console
          </h1>
          <p className="font-sans text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Monitor stateful relational schemas, mock Postgres Auth registrations, deploy image bucket assets to inventory, and invoke premium Gemini AI model routines.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <button 
            onClick={loadSupabaseData}
            disabled={isLoading}
            className="p-2 bg-[#121b2d] border border-white/5 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh tables"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleHardResetDatabase}
            className="py-2 px-3.5 bg-red-950/40 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase font-black tracking-widest rounded-lg transition-all active:scale-95"
            title="Truncate Database"
          >
            Truncate DB
          </button>
        </div>
      </div>

      {/* Grid: Columns of Supabase Modules */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* PostgreSQL SQL Logger Terminal (Span across entire width under tabs in beautiful layout) */}
        <section className="xl:col-span-12 glass-panel rounded-2xl p-5 border-l-4 border-amber-500/80 bg-gradient-to-r from-amber-950/10 to-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="text-amber-400 w-4 h-4" />
              <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                PostgreSql Live Transaction Log Stream
              </h2>
            </div>
            <span className="font-mono text-[9px] text-gray-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase">
              Client & AI Interceptions
            </span>
          </div>

          <div className="bg-[#070b14] rounded-xl p-4 font-mono text-[11px] text-emerald-400/90 space-y-2 border border-white/5 max-h-48 overflow-y-auto scrollbar-thin">
            {dbLogs.length === 0 ? (
              <p className="text-gray-500 italic select-none">No transactions registered. Perform CRUD items or register auth users below.</p>
            ) : (
              dbLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[#3ecf8e] font-black shrink-0">[{log.operation}]</span>
                    <span className="text-amber-300 font-bold shrink-0">{log.table}</span>
                    <span className="text-gray-400 select-all truncate max-w-lg" title={log.query}>{log.query}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-bold text-[10px]">
                    <span className="text-indigo-400">{log.duration}</span>
                    <span className="text-gray-500">{log.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Auth Module (Left tab) */}
        <section className="xl:col-span-6 glass-panel rounded-2xl p-5 border-t-2 border-[#3ecf8e]/80">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <Shield className="text-[#3ecf8e] w-4 h-4" />
            <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Supabase Authentication Simulator
            </h2>
          </div>

          {/* Form to Register Auth Credentials */}
          <form onSubmit={handleCreateAuthUser} className="space-y-4 mb-5">
            <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-gray-400">
              Register Credentials
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Email Identity</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. mentes@example.com"
                  className="w-full bg-[#11192a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">System Role Authority</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-[#11192a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Lead Commander">Lead Commander</option>
                  <option value="Elite Scout">Elite Scout</option>
                  <option value="Sentinel Analyst">Sentinel Analyst</option>
                  <option value="Platform Agent">Platform Agent</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#12ab6b] hover:bg-[#10935c] text-white font-mono text-[10px] font-bold tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              CREATE SUPABASE AUTH USER
            </button>
          </form>

          {/* Users List from Supabase Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-gray-400">
                Live Table: auth.users
              </h3>
              <span className="font-mono text-[10px] text-gray-500">Record count: {authUsers.length}</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {authUsers.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    userProfile.name === item.email.split("@")[0].toUpperCase()
                      ? 'border-[#3ecf8e] bg-[#0c1410]/50' 
                      : 'border-white/5 bg-[#0f1624]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center text-[#3ecf8e] shrink-0 font-bold text-xs">
                      {item.role[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-extrabold text-xs text-white truncate">{item.email}</p>
                      <p className="font-mono text-[9px] text-gray-500 mt-0.5">UID: {item.id} • Auth State: {item.role}</p>
                    </div>
                  </div>
                  {userProfile.name === item.email.split("@")[0].toUpperCase() && (
                    <span className="font-mono text-[8.5px] font-extrabold text-[#3ecf8e] bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 px-2 py-0.5 rounded">
                      ACTIVE SYSTEM NODE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Storage Buckets (Right tab) */}
        <section className="xl:col-span-6 glass-panel rounded-2xl p-5 border-t-2 border-indigo-500/80">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <UploadCloud className="text-indigo-400 w-4 h-4" />
            <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Supabase Storage Engine Simulator
            </h2>
          </div>

          <div className="space-y-4 mb-5">
            <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-gray-400">
              Upload Token Avatar to Storage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Target Filename</label>
                <input 
                  type="text" 
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  placeholder="e.g. hyper_shield_sigil"
                  className="w-full bg-[#11192a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Select Bucket</label>
                <select 
                  value={uploadBucket}
                  onChange={(e) => setUploadBucket(e.target.value)}
                  className="w-full bg-[#11192a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="profile_images">profile_images (Bucket)</option>
                  <option value="inventory_assets">inventory_assets (Bucket)</option>
                  <option value="campaign_banners">campaign_banners (Bucket)</option>
                </select>
              </div>
            </div>

            {/* Custom URL or Presets selection */}
            <div className="space-y-1.5">
              <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block">Choose Preset Artwork Token</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSelectedImageUrl(preset.url);
                      if (!uploadFilename) setUploadFilename(preset.name.toLowerCase().replace(/ /g, '_'));
                    }}
                    className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      selectedImageUrl === preset.url 
                        ? 'border-indigo-500 bg-indigo-950/20' 
                        : 'border-white/5 bg-[#121b2d]/40'
                    }`}
                  >
                    <img src={preset.url} className="w-8 h-8 rounded object-cover" alt="" />
                    <span className="font-mono text-[7.5px] text-white tracking-tight text-center leading-none truncate max-w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUploadAsset}
              disabled={isLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              UPLOAD OBJECT TO BUCKET
            </button>
          </div>

          {/* List of storage buckets files */}
          <div className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-gray-400">
              Live Storage Objects (Mocked CDN)
            </h3>

            <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
              {storageBuckets.map((obj) => (
                <div key={obj.id} className="p-2.5 rounded-xl border border-white/5 bg-[#0f1624]/60 hover:bg-white/5 transition-all flex items-center gap-2.5">
                  <img src={obj.url} className="w-10 h-10 rounded-lg object-cover border border-indigo-500/20 shadow" alt="" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-white font-bold leading-tight truncate" title={obj.filename}>
                      {obj.filename}
                    </p>
                    <p className="font-mono text-[8px] text-indigo-300 mt-0.5">Bucket: {obj.bucket}</p>
                    <p className="font-mono text-[8px] text-gray-500 leading-none mt-1">size: {obj.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gemini Core Intelligent Counselor Console */}
        <section className="xl:col-span-12 glass-panel rounded-2xl p-6 border-l-4 border-indigo-500/85 bg-gradient-to-r from-[#01061a] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-5 select-none">
            <div className="flex items-center gap-2">
              <Sparkles className="text-secondary w-5 h-5 animate-pulse" />
              <div>
                <h2 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                  Afrinias Artificial Intelligence Advisor
                </h2>
                <p className="font-mono text-[8.5px] text-indigo-300 leading-none mt-0.5">
                  Cognitive Analysis & Tactical Directives
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleConsultAI}
              disabled={aiLoading}
              className="py-2 px-5 bg-gradient-to-r from-secondary-400 to-primary text-black font-mono text-[10.5px] font-extrabold tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer text-glow-indigo"
            >
              <Lightbulb className="w-4 h-4 text-black" />
              {aiLoading ? "CONSULTING DEEP SYSTEM..." : "RUN INTEL COUNSEL"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left AI Analysis Bullet list details */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-[#ddb7ff] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Analytical Insights
              </h3>

              {!aiReport ? (
                <div className="p-5 rounded-xl bg-[#0c101c] border border-white/5 flex flex-col items-center justify-center text-center text-gray-400">
                  <Sparkles className="w-10 h-10 text-gray-600 mb-2" />
                  <p className="font-sans text-xs font-semibold leading-relaxed">
                    AI analysis is standing by. Click "RUN INTEL COUNSEL" to instruct Gemini to evaluate your productivity scores, habit matrix cycles, and open backlog quests.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aiReport.analysis.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0d1326] border border-white/5 hover:border-indigo-500/10 transition-colors">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="font-sans text-[12px] text-gray-300 font-medium leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right AI Generated Quest Object view with button */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 space-y-4">
              <h3 className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-[#ddb7ff] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Recommended Directive
              </h3>

              {!aiReport || !aiReport.suggestedQuest ? (
                <div className="h-[140px] rounded-xl border border-dashed border-white/5 flex items-center justify-center text-center text-gray-650">
                  <p className="font-mono text-[9px] uppercase tracking-wider font-bold">Awaiting Counselor Output</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-[#ddb7ff]/20 bg-[#ddb7ff]/5 relative overflow-hidden flex flex-col justify-between h-full relative group shadow">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-b from-[#ddb7ff]/10 to-transparent rounded-full blur-xl"></div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[9px] uppercase font-bold text-secondary bg-indigo-950/40 px-2 py-0.5 rounded border border-secondary/20">
                        {aiReport.suggestedQuest.category}
                      </span>
                      <span className="font-mono text-[9px] text-[#ddb7ff] font-bold">
                        {aiReport.suggestedQuest.deadline}
                      </span>
                    </div>

                    <h4 className="font-display font-extrabold text-sm text-white pt-1 leading-tight group-hover:text-[#ddb7ff] transition-colors">
                      {aiReport.suggestedQuest.title}
                    </h4>
                    <p className="font-sans text-[11px] text-gray-400 leading-snug">
                      {aiReport.suggestedQuest.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 font-mono text-[11px] font-black">
                        +{aiReport.suggestedQuest.xpReward}
                      </span>
                      <span className="font-mono text-[8px] text-gray-500 uppercase font-black">XP REWARD</span>
                    </div>

                    <button
                      onClick={handleAcceptAiQuest}
                      className="py-1.5 px-3 bg-[#ddb7ff] text-indigo-950 hover:brightness-110 active:scale-95 font-mono text-[9.5px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer shadow"
                    >
                      SYNC DIRECTIVE
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
