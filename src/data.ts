import { Habit, Quest, TeamQuestCampaign, LeaderboardUser, FeedItem, UserProfile, Badge, Award, PeriodWinner, GoldenGoal } from './types';

export const initialUserProfile: UserProfile = {
  name: 'New User',
  title: 'Novice',
  level: 1,
  currentXp: 0,
  xpToNextLevel: 1000,
  productivityScore: 0,
  avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
};

export const initialHabits: Habit[] = [];

export const initialQuests: Quest[] = [];

export const initialTeamCampaigns: TeamQuestCampaign[] = [
  {
    id: 'tc_1',
    title: 'Operation Phoenix',
    description: 'Refactor the legacy authentication module and migrate to the new OAuth 2.0 provider.',
    tier: 'EPIC',
    timeLeft: '2 Days Left',
    xpReward: 5000,
    progress: 65,
    progressLabel: 'Phase 3 of 4',
    avatars: [
      'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_1280.jpg'
    ],
    joined: true
  },
  {
    id: 'tc_2',
    title: 'Bug Squasher Weekend',
    description: 'Clear out at least 50 P2 bugs from the backlog before the end of the sprint.',
    tier: 'RARE',
    timeLeft: '12 Hours Left',
    xpReward: 2000,
    progress: 80,
    progressLabel: '40 / 50 Bugs',
    avatars: [
      'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_1280.jpg'
    ]
  },
  {
    id: 'tc_3',
    title: 'Client Outreach',
    description: 'Contact 100 prospective clients for the upcoming beta launch.',
    tier: 'COMMON',
    timeLeft: '5 Days Left',
    xpReward: 500,
    progress: 20,
    progressLabel: '20 / 100 Clients',
    avatars: []
  }
];

export const initialLeaderboard: LeaderboardUser[] = [
  {
    rank: 1,
    name: 'Alex Hunter',
    level: 12,
    tier: 'Elite',
    score: 84.5,
    totalXp: 12500,
    avatar: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg'
  },
  {
    rank: 2,
    name: 'Sarah Connor',
    level: 8,
    tier: 'Pro',
    score: 65.2,
    totalXp: 8200,
    avatar: 'https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_1280.jpg'
  },
  {
    rank: 3,
    name: 'John Doe',
    level: 5,
    tier: 'Veteran',
    score: 45.1,
    totalXp: 4500,
    avatar: 'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_1280.jpg'
  },
  {
    rank: 4,
    name: 'Emily Davis',
    level: 3,
    tier: 'Novice',
    score: 15.0,
    totalXp: 1500,
    avatar: 'https://cdn.pixabay.com/photo/2017/08/30/17/27/business-woman-2697954_1280.jpg'
  }
];

export const initialFeed: FeedItem[] = [];

export const initialBadges: Badge[] = [
  {
    id: 'badge_starter',
    name: 'First Step',
    icon: 'rocket_launch',
    description: 'Complete your very first task',
    xpRequired: 100,
    color: 'secondary'
  },
  {
    id: 'badge_grinder',
    name: 'Grinder',
    icon: 'local_fire_department',
    description: 'Earn 1,000 total XP',
    xpRequired: 1000,
    color: 'tertiary'
  },
  {
    id: 'badge_dedicated',
    name: 'Dedicated',
    icon: 'bolt',
    description: 'Earn 5,000 total XP',
    xpRequired: 5000,
    color: 'primary'
  },
  {
    id: 'badge_champion',
    name: 'Champion',
    icon: 'military_tech',
    description: 'Earn 10,000 total XP',
    xpRequired: 10000,
    color: 'tertiary'
  },
  {
    id: 'badge_legend',
    name: 'Legend',
    icon: 'workspace_premium',
    description: 'Earn 25,000 total XP',
    xpRequired: 25000,
    color: 'primary'
  },
  {
    id: 'badge_streak_master',
    name: 'Streak Master',
    icon: 'whatshot',
    description: 'Earn 50,000 total XP',
    xpRequired: 50000,
    color: 'secondary'
  }
];

export const initialAwards: Award[] = [];

export const initialPeriodWinners: PeriodWinner[] = [];

export const initialGoldenGoal: GoldenGoal | null = null;

export const staticAnomalyDetections = [];
