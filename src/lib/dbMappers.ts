import { Habit, Award, PeriodWinner, AwardClaim } from '../types';

export function mapDbHabit(row: any, ownerName?: string): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    ownerName,
    title: row.title,
    category: row.category,
    icon: row.icon,
    streak: row.streak ?? 0,
    xpPerDay: row.xp_per_day ?? 50,
    levelProgress: row.level_progress ?? 0,
    activityGrid: row.activity_grid ?? [],
    reminder: row.reminder ?? undefined,
    frequency: row.frequency ?? 3,
    period: row.period ?? 'week',
    completionsThisPeriod: row.completions_this_period ?? 0,
    periodDeadline: row.period_deadline ?? undefined,
  };
}

export function habitToDb(habit: Habit, userId: string, teamId: string) {
  return {
    user_id: userId,
    team_id: teamId,
    title: habit.title,
    category: habit.category,
    icon: habit.icon,
    streak: habit.streak,
    xp_per_day: habit.xpPerDay,
    level_progress: habit.levelProgress,
    activity_grid: habit.activityGrid ?? [],
    reminder: habit.reminder ?? null,
    frequency: habit.frequency,
    period: habit.period,
    completions_this_period: habit.completionsThisPeriod,
    period_deadline: habit.periodDeadline ?? null,
  };
}

export function mapDbAward(row: any, ownerName?: string): Award {
  return {
    id: row.id,
    userId: row.user_id,
    ownerName,
    title: row.title,
    description: row.description ?? undefined,
    xpReward: row.xp_reward,
    deadline: row.deadline,
    achieved: row.achieved ?? false,
    claimedAt: row.claimed_at ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

export function awardToDb(award: Award, userId: string, teamId: string) {
  return {
    user_id: userId,
    team_id: teamId,
    title: award.title,
    description: award.description ?? null,
    xp_reward: award.xpReward,
    deadline: award.deadline,
    achieved: award.achieved ?? false,
    claimed_at: award.claimedAt ?? null,
  };
}

export function mapDbPeriodWinner(row: any): PeriodWinner {
  return {
    id: row.id,
    period: row.period,
    name: row.name,
    xp: row.xp,
    avatar: row.avatar ?? undefined,
    date: row.period_end ?? row.created_at,
    userId: row.user_id,
    isLeading: false,
  };
}

export function mapDbAwardClaim(row: any): AwardClaim {
  return {
    id: row.id,
    awardId: row.award_id,
    userId: row.user_id,
    claimedAt: row.claimed_at,
  };
}

// Trigger TS Service reload

