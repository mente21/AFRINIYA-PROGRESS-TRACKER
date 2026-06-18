import { useState } from 'react';
import { LeaderboardUser, UserProfile } from '../types';
import { motion } from 'motion/react';

interface LeaderboardViewProps {
  userProfile: UserProfile;
  leaderboard: LeaderboardUser[];
  totalXp: number;
  currentUserId?: string;
}

export default function LeaderboardView({
  userProfile,
  leaderboard,
  totalXp,
  currentUserId,
}: LeaderboardViewProps) {
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'all-time'>('weekly');
  const [expandedPosition, setExpandedPosition] = useState(false);

  const realLeaderboard = leaderboard
    .map(u => ({
      ...u,
      totalXp: u.id === currentUserId ? totalXp : u.totalXp,
      score: Math.min(99.9, parseFloat(((u.id === currentUserId ? totalXp : u.totalXp) / 146).toFixed(1))),
      equippedFrameCss: u.id === currentUserId ? (userProfile.equippedFrameCss || u.equippedFrameCss) : u.equippedFrameCss,
      isCurrentUser: u.id === currentUserId,
    }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  const myRank = realLeaderboard.find(p => p.isCurrentUser)?.rank ?? realLeaderboard.length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header Row */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Global Rankings</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">Compete with the elite. Climb operative codes to level up.</p>
        </div>

        {/* Filters Panel inline Glass */}
        <div className="flex p-1 bg-gray-900 rounded-xl border border-white/5 space-x-1">
          {(['daily', 'weekly', 'all-time'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 font-mono text-[9px] font-bold tracking-wider rounded-lg uppercase transition-all ${
                filter === tab
                  ? 'bg-gray-800 text-primary border border-white/5 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Podium Top 3 Standings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative pt-6">
        {realLeaderboard.slice(0, 3).map((player, index) => {
          const isGold = index === 0;
          const isSilver = index === 1;
          const isBronze = index === 2;
          const rankNum = index + 1;
          const orderClass = isGold ? 'order-1 md:order-2 h-[310px]' : isSilver ? 'order-2 md:order-1 h-[270px]' : 'order-3 md:order-3 h-[255px]';
          const glowClass = isGold ? 'glow-gold border border-[#efc200]/30' : 'border border-white/5';
          
          return (
            <div key={rankNum} className={`glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all ${orderClass} ${glowClass}`}>
              <div className={`absolute top-0 w-full h-1 ${isGold ? 'bg-[#efc200]' : isSilver ? 'bg-gray-500' : 'bg-[#4d4354]'}`}></div>
              <div className={`font-display text-7xl leading-none opacity-10 absolute right-4 top-4 font-extrabold select-none ${isGold ? 'text-[#efc200]' : isSilver ? 'text-gray-400' : 'text-amber-800'}`}>
                {rankNum}
              </div>
              
              <div className={`w-20 h-20 rounded-full bg-gray-800 p-1 relative z-10 mb-3 shrink-0 ${isGold ? 'w-24 h-24 border-[#efc200] border-4' : isSilver ? 'border-gray-400 border-2' : 'border-amber-600/70 border-2'} ${player.equippedFrameCss || ''}`}>
                {isGold && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#efc200] text-gray-950 rounded-full w-7 h-7 flex items-center justify-center shadow-md border border-amber-300">
                    <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                )}
                {player.avatar ? (
                  <img alt={player.name} className="w-full h-full rounded-full object-cover" src={player.avatar} />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400">person</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-display font-bold text-sm text-white">{player.name}</h3>
              <p className={`font-mono text-[10px] tracking-widest uppercase mt-1 ${isGold ? 'text-[#efc200]' : 'text-secondary'}`}>
                Level {player.level}
              </p>
              
              <div className={`mt-5 w-full bg-[#171f33]/60 rounded-xl p-2.5 border border-white/5 ${isGold ? 'border-yellow-500/20' : ''}`}>
                <div className={`font-display text-base font-extrabold ${isGold ? 'text-[#efc200] text-lg' : 'text-[#dae2fd]'}`}>
                  {player.totalXp.toLocaleString()} <span className="text-[10px] text-on-surface-variant font-mono">XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table List */}
      <section className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        {/* Header Grid Row */}
        <div className="flex items-center px-6 py-3 bg-gray-900/50 border-b border-white/5 font-mono text-[9px] tracking-wider text-gray-400 font-bold uppercase">
          <div className="w-12 text-center">Rank</div>
          <div className="flex-1 pl-4">Operator</div>
          <div className="w-24 text-center hidden sm:block">Score</div>
          <div className="w-32 text-right">Total XP</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-gray-800/40">
          {realLeaderboard.length === 0 ? (
            <div className="px-6 py-10 text-center font-mono text-xs text-gray-500">
              No team members yet. Members appear here after they sign in.
            </div>
          ) : realLeaderboard.map((player) => (
            <div 
              key={player.id || player.rank}
              className={`flex items-center px-6 py-3.5 hover:bg-gray-800/20 transition-colors group ${
                player.isCurrentUser ? 'bg-primary/5' : ''
              }`}
            >
              <div className="w-12 text-center font-display text-sm font-extrabold text-gray-400 group-hover:text-primary transition-colors">
                {player.rank}
              </div>
              <div className="flex-1 pl-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gray-950 overflow-hidden flex items-center justify-center shrink-0 ${player.equippedFrameCss || 'border border-gray-800'}`}>
                  {player.avatar ? (
                    <img alt="User avatar" className="w-full h-full object-cover" src={player.avatar} />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5 leading-tight">
                    <span>{player.name}</span>
                    {player.isCurrentUser && (
                      <span className="bg-primary/20 text-primary border border-primary/20 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase leading-none font-bold">You</span>
                    )}
                  </div>
                  <div className="font-mono text-[9px] text-gray-500 uppercase mt-1">Level {player.level} {player.tier && `• ${player.tier}`}</div>
                </div>
              </div>

              <div className="w-24 text-center hidden sm:block font-mono text-xs font-bold text-secondary text-glow-cyan">
                {player.score}
              </div>
              <div className="w-32 text-right font-display text-sm font-extrabold text-white">
                {player.totalXp.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* List Footer actions */}
        <div className="p-3 text-center border-t border-white/5">
          <button 
            onClick={() => alert("Operators database fully synchronized with local regional proxy servers.")}
            className="font-mono text-[10px] tracking-wider font-extrabold text-primary hover:text-[#ddb7ff] py-1.5 px-3 rounded hover:bg-primary/5 uppercase"
          >
            Sychronize Roster
          </button>
        </div>
      </section>

      {/* Sticky Bottom "Your Position" Bar HUD */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#0b1326]/90 backdrop-blur-md border-t border-primary/25 z-30">
        <div className="max-w-6xl mx-auto">
          <div 
            onClick={() => setExpandedPosition(!expandedPosition)}
            className="glass-panel rounded-xl p-3 px-4 border border-primary/40 relative overflow-hidden group hover:bg-[#1e293b]/70 cursor-pointer glow-primary transition-all duration-300 flex flex-col gap-3"
          >
            {/* Edge Color Decor */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 text-center font-display text-2xl font-black text-primary">{myRank}</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-950 border border-primary/40 overflow-hidden shrink-0">
                    <img 
                      alt={userProfile.name} 
                      className="w-full h-full object-cover" 
                      src={userProfile.avatar} 
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 leading-none">
                      <span>{userProfile.name} (You)</span>
                    </div>
                    <div className="font-mono text-[9px] text-primary tracking-wide uppercase mt-1 leading-none font-bold">
                      Level {userProfile.level} • {userProfile.title}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block leading-none">
                  <div className="font-mono text-[9px] text-gray-500 mb-1 leading-none uppercase tracking-wider">Score</div>
                  <div className="font-mono text-sm font-bold text-secondary text-glow-cyan leading-none">
                    {totalXp > 0 ? (totalXp / 146).toFixed(1) : '0.0'}
                  </div>
                </div>
                <div className="text-right leading-none">
                  <div className="font-mono text-[9px] text-gray-500 mb-1 leading-none uppercase tracking-wider">Total XP</div>
                  <div className="font-display text-lg font-black text-white leading-none">
                    {totalXp.toLocaleString()}
                  </div>
                </div>
                <button className="p-1 rounded-full hover:bg-white/5 transition-colors text-gray-400">
                  <span className="material-symbols-outlined text-lg leading-none transform transition-transform duration-300">
                    {expandedPosition ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick expandable detail view inside the sticky position footer */}
            {expandedPosition && (
              <div className="pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-gray-950/40">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Current Rank</span>
                  <span className="text-white font-bold">#{myRank}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-950/40">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Current Level</span>
                  <span className="text-green-400 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px] leading-none">upgrade</span> Lv. {userProfile.level}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-950/40">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">XP to Level Up</span>
                  <span className="text-secondary font-bold">{(userProfile.xpToNextLevel - userProfile.currentXp).toLocaleString()} XP</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-950/40">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Title</span>
                  <span className="text-[#efc200] font-bold">{userProfile.title}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
