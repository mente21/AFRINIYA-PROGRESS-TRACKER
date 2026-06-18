import React, { useState } from 'react';
import { TeamQuestCampaign, UserProfile, FeedItem, LeaderboardUser } from '../types';
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



  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Global Rankings</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">Compete on the global leaderboard and track your progress.</p>
        </div>

        <div className="flex items-center gap-2.5 bg-[#171f33]/80 border border-white/5 px-4 py-2 rounded-xl shrink-0">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="font-display font-semibold text-white">{totalXp.toLocaleString()} XP</span>
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest ml-1">Total XP</span>
        </div>
      </header>

      <LeaderboardView 
        userProfile={userProfile}
        leaderboard={leaderboard}
        totalXp={totalXp}
        currentUserId={currentUserId}
      />
    </div>
  );
}
