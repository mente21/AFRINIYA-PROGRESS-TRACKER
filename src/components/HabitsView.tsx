import React, { useState } from 'react';
import { Habit, UserProfile, FeedItem } from '../types';
import ConfirmModal, { ConfirmActionData } from './ConfirmModal';

interface HabitsViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  currentUserId?: string;
  onAddHabit?: (habit: Habit) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
  onHabitCheckIn?: (habitId: string, updates: Partial<Habit>, xpEarned: number) => void;
}

// Helper: get ISO end-of-week (Sunday) or end-of-month from today
function getPeriodDeadline(period: 'week' | 'month'): string {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay(); // 0=Sun, 1=Mon...
    const daysToSunday = day === 0 ? 0 : 7 - day;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysToSunday);
    sunday.setHours(23, 59, 59, 0);
    return sunday.toISOString();
  } else {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return lastDay.toISOString();
  }
}

function isPeriodExpired(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export default function HabitsView({
  userProfile,
  setUserProfile,
  habits,
  setHabits,
  totalXp,
  setTotalXp,
  setFeed,
  currentUserId,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onHabitCheckIn,
}: HabitsViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'HEALTH' | 'FOCUS' | 'MIND'>('ALL');
  const [confirmAction, setConfirmAction] = useState<ConfirmActionData | null>(null);

  // Add habit form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'HEALTH' | 'FOCUS' | 'MIND'>('FOCUS');
  const [newFrequency, setNewFrequency] = useState(3);
  const [newPeriod, setNewPeriod] = useState<'week' | 'month'>('week');
  const [newXp, setNewXp] = useState(50);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredHabits = habits.filter(h => filter === 'ALL' || h.category === filter);

  // Check in: any team member can independently check in on any habit
  const handleCheckIn = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    setConfirmAction({
      title: "Log Check-in",
      message: `Are you sure you want to check in for "${habit.title}"?`,
      icon: "task_alt",
      confirmText: "Check In",
      onConfirm: () => {
        const expired = isPeriodExpired(habit.periodDeadline);
        const completions = expired ? 0 : habit.completionsThisPeriod;
        const deadline = expired ? getPeriodDeadline(habit.period) : habit.periodDeadline;

        if (completions >= habit.frequency) return;

        const xpEarned = habit.xpPerDay;
        const newCompletions = completions + 1;
        const newStreak = habit.streak + 1;
        const updates = {
          streak: newStreak,
          completionsThisPeriod: newCompletions,
          periodDeadline: deadline,
          levelProgress: Math.min(100, habit.levelProgress + Math.round(100 / (habit.frequency * 4))),
        };

        if (onHabitCheckIn) {
          onHabitCheckIn(habitId, updates, xpEarned);
        } else {
          setHabits(prev => prev.map(h => h.id !== habitId ? h : { ...h, ...updates }));
          setTotalXp(p => p + xpEarned);
          setUserProfile(p => {
            const nextXp = p.currentXp + xpEarned;
            return nextXp >= p.xpToNextLevel
              ? { ...p, level: p.level + 1, currentXp: nextXp - p.xpToNextLevel, productivityScore: Math.min(100, p.productivityScore + 2) }
              : { ...p, currentXp: nextXp, productivityScore: Math.min(100, p.productivityScore + 1) };
          });
        }

        setFeed(prev => [{
          id: `f_habit_${Date.now()}`,
          type: 'achievement',
          title: `Habit Check-in: "${habit.title}"`,
          description: `${newCompletions}/${habit.frequency} this ${habit.period} done! +${xpEarned} XP earned.`,
          timeAgo: 'Just now'
        }, ...prev]);
      }
    });
  };

  // Create new habit
  const handleAddHabit = () => {
    if (!newTitle.trim()) { alert('Please enter a habit name.'); return; }
    const iconMap = { HEALTH: 'directions_run', FOCUS: 'psychology', MIND: 'menu_book' };
    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      userId: currentUserId,
      ownerName: userProfile.name,
      title: newTitle.trim(),
      category: newCategory,
      icon: iconMap[newCategory],
      streak: 0,
      xpPerDay: newXp,
      levelProgress: 0,
      activityGrid: [],
      frequency: newFrequency,
      period: newPeriod,
      completionsThisPeriod: 0,
      periodDeadline: getPeriodDeadline(newPeriod),
    };
    if (onAddHabit) {
      onAddHabit(newHabit);
    } else {
      setHabits(prev => [newHabit, ...prev]);
    }
    setFeed(prev => [{
      id: `f_habit_new_${Date.now()}`,
      type: 'achievement',
      title: `New Habit Started: "${newTitle}"`,
      description: `Target: ${newFrequency}x per ${newPeriod}. +${newXp} XP per check-in.`,
      timeAgo: 'Just now'
    }, ...prev]);
    setNewTitle('');
    setNewFrequency(3);
    setNewXp(50);
    setShowAddForm(false);
  };

  const themeColor = (cat: string, type: 'text' | 'bg' | 'border') => {
    const map: Record<string, Record<string, string>> = {
      HEALTH: { text: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary' },
      FOCUS: { text: 'text-primary', bg: 'bg-primary', border: 'border-primary' },
      MIND: { text: 'text-tertiary', bg: 'bg-tertiary', border: 'border-tertiary' },
    };
    return map[cat]?.[type] ?? '';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Habits & Goals</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">See all team habits — check in and manage only your own.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel rounded-xl px-4 py-2.5 flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[#efc200] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-display font-extrabold text-white">{totalXp.toLocaleString()}</span>
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">XP</span>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-purple-950 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[13px]">{showAddForm ? 'close' : 'add'}</span>
            {showAddForm ? 'Cancel' : 'Add Habit'}
          </button>
        </div>
      </header>

      {/* Add Habit Form (simple inline) */}
      {showAddForm && (
        <section className="glass-panel rounded-2xl p-5 border border-primary/20 space-y-4">
          <h2 className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">New Habit</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Habit Name *</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Read for 30 min, Go to gym..."
                className="w-full bg-[#0b1326] border border-gray-800 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Category</label>
              <div className="flex gap-2">
                {(['FOCUS', 'HEALTH', 'MIND'] as const).map(cat => (
                  <button key={cat} type="button" onClick={() => setNewCategory(cat)}
                    className={`flex-1 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider border transition-all ${
                      newCategory === cat ? `${themeColor(cat, 'border')} ${themeColor(cat, 'text')} bg-white/5` : 'border-gray-800 text-gray-500'
                    }`}
                  >{cat}</button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Per Period</label>
              <div className="flex gap-2">
                {(['week', 'month'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setNewPeriod(p)}
                    className={`flex-1 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider border transition-all ${
                      newPeriod === p ? 'border-secondary text-secondary bg-secondary/10' : 'border-gray-800 text-gray-500'
                    }`}
                  >Per {p}</button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                Frequency — <span className="text-white font-bold">{newFrequency}x per {newPeriod}</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <button key={n} type="button" onClick={() => setNewFrequency(n)}
                    className={`w-8 h-8 rounded font-mono text-xs font-bold border transition-all ${
                      newFrequency === n ? 'border-primary bg-primary/15 text-primary' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* XP per check-in */}
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                XP per check-in — <span className="text-primary font-bold">{newXp} XP</span>
              </label>
              <input type="range" min={10} max={300} step={10} value={newXp} onChange={e => setNewXp(Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg font-mono text-[10px] uppercase tracking-wider">
              Cancel
            </button>
            <button onClick={handleAddHabit}
              className="px-5 py-2 bg-primary text-purple-950 font-bold rounded-lg font-mono text-[10px] uppercase tracking-wider hover:brightness-110 shadow-lg shadow-primary/20">
              Add Habit
            </button>
          </div>
        </section>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
        {(['ALL', 'HEALTH', 'FOCUS', 'MIND'] as const).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full font-mono text-[10px] tracking-wider font-bold transition-all shrink-0 border ${
              filter === cat
                ? cat === 'ALL' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : cat === 'HEALTH' ? 'bg-secondary/25 border-secondary text-secondary'
                  : cat === 'FOCUS' ? 'bg-primary/25 border-primary text-primary'
                  : 'bg-tertiary/25 border-tertiary text-tertiary'
                : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {cat === 'ALL' ? 'All Habits' : cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredHabits.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-gray-600 text-5xl">local_fire_department</span>
          <p className="font-display font-bold text-gray-400">No habits yet</p>
          <p className="font-sans text-xs text-gray-600">Click "Add Habit" to create your first recurring habit.</p>
        </div>
      )}

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredHabits.map(habit => {
          const expired = isPeriodExpired(habit.periodDeadline);
          const completions = expired ? 0 : habit.completionsThisPeriod;
          const isDone = completions >= habit.frequency;

          const accentBg = themeColor(habit.category, 'bg');
          const accentText = themeColor(habit.category, 'text');
          const accentBorder = themeColor(habit.category, 'border');

          const isOwn = !habit.userId || habit.userId === currentUserId;

          return (
            <article key={habit.id} className="glass-panel rounded-2xl p-5 flex flex-col gap-4 relative group transition-colors hover:bg-[#222a3d]/50">
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBg} rounded-l-2xl`} />

              {/* Header */}
              <div className="flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`material-symbols-outlined text-[14px] ${accentText}`}>{habit.icon}</span>
                    <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${accentText}`}>{habit.category}</span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-white leading-tight">{habit.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {isOwn ? (
                      <span className="font-mono text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[9px]">person</span> Your habit
                      </span>
                    ) : habit.ownerName ? (
                      <span className="font-mono text-[8px] bg-gray-800/60 text-gray-400 border border-gray-700/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[9px]">person</span> {habit.ownerName}
                      </span>
                    ) : null}
                    <span className="font-mono text-[9px] text-gray-500">
                      {habit.frequency}× per {habit.period} · +{habit.xpPerDay} XP each
                    </span>
                  </div>
                </div>

                {/* Streak count + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center bg-[#1e293b]/80 border border-white/5 rounded-xl p-2 min-w-[50px]">
                    <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    <span className="font-display text-white text-xs font-bold mt-0.5">{habit.streak}</span>
                  </div>
                  {isOwn && (
                    <div className="flex items-center gap-1.5">
                      {onEditHabit && (
                        <button onClick={() => onEditHabit(habit)}
                          className="p-1.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-primary border border-white/5 transition-all"
                          title="Edit habit">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                      )}
                      <button onClick={() => {
                          setConfirmAction({
                            title: "Delete Habit",
                            message: "Are you sure you want to completely remove this habit and its history?",
                            icon: "delete",
                            color: "text-red-400",
                            confirmText: "Delete",
                            onConfirm: () => {
                              if (onDeleteHabit) onDeleteHabit(habit.id);
                              else setHabits(p => p.filter(h => h.id !== habit.id));
                            }
                          });
                        }}
                        className="p-1.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-red-400 border border-white/5 transition-all"
                        title="Delete habit">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Period Progress Dots */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[9px] text-gray-400">
                  <span>This {habit.period}</span>
                  <span className={isDone ? 'text-green-400 font-bold' : accentText}>
                    {isDone ? '✓ Complete!' : `${completions} / ${habit.frequency} done`}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: habit.frequency }).map((_, i) => {
                    const done = i < completions;
                    return (
                      <div key={i} className={`flex-1 min-w-[20px] h-2.5 rounded-full transition-all ${
                        done ? `${accentBg} shadow-sm`
                        : 'bg-gray-800 border border-gray-700'
                      }`} />
                    );
                  })}
                </div>
                {habit.periodDeadline && !expired && (
                  <p className="font-mono text-[8px] text-gray-600 uppercase tracking-wider">
                    Period ends: {new Date(habit.periodDeadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Level XP bar */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-gray-500">
                  <span>Level Progress</span>
                  <span>{habit.levelProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className={`h-full ${accentBg} rounded-full transition-all duration-500`} style={{ width: `${habit.levelProgress}%` }} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/5 z-10">
                {/* Check-in */}
                <button
                  onClick={() => handleCheckIn(habit.id)}
                  disabled={isDone && !expired}
                  className={`flex-1 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                    isDone && !expired
                      ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                      : `border ${accentBorder} ${accentText} hover:bg-white/5 active:scale-95`
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {isDone && !expired ? 'check_circle' : 'add_circle'}
                  </span>
                  {isDone && !expired ? 'Done this period' : `Check In (+${habit.xpPerDay} XP)`}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      
      <ConfirmModal 
        action={confirmAction} 
        onClose={() => setConfirmAction(null)} 
      />
    </div>
  );
}
