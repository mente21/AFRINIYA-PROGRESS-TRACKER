import React, { useState, useEffect } from 'react';
import { Award, AwardClaim, PeriodWinner, Badge, UserProfile, Profile } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal, { ConfirmActionData } from './ConfirmModal';

interface AwardsViewProps {
  awards: Award[];
  setAwards: React.Dispatch<React.SetStateAction<Award[]>>;
  awardClaims?: AwardClaim[];
  teamMembers?: Profile[];
  periodWinners: PeriodWinner[];
  currentPeriodLeaders?: Record<string, PeriodWinner | null>;
  badges: Badge[];
  totalXp: number;
  userProfile: UserProfile;
  currentUserId?: string;
  memberXpMap?: Record<string, number>;
  onOpenAddAward?: () => void;
  onEditAward?: (award: Award) => void;
  onDeleteAward?: (awardId: string) => void;
  onClaimAward?: (award: Award) => void;
}

export default function AwardsView({
  awards,
  setAwards,
  awardClaims = [],
  teamMembers = [],
  periodWinners,
  currentPeriodLeaders = {},
  badges,
  totalXp,
  userProfile,
  currentUserId,
  memberXpMap = {},
  onOpenAddAward,
  onEditAward,
  onDeleteAward,
  onClaimAward,
}: AwardsViewProps) {
  const [activeTab, setActiveTab] = useState<'awards' | 'badges' | 'winners'>('awards');
  const [confirmAction, setConfirmAction] = useState<ConfirmActionData | null>(null);
  const [awardLeaderboards, setAwardLeaderboards] = useState<Record<string, { userId: string; xpGained: number }[]>>({});

  useEffect(() => {
    const fetchLeaderboards = async () => {
      const newLeaderboards: Record<string, { userId: string; xpGained: number }[]> = {};
      
      for (const award of awards) {
        if (!award.createdAt) continue;
        
        const { data, error } = await supabase
          .from('xp_events')
          .select('user_id, amount')
          .gte('created_at', award.createdAt)
          .lte('created_at', award.deadline);

        if (error || !data) continue;

        const userXp: Record<string, number> = {};
        for (const event of data) {
          userXp[event.user_id] = (userXp[event.user_id] || 0) + event.amount;
        }

        const sorted = Object.entries(userXp)
          .map(([userId, xpGained]) => ({ userId, xpGained }))
          .sort((a, b) => b.xpGained - a.xpGained);

        newLeaderboards[award.id] = sorted;
      }
      setAwardLeaderboards(newLeaderboards);
    };

    if (awards.length > 0 && activeTab === 'awards') {
      fetchLeaderboards();
    }
  }, [awards, activeTab]);

  const handleClaimAward = (award: Award) => {
    if (onClaimAward) {
      onClaimAward(award);
    } else {
      setAwards(prev => prev.map(a =>
        a.id === award.id ? { ...a, achieved: true, claimedAt: new Date().toISOString() } : a
      ));
    }
  };

  const getOwnerXp = (award: Award) => {
    if (award.userId && memberXpMap[award.userId] !== undefined) {
      return memberXpMap[award.userId];
    }
    if (award.userId === currentUserId || !award.userId) return totalXp;
    return 0;
  };

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const periodColors: Record<string, string> = {
    daily: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    weekly: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    monthly: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    yearly: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  };

  const periodIcons: Record<string, string> = {
    daily: 'today',
    weekly: 'date_range',
    monthly: 'calendar_month',
    yearly: 'event',
  };

  const badgeColorMap: Record<string, string> = {
    primary: 'text-primary shadow-[0_0_15px_rgba(221,183,255,0.4)]',
    secondary: 'text-secondary shadow-[0_0_15px_rgba(76,215,246,0.4)]',
    tertiary: 'text-yellow-400 shadow-[0_0_15px_rgba(239,194,0,0.4)]',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Awards & Badges</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">See all team awards — achieve and claim them independently.</p>
        </div>
        {activeTab === 'awards' && (
          <button onClick={onOpenAddAward}
            className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Award
          </button>
        )}
      </header>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-[#131b2e] rounded-xl border border-white/5 w-fit">
        {([
          { key: 'awards', label: 'Team Awards', icon: 'emoji_events' },
          { key: 'badges', label: 'Badges', icon: 'military_tech' },
          { key: 'winners', label: 'Period Winners', icon: 'leaderboard' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === t.key ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ─── AWARDS ─── */}
        {activeTab === 'awards' && (
          <motion.div key="awards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {awards.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 flex flex-col items-center text-center gap-4">
                <span className="material-symbols-outlined text-5xl text-gray-600">emoji_events</span>
                <div>
                  <p className="font-display font-bold text-white">No awards yet</p>
                  <p className="font-sans text-sm text-gray-400 mt-1">Add a personal award — visible to the team, managed by you.</p>
                </div>
                <button onClick={onOpenAddAward}
                  className="px-6 py-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition-all">
                  + Add Your First Award
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {awards.map(award => {
                  const isClaimedByMe = !!awardClaims?.some(c => c.awardId === award.id && c.userId === currentUserId);
                  const claimInfo = awardClaims?.find(c => c.awardId === award.id && c.userId === currentUserId);
                  
                  const isOwn = !award.userId || award.userId === currentUserId;
                  const daysLeft = getDaysLeft(award.deadline);
                  const expired = daysLeft < 0;
                  const leaderboard = awardLeaderboards[award.id] || [];
                  const winner = leaderboard[0];
                  const amIWinner = winner?.userId === currentUserId;
                  const canClaim = expired && !isClaimedByMe && amIWinner;
                  const claimsForThisAward = awardClaims?.filter(c => c.awardId === award.id) || [];

                  return (
                    <motion.div key={award.id} layout
                      className={`glass-panel rounded-2xl p-5 relative overflow-hidden group ${
                        isClaimedByMe ? 'border border-green-500/20 bg-green-500/5' :
                        expired ? 'border border-red-500/20 opacity-70' :
                        isOwn ? 'border border-yellow-500/10 hover:border-yellow-500/25 transition-all' :
                        'border border-white/5 opacity-90'
                      }`}
                    >
                      {/* Background glow */}
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isClaimedByMe ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1", color: isClaimedByMe ? '#4ade80' : '#eab308' }}>
                              {isClaimedByMe ? 'workspace_premium' : 'emoji_events'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-sm text-white">{award.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {isOwn ? (
                                <span className="font-mono text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[9px]">person</span> Created by you
                                </span>
                              ) : award.ownerName ? (
                                <span className="font-mono text-[8px] bg-gray-800/60 text-gray-400 border border-gray-700/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[9px]">person</span> Created by {award.ownerName}
                                </span>
                              ) : null}
                            </div>
                            {award.description && <p className="font-sans text-xs text-gray-400 mt-1">{award.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 shrink-0">
                          {isOwn && !isClaimedByMe && onEditAward && (
                            <button
                              onClick={() => onEditAward(award)}
                              className="p-1.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-primary border border-white/5 transition-all"
                              title="Edit award"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                          )}
                          {isOwn && onDeleteAward && (
                            <button
                              onClick={() => setConfirmAction({
                                title: 'Delete Award',
                                message: `Remove "${award.title}"? This cannot be undone.`,
                                icon: 'delete',
                                color: 'text-red-400',
                                confirmText: 'Delete',
                                onConfirm: () => onDeleteAward(award.id),
                              })}
                              className="p-1.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-red-400 border border-white/5 transition-all"
                              title="Delete award"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          )}
                          {isClaimedByMe && (
                            <span className="font-mono text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">CLAIMED ✓</span>
                          )}
                          {expired && !isClaimedByMe && (
                            <span className="font-mono text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>
                          )}
                        </div>
                      </div>

                      {/* Competition Leaderboard */}
                      <div className="space-y-2 mb-4 bg-[#0b1326]/50 rounded-xl p-3 border border-white/5">
                        <div className="flex justify-between font-mono text-[10px] mb-2">
                          <span className="text-gray-400">Competition Leaderboard</span>
                          <span className="text-yellow-400 font-bold tracking-wider">
                            {award.xpReward && award.xpReward > 0 ? `REWARD: ${award.xpReward.toLocaleString()} XP` : 'REWARD: Prestige'}
                          </span>
                        </div>
                        
                        {leaderboard.length === 0 ? (
                          <div className="text-center font-mono text-[9px] text-gray-600 py-2">No XP gained yet</div>
                        ) : (
                          <div className="space-y-1.5">
                            {leaderboard.slice(0, 3).map((entry, idx) => {
                              const member = teamMembers?.find(m => m.id === entry.userId);
                              const isMe = entry.userId === currentUserId;
                              // Use member's total_xp if available, otherwise use xpGained from events
                              const displayXp = member?.total_xp !== undefined ? member.total_xp : entry.xpGained;
                              return (
                                <div key={entry.userId} className={`flex justify-between items-center text-[10px] font-mono px-2 py-1 rounded ${isMe ? 'bg-primary/10 border border-primary/20' : ''}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`}>#{idx + 1}</span>
                                    <span className={isMe ? 'text-primary font-bold' : 'text-gray-300'}>{member?.name || 'Unknown'} {isMe && '(You)'}</span>
                                  </div>
                                  <span className="text-white font-bold">{displayXp.toLocaleString()} XP</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="flex justify-between items-center">
                        <div className={`flex items-center gap-1.5 font-mono text-[10px] ${expired ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-gray-400'}`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {expired ? 'Competition Ended' :
                            daysLeft === 0 ? 'Ends today!' :
                            `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </div>
                        {canClaim && (
                          <button onClick={() => handleClaimAward(award)}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 text-yellow-950 font-mono text-[9px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-yellow-500/20 animate-pulse">
                            {award.xpReward && award.xpReward > 0 ? `Claim ${award.xpReward.toLocaleString()} XP!` : 'Claim Award!'}
                          </button>
                        )}
                        {!canClaim && expired && isClaimedByMe && (
                          <span className="font-mono text-[9px] text-green-400 border border-green-500/20 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">Reward Claimed</span>
                        )}
                        {!canClaim && expired && !amIWinner && leaderboard.length > 0 && (
                          <span className="font-mono text-[9px] text-gray-500">Winner: {teamMembers?.find(m => m.id === winner?.userId)?.name || 'Unknown'}</span>
                        )}
                      </div>

                      {/* Claimant List */}
                      {claimsForThisAward.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[9px] text-gray-500">Achieved by:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {claimsForThisAward.map(c => {
                              const member = teamMembers?.find(m => m.id === c.userId);
                              if (!member) return null;
                              return member.avatar ? (
                                <img
                                  key={c.id}
                                  src={member.avatar}
                                  alt={member.name}
                                  title={`${member.name} claimed on ${new Date(c.claimedAt).toLocaleDateString()}`}
                                  className="w-5 h-5 rounded-full border border-gray-900 object-cover"
                                />
                              ) : (
                                <div
                                  key={c.id}
                                  title={`${member.name} claimed on ${new Date(c.claimedAt).toLocaleDateString()}`}
                                  className="w-5 h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center font-mono text-[7px] font-bold text-white"
                                >
                                  {member.name.slice(0, 2).toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── BADGES ─── */}
        {activeTab === 'badges' && (
          <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 glass-panel rounded-2xl p-4 flex items-center gap-4">
              <div className="text-center">
                <div className="font-display text-2xl font-black text-white">{badges.filter(b => b.unlockedAt).length}</div>
                <div className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">Earned</div>
              </div>
              <div className="h-10 w-px bg-gray-800" />
              <div className="text-center">
                <div className="font-display text-2xl font-black text-white">{badges.length}</div>
                <div className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">Total</div>
              </div>
              <div className="h-10 w-px bg-gray-800" />
              <div className="flex-1">
                <div className="font-mono text-[9px] text-gray-400 uppercase tracking-wider mb-1">Your Total XP</div>
                <div className="font-display text-xl font-bold text-primary">{totalXp.toLocaleString()} XP</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map(badge => {
                const earned = !!badge.unlockedAt;
                const pct = Math.min(100, Math.round((totalXp / badge.xpRequired) * 100));
                const colorCls = badgeColorMap[badge.color] || badgeColorMap.primary;

                return (
                  <motion.div key={badge.id} layout
                    className={`glass-panel rounded-2xl p-5 text-center relative overflow-hidden transition-all ${
                      earned ? `border border-${badge.color === 'primary' ? 'primary' : badge.color === 'secondary' ? 'secondary' : 'yellow-400'}/30` : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
                    }`}
                  >
                    {earned && <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.03] pointer-events-none" />}

                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 ${earned ? 'bg-gray-900 border border-white/10' : 'bg-gray-900/50 border border-white/5'}`}>
                      <span className={`material-symbols-outlined text-3xl ${earned ? colorCls : 'text-gray-600'}`}
                        style={{ fontVariationSettings: earned ? "'FILL' 1" : "'FILL' 0" }}>
                        {badge.icon}
                      </span>
                    </div>

                    <h3 className={`font-display font-bold text-sm ${earned ? 'text-white' : 'text-gray-500'}`}>{badge.name}</h3>
                    <p className="font-sans text-[11px] text-gray-400 mt-1 leading-relaxed">{badge.description}</p>

                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          badge.color === 'primary' ? 'bg-primary' :
                          badge.color === 'secondary' ? 'bg-secondary' : 'bg-yellow-400'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="font-mono text-[9px] text-gray-500">{earned ? '✓ Earned!' : `${totalXp.toLocaleString()} / ${badge.xpRequired.toLocaleString()} XP`}</div>
                    </div>

                    {earned && badge.unlockedAt && (
                      <div className="mt-2 font-mono text-[9px] text-gray-500">
                        {new Date(badge.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── PERIOD WINNERS ─── */}
        {activeTab === 'winners' && (
          <motion.div key="winners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(period => {
                const winners = periodWinners.filter(w => w.period === period);
                const latest = winners[winners.length - 1];
                const leading = currentPeriodLeaders[period];
                const display = latest || leading;

                return (
                  <div key={period} className={`glass-panel rounded-2xl p-4 text-center border ${periodColors[period]?.split(' ')[2] || 'border-white/5'}`}>
                    <div className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-3 ${periodColors[period]}`}>
                      <span className="material-symbols-outlined text-[11px]">{periodIcons[period]}</span>
                      {period} {display?.isLeading ? 'leader' : 'winner'}
                    </div>
                    {display ? (
                      <>
                        {display.avatar ? (
                          <img src={display.avatar} alt={display.name} className="w-12 h-12 rounded-full border border-white/10 mx-auto mb-2 object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-800 border border-white/10 mx-auto mb-2 flex items-center justify-center font-mono text-sm font-bold text-gray-300">
                            {display.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <p className="font-display font-bold text-sm text-white">{display.name}</p>
                        <p className="font-mono text-[10px] text-primary font-bold mt-0.5">{display.xp.toLocaleString()} XP</p>
                        <p className="font-mono text-[9px] text-gray-500 mt-1">
                          {display.isLeading ? 'Leading this period' : new Date(display.date).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <div className="py-4">
                        <span className="material-symbols-outlined text-2xl text-gray-600 block mb-1">emoji_events</span>
                        <p className="font-mono text-[10px] text-gray-600">No winner yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {periodWinners.length > 0 && (
              <div className="glass-panel rounded-2xl p-5">
                <h3 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">history</span>
                  Winner History
                </h3>
                <div className="space-y-3">
                  {[...periodWinners].reverse().map(w => (
                    <div key={w.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      {w.avatar ? (
                        <img src={w.avatar} alt={w.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-mono text-[10px] font-bold text-gray-300 shrink-0">
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-display font-semibold text-xs text-white">{w.name}</p>
                        <p className="font-mono text-[9px] text-gray-500">{new Date(w.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${periodColors[w.period]}`}>
                        {w.period}
                      </span>
                      <span className="font-mono text-[10px] text-primary font-bold">{w.xp.toLocaleString()} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {periodWinners.length === 0 && !Object.values(currentPeriodLeaders).some(Boolean) && (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-600 block mb-3">leaderboard</span>
                <p className="font-display font-bold text-white">No winners recorded yet</p>
                <p className="font-sans text-sm text-gray-400 mt-1">Earn XP from tasks and habits to become the period leader. Past winners are saved automatically.</p>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      <ConfirmModal action={confirmAction} onClose={() => setConfirmAction(null)} />
    </div>
  );
}

// Trigger TS Service reload

