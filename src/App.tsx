import { useState, useEffect } from 'react';
import { ActiveTab, Habit, Quest, TeamQuestCampaign, FeedItem, UserProfile, Badge, Award, AwardClaim, PeriodWinner, GoldenGoal, LeaderboardUser, Profile } from './types';
import Navigation from './components/Navigation';
import DashboardView from './components/DashboardView';
import HabitsView from './components/HabitsView';
import QuestsView from './components/QuestsView';
import TeamQuestsView from './components/TeamQuestsView';
import AnalyticsView from './components/AnalyticsView';
import InventoryView from './components/InventoryView';
import AwardsView from './components/AwardsView';
import HistoryView from './components/HistoryView';
import Modals from './components/Modals';
import AuthScreen from './components/AuthScreen';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { deriveTaskStatus } from './lib/taskUtils';
import { getFrameCss, getFrameRank } from './lib/frames';
import { mapDbHabit, habitToDb, mapDbAward, awardToDb, mapDbPeriodWinner, mapDbAwardClaim } from './lib/dbMappers';
import { logXpEvent, finalizePeriodWinners, getCurrentPeriodLeaders } from './lib/periodWinners';
import { syncBadgesToDb, loadBadgesFromDb, unlockBadgeInDb, syncFeedsToDb, loadFeedsFromDb, clearAllFeedsFromDb } from './lib/badgesFeedsDb';

import {
  initialUserProfile,
  initialHabits,
  initialQuests,
  initialTeamCampaigns,
  initialFeed,
  initialBadges,
  initialAwards,
  initialPeriodWinners,
  initialGoldenGoal,
} from './data';

import { AnimatePresence, motion } from 'motion/react';

