export type ActiveTab = 'dashboard' | 'habits' | 'tasks' | 'team_hub' | 'analytics' | 'inventory' | 'awards' | 'history';

export type TaskType = 'today' | 'weekly' | 'monthly' | 'long_term' | 'daily' | 'yearly' | 'one_time';

export interface Habit {
  id: string;
  userId?: string;
  ownerName?: string;
  title: string;
  category: 'HEALTH' | 'FOCUS' | 'MIND';
  icon: string;
  streak: number;            // total completions streak count
  xpPerDay: number;          // XP per completion
  levelProgress: number;     // percentage
  activityGrid: ('completed' | 'today' | 'future' | 'missed')[];
  reminder?: string;
  // Frequency settings
  frequency: number;         // e.g. 3 (times per period)
  period: 'week' | 'month';  // "per week" or "per month"
  completionsThisPeriod: number;  // how many done so far this period
  periodDeadline?: string;   // ISO date of end of current period
}

export interface Team {
  id: string;
  name: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  team_id: string | null;
  name: string;
  avatar: string;
  title: string;
  level: number;
  total_xp: number;
  equipped_frame_id?: string;
  created_at?: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
}

export interface Quest {
  id: string;
  team_id?: string;
  creator_id?: string;
  title: string;
  description: string;
  category: string; // 'Development' | 'Design' | etc.
  taskType: TaskType;
  deadline: string;
  xpReward: number;
  created_at?: string;
  
  // Computed fields for UI
  status: 'todo' | 'in_progress' | 'completed';
  completionsCount?: number; // How many team members completed it
  completedByMe?: boolean;
  creatorName?: string;
  
  // Legacy fields (optional) to prevent breaking other views
  isGolden?: boolean;
  progress?: number; // percentage
  originalDeadline?: string;
  warning?: string; 
  overdueDays?: number;
  reminder?: string; 
  completedAt?: string; 
  assignee?: string;
  assigneeId?: string | null;
  targetCount?: number;   
  currentCount?: number;  
  bonusXpPerResult?: number; 
}

export interface TeamQuestCampaign {
  id: string;
  title: string;
  description: string;
  tier: 'EPIC' | 'RARE' | 'COMMON';
  timeLeft: string;
  xpReward: number;
  progress: number; // percentage
  progressLabel: string;
  avatars: string[];
  joined?: boolean;
}

export interface LeaderboardUser {
  id?: string;
  rank: number;
  name: string;
  level: number;
  tier?: string;
  score: number;
  totalXp: number;
  avatar: string;
  equippedFrameId?: string;
  equippedFrameCss?: string;
  isCurrentUser?: boolean;
}

export interface FeedItem {
  id: string;
  type: 'achievement' | 'challenge' | 'surpassed';
  title: string;
  description: string;
  timeAgo: string;
  avatar?: string;
  retaliated?: boolean;
}

export interface UserProfile {
  id?: string;
  team_id?: string;
  name: string;
  title: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  productivityScore: number;
  avatar: string;
  equippedFrameId?: string;
  equippedFrameCss?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;           // material-symbols icon name
  description: string;
  xpRequired: number;     // total XP needed to unlock
  color: string;          // e.g. 'primary' | 'secondary' | 'tertiary'
  unlockedAt?: string;    // ISO date if earned
}

export interface Award {
  id: string;
  userId?: string;
  ownerName?: string;
  title: string;
  description?: string;
  xpReward: number;
  deadline: string;       // ISO date string
  achieved: boolean;
  claimedAt?: string;     // ISO date when claimed
  createdAt?: string;
}

export interface AwardClaim {
  id: string;
  awardId: string;
  userId: string;
  claimedAt: string;
}

export interface PeriodWinner {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  name: string;
  xp: number;
  avatar?: string;
  date: string;
  userId?: string;
  isLeading?: boolean;
}

export interface GoldenGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;    // ISO date
  progress: number;       // 0–100
  xpReward: number;
  achieved: boolean;
}

export interface Reminder {
  id: string;
  taskId?: string;
  habitId?: string;
  label: string;
  time: string;           // "HH:MM"
  active: boolean;
}

// Trigger TS Service reload

