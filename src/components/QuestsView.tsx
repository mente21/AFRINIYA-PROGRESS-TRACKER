import React, { useState } from 'react';
import { Quest, UserProfile, FeedItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal, { ConfirmActionData } from './ConfirmModal';
import { supabase } from '../lib/supabase';
import { isTaskLockedForUser } from '../lib/taskUtils';

interface TasksViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  onEditTask?: (task: Quest) => void;
  onAddTask?: () => void;
  onDeleteTask?: (questId: string) => void;
  onXpEarned?: (amount: number, source: string) => void;
  teamSize?: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  today: { label: 'Today', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', icon: 'today' },
  weekly: { label: 'This Week', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20', icon: 'date_range' },
  monthly: { label: 'This Month', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: 'calendar_month' },
  long_term: { label: 'Long-term', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: 'event' },
  // legacy fallbacks for old data
  daily: { label: 'Today', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', icon: 'today' },
  yearly: { label: 'Long-term', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: 'event' },
  one_time: { label: 'Task', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: 'check_circle' },
};

export default function TasksView({
  userProfile,
  setUserProfile,
  quests,
  setQuests,
  totalXp,
  setTotalXp,
  setFeed,
  onEditTask,
  onAddTask,
  onDeleteTask,
  onXpEarned,
  teamSize = 0,
}: TasksViewProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one_time' | 'golden'>('ALL');
  const [confirmAction, setConfirmAction] = useState<ConfirmActionData | null>(null);



  const filteredQuests = quests.filter(q => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'golden') return q.isGolden;
    return q.taskType === typeFilter;
  });

  const getCols = (status: 'todo' | 'in_progress' | 'completed') =>
    filteredQuests.filter(q => q.status === status);

  const handleShiftStatus = (questId: string, currentStatus: 'todo' | 'in_progress' | 'completed', direction: 'forward' | 'backward') => {
    const actionName = direction === 'forward' ? (currentStatus === 'todo' ? 'start working on this task' : 'mark this task as complete') : 'revert the status of this task';
    
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    if (isTaskLockedForUser(quest.assigneeId, userProfile.id || '')) {
      alert(`This task is assigned to ${quest.assignee}. You cannot change its status.`);
      return;
    }

    setConfirmAction({
      title: "Update Task",
      message: `Are you sure you want to ${actionName}?`,
      icon: "update",
      confirmText: "Yes, do it",
      onConfirm: async () => {
        let newStatus: 'todo' | 'in_progress' | 'completed' = currentStatus;
        let xpDelta = 0;
        let completing = false;
        let reverting = false;

        if (direction === 'forward') {
          if (currentStatus === 'todo') newStatus = 'in_progress';
          else if (currentStatus === 'in_progress') {
            newStatus = 'completed';
            xpDelta = quest.xpReward;
            completing = true;
          }
        } else {
          if (currentStatus === 'completed') {
            newStatus = 'in_progress';
            xpDelta = -quest.xpReward;
            reverting = true;
          }
          else if (currentStatus === 'in_progress') newStatus = 'todo';
        }

        // DB writes for completions
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        
        if (userId) {
          if (completing) {
            await supabase.from('task_completions').insert({
              task_id: questId,
              user_id: userId
            });
          } else if (reverting) {
            await supabase.from('task_completions').delete()
              .eq('task_id', questId)
              .eq('user_id', userId);
          }
        }

        // Optimistic UI update
        setQuests(prev => prev.map(q => {
          if (q.id !== questId) return q;
          if (newStatus === 'completed') {
            return {
              ...q,
              status: newStatus,
              completedAt: new Date().toISOString(),
              originalDeadline: q.originalDeadline || q.deadline,
              deadline: `Completed ${new Date().toLocaleDateString()}`
            };
          } else {
            return {
              ...q,
              status: newStatus,
              completedAt: undefined,
              deadline: q.originalDeadline || q.deadline,
              originalDeadline: undefined
            };
          }
        }));

        if (xpDelta !== 0) {
          setTotalXp(prevXp => Math.max(0, prevXp + xpDelta));
          if (xpDelta > 0 && onXpEarned) onXpEarned(xpDelta, 'task');
          setUserProfile(prevProfile => {
            let nextXp = prevProfile.currentXp + xpDelta;
            let nextLevel = prevProfile.level;
            
            if (nextXp >= prevProfile.xpToNextLevel) {
              nextLevel += 1;
              nextXp -= prevProfile.xpToNextLevel;
            } 
            else if (nextXp < 0) {
              nextXp = 0; 
            }

            const prodDelta = xpDelta > 0 ? (newStatus === 'completed' ? 4 : 2) : -4;

            return { 
              ...prevProfile, 
              level: nextLevel, 
              currentXp: nextXp, 
              productivityScore: Math.min(100, Math.max(0, prevProfile.productivityScore + prodDelta)) 
            };
          });
          setFeed(prevFeed => [{
            id: `f_task_c_${Date.now()}`,
            type: 'achievement',
            title: xpDelta > 0 ? `Task Done: "${quest.title}"` : `Task Reverted: "${quest.title}"`,
            description: xpDelta > 0 ? `Great work! Earned +${xpDelta} XP.` : `Task moved back. ${xpDelta} XP deducted.`,
            timeAgo: 'Just now'
          }, ...prevFeed]);
        }
      }
    });
  };

  const handleIncrementCount = (questId: string, direction: 'up' | 'down') => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.targetCount === undefined) return;

    const current = quest.currentCount ?? 0;
    const newCount = direction === 'up'
      ? Math.min(quest.targetCount, current + 1)
      : Math.max(0, current - 1);

    const isNowComplete = newCount >= quest.targetCount && quest.status !== 'completed';

    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      if (isNowComplete) {
        return { ...q, currentCount: newCount, status: 'completed', completedAt: new Date().toISOString(), originalDeadline: q.originalDeadline || q.deadline, deadline: `Completed ${new Date().toLocaleDateString()}` };
      }
      return {
        ...q,
        currentCount: newCount,
        status: newCount < (q.targetCount ?? 0) && q.status === 'completed' ? 'in_progress' : q.status,
        completedAt: newCount < (q.targetCount ?? 0) ? undefined : q.completedAt,
        deadline: (newCount < (q.targetCount ?? 0) && q.originalDeadline) ? q.originalDeadline : q.deadline,
        originalDeadline: newCount < (q.targetCount ?? 0) ? undefined : q.originalDeadline,
      };
    }));

    if (isNowComplete) {
      setTotalXp(prev => prev + quest.xpReward);
      setUserProfile(prev => {
        let nextXp = prev.currentXp + quest.xpReward;
        let nextLevel = prev.level;
        if (nextXp >= prev.xpToNextLevel) { nextLevel += 1; nextXp -= prev.xpToNextLevel; }
        return { ...prev, level: nextLevel, currentXp: nextXp, productivityScore: Math.min(100, prev.productivityScore + 4) };
      });
      setFeed(prev => [{ id: `f_count_${Date.now()}`, type: 'achievement', title: `Count Task Done: "${quest.title}"`, description: `All ${quest.targetCount} done! +${quest.xpReward} XP earned.`, timeAgo: 'Just now' }, ...prev]);
    }
  };

  const handleClaimBonus = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest?.bonusXpPerResult) return;
    const bonus = quest.bonusXpPerResult;
    setConfirmAction({
      title: '🏆 Claim Result Bonus',
      message: `You got a result on "${quest.title}"! This will also count as +1 client contact and award you +${bonus.toLocaleString()} XP.`,
      icon: 'emoji_events',
      color: 'text-yellow-400',
      confirmText: 'Claim Bonus!',
      onConfirm: () => {
        // Increment count AND award bonus XP
        const current = quest.currentCount ?? 0;
        const newCount = current + 1; // no cap — can go beyond target for recurring results
        const reachesTarget = quest.targetCount !== undefined && newCount >= quest.targetCount && quest.status !== 'completed';

        setQuests(prev => prev.map(q => {
          if (q.id !== questId) return q;
          if (reachesTarget) {
            return { ...q, currentCount: newCount, status: 'completed', completedAt: new Date().toISOString(), originalDeadline: q.originalDeadline || q.deadline, deadline: `Completed ${new Date().toLocaleDateString()}` };
          }
          return { ...q, currentCount: newCount };
        }));

        // Award bonus XP
        setTotalXp(prev => prev + bonus);
        setUserProfile(prev => {
          let nextXp = prev.currentXp + bonus;
          let nextLevel = prev.level;
          if (nextXp >= prev.xpToNextLevel) { nextLevel += 1; nextXp -= prev.xpToNextLevel; }
          return { ...prev, level: nextLevel, currentXp: nextXp, productivityScore: Math.min(100, prev.productivityScore + 6) };
        });

        // If also completing the task, award base XP too
        if (reachesTarget) {
          setTotalXp(prev => prev + quest.xpReward);
        }

        setFeed(prev => [{
          id: `f_bonus_${Date.now()}`,
          type: 'achievement',
          title: `🏆 Bonus Result: "${quest.title}"`,
          description: `${userProfile.name} secured a result and claimed +${bonus.toLocaleString()} Bonus XP! (${newCount}/${quest.targetCount ?? '∞'})`,
          timeAgo: 'Just now'
        }, ...prev]);
      }
    });
  };

  const handleAwakeTask = (questId: string) => {
    setConfirmAction({
      title: "Awake Task",
      message: "Are you sure you want to awake this deadlined task? It will cut its XP reward in half.",
      icon: "bolt",
      color: "text-red-400",
      confirmText: "Awake",
      onConfirm: () => {
        setQuests(prev => prev.map(q => {
          if (q.id === questId) {
            const newXp = Math.max(1, Math.floor(q.xpReward / 2));
            return {
              ...q,
              xpReward: newXp,
              deadline: new Date().toISOString().split('T')[0], // Reset deadline to today
            };
          }
          return q;
        }));
        setFeed(prev => [{
          id: `f_awake_${Date.now()}`,
          type: 'challenge',
          title: 'Task Awoken!',
          description: `Deadlined task was revived for half XP.`,
          timeAgo: 'Just now'
        }, ...prev]);
      }
    });
  };

  const handleDelete = (questId: string) => {
    setConfirmAction({
      title: "Delete Task",
      message: "Are you sure you want to definitively delete this task?",
      icon: "delete",
      color: "text-red-400",
      confirmText: "Delete",
      onConfirm: () => {
        if (onDeleteTask) {
          onDeleteTask(questId);
        } else {
          setQuests(prev => prev.filter(q => q.id !== questId));
          setFeed(prev => [{ id: `f_del_${Date.now()}`, type: 'challenge', title: 'Task Removed', description: 'Task was deleted from your list.', timeAgo: 'Just now' }, ...prev]);
        }
      }
    });
  };



  const typeFilters: { key: typeof typeFilter; label: string; icon: string }[] = [
    { key: 'ALL', label: 'All Tasks', icon: 'list' },
    { key: 'today', label: 'Today', icon: 'today' },
    { key: 'weekly', label: 'This Week', icon: 'date_range' },
    { key: 'monthly', label: 'This Month', icon: 'calendar_month' },
    { key: 'long_term', label: 'Long-term', icon: 'event' },
    { key: 'golden', label: '⭐ Golden', icon: 'star' },
  ];

  const renderTaskCard = (task: Quest, showNavButtons = true) => {
    const typeInfo = TYPE_LABELS[task.taskType] || TYPE_LABELS.one_time;
    
    // Check if overdue by comparing today with deadline date
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = task.status !== 'completed' && task.deadline && task.deadline < todayStr && !task.deadline.startsWith('Completed');

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`glass-card rounded-xl p-4 relative overflow-hidden group transition-all duration-300 ${
          task.isGolden ? 'golden-goal border-l-2' : 'border border-gray-800'
        } ${isOverdue ? 'border-red-500/35 shadow-[0_0_15px_rgba(147,0,10,0.15)]' : ''} hover:shadow-lg hover:-translate-y-0.5`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isOverdue && (
              <span className="font-mono text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold animate-pulse">
                <span className="material-symbols-outlined text-[9px]">warning</span> OVERDUE
              </span>
            )}
            <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border ${typeInfo.color}`}>
              <span className="material-symbols-outlined text-[9px] mr-0.5" style={{ verticalAlign: 'middle' }}>{typeInfo.icon}</span>
              {typeInfo.label}
            </span>
            {task.isGolden && (
              <span className="font-mono text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> Golden
              </span>
            )}
            {task.reminder && (
              <span className="font-mono text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[9px]">alarm</span> {task.reminder}
              </span>
            )}
            {task.assigneeId && task.assignee !== 'ALL' && (
              <span className="font-mono text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5" title={`Assigned to ${task.assignee}`}>
                <span className="material-symbols-outlined text-[9px]">person</span> {task.assignee}
              </span>
            )}
            {!task.assigneeId && (
              <span className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Shared Task — each member completes independently">
                <span className="material-symbols-outlined text-[9px]">group</span> Shared
                {teamSize > 0 && task.completionsCount !== undefined && (
                  <span className="ml-0.5 text-emerald-300">({task.completionsCount}/{teamSize})</span>
                )}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Edit */}
            {onEditTask && task.status !== 'completed' && (
              <button onClick={() => {
                  setConfirmAction({
                    title: "Edit Task",
                    message: "Are you sure you want to edit this task?",
                    icon: "edit",
                    confirmText: "Edit",
                    onConfirm: () => onEditTask(task)
                  });
                }}
                className="text-gray-600 hover:text-primary hover:bg-gray-800 p-1 rounded-full transition-all"
                title="Edit task">
                <span className="material-symbols-outlined text-[13px]">edit</span>
              </button>
            )}
            {/* Delete confirm */}
            <button onClick={() => handleDelete(task.id)}
              className="text-gray-600 hover:text-red-400 hover:bg-gray-800 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100"
              title="Delete task">
              <span className="material-symbols-outlined text-[13px]">delete</span>
            </button>
            {/* Move forward or Awake */}
            {showNavButtons && task.status !== 'completed' && (() => {
              const isLocked = isTaskLockedForUser(task.assigneeId, userProfile.id || '');
              
              if (isOverdue) {
                return (
                  <button onClick={() => handleAwakeTask(task.id)}
                    disabled={isLocked}
                    className={`p-1 rounded-full transition-all flex items-center gap-1 px-2 ${isLocked ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300'}`}
                    title={isLocked ? `Assigned to ${task.assignee}` : 'Awake task (Cuts XP by half)'}>
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    <span className="font-mono text-[9px] font-bold">AWAKE</span>
                  </button>
                );
              }

              return (
                <button onClick={() => handleShiftStatus(task.id, task.status, 'forward')}
                  disabled={isLocked}
                  className={`p-1 rounded-full transition-all ${isLocked ? 'opacity-50 cursor-not-allowed text-gray-500' : task.status === 'in_progress' ? 'text-green-400 hover:bg-gray-800' : 'text-gray-500 hover:text-secondary hover:bg-gray-800'}`}
                  title={isLocked ? `Assigned to ${task.assignee}` : (task.status === 'in_progress' ? 'Mark complete' : 'Start working')}>
                  <span className="material-symbols-outlined text-sm">{isLocked ? 'lock' : (task.status === 'in_progress' ? 'check' : 'arrow_forward')}</span>
                </button>
              );
            })()}
            {/* Move backward */}
            {showNavButtons && task.status !== 'todo' && (() => {
              const isLocked = isTaskLockedForUser(task.assigneeId, userProfile.id || '');
              return (
                <button onClick={() => handleShiftStatus(task.id, task.status, 'backward')}
                  disabled={isLocked}
                  className={`p-1 rounded-full transition-all ${isLocked ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                  title={isLocked ? `Assigned to ${task.assignee}` : "Move back"}>
                  <span className="material-symbols-outlined text-[13px]">{isLocked ? 'lock' : 'arrow_back'}</span>
                </button>
              );
            })()}
          </div>
        </div>

        <h4 className={`font-display font-semibold text-sm leading-tight mb-1 ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white group-hover:text-primary transition-colors'}`}>
          {task.title}
        </h4>
        {task.description && task.status !== 'completed' && (
          <p className="font-sans text-xs text-gray-400 leading-normal line-clamp-2 mb-3">{task.description}</p>
        )}

        {/* Count-based progress tracker */}
        {task.targetCount !== undefined && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">Progress</span>
              <span className={`font-mono text-xs font-bold ${task.status === 'completed' ? 'text-green-400' : 'text-secondary'}`}>
                {task.currentCount ?? 0} / {task.targetCount}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${task.status === 'completed' ? 'bg-green-400' : 'bg-secondary'}`}
                style={{ width: `${Math.min(100, ((task.currentCount ?? 0) / task.targetCount) * 100)}%` }}
              />
            </div>
            {/* +/- buttons: only when not completed */}
            {task.status !== 'completed' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); handleIncrementCount(task.id, 'down'); }}
                  className="w-7 h-7 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-xs">remove</span>
                </button>
                <div className="flex-1 text-center font-mono text-[10px] text-gray-500">
                  tap <span className="text-secondary font-bold">+</span> when you talk to one
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleIncrementCount(task.id, 'up'); }}
                  className="w-7 h-7 rounded-lg bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/30 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                </button>
              </div>
            )}
            {/* Bonus Result button — always visible when active (not completed) OR when moved back */}
            {task.bonusXpPerResult && task.bonusXpPerResult > 0 && task.status !== 'completed' && (
              <button
                onClick={e => { e.stopPropagation(); handleClaimBonus(task.id); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-mono text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-yellow-500/10 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                Got a Result! &nbsp;<span className="text-yellow-300">+{task.bonusXpPerResult.toLocaleString()} XP</span>
              </button>
            )}
          </div>
        )}

        {/* Progress bar for in_progress */}
        {task.progress !== undefined && task.status === 'in_progress' && (
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
            <div className={`h-full ${task.isGolden ? 'bg-yellow-400' : 'bg-secondary'}`} style={{ width: `${task.progress}%` }} />
          </div>
        )}

        {/* Footer: deadline + XP */}
        <div className={`flex justify-between items-center font-mono text-[10px] ${task.status !== 'completed' ? 'mt-3 pt-3 border-t border-white/5' : 'mt-2'}`}>
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
            <span className="material-symbols-outlined text-sm">{task.status === 'completed' ? 'event_available' : isOverdue ? 'history' : 'calendar_today'}</span>
            <span>{task.deadline}</span>
          </div>
          {task.status !== 'completed' && (
            <div className={`font-bold ${task.isGolden ? 'text-yellow-400' : 'text-primary'}`}>+{task.xpReward} XP</div>
          )}
          {task.status === 'completed' && (
            <span className="material-symbols-outlined text-green-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">My Tasks</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">Manage and track all your tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-purple-950 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              Add Task
            </button>
          )}
        </div>
      </header>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {typeFilters.map(f => (
          <button key={f.key} onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              typeFilter === f.key
                ? 'bg-secondary/20 border border-secondary text-secondary'
                : 'bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            <span className="material-symbols-outlined text-[11px]">{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[50vh]">
        {/* To Do */}
        <div className="flex flex-col gap-3 bg-[#131b2e]/30 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-mono text-xs font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>TO DO
            </h3>
            <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">{getCols('todo').length}</span>
          </div>
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {getCols('todo').map(task => renderTaskCard(task))}
            </AnimatePresence>
            {getCols('todo').length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/5 rounded-xl text-center">
                <p className="font-mono text-[10px] text-gray-600">No tasks here</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div className="flex flex-col gap-3 bg-[#131b2e]/30 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-mono text-xs font-bold text-secondary tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>IN PROGRESS
            </h3>
            <span className="bg-secondary/10 text-secondary border border-secondary/10 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">{getCols('in_progress').length}</span>
          </div>
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {getCols('in_progress').map(task => renderTaskCard(task))}
            </AnimatePresence>
            {getCols('in_progress').length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/5 rounded-xl text-center">
                <p className="font-mono text-[10px] text-gray-600">Move a task here to start</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="flex flex-col gap-3 bg-[#131b2e]/30 p-4 rounded-xl border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-mono text-xs font-bold text-green-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>DONE
            </h3>
            <span className="bg-green-400/10 text-green-400 border border-green-400/10 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">{getCols('completed').length}</span>
          </div>
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {getCols('completed').map(task => renderTaskCard(task, true))}
            </AnimatePresence>
            {getCols('completed').length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/5 rounded-xl text-center">
                <p className="font-mono text-[10px] text-gray-600">Completed tasks appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        action={confirmAction} 
        onClose={() => setConfirmAction(null)} 
      />
    </div>
  );
}
