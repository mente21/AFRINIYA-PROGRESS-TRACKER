import { SupabaseClient } from '@supabase/supabase-js';
import { PeriodWinner, Profile } from '../types';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function getPeriodBounds(period: Period, offset = -1): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (offset === -1) {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    }
  } else if (period === 'weekly') {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(now.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    if (offset === -1) {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 7);
    }
  } else if (period === 'monthly') {
    if (offset === -1) {
      start.setMonth(now.getMonth() - 1, 1);
      end.setMonth(now.getMonth(), 0);
    } else {
      start.setDate(1);
      end.setMonth(now.getMonth() + 1, 0);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    if (offset === -1) {
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
    } else {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export async function logXpEvent(
  supabase: SupabaseClient,
  userId: string,
  teamId: string,
  amount: number,
  source: string
) {
  if (amount <= 0) return;
  await supabase.from('xp_events').insert({
    user_id: userId,
    team_id: teamId,
    amount,
    source,
  });
}

export async function finalizePeriodWinners(
  supabase: SupabaseClient,
  teamId: string,
  members: Profile[]
): Promise<void> {
  const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly'];

  for (const period of periods) {
    const { start, end } = getPeriodBounds(period, -1);
    const periodStart = start.toISOString();
    const periodEnd = end.toISOString();

    const { data: existing } = await supabase
      .from('period_winners')
      .select('id')
      .eq('team_id', teamId)
      .eq('period', period)
      .eq('period_start', periodStart)
      .maybeSingle();

    if (existing) continue;

    const { data: events } = await supabase
      .from('xp_events')
      .select('user_id, amount')
      .eq('team_id', teamId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    if (!events?.length) continue;

    const totals: Record<string, number> = {};
    for (const e of events) {
      totals[e.user_id] = (totals[e.user_id] || 0) + e.amount;
    }

    const winnerId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!winnerId) continue;

    const winner = members.find(m => m.id === winnerId);
    if (!winner) continue;

    await supabase.from('period_winners').insert({
      team_id: teamId,
      period,
      user_id: winnerId,
      name: winner.name,
      avatar: winner.avatar,
      xp: totals[winnerId],
      period_start: periodStart,
      period_end: periodEnd,
    });
  }
}

export async function getCurrentPeriodLeaders(
  supabase: SupabaseClient,
  teamId: string,
  members: Profile[]
): Promise<Record<Period, PeriodWinner | null>> {
  const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly'];
  const leaders: Record<Period, PeriodWinner | null> = {
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
  };

  for (const period of periods) {
    const { start, end } = getPeriodBounds(period, 0);
    const { data: events } = await supabase
      .from('xp_events')
      .select('user_id, amount')
      .eq('team_id', teamId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (!events?.length) continue;

    const totals: Record<string, number> = {};
    for (const e of events) {
      totals[e.user_id] = (totals[e.user_id] || 0) + e.amount;
    }

    const leaderId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!leaderId) continue;

    const member = members.find(m => m.id === leaderId);
    if (!member) continue;

    leaders[period] = {
      id: `leading_${period}`,
      period,
      name: member.name,
      xp: totals[leaderId],
      avatar: member.avatar,
      date: new Date().toISOString(),
      userId: leaderId,
      isLeading: true,
    };
  }

  return leaders;
}