type ModalMode = 'add_task' | 'edit_task' | 'add_habit' | 'edit_habit' | 'add_award' | 'edit_award' | 'golden_goal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchVal, setSearchVal] = useState('');

  // Core state
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [teamCampaigns, setTeamCampaigns] = useState<TeamQuestCampaign[]>(initialTeamCampaigns);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [totalXp, setTotalXp] = useState<number>(0);

  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [awards, setAwards] = useState<Award[]>(initialAwards);
  const [awardClaims, setAwardClaims] = useState<AwardClaim[]>([]);
  const [periodWinners, setPeriodWinners] = useState<PeriodWinner[]>(initialPeriodWinners);
  const [currentPeriodLeaders, setCurrentPeriodLeaders] = useState<Record<string, PeriodWinner | null>>({});
  const [goldenGoal, setGoldenGoal] = useState<GoldenGoal | null>(initialGoldenGoal);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add_task');
  const [editingTask, setEditingTask] = useState<Quest | null>(null);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // DB loading
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Setup Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If logging out, we could clear local state here or just reload
      if (!session) {
        setHabits([]);
        setQuests([]);
        setFeed([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Fetch initial db state
  useEffect(() => {
    if (isAuthLoading || !session) {
      setIsDbLoading(false);
      return;
    }

    const userId = session.user.id;
    const defaultTeamId = '16890efb-a4c1-4886-8f5f-2c04915b24ce';

    async function fetchState() {
      setIsDbLoading(true);
      try {
        // 1. Ensure Profile Exists & get Team
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        let userProfileData = profile;

        if (profileError || !profile) {
          // Upsert default profile
          const newProfile = {
            id: userId,
            team_id: defaultTeamId,
            name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || 'New Player',
            avatar: session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || initialUserProfile.avatar,
            level: 1,
            title: 'Novice',
            total_xp: 0
          };
          await supabase.from('profiles').upsert(newProfile);
          userProfileData = newProfile;
        } else if (!profile.team_id) {
          // Assign to default team if missing
          await supabase.from('profiles').update({ team_id: defaultTeamId }).eq('id', userId);
          userProfileData.team_id = defaultTeamId;
        }

        const frameId = userProfileData.equipped_frame_id || 'none';
        setUserProfile(prev => ({
          ...prev,
          id: userId,
          team_id: userProfileData.team_id,
          name: userProfileData.name,
          avatar: userProfileData.avatar,
          level: userProfileData.level,
          title: userProfileData.title || getFrameRank(frameId),
          equippedFrameId: frameId,
          equippedFrameCss: getFrameCss(frameId),
        }));
        setTotalXp(userProfileData.total_xp);

        const profileNameById = (members: Profile[]) =>
          Object.fromEntries(members.map(m => [m.id, m.name]));

        // 2. Fetch Team Profiles (for Leaderboard & Team Hub)
        let loadedTeamMembers: Profile[] = [];
        const fetchTeamMembers = async () => {
          const { data: teamMembersData } = await supabase
            .from('profiles')
            .select('*')
            .eq('team_id', userProfileData.team_id)
            .order('name');

          if (teamMembersData) {
            loadedTeamMembers = teamMembersData;
            setTeamMembers(teamMembersData);
            const me = teamMembersData.find((m: Profile) => m.id === userId);
            if (me?.equipped_frame_id) {
              setUserProfile(prev => ({
                ...prev,
                equippedFrameId: me.equipped_frame_id || 'none',
                equippedFrameCss: getFrameCss(me.equipped_frame_id),
              }));
            }
            const mappedLeaderboard = teamMembersData.map((u: Profile, i: number) => ({
              rank: i + 1,
              name: u.name,
              level: u.level || 1,
              tier: u.title || 'Novice',
              score: Math.min(99.9, parseFloat(((u.total_xp || 0) / 146).toFixed(1))),
              totalXp: u.total_xp || 0,
              avatar: u.avatar,
              id: u.id,
              equippedFrameId: u.equipped_frame_id || 'none',
              equippedFrameCss: getFrameCss(u.equipped_frame_id),
            }));
            setLeaderboard(mappedLeaderboard);
          }
        };
        await fetchTeamMembers();

        // 3. Fetch Tasks and Completions
        const fetchTasks = async () => {
          const [{ data: dbTasks }, { data: dbCompletions }] = await Promise.all([
            supabase.from('tasks').select('*').eq('team_id', userProfileData.team_id),
            supabase.from('task_completions').select('task_id, user_id')
          ]);

          const names = profileNameById(loadedTeamMembers);

          if (dbTasks) {
            const mappedTasks = dbTasks.map(t => {
              const { status, completedByMe, completionsCount } = deriveTaskStatus(
                t.assignee_id,
                dbCompletions || [],
                t.id,
                userId
              );
              const assigneeName = t.assignee_id ? names[t.assignee_id] : undefined;
              return {
                ...t,
                xpReward: t.xp_reward,
                taskType: t.task_type || 'one_time',
                assigneeId: t.assignee_id || null,
                assignee: assigneeName || (t.assignee_id ? 'Unknown' : 'ALL'),
                status,
                completionsCount,
                completedByMe
              };
            });
            setQuests(mappedTasks);
          }
        };
        await fetchTasks();

        const fetchHabits = async () => {
          const { data } = await supabase
            .from('habits')
            .select('*')
            .eq('team_id', userProfileData.team_id)
            .order('created_at', { ascending: false });
          if (data) {
            const names = profileNameById(loadedTeamMembers);
            setHabits(data.map(h => mapDbHabit(h, names[h.user_id])));
          }
        };

        const fetchAwards = async () => {
          const { data } = await supabase
            .from('awards')
            .select('*')
            .eq('team_id', userProfileData.team_id)
            .order('created_at', { ascending: false });
          if (data) {
            const names = profileNameById(loadedTeamMembers);
            setAwards(data.map(a => mapDbAward(a, names[a.user_id])));
            const awardIds = data.map(a => a.id);
            if (awardIds.length > 0) {
              const { data: claims } = await supabase
                .from('award_claims')
                .select('*')
                .in('award_id', awardIds);
              if (claims) {
                setAwardClaims(claims.map(mapDbAwardClaim));
              }
            } else {
              setAwardClaims([]);
            }
          }
        };

        const fetchPeriodWinners = async () => {
          await finalizePeriodWinners(supabase, userProfileData.team_id, loadedTeamMembers);
          const { data } = await supabase
            .from('period_winners')
            .select('*')
            .eq('team_id', userProfileData.team_id)
            .order('period_end', { ascending: true });
          if (data) setPeriodWinners(data.map(mapDbPeriodWinner));
          const leaders = await getCurrentPeriodLeaders(supabase, userProfileData.team_id, loadedTeamMembers);
          setCurrentPeriodLeaders(leaders);
        };

        await Promise.all([fetchHabits(), fetchAwards(), fetchPeriodWinners()]);

        // Load badges from database
        const dbBadges = await loadBadgesFromDb(userId);
        if (dbBadges.length > 0) {
          setBadges(dbBadges);
        } else {
          // Initialize badges for new users
          await syncBadgesToDb(initialBadges, userId);
          setBadges(initialBadges);
        }

        // Load feeds from database
        const dbFeeds = await loadFeedsFromDb(userId);
        if (dbFeeds.length > 0) {
          setFeed(dbFeeds);
        }

        // 4. Load remaining legacy data from LocalStorage
        const localLegacy = localStorage.getItem(`legacy_state_${userId}`);
        if (localLegacy) {
          const data = JSON.parse(localLegacy);
          if (data.teamCampaigns) setTeamCampaigns(data.teamCampaigns);
          if (data.feed) setFeed(data.feed);
          if (data.badges) setBadges(data.badges);
          if (data.goldenGoal !== undefined) setGoldenGoal(data.goldenGoal);
        }

        // 5. Setup Realtime Subscriptions
        const channel = supabase.channel('team_updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, fetchTasks)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchTeamMembers)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, fetchHabits)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'awards' }, fetchAwards)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'award_claims' }, fetchAwards)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'period_winners' }, fetchPeriodWinners)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'xp_events' }, fetchPeriodWinners)
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('DB fetch failed on startup:', err);
      } finally {
        setIsDbLoading(false);
      }
    }
    fetchState();
  }, [session, isAuthLoading]);

  // Sync legacy state to localStorage
  useEffect(() => {
    if (isDbLoading || !session) return;
    const saveTimer = setTimeout(() => {
      localStorage.setItem(`legacy_state_${session.user.id}`, JSON.stringify({
        teamCampaigns, feed, badges, goldenGoal
      }));
    }, 400);
    return () => clearTimeout(saveTimer);
  }, [teamCampaigns, feed, badges, goldenGoal, isDbLoading, session]);

  // Sync badges to database
  useEffect(() => {
    if (isDbLoading || !session) return;
    const saveTimer = setTimeout(() => {
      syncBadgesToDb(badges, session.user.id);
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [badges, isDbLoading, session]);

  // Sync feeds to database
  useEffect(() => {
    if (isDbLoading || !session) return;
    const saveTimer = setTimeout(() => {
      syncFeedsToDb(feed, session.user.id);
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [feed, isDbLoading, session]);

  // Sync profile to database
  useEffect(() => {
    if (isDbLoading || !session || !userProfile.name) return;
    const syncProfile = async () => {
      try {
        await supabase.from('profiles').update({
          level: userProfile.level,
          total_xp: totalXp,
          equipped_frame_id: userProfile.equippedFrameId || 'none',
          title: userProfile.title,
        }).eq('id', session.user.id);
      } catch (e) {
        console.error('Error syncing profile', e);
      }
    };
    const saveTimer = setTimeout(syncProfile, 500);
    return () => clearTimeout(saveTimer);
  }, [userProfile.level, userProfile.title, userProfile.equippedFrameId, totalXp, isDbLoading, session]);

  // Badge unlock check — runs whenever totalXp changes
  useEffect(() => {
    if (isDbLoading) return;
    
    const newlyUnlocked = badges.filter(b => !b.unlockedAt && totalXp >= b.xpRequired);
    
    if (newlyUnlocked.length > 0) {
      const unlockedAt = new Date().toISOString();
      
      setBadges(prev => prev.map(badge => {
        if (!badge.unlockedAt && totalXp >= badge.xpRequired) {
          // Update in database
          if (session) {
            unlockBadgeInDb(badge.id, session.user.id, unlockedAt);
          }
          return { ...badge, unlockedAt };
        }
        return badge;
      }));
      
      const newFeedItems = newlyUnlocked.map(badge => ({
        id: `f_badge_${badge.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        type: 'achievement' as const,
        title: `Badge Unlocked: "${badge.name}"! 🎖️`,
        description: badge.description,
        timeAgo: 'Just now'
      }));
      
      setFeed(prev => [...newFeedItems, ...prev]);
    }
  }, [totalXp, isDbLoading, badges, session]);

  const handleLevelUpCheck = (xpAwarded: number) => {
    setUserProfile(prev => {
      const nextXp = prev.currentXp + xpAwarded;
      if (nextXp >= prev.xpToNextLevel) {
        return { ...prev, level: prev.level + 1, currentXp: nextXp - prev.xpToNextLevel, productivityScore: Math.min(100, prev.productivityScore + 3) };
      }
      return { ...prev, currentXp: nextXp };
    });
  };

  const handleAddQuest = async (newQuest: Quest) => {
    // Optimistic UI update
    setQuests(prev => [{...newQuest, status: 'todo'}, ...prev]);
    setFeed(prev => [{
      id: `f_add_q_${Date.now()}`,
      type: 'challenge',
      title: `New Task Added: "${newQuest.title}"`,
      description: `Added to To Do list. Worth ${newQuest.xpReward} XP.`,
      timeAgo: 'Just now'
    }, ...prev]);

    // DB Write
    if (session?.user?.id && userProfile.team_id) {
      await supabase.from('tasks').insert({
        team_id: userProfile.team_id,
        creator_id: session.user.id,
        title: newQuest.title,
        description: newQuest.description,
        category: newQuest.category,
        task_type: newQuest.taskType,
        deadline: newQuest.deadline,
        xp_reward: newQuest.xpReward,
        assignee_id: newQuest.assigneeId || null,
      });
    }
  };

  const handleUpdateQuest = async (updatedQuest: Quest) => {
    // Optimistic UI update
    setQuests(prev => prev.map(q => q.id === updatedQuest.id ? updatedQuest : q));
    setEditingTask(null);

    // DB Write
    await supabase.from('tasks').update({
      title: updatedQuest.title,
      description: updatedQuest.description,
      category: updatedQuest.category,
      task_type: updatedQuest.taskType,
      deadline: updatedQuest.deadline,
      xp_reward: updatedQuest.xpReward,
      assignee_id: updatedQuest.assigneeId || null,
    }).eq('id', updatedQuest.id);
  };

  const handleDeleteQuest = async (questId: string) => {
    setQuests(prev => prev.filter(q => q.id !== questId));
    setFeed(prev => [{ id: `f_del_${Date.now()}`, type: 'challenge', title: 'Task Removed', description: 'Task was deleted for the whole team.', timeAgo: 'Just now' }, ...prev]);
    await supabase.from('tasks').delete().eq('id', questId);
  };

  const handleXpEarned = async (amount: number, source: string) => {
    if (!session?.user?.id || !userProfile.team_id || amount <= 0) return;
    await logXpEvent(supabase, session.user.id, userProfile.team_id, amount, source);
    const leaders = await getCurrentPeriodLeaders(supabase, userProfile.team_id, teamMembers);
    setCurrentPeriodLeaders(leaders);
  };

  const handleEquipFrame = async (frameId: string, rank: string, frameCss: string) => {
    setUserProfile(prev => ({
      ...prev,
      title: rank,
      equippedFrameId: frameId,
      equippedFrameCss: frameCss,
    }));
    if (session?.user?.id) {
      await supabase.from('profiles').update({
        equipped_frame_id: frameId,
        title: rank,
      }).eq('id', session.user.id);
    }
  };

  const handleAddHabit = async (newHabit: Habit) => {
    const habitWithOwner = {
      ...newHabit,
      userId: session?.user?.id,
      ownerName: userProfile.name,
    };
    setHabits(prev => [habitWithOwner, ...prev]);
    setFeed(prev => [{
      id: `f_add_h_${Date.now()}`,
      type: 'challenge',
      title: `Habit Added: "${newHabit.title}"`,
      description: `New habit visible to the team.`,
      timeAgo: 'Just now'
    }, ...prev]);

    if (session?.user?.id && userProfile.team_id) {
      await supabase.from('habits').insert(habitToDb(habitWithOwner, session.user.id, userProfile.team_id));
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    await supabase.from('habits').delete().eq('id', habitId);
  };

  const handleUpdateHabit = async (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setEditingHabit(null);
    await supabase.from('habits').update({
      title: updatedHabit.title,
      category: updatedHabit.category,
      icon: updatedHabit.icon,
      xp_per_day: updatedHabit.xpPerDay,
      frequency: updatedHabit.frequency,
      period: updatedHabit.period,
      reminder: updatedHabit.reminder ?? null,
    }).eq('id', updatedHabit.id);
  };

  const handleHabitCheckIn = async (habitId: string, updates: Partial<Habit>, xpEarned: number) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
    setTotalXp(p => p + xpEarned);
    setUserProfile(p => {
      const nextXp = p.currentXp + xpEarned;
      return nextXp >= p.xpToNextLevel
        ? { ...p, level: p.level + 1, currentXp: nextXp - p.xpToNextLevel, productivityScore: Math.min(100, p.productivityScore + 2) }
        : { ...p, currentXp: nextXp, productivityScore: Math.min(100, p.productivityScore + 1) };
    });

    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      await supabase.from('habits').update({
        streak: updates.streak ?? habit.streak,
        completions_this_period: updates.completionsThisPeriod ?? habit.completionsThisPeriod,
        period_deadline: updates.periodDeadline ?? habit.periodDeadline,
        level_progress: updates.levelProgress ?? habit.levelProgress,
      }).eq('id', habitId);
    }
    await handleXpEarned(xpEarned, 'habit');
  };

  const handleAddAward = async (award: Award) => {
    const awardWithOwner = {
      ...award,
      userId: session?.user?.id,
      ownerName: userProfile.name,
    };
    setAwards(prev => [awardWithOwner, ...prev]);
    setFeed(prev => [{
      id: `f_add_aw_${Date.now()}`,
      type: 'achievement',
      title: `New Award Set: "${award.title}"`,
      description: award.xpReward > 0
        ? `Earn the best XP to claim the reward of ${award.xpReward.toLocaleString()} XP!`
        : `Earn the best XP to claim this prestigious reward!`,
      timeAgo: 'Just now'
    }, ...prev]);

    if (session?.user?.id && userProfile.team_id) {
      await supabase.from('awards').insert(awardToDb(awardWithOwner, session.user.id, userProfile.team_id));
    }
  };

  const handleClaimAward = async (award: Award) => {
    if (!session?.user?.id) return;
    const claimedAt = new Date().toISOString();
    
    // Optimistic UI updates
    const newClaim: AwardClaim = {
      id: `temp_claim_${Date.now()}`,
      awardId: award.id,
      userId: session.user.id,
      claimedAt
    };
    setAwardClaims(prev => [...prev, newClaim]);

    // Give the user the reward XP
    const rewardVal = award.xpReward || 0;
    const newXp = totalXp + rewardVal;
    setTotalXp(newXp);
    if (rewardVal > 0) {
      handleLevelUpCheck(rewardVal);
    }

    await supabase.from('award_claims').insert({
      award_id: award.id,
      user_id: session.user.id,
      claimed_at: claimedAt
    });

    // Log XP event
    if (rewardVal > 0) {
      await logXpEvent(supabase, session.user.id, userProfile.team_id, rewardVal, `Won competition: ${award.title}`);
    }

    // Optionally update user profile XP in DB
    if (rewardVal > 0) {
      await supabase.from('profiles').update({ total_xp: newXp }).eq('id', session.user.id);
    }
  };

  const handleUpdateAward = async (updatedAward: Award) => {
    setAwards(prev => prev.map(a => a.id === updatedAward.id ? updatedAward : a));
    setEditingAward(null);
    await supabase.from('awards').update({
      title: updatedAward.title,
      description: updatedAward.description ?? null,
      xp_reward: updatedAward.xpReward,
      deadline: updatedAward.deadline,
    }).eq('id', updatedAward.id);
  };

  const handleDeleteAward = async (awardId: string) => {
    setAwards(prev => prev.filter(a => a.id !== awardId));
    await supabase.from('awards').delete().eq('id', awardId);
  };

  const handleSetGoldenGoal = (goal: GoldenGoal) => {
    setGoldenGoal(goal);
    setFeed(prev => [{
      id: `f_gg_${Date.now()}`,
      type: 'achievement',
      title: `Big Dream Goal Set: "${goal.title}"`,
      description: `Your dream goal is now pinned to the dashboard!`,
      timeAgo: 'Just now'
    }, ...prev]);
  };

  const handleProfilePhotoChange = (url: string) => {
    setUserProfile(prev => ({ ...prev, avatar: url }));
  };

  const openModal = (mode: ModalMode, item?: Quest | Award | Habit) => {
    setModalMode(mode);
    setEditingTask(mode === 'edit_task' ? (item as Quest) || null : null);
    setEditingAward(mode === 'edit_award' ? (item as Award) || null : null);
    setEditingHabit(mode === 'edit_habit' ? (item as Habit) || null : null);
    setIsModalOpen(true);
  };

  const filterQuestsBySearch = (list: Quest[]) => {
    if (!searchVal.trim()) return list;
    return list.filter(q =>
      q.title.toLowerCase().includes(searchVal.toLowerCase()) ||
      q.description.toLowerCase().includes(searchVal.toLowerCase())
    );
  };

  const filterHabitsBySearch = (list: Habit[]) => {
    if (!searchVal.trim()) return list;
    return list.filter(h => h.title.toLowerCase().includes(searchVal.toLowerCase()));
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
    </div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen relative font-sans flex flex-col md:flex-row antialiased selection:bg-primary/20 selection:text-primary">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        totalXp={totalXp}
        quests={quests}
        habits={habits}
        onOpenNewTaskModal={() => openModal('add_task')}
        onProfilePhotoChange={handleProfilePhotoChange}
        onLogOut={handleLogout}
      />

      <div className="flex-1 transition-all md:ml-64 flex flex-col md:pt-4">
        {/* Desktop top header */}
        <header className="hidden md:flex fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-[#0b1326]/80 backdrop-blur-md justify-between items-center px-10 border-b border-[#4d4354]/10 z-30">
          <div className="flex-1 max-w-sm">
            <div className="relative flex items-center text-gray-500 focus-within:text-secondary">
              <span className="material-symbols-outlined absolute left-3.5 text-[18px]">search</span>
              <input
                type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
                placeholder="Search tasks and habits..."
                className="w-full bg-[#171f33]/50 border-none rounded-full py-2 pl-10 pr-4 font-sans text-xs text-white placeholder:text-gray-500 focus:ring-1 focus:ring-secondary focus:bg-[#171f33] outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-secondary rounded-full relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <div className="font-mono text-xs text-primary font-bold">{totalXp.toLocaleString()} XP</div>
            <button onClick={() => handleProfilePhotoChange(prompt('Enter profile photo URL:') || userProfile.avatar)}>
              <div className={`w-8 h-8 rounded-full overflow-hidden transition-all duration-300 ${userProfile.equippedFrameCss || 'border border-primary/45 hover:ring-2 hover:ring-primary/50'}`}>
                <img alt="Profile" className="w-full h-full object-cover" src={userProfile.avatar} />
              </div>
            </button>
            <button
              onClick={() => openModal('add_task')}
              className="ml-2 px-5 py-2 font-mono text-[10px] uppercase font-bold text-purple-950 bg-[#ddb7ff] shadow-lg hover:shadow-[#ddb7ff]/30 active:scale-95 hover:brightness-110 tracking-widest rounded-full transition-all"
            >
              Add Task
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 mt-16 md:mt-16 px-4 md:px-10 pb-28 md:pb-10 pt-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  totalXp={totalXp}
                  setTotalXp={setTotalXp}
                  feed={feed}
                  setFeed={setFeed}
                  onChangeTab={tab => setActiveTab(tab)}
                  goldenGoal={goldenGoal}
                  onEditGoldenGoal={() => openModal('golden_goal')}
                  badges={badges}
                  habits={habits}
                  currentUserId={session?.user?.id}
                />
              )}

              {activeTab === 'habits' && (
                <HabitsView
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  habits={filterHabitsBySearch(habits)}
                  setHabits={setHabits}
                  totalXp={totalXp}
                  setTotalXp={setTotalXp}
                  setFeed={setFeed}
                  currentUserId={userProfile.id}
                  onAddHabit={handleAddHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onEditHabit={(habit) => openModal('edit_habit', habit)}
                  onHabitCheckIn={handleHabitCheckIn}
                />
              )}

              {activeTab === 'tasks' && (
                <QuestsView
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  quests={filterQuestsBySearch(quests)}
                  setQuests={setQuests}
                  totalXp={totalXp}
                  setTotalXp={setTotalXp}
                  setFeed={setFeed}
                  onEditTask={(task) => openModal('edit_task', task)}
                  onAddTask={() => openModal('add_task')}
                  onDeleteTask={handleDeleteQuest}
                  onXpEarned={handleXpEarned}
                  teamSize={teamMembers.length}
                />
              )}

               {activeTab === 'awards' && (
                <AwardsView
                  awards={awards}
                  setAwards={setAwards}
                  awardClaims={awardClaims}
                  teamMembers={teamMembers}
                  periodWinners={periodWinners}
                  currentPeriodLeaders={currentPeriodLeaders}
                  badges={badges}
                  totalXp={totalXp}
                  userProfile={userProfile}
                  currentUserId={userProfile.id}
                  memberXpMap={Object.fromEntries(teamMembers.map(m => [m.id, m.total_xp || 0]))}
                  onOpenAddAward={() => openModal('add_award')}
                  onEditAward={(award) => openModal('edit_award', award)}
                  onDeleteAward={handleDeleteAward}
                  onClaimAward={handleClaimAward}
                />
              )}

              {activeTab === 'history' && (
                <HistoryView
                  quests={quests}
                  habits={habits}
                />
              )}

              {activeTab === 'team_hub' && (
                <TeamQuestsView
                  userProfile={userProfile}
                  totalXp={totalXp}
                  setTotalXp={setTotalXp}
                  teamCampaigns={teamCampaigns}
                  setTeamCampaigns={setTeamCampaigns}
                  setFeed={setFeed}
                  onLevelUpCheck={handleLevelUpCheck}
                  leaderboard={leaderboard}
                  currentUserId={userProfile.id}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  userProfile={userProfile}
                  totalXp={totalXp}
                  quests={quests}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  totalXp={totalXp}
                  onEquipFrame={handleEquipFrame}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modal */}
      <Modals
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); setEditingAward(null); setEditingHabit(null); }}
        onAddHabit={handleAddHabit}
        onAddQuest={handleAddQuest}
        onAddAward={handleAddAward}
        onSetGoldenGoal={handleSetGoldenGoal}
        editingQuest={editingTask}
        editingAward={editingAward}
        editingHabit={editingHabit}
        onUpdateQuest={handleUpdateQuest}
        onUpdateAward={handleUpdateAward}
        onUpdateHabit={handleUpdateHabit}
        defaultMode={modalMode}
        currentGoldenGoal={goldenGoal}
        teamId={userProfile.team_id}
      />
    </div>
  );
}

// Trigger TS Service reload

