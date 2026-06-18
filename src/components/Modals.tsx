import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Habit, Quest, Award, GoldenGoal } from '../types';

type ModalMode = 'add_task' | 'edit_task' | 'add_habit' | 'edit_habit' | 'add_award' | 'edit_award' | 'golden_goal';

interface ModalsProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Habit) => void;
  onAddQuest: (quest: Quest) => void;
  onAddAward?: (award: Award) => void;
  onSetGoldenGoal?: (goal: GoldenGoal) => void;
  editingQuest?: Quest | null;
  editingAward?: Award | null;
  editingHabit?: Habit | null;
  onUpdateQuest?: (quest: Quest) => void;
  onUpdateAward?: (award: Award) => void;
  onUpdateHabit?: (habit: Habit) => void;
  defaultMode?: ModalMode;
  currentGoldenGoal?: GoldenGoal | null;
  teamId?: string;
}

export default function Modals({
  isOpen,
  onClose,
  onAddHabit,
  onAddQuest,
  onAddAward,
  onSetGoldenGoal,
  editingQuest,
  editingAward,
  editingHabit,
  onUpdateQuest,
  onUpdateAward,
  onUpdateHabit,
  defaultMode = 'add_task',
  currentGoldenGoal,
  teamId,
}: ModalsProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(
    editingQuest ? 'edit_task' : editingAward ? 'edit_award' : editingHabit ? 'edit_habit' : defaultMode
  );

  // Task fields
  const [title, setTitle] = useState(editingQuest?.title || '');
  const [category, setCategory] = useState(editingQuest?.category || 'Development');
  const [description, setDescription] = useState(editingQuest?.description || '');
  const [isGolden, setIsGolden] = useState(editingQuest?.isGolden || false);
  const [xp, setXp] = useState(editingQuest?.xpReward || 100);
  const [deadline, setDeadline] = useState(editingQuest?.deadline || '');
  const [reminder, setReminder] = useState(editingQuest?.reminder || '');
  const [taskType, setTaskType] = useState(editingQuest?.taskType || 'one_time');
  const [assignee, setAssignee] = useState(editingQuest?.assigneeId || 'ALL');
  const [isCountTask, setIsCountTask] = useState(!!(editingQuest?.targetCount));
  const [targetCount, setTargetCount] = useState(editingQuest?.targetCount || 5);
  const [bonusXpPerResult, setBonusXpPerResult] = useState(editingQuest?.bonusXpPerResult || 0);

  // Sync state when modal opens or editingQuest changes
  useEffect(() => {
    if (isOpen) {
      if (editingQuest) {
        setModalMode('edit_task');
        setTitle(editingQuest.title || '');
        setCategory(editingQuest.category || 'Development');
        setDescription(editingQuest.description || '');
        setIsGolden(editingQuest.isGolden || false);
        setXp(editingQuest.xpReward || 100);
        setDeadline(editingQuest.deadline?.replace('Completed ', '') || '');
        setReminder(editingQuest.reminder || '');
        setTaskType(editingQuest.taskType || 'one_time');
        setAssignee(editingQuest.assigneeId || 'ALL');
        setIsCountTask(!!(editingQuest.targetCount));
        setTargetCount(editingQuest.targetCount || 5);
        setBonusXpPerResult(editingQuest.bonusXpPerResult || 0);
      } else if (editingAward) {
        setModalMode('edit_award');
        setAwardTitle(editingAward.title || '');
        setAwardDesc(editingAward.description || '');
        setAwardXpReward(editingAward.xpReward || 0);
        setAwardDeadline(editingAward.deadline ? editingAward.deadline.split('T')[0] : '');
      } else if (editingHabit) {
        setModalMode('edit_habit');
        setTitle(editingHabit.title || '');
        setHabitCategory(editingHabit.category || 'FOCUS');
        setHabitReminder(editingHabit.reminder || '');
        setHabitFrequency(editingHabit.frequency || 3);
        setHabitPeriod(editingHabit.period || 'week');
        setXp(editingHabit.xpPerDay || 50);
      } else {
        setModalMode(defaultMode);
        setTitle('');
        setCategory('Development');
        setDescription('');
        setIsGolden(false);
        setXp(100);
        setDeadline('');
        setReminder('');
        setTaskType('one_time');
        setAssignee('ALL');
        setIsCountTask(false);
        setTargetCount(5);
        setBonusXpPerResult(0);
        setAwardTitle('');
        setAwardDesc('');
        setAwardXpReward(0);
        setAwardDeadline('');
        setHabitCategory('FOCUS');
        setHabitReminder('');
        setHabitFrequency(3);
        setHabitPeriod('week');
      }
    }
  }, [isOpen, editingQuest, editingAward, editingHabit, defaultMode]);

  // Team users fetched from Supabase for assignee dropdown
  const [teamUsers, setTeamUsers] = useState<{ id: string; name: string; avatar: string | null }[]>([]);
  useEffect(() => {
    if (!isOpen || !teamId) return;
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .eq('team_id', teamId)
          .order('name');
        setTeamUsers(data || []);
      } catch (e) {
        console.error('Failed to fetch team users:', e);
      }
    };
    fetchUsers();
  }, [isOpen, teamId]);

  // Habit fields
  const [habitCategory, setHabitCategory] = useState<'HEALTH' | 'FOCUS' | 'MIND'>('FOCUS');
  const [habitReminder, setHabitReminder] = useState('');
  const [habitFrequency, setHabitFrequency] = useState(3);
  const [habitPeriod, setHabitPeriod] = useState<'week' | 'month'>('week');

  // Award fields
  const [awardTitle, setAwardTitle] = useState('');
  const [awardDesc, setAwardDesc] = useState('');
  const [awardXpReward, setAwardXpReward] = useState(0);
  const [awardDeadline, setAwardDeadline] = useState('');

  // Golden goal fields
  const [ggTitle, setGgTitle] = useState(currentGoldenGoal?.title || '');
  const [ggDesc, setGgDesc] = useState(currentGoldenGoal?.description || '');
  const [ggTargetDate, setGgTargetDate] = useState(currentGoldenGoal?.targetDate || '');
  const [ggXpReward, setGgXpReward] = useState(currentGoldenGoal?.xpReward || 1000);

  if (!isOpen) return null;

  const taskTypes = [
    { value: 'today', label: 'Today', icon: 'today', deadlineDays: 0 },
    { value: 'weekly', label: 'This Week', icon: 'date_range', deadlineDays: 7 },
    { value: 'monthly', label: 'This Month', icon: 'calendar_month', deadlineDays: 30 },
    { value: 'long_term', label: 'Long-term', icon: 'event', deadlineDays: null },
  ] as const;

  const taskCategories = ['Development', 'Design', 'Strategic', 'Marketing', 'Health', 'Learning', 'Personal'];

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Please enter a task title.'); return; }

    // Auto-set deadline based on timeframe if not manually set
    const selectedType = taskTypes.find(t => t.value === taskType);
    let autoDeadline = deadline;
    if (!deadline && selectedType && selectedType.deadlineDays !== null) {
      const d = new Date();
      d.setDate(d.getDate() + selectedType.deadlineDays);
      autoDeadline = d.toISOString().split('T')[0];
    }

    const assigneeId = assignee === 'ALL' ? null : assignee;
    const assigneeName = assigneeId
      ? teamUsers.find(u => u.id === assigneeId)?.name || 'Unknown'
      : 'ALL';

    if (modalMode === 'edit_task' && editingQuest && onUpdateQuest) {
      onUpdateQuest({ ...editingQuest, title, category: category as any, description, isGolden, xpReward: Number(xp), deadline: autoDeadline || editingQuest.deadline, reminder: reminder || undefined, taskType: taskType as any, assignee: assigneeName, assigneeId, targetCount: isCountTask ? Number(targetCount) : undefined, bonusXpPerResult: isCountTask && bonusXpPerResult > 0 ? Number(bonusXpPerResult) : undefined });
    } else {
      const newQuest: Quest = {
        id: `q_usr_${Date.now()}`,
        title, description: description || 'No details added.',
        category: category as any,
        status: 'todo',
        isGolden,
        taskType: taskType as any,
        deadline: autoDeadline || 'No deadline set',
        xpReward: Number(xp) || 100,
        reminder: reminder || undefined,
        assignee: assigneeName,
        assigneeId,
        targetCount: isCountTask ? Number(targetCount) : undefined,
        currentCount: isCountTask ? 0 : undefined,
        bonusXpPerResult: isCountTask && bonusXpPerResult > 0 ? Number(bonusXpPerResult) : undefined,
      };
      onAddQuest(newQuest);
    }
    resetAndClose();
  };

  const handleSubmitHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Please enter a habit name.'); return; }
    const iconMap = { HEALTH: 'directions_run', FOCUS: 'psychology', MIND: 'menu_book' };
    // get end-of-period deadline
    const now = new Date();
    let deadline: string;
    if (habitPeriod === 'week') {
      const day = now.getDay();
      const daysToSunday = day === 0 ? 0 : 7 - day;
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + daysToSunday);
      deadline = sunday.toISOString();
    } else {
      deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }
    const newHabit: Habit = {
      id: editingHabit?.id || `h_usr_${Date.now()}`,
      userId: editingHabit?.userId,
      ownerName: editingHabit?.ownerName,
      title, category: habitCategory, icon: iconMap[habitCategory],
      streak: editingHabit?.streak ?? 0,
      xpPerDay: Number(xp) || 50,
      levelProgress: editingHabit?.levelProgress ?? 0,
      reminder: habitReminder || undefined,
      activityGrid: editingHabit?.activityGrid ?? [],
      frequency: habitFrequency,
      period: habitPeriod,
      completionsThisPeriod: editingHabit?.completionsThisPeriod ?? 0,
      periodDeadline: editingHabit?.periodDeadline ?? deadline,
    };
    if (modalMode === 'edit_habit' && editingHabit && onUpdateHabit) {
      onUpdateHabit(newHabit);
    } else {
      onAddHabit(newHabit);
    }
    resetAndClose();
  };

  const handleSubmitAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardTitle.trim()) { alert('Please enter an award name.'); return; }
    if (!awardDeadline) { alert('Please set a deadline for the award.'); return; }
    if (modalMode === 'edit_award' && editingAward && onUpdateAward) {
      onUpdateAward({
        ...editingAward,
        title: awardTitle,
        description: awardDesc || undefined,
        xpReward: awardXpReward,
        deadline: new Date(awardDeadline).toISOString(),
      });
    } else if (onAddAward) {
      onAddAward({
        id: `aw_${Date.now()}`,
        title: awardTitle,
        description: awardDesc || undefined,
        xpReward: awardXpReward,
        deadline: new Date(awardDeadline).toISOString(),
        achieved: false,
      });
    }
    resetAndClose();
  };

  const handleSubmitGoldenGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ggTitle.trim()) { alert('Please enter your big goal.'); return; }
    if (onSetGoldenGoal) {
      onSetGoldenGoal({
        id: currentGoldenGoal?.id || `gg_${Date.now()}`,
        title: ggTitle,
        description: ggDesc || undefined,
        targetDate: ggTargetDate || undefined,
        progress: currentGoldenGoal?.progress || 0,
        xpReward: ggXpReward,
        achieved: currentGoldenGoal?.achieved || false,
      });
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setTitle(''); setDescription(''); setIsGolden(false); setDeadline(''); setReminder('');
    setAwardTitle(''); setAwardDesc(''); setAwardDeadline(''); setGgTitle(''); setGgDesc('');
    onClose();
  };



  const inputCls = "w-full p-2.5 rounded-lg border border-gray-800 bg-[#0b1326] text-white focus:outline-none focus:border-primary transition-all text-xs font-sans";

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg border border-primary/25 bg-[#131b2e] rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 shrink-0 bg-black/20">
          <span className="material-symbols-outlined text-primary">
            {modalMode === 'add_task' ? 'add_task' : 
             modalMode === 'edit_task' ? 'edit' : 
             modalMode === 'add_habit' || modalMode === 'edit_habit' ? 'local_fire_department' : 
             modalMode === 'add_award' || modalMode === 'edit_award' ? 'emoji_events' : 'star'}
          </span>
          <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            {modalMode === 'add_task' ? 'Add Task' : 
             modalMode === 'edit_task' ? 'Edit Task' : 
             modalMode === 'add_habit' ? 'Add Habit' :
             modalMode === 'edit_habit' ? 'Edit Habit' :
             modalMode === 'add_award' ? 'Add Award' :
             modalMode === 'edit_award' ? 'Edit Award' : 'Big Dream Goal'}
          </h2>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1">

          {/* ─── ADD / EDIT TASK ─── */}
          {(modalMode === 'add_task' || modalMode === 'edit_task') && (
            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 text-xs font-mono">
              
              {/* Task Timeframe selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Task Timeframe</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {taskTypes.map(tt => (
                    <button key={tt.value} type="button" onClick={() => setTaskType(tt.value as any)}
                      className={`p-2 rounded-lg text-center border font-mono text-[8px] font-bold uppercase tracking-wide transition-all flex flex-col items-center gap-1 ${
                        taskType === tt.value ? 'border-secondary bg-secondary/10 text-secondary' : 'border-gray-800 bg-transparent text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{tt.icon}</span>
                      {tt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title and Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Task Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Read 30 mins..." className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assignee</label>
                  <select
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                    className={inputCls}
                  >
                    <option value="ALL">👥 ALL (Shared Task)</option>
                    {teamUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                    {teamUsers.length === 0 && teamId && (
                      <option disabled>No team members found</option>
                    )}
                    {!teamId && (
                      <option disabled>Loading team...</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {taskCategories.map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      className={`p-2 rounded-lg text-center border font-mono text-[8px] font-bold uppercase tracking-wide transition-all ${
                        category === cat ? 'border-secondary bg-secondary/10 text-secondary' : 'border-gray-800 bg-transparent text-gray-400'
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What needs to be done?" rows={2}
                  className="w-full p-2.5 rounded-lg border border-gray-800 bg-[#0b1326] text-white focus:outline-none focus:border-primary transition-all text-xs resize-none font-sans" />
              </div>

              {/* Deadline + Reminder */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Deadline</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">alarm</span>Reminder
                  </label>
                  <input type="time" value={reminder} onChange={e => setReminder(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* XP + Golden */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    <span>XP Reward</span><span className="text-primary">{xp} XP</span>
                  </div>
                  <input type="range" min={25} max={1000} step={25} value={xp} onChange={e => setXp(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Tier</label>
                  <button type="button" onClick={() => setIsGolden(!isGolden)}
                    className={`w-full p-2.5 rounded-lg border font-mono text-[9px] font-bold uppercase text-center transition-all ${
                      isGolden ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-gray-800 bg-transparent text-gray-400'
                    }`}
                  >
                    {isGolden ? '⭐ Golden Task' : 'Standard Task'}
                  </button>
                </div>
              </div>

              {/* Count-based Task Toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsCountTask(!isCountTask)}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                    isCountTask
                      ? 'border-secondary/50 bg-secondary/10 text-secondary'
                      : 'border-gray-800 bg-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isCountTask ? "'FILL' 1" : "'FILL' 0" }}>pin</span>
                  {isCountTask ? '✓ Count-Based Task Enabled' : 'Enable Count-Based Progress'}
                </button>
                {isCountTask && (
                  <div className="space-y-2">
                    {/* Target Count row */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/5 border border-secondary/20">
                      <span className="material-symbols-outlined text-secondary text-sm">tag</span>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex-1">Target Count</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
                          className="w-6 h-6 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center font-bold transition-all">
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>
                        <input
                          type="number" min={1} max={999} value={targetCount}
                          onChange={e => setTargetCount(Math.max(1, Number(e.target.value)))}
                          className="w-14 text-center bg-[#0b1326] border border-gray-700 rounded-lg py-1 text-sm font-bold text-white focus:outline-none focus:border-secondary"
                        />
                        <button type="button" onClick={() => setTargetCount(Math.min(999, targetCount + 1))}
                          className="w-6 h-6 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center font-bold transition-all">
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    </div>
                    {/* Bonus XP per Result row */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                      <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-yellow-400/80 uppercase tracking-widest font-bold block">Bonus XP per Result</label>
                        <p className="text-[9px] text-gray-500 mt-0.5">e.g. +500 XP each time someone gets an agreement</p>
                      </div>
                      <input
                        type="number" min={0} max={9999} step={50} value={bonusXpPerResult}
                        onChange={e => setBonusXpPerResult(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-16 text-center bg-[#0b1326] border border-yellow-700/40 rounded-lg py-1 text-sm font-bold text-yellow-400 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={resetAndClose}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg uppercase tracking-wider text-[10px]">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-primary text-purple-950 font-bold rounded-lg uppercase tracking-wider text-[10px] hover:brightness-110 shadow-lg shadow-primary/20">
                  {modalMode === 'edit_task' ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          )}

          {/* ─── ADD / EDIT HABIT ─── */}
          {(modalMode === 'add_habit' || modalMode === 'edit_habit') && (
            <form onSubmit={handleSubmitHabit} className="p-6 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Habit Name *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Morning Run, Read 20 pages..." className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HEALTH', 'FOCUS', 'MIND'] as const).map(cat => (
                    <button key={cat} type="button" onClick={() => setHabitCategory(cat)}
                      className={`p-2.5 rounded-lg text-center border font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                        habitCategory === cat ? 'border-secondary bg-secondary/10 text-secondary' : 'border-gray-800 bg-transparent text-gray-400'
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">How often?</label>
                <div className="flex gap-2 mb-2">
                  {(['week', 'month'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setHabitPeriod(p)}
                      className={`flex-1 py-1.5 rounded border font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                        habitPeriod === p ? 'border-secondary bg-secondary/10 text-secondary' : 'border-gray-800 text-gray-400'
                      }`}
                    >Per {p}</button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,7].map(n => (
                    <button key={n} type="button" onClick={() => setHabitFrequency(n)}
                      className={`w-8 h-8 rounded border font-mono text-xs font-bold transition-all ${
                        habitFrequency === n ? 'border-primary bg-primary/15 text-primary' : 'border-gray-800 text-gray-500'
                      }`}
                    >{n}</button>
                  ))}
                  <span className="self-center font-mono text-[9px] text-gray-500 ml-1">times per {habitPeriod}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    <span>XP / Check-in</span><span className="text-primary">{xp} XP</span>
                  </div>
                  <input type="range" min={10} max={300} step={10} value={xp} onChange={e => setXp(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">alarm</span>Reminder
                  </label>
                  <input type="time" value={habitReminder} onChange={e => setHabitReminder(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={resetAndClose}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg uppercase tracking-wider text-[10px]">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-primary text-purple-950 font-bold rounded-lg uppercase tracking-wider text-[10px] hover:brightness-110 shadow-lg shadow-primary/20">
                  {modalMode === 'edit_habit' ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </form>
          )}

          {/* ─── ADD / EDIT AWARD ─── */}
          {(modalMode === 'add_award' || modalMode === 'edit_award') && (
            <form onSubmit={handleSubmitAward} className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2 mb-2">
                <span className="material-symbols-outlined text-yellow-400 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <p className="font-sans text-xs text-gray-300 leading-relaxed">
                  {modalMode === 'edit_award'
                    ? 'Update your competition details. The winner gets the XP reward at the deadline.'
                    : 'Start a time-bound competition. The team member who earns the most XP by the deadline wins the reward.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Award Name *</label>
                <input type="text" value={awardTitle} onChange={e => setAwardTitle(e.target.value)}
                  placeholder="e.g. Buy new headphones, Weekend trip..." className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Description (optional)</label>
                <input type="text" value={awardDesc} onChange={e => setAwardDesc(e.target.value)}
                  placeholder="What is this reward for?" className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Deadline *</label>
                <input type="date" value={awardDeadline} onChange={e => setAwardDeadline(e.target.value)} className={inputCls} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={resetAndClose}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg uppercase tracking-wider text-[10px]">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-yellow-500 text-yellow-950 font-bold rounded-lg uppercase tracking-wider text-[10px] hover:brightness-110 shadow-lg shadow-yellow-500/20">
                  {modalMode === 'edit_award' ? 'Save Changes' : 'Set Award'}
                </button>
              </div>
            </form>
          )}

          {/* ─── GOLDEN GOAL ─── */}
          {modalMode === 'golden_goal' && (
            <form onSubmit={handleSubmitGoldenGoal} className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent flex items-start gap-2 mb-2">
                <span className="material-symbols-outlined text-yellow-400 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <p className="font-display font-bold text-sm text-yellow-300">Your Big Dream Goal</p>
                  <p className="font-sans text-xs text-gray-300 mt-1 leading-relaxed">
                    Set the one big goal that drives everything you do. It will always show on your dashboard.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Your Big Dream *</label>
                <input type="text" value={ggTitle} onChange={e => setGgTitle(e.target.value)}
                  placeholder="e.g. Launch my own app, Run a marathon..." className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Why this matters to you</label>
                <textarea value={ggDesc} onChange={e => setGgDesc(e.target.value)}
                  placeholder="What will achieving this mean for you?" rows={2}
                  className="w-full p-2.5 rounded-lg border border-gray-800 bg-[#0b1326] text-white focus:outline-none focus:border-primary transition-all text-xs resize-none font-sans" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Target Date</label>
                  <input type="date" value={ggTargetDate} onChange={e => setGgTargetDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    <span>XP Reward</span><span className="text-yellow-400">{ggXpReward.toLocaleString()} XP</span>
                  </div>
                  <input type="range" min={500} max={10000} step={500} value={ggXpReward} onChange={e => setGgXpReward(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={resetAndClose}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg uppercase tracking-wider text-[10px]">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 font-bold rounded-lg uppercase tracking-wider text-[10px] hover:brightness-110 shadow-lg shadow-yellow-500/20">
                  {currentGoldenGoal ? 'Update Dream Goal' : 'Set My Dream Goal'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// Trigger TS Service reload

