import React, { useState } from 'react';
import { UserProfile, FeedItem, GoldenGoal, Badge, Habit } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  feed: FeedItem[];
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  onChangeTab: (tab: any) => void;
  goldenGoal: GoldenGoal | null;
  onEditGoldenGoal?: () => void;
  badges: Badge[];
  habits: Habit[];
}

export default function DashboardView({
  userProfile,
  setUserProfile,
  totalXp,
  setTotalXp,
  feed,
  setFeed,
  onChangeTab,
  goldenGoal,
  onEditGoldenGoal,
  badges,
  habits,
}: DashboardViewProps) {
  const [retaliatingId, setRetaliatingId] = useState<string | null>(null);
  const [retaliationStatus, setRetaliationStatus] = useState<string>('');

  const handleRetaliate = (itemId: string) => {
    setRetaliatingId(itemId);
    setRetaliationStatus('Starting comeback...');
    setTimeout(() => setRetaliationStatus('Boosting productivity score...'), 1000);
    setTimeout(() => setRetaliationStatus('Counter-attack underway...'), 2200);
    setTimeout(() => {
      setTotalXp(prev => prev + 450);
      setUserProfile(prev => ({ ...prev, productivityScore: Math.min(100, prev.productivityScore + 4) }));
      setFeed(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, retaliated: true, title: 'Sarah J. surpassed you (You Responded!)', description: 'You launched a focus streak, earning +450 XP!' }
          : item
      ));
      setRetaliatingId(null); setRetaliationStatus('');
    }, 3500);
  };

  const earnedBadges = badges.filter(b => b.unlockedAt);
  const nextBadge = badges.find(b => !b.unlockedAt && totalXp < b.xpRequired);

  const badgeColorMap: Record<string, string> = {
    primary: 'text-primary', secondary: 'text-secondary', tertiary: 'text-yellow-400',
  };

  return (
    <div className="space-y-6">

      {/* ─── GOLDEN GOAL BANNER ─── */}
      {goldenGoal ? (
        <section
          className="glass-panel rounded-2xl p-5 border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent relative overflow-hidden group cursor-pointer"
          onClick={onEditGoldenGoal}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />
          <div className="flex items-start justify-between gap-4 z-10 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div className="flex-1">
                <p className="font-mono text-[9px] text-yellow-400/70 uppercase tracking-widest mb-0.5 font-bold">My Big Dream Goal</p>
                <h2 className="font-display text-lg font-extrabold text-white">{goldenGoal.title}</h2>
                {goldenGoal.description && <p className="font-sans text-xs text-gray-400 mt-1">{goldenGoal.description}</p>}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full"
                      style={{ width: `${goldenGoal.progress}%` }}
                      initial={{ width: 0 }} animate={{ width: `${goldenGoal.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-yellow-400 font-bold shrink-0">{goldenGoal.progress}%</span>
                </div>
                {goldenGoal.targetDate && (
                  <p className="font-mono text-[9px] text-gray-500 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                    Target: {new Date(goldenGoal.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <button className="shrink-0 p-1.5 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
        </section>
      ) : (
        <button onClick={onEditGoldenGoal}
          className="w-full glass-panel rounded-2xl p-5 border border-dashed border-yellow-500/20 hover:border-yellow-500/40 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl border border-dashed border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-500/60 transition-colors">
            <span className="material-symbols-outlined text-2xl text-yellow-600 group-hover:text-yellow-400 transition-colors">star</span>
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-sm text-gray-300 group-hover:text-white transition-colors">Set Your Big Dream Goal</p>
            <p className="font-sans text-xs text-gray-500 mt-0.5">Define the one goal that drives everything you do</p>
          </div>
          <span className="material-symbols-outlined text-gray-600 ml-auto">arrow_forward</span>
        </button>
      )}

      {/* ─── STATS HEADER ─── */}
      <header className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Productivity Score */}
        <div className="glass-panel rounded-xl p-5 md:col-span-2 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
          <div className="z-10">
            <h3 className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-1">Productivity Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(76,215,246,0.5)]">
                {userProfile.productivityScore}
              </span>
              <span className="font-display text-lg text-secondary">/100</span>
            </div>
            <p className="font-mono text-[11px] text-secondary mt-3 flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-xs">trending_up</span> Top 5% Globally
            </p>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.2" />
              <path className="text-secondary transition-all duration-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${userProfile.productivityScore}, 100`} strokeWidth="3.2" />
            </svg>
            <span className="material-symbols-outlined absolute text-secondary text-3xl animate-pulse">bolt</span>
          </div>
        </div>

        {/* Level / XP bar */}
        <div className="glass-panel rounded-xl p-5 md:col-span-3 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="flex justify-between items-end mb-4 z-10">
            <div>
              <h3 className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-1">Level Progress</h3>
              <div className="font-display text-2xl font-black text-white">
                Level {userProfile.level} <span className="text-sm text-gray-400 font-normal">· {userProfile.title}</span>
              </div>
            </div>
            <div className="bg-primary/15 text-primary px-2.5 py-1 rounded-md font-mono text-[10px] border border-primary/20 flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-xs">local_fire_department</span> {totalXp.toLocaleString()} XP
            </div>
          </div>
          <div className="space-y-2 z-10">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-gray-400">To next level</span>
              <span className="text-primary font-bold">{userProfile.currentXp} / {userProfile.xpToNextLevel} XP</span>
            </div>
            <div className="h-3.5 w-full bg-gray-800 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div className="h-full xp-gradient rounded-full relative"
                style={{ width: `${(userProfile.currentXp / userProfile.xpToNextLevel) * 100}%` }}
                layout transition={{ type: 'spring', stiffness: 80 }}>
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm mix-blend-overlay" />
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── BADGES ROW ─── */}
      {(earnedBadges.length > 0 || nextBadge) && (
        <section className="glass-panel rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">military_tech</span>
              Your Badges
            </h3>
            <button onClick={() => onChangeTab('awards')}
              className="text-secondary font-mono text-[10px] tracking-wider font-bold hover:text-cyan-200 uppercase">
              View All
            </button>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {earnedBadges.slice(0, 5).map(badge => (
              <div key={badge.id} className="flex flex-col items-center gap-1 shrink-0 group/badge">
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center hover:border-primary/30 transition-all">
                  <span className={`material-symbols-outlined text-xl ${badgeColorMap[badge.color] || 'text-primary'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                </div>
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-wide text-center">{badge.name}</span>
              </div>
            ))}
            {nextBadge && (
              <div className="flex flex-col items-center gap-1 shrink-0 opacity-40">
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-dashed border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-gray-600">{nextBadge.icon}</span>
                </div>
                <span className="font-mono text-[8px] text-gray-600 uppercase tracking-wide text-center">{nextBadge.name}</span>
                <span className="font-mono text-[7px] text-gray-700">{nextBadge.xpRequired.toLocaleString()} XP</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── MAIN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Activity Feed */}
          <section className="space-y-3">
            <h2 className="font-display text-[18px] font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">diversity_3</span>
              Activity Feed
            </h2>
            <div className="glass-panel rounded-xl p-4 divide-y divide-gray-800">
              {feed.slice(0, 6).map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  {item.avatar ? (
                    <img alt="User" className="w-10 h-10 rounded-full border border-gray-700 shrink-0 object-cover mt-1" src={item.avatar} />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 mt-1 ${
                      item.type === 'achievement' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/10 border-secondary/20 text-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {item.type === 'achievement' ? 'military_tech' : 'swords'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-white leading-snug">
                      {item.type === 'achievement' && <span className="font-semibold text-primary">Achievement: </span>}
                      <span className="text-gray-300 font-medium">{item.title}</span>
                    </p>
                    <p className="font-sans text-xs text-gray-400 mt-1">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">{item.timeAgo}</span>
                      {item.type === 'surpassed' && !item.retaliated && (
                        <button onClick={() => handleRetaliate(item.id)} disabled={retaliatingId !== null}
                          className="px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase border border-red-500 text-red-400 hover:bg-red-950/20 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50">
                          <span className="material-symbols-outlined text-xs">local_fire_department</span>
                          Respond
                        </button>
                      )}
                    </div>
                    {retaliatingId === item.id && (
                      <div className="mt-3 p-3 rounded-lg border border-red-900/45 bg-[#0e0712] font-mono text-[10px] text-red-400 animate-pulse">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                          <span>{retaliationStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Streak widget */}
          <section className="glass-panel rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
            <h3 className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              Active Streaks
            </h3>
            <div className="mb-4">
              <div className="font-display text-4xl font-extrabold text-white">
                {habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}
              </div>
              <div className="text-xs text-gray-400 font-sans mt-0.5">Day streak active</div>
            </div>
            <div className="flex justify-between gap-1.5 p-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, idx) => {
                const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0 = Mon, 6 = Sun
                const isToday = idx === currentDayIndex;
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-full aspect-square max-w-[36px] rounded-lg border flex items-center justify-center transition-all ${
                      isToday ? 'border-primary bg-gray-900' : 'border-gray-800 text-gray-600'
                    }`}>
                      {isToday ? <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" /> :
                      <span className="text-[10px] font-bold text-gray-600">·</span>}
                    </div>
                    <span className={`font-mono text-[10px] font-bold ${isToday ? 'text-primary' : 'text-gray-500'}`}>{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick stats */}
          <section className="glass-panel rounded-xl p-5">
            <h3 className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs text-gray-400">Total XP Earned</span>
                <span className="font-mono text-xs text-primary font-bold">{totalXp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs text-gray-400">Level</span>
                <span className="font-mono text-xs text-white font-bold">{userProfile.level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs text-gray-400">Badges Earned</span>
                <span className="font-mono text-xs text-yellow-400 font-bold">{earnedBadges.length} / {badges.length}</span>
              </div>
              <div className="h-px bg-gray-800" />
              <button onClick={() => onChangeTab('analytics')}
                className="w-full text-center font-mono text-[10px] text-secondary hover:text-cyan-200 font-bold uppercase tracking-wider transition-colors">
                View Full Analytics →
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
