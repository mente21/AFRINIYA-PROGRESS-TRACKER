import React, { useState } from 'react';
import { TeamQuestCampaign, UserProfile, FeedItem, LeaderboardUser } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LeaderboardView from './LeaderboardView';

interface TeamQuestsViewProps {
  userProfile: UserProfile;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  teamCampaigns: TeamQuestCampaign[];
  setTeamCampaigns: React.Dispatch<React.SetStateAction<TeamQuestCampaign[]>>;
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  onLevelUpCheck: (xpAwarded: number) => void;
  leaderboard: LeaderboardUser[];
  currentUserId?: string;
}

export default function TeamQuestsView({
  userProfile,
  totalXp,
  setTotalXp,
  teamCampaigns,
  setTeamCampaigns,
  setFeed,
  onLevelUpCheck,
  leaderboard,
  currentUserId,
}: TeamQuestsViewProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'rankings' | 'campaigns'>('rankings');

  // Rewards list status mapping
  const rewardsLimitPrereqs = [
    { id: 'r1', title: 'Golden Innovator Badge', targetXp: 15000, icon: 'diamond', color: 'text-tertiary', desc: 'Unlock elite golden profile border frames.' },
    { id: 'r2', title: '1.5x Global Multiplier', targetXp: 10000, icon: 'electric_bolt', color: 'text-primary', desc: 'Accelerates all completed habit XP nodes.' },
    { id: 'r3', title: 'Neon Avatar Frame Group', targetXp: 20000, icon: 'palette', color: 'text-secondary', desc: 'Glows in team dashboard roster listings.' }
  ];

  const handleJoinCampaign = (campaignId: string) => {
    setTeamCampaigns(prev => prev.map(tc => {
      if (tc.id === campaignId) {
        if (!tc.joined) {
          // Joined quest! Move progress line
          const newProgress = Math.min(100, tc.progress + 15);
          
          setFeed(prevFeed => [
            {
              id: `f_campaign_j_${Date.now()}`,
              type: 'challenge',
              title: `Joined Campaign: "${tc.title}"`,
              description: `Operative locked in. Contributing coordinates towards the +${tc.xpReward} XP multiplier reward.`,
              timeAgo: 'Just now'
            },
            ...prevFeed
          ]);
          
          return {
            ...tc,
            joined: true,
            progress: newProgress,
            progressLabel: tc.progressLabel.includes('/') 
              ? `PRs Merged: ${parseInt(tc.progressLabel.split('/')[1]?.trim()?.split(' ')[0] || '42') + 5} / 50`
              : 'Phase 3 of 4 (Contributing)'
          };
        }
      }
      return tc;
    }));
  };

  const handleContributeQuest = (campaignId: string, rewardXp: number, completionMultiplier: number) => {
    setTeamCampaigns(prev => prev.map(tc => {
      if (tc.id === campaignId) {
        const addedProgress = 10;
        const newProgress = Math.min(100, tc.progress + addedProgress);
        const didComplete = newProgress >= 100;

        if (didComplete) {
          onLevelUpCheck(rewardXp);
          setTotalXp(v => v + rewardXp);
          alert(`MISSION ACCOMPLISHED! Commander, your squad successfully cleared "${tc.title}". +${rewardXp} XP successfully synchronized across terminal databases!`);
        } else {
          // Contributed partial XP
          setTotalXp(v => v + 150);
          onLevelUpCheck(150);
        }

        return {
          ...tc,
          progress: newProgress,
          progressLabel: didComplete ? '100% COMPLETE' : `Contributing: ${newProgress}%`
        };
      }
      return tc;
    }));
  };

  const handleClaimBadge = (title: string) => {
    alert(`OPERATIVE CLEARANCE GRANTED: "${title}" added to your Achievements database inventory successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Team Hub</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">Compete on the global cooperative roster or conquer group directives.</p>
        </div>

        <div className="flex items-center gap-2.5 bg-[#171f33]/80 border border-white/5 px-4 py-2 rounded-xl shrink-0">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="font-display font-semibold text-white">{totalXp.toLocaleString()} XP</span>
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest ml-1">Team Total</span>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#1e293b] pb-2 space-x-6 items-center select-none pt-2">
        <button
          onClick={() => setSubTab('rankings')}
          className={`font-display text-sm font-bold tracking-tight pb-2.5 relative transition-colors ${
            subTab === 'rankings' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Global Rankings</span>
          {subTab === 'rankings' && (
            <motion.div 
              layoutId="teamHubUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => setSubTab('campaigns')}
          className={`font-display text-sm font-bold tracking-tight pb-2.5 relative transition-colors ${
            subTab === 'campaigns' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Co-op Campaigns</span>
          {subTab === 'campaigns' && (
            <motion.div 
              layoutId="teamHubUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'rankings' ? (
          <motion.div
            key="rankings_subview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <LeaderboardView 
              userProfile={userProfile}
              leaderboard={leaderboard}
              totalXp={totalXp}
              currentUserId={currentUserId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="campaigns_subview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Side: Active Campaigns (Col-8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Daily Directive */}
              <section className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <h2 className="text-secondary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs">schedule</span> Daily Directive
                  </h2>
                  <span className="text-gray-500 uppercase tracking-widest">Resets in 14:10:05</span>
                </div>

                {/* Daily Directive Card */}
                <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-secondary hover:bg-[#1e293b]/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  <div className="flex items-start gap-4 z-10">
                    <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
                      <span className="material-symbols-outlined text-lg">forum</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[#dae2fd] text-base leading-tight">Inbox Zero Protocol</h3>
                      <p className="font-sans text-xs text-gray-400 mt-1.5">Clear all pending team support tickets before EOD.</p>
                    </div>
                  </div>

                  <div className="space-y-2 z-10 w-full md:w-auto md:min-w-[180px]">
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-gray-500">Progress Limit</span>
                      <span className="text-secondary font-bold">34 / 50 Tickets</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full shadow-[0_0_8px_#4cd7f6]" style={{ width: '68%' }}></div>
                    </div>
                    {/* Clickable daily contribution handle */}
                    <button 
                      onClick={() => alert("Transmitted operational clearance approvals for 5 tickets! XP synchronized +50.")}
                      className="w-full text-right font-mono text-[9px] font-bold text-gray-400 hover:text-white uppercase tracking-wider block mt-1"
                    >
                      Manage Tickets • +150 XP
                    </button>
                  </div>
                </div>
              </section>

              {/* Active Campaigns List */}
              <section className="space-y-3">
                <h2 className="text-primary font-mono text-[10px] tracking-wider uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  Active Campaigns
                </h2>

                <div className="space-y-4">
                  {teamCampaigns.map((tc) => {
                    const isEpic = tc.tier === 'EPIC';
                    const isRare = tc.tier === 'RARE';
                    const tierColor = isEpic ? 'text-[#efc200] border-amber-500/20 bg-amber-500/5' : isRare ? 'text-primary border-primary/25 bg-primary/5' : 'text-secondary border-secondary/20 bg-secondary/5';
                    const accentBorderClass = isEpic ? 'tier-epic border-l-2' : isRare ? 'tier-rare border-l-2' : 'tier-common border-l-2';

                    return (
                      <div 
                        key={tc.id}
                        className={`glass-panel rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group transition-all duration-300 ${accentBorderClass}`}
                      >
                        {/* Glow and details container anchors */}
                        <div className="flex justify-between items-start z-10">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border flex items-center gap-1 ${tierColor}`}>
                              <span className="material-symbols-outlined text-[11px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {isEpic ? 'stars' : isRare ? 'token' : 'shield'}
                              </span>
                              <span>{tc.tier}</span>
                            </div>
                            <div className="font-mono text-[9px] text-gray-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">timer</span>
                              <span>{tc.timeLeft}</span>
                            </div>
                          </div>

                          <div className={`font-display text-sm font-extrabold ${isEpic ? 'text-tertiary' : isRare ? 'text-primary' : 'text-secondary'}`}>
                            +{tc.xpReward} XP
                          </div>
                        </div>

                        <div className="z-10">
                          <h3 className="font-display font-semibold text-lg text-white group-hover:text-primary transition-colors leading-tight">{tc.title}</h3>
                          <p className="font-sans text-xs text-gray-400 mt-2 leading-relaxed">{tc.description}</p>
                        </div>

                        {/* Progress tracking bars */}
                        <div className="space-y-2 mt-1 z-10">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-gray-300 font-bold">{tc.progressLabel}</span>
                            <span className={isEpic ? 'text-tertiary font-bold' : 'text-secondary font-bold'}>{tc.progress}% Complete</span>
                          </div>
                          <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden p-0.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 relative ${
                                isEpic ? 'bg-tertiary shadow-[0_0_12px_#efc200]' : 'xp-bar-fill'
                              }`} 
                              style={{ width: `${tc.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Action Hubs and Squadd Members */}
                        <div className="flex justify-between items-center z-10 pt-3 border-t border-white/5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {tc.avatars.map((v, idx) => (
                              <img 
                                key={idx}
                                alt="Squad mate avatar" 
                                className="w-7 h-7 rounded-full border border-gray-950 object-cover shrink-0" 
                                src={v} 
                              />
                            ))}
                            {tc.avatars.length > 0 && (
                              <div className="w-7 h-7 rounded-full border border-gray-950 bg-gray-800 flex items-center justify-center font-mono text-[9px] text-gray-400 font-bold">
                                +3
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Interactive Contribution Buttons */}
                            {tc.joined ? (
                              <button 
                                onClick={() => handleContributeQuest(tc.id, tc.xpReward, tc.progress)}
                                className={`px-3.5 py-1.5 rounded font-mono text-[10px] font-bold transition-all duration-300 ${
                                  isEpic ? 'bg-amber-600/10 border border-[#efc200] text-tertiary' : 'bg-primary/10 border border-primary/40 text-primary'
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs align-middle mr-1">bolt</span>
                                Contribute Sprint Node
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleJoinCampaign(tc.id)}
                                className="px-3.5 py-1.5 rounded bg-gray-900 border border-white/10 font-mono text-[10px] font-bold text-gray-300 hover:border-primary hover:text-primary transition-all"
                              >
                                Join Objective
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>

            {/* Right Side: Available Rewards Panel + Mini triumphs (Col-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Rewards claim panel */}
              <div className="glass-panel rounded-xl p-4">
                <h2 className="font-mono text-[9px] text-gray-400 tracking-wider uppercase flex items-center gap-1 pb-2.5 border-b border-white/5 mb-4 font-bold">
                  <span className="material-symbols-outlined text-sm text-[#efc200]">military_tech</span>
                  Available Rewards
                </h2>

                <div className="space-y-4">
                  {rewardsLimitPrereqs.map((reward) => {
                    const targetMet = totalXp >= reward.targetXp;
                    const remainingXp = reward.targetXp - totalXp;

                    return (
                      <div key={reward.id} className="flex gap-3 items-center group">
                        <div className="w-11 h-11 rounded-lg bg-gray-950 border border-white/5 flex items-center justify-center relative overflow-hidden shrink-0">
                          <div className={`absolute inset-0 bg-[#efc200]/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                          <span className={`material-symbols-outlined text-xl group-hover:scale-115 transition-transform ${reward.color}`}>
                            {reward.icon}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-display font-semibold text-xs text-white leading-tight">{reward.title}</h4>
                          {targetMet ? (
                            <button 
                              onClick={() => handleClaimBadge(reward.title)}
                              className="mt-1 font-mono text-[9px] font-extrabold text-green-400 flex items-center gap-0.5 hover:text-green-300"
                            >
                              <span className="material-symbols-outlined text-[11px]">download_done</span>
                              CLAIM UNLOCKED RANGE
                            </button>
                          ) : (
                            <p className="font-mono text-[9px] text-gray-500 mt-1 uppercase tracking-wider">
                              Requires {reward.targetXp.toLocaleString()} XP ({remainingXp.toLocaleString()} left)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mini triumphal log feeds */}
              <div className="glass-panel rounded-xl p-4">
                <h2 className="font-mono text-[9px] text-gray-400 tracking-wider uppercase flex items-center gap-1 pb-2.5 border-b border-white/5 mb-4 font-bold">
                  <span className="material-symbols-outlined text-sm text-secondary">history</span>
                  Recent Triumphs
                </h2>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex items-start gap-2.5 text-gray-400">
                    <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">check_circle</span>
                    <div>
                      <span className="text-white font-semibold">{userProfile.name}</span> completed <span className="text-secondary text-glow-cyan font-bold leading-none">Bug Bash objective</span>
                      <div className="font-mono text-[9px] text-gray-500 uppercase mt-0.5 block tracking-widest leading-none">2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-gray-400">
                    <span className="material-symbols-outlined text-[#efc200] text-sm mt-0.5">stars</span>
                    <div>
                      <span className="text-white font-semibold">Team {userProfile.name.split(' ')[0] || 'Alpha'}</span> unlocked <span className="text-[#efc200] font-bold">Sprint Master</span> title
                      <div className="font-mono text-[9px] text-gray-500 uppercase mt-0.5 block tracking-widest leading-none">5 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-gray-400">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">upgrade</span>
                    <div>
                      <span className="text-white font-semibold">{userProfile.name}</span> reached Level {userProfile.level}
                      <div className="font-mono text-[9px] text-gray-500 uppercase mt-0.5 block tracking-widest leading-none">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
