import { supabase } from './supabase';
import { Badge, FeedItem } from '../types';

// ==================== BADGES ====================

export async function syncBadgesToDb(badges: Badge[], userId: string) {
  if (!userId) return;

  try {
    // Upsert all badges
    const badgesToUpsert = badges.map(badge => ({
      user_id: userId,
      badge_key: badge.id,
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      xp_required: badge.xpRequired,
      color: badge.color,
      unlocked_at: badge.unlockedAt || null,
    }));

    const { error } = await supabase
      .from('badges')
      .upsert(badgesToUpsert, { 
        onConflict: 'user_id,badge_key',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error syncing badges to DB:', error);
    }
  } catch (err) {
    console.error('Error in syncBadgesToDb:', err);
  }
}

export async function loadBadgesFromDb(userId: string): Promise<Badge[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('xp_required', { ascending: true });

    if (error) {
      console.error('Error loading badges from DB:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map(row => ({
      id: row.badge_key,
      name: row.name,
      icon: row.icon,
      description: row.description,
      xpRequired: row.xp_required,
      color: row.color,
      unlockedAt: row.unlocked_at,
    }));
  } catch (err) {
    console.error('Error in loadBadgesFromDb:', err);
    return [];
  }
}

export async function unlockBadgeInDb(badgeId: string, userId: string, unlockedAt: string) {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('badges')
      .update({ unlocked_at: unlockedAt })
      .eq('user_id', userId)
      .eq('badge_key', badgeId);

    if (error) {
      console.error('Error unlocking badge in DB:', error);
    }
  } catch (err) {
    console.error('Error in unlockBadgeInDb:', err);
  }
}

// ==================== FEEDS ====================

export async function syncFeedsToDb(feeds: FeedItem[], userId: string) {
  if (!userId) return;

  try {
    // Delete all existing feeds for this user first
    await supabase.from('feeds').delete().eq('user_id', userId);

    if (feeds.length === 0) return;

    // Insert all current feeds
    const feedsToInsert = feeds.map(feed => ({
      user_id: userId,
      feed_key: feed.id,
      type: feed.type,
      title: feed.title,
      description: feed.description,
      time_ago: feed.timeAgo,
      avatar: feed.avatar || null,
      retaliated: feed.retaliated || false,
    }));

    const { error } = await supabase
      .from('feeds')
      .insert(feedsToInsert);

    if (error) {
      console.error('Error syncing feeds to DB:', error);
    }
  } catch (err) {
    console.error('Error in syncFeedsToDb:', err);
  }
}

export async function loadFeedsFromDb(userId: string): Promise<FeedItem[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading feeds from DB:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map(row => ({
      id: row.feed_key,
      type: row.type as 'achievement' | 'challenge' | 'surpassed',
      title: row.title,
      description: row.description,
      timeAgo: row.time_ago,
      avatar: row.avatar,
      retaliated: row.retaliated,
    }));
  } catch (err) {
    console.error('Error in loadFeedsFromDb:', err);
    return [];
  }
}

export async function clearAllFeedsFromDb(userId: string) {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('feeds')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing feeds from DB:', error);
    }
  } catch (err) {
    console.error('Error in clearAllFeedsFromDb:', err);
  }
}

export async function addFeedToDb(feed: FeedItem, userId: string) {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('feeds')
      .insert({
        user_id: userId,
        feed_key: feed.id,
        type: feed.type,
        title: feed.title,
        description: feed.description,
        time_ago: feed.timeAgo,
        avatar: feed.avatar || null,
        retaliated: feed.retaliated || false,
      });

    if (error) {
      console.error('Error adding feed to DB:', error);
    }
  } catch (err) {
    console.error('Error in addFeedToDb:', err);
  }
}
