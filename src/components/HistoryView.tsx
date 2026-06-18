import React, { useState, useMemo } from 'react';
import { Quest, Habit } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  quests: Quest[];
  habits: Habit[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HistoryView({ quests, habits }: HistoryViewProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build completion map: key = "YYYY-MM-DD" → array of completed task titles
  const completionMap = useMemo(() => {
    const map: Record<string, { title: string; xp: number; type: 'task' | 'habit' }[]> = {};

    quests.filter(q => q.completedAt).forEach(q => {
      const dateKey = q.completedAt!.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({ title: q.title, xp: q.xpReward, type: 'task' });
    });

    // Add some mock habit completions for demonstration from activity grid
    habits.forEach(h => {
      const completedCount = h.activityGrid.filter(c => c === 'completed').length;
      // Mark the last N days as having this habit
      for (let i = 0; i < Math.min(completedCount, 30); i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i - 1);
        const dk = d.toISOString().slice(0, 10);
        if (!map[dk]) map[dk] = [];
        if (!map[dk].find(x => x.title === h.title)) {
          map[dk].push({ title: h.title, xp: h.xpPerDay, type: 'habit' });
        }
      }
    });

    return map;
  }, [quests, habits]);

  // Generate calendar grid for selected month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (null | { date: Date; key: string })[] = [];

    // Pad with nulls for days before first of month
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      days.push({ date, key: date.toISOString().slice(0, 10) });
    }
    return days;
  }, [viewYear, viewMonth]);

  // Heatmap intensity for the last 18 weeks (GitHub-style)
  const heatmapWeeks = useMemo(() => {
    const weeks: { dateKey: string; count: number }[][] = [];
    const start = new Date(now);
    start.setDate(start.getDate() - 18 * 7);

    let week: { dateKey: string; count: number }[] = [];
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      week.push({ dateKey: key, count: completionMap[key]?.length || 0 });
      if (d.getDay() === 6) { weeks.push(week); week = []; }
    }
    if (week.length) weeks.push(week);
    return weeks;
  }, [completionMap]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const todayKey = now.toISOString().slice(0, 10);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-800 border-gray-700';
    if (count === 1) return 'bg-primary/20 border-primary/30';
    if (count === 2) return 'bg-primary/40 border-primary/50';
    if (count === 3) return 'bg-primary/60 border-primary/70';
    return 'bg-primary border-primary/80 shadow-[0_0_4px_rgba(221,183,255,0.4)]';
  };

  const selectedDayItems = selectedDay ? (completionMap[selectedDay] || []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">History</h1>
        <p className="font-sans text-sm text-gray-400 mt-1">
          All your completed tasks and habits — nothing is ever deleted.
        </p>
      </header>

      {/* Activity Heatmap (GitHub-style) */}
      <section className="glass-panel rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">grid_on</span>
            Activity Overview (Last 18 Weeks)
          </h2>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500 uppercase">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`w-3 h-3 rounded-sm border ${getIntensityClass(i)}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <button
                    key={di}
                    onClick={() => setSelectedDay(day.dateKey === selectedDay ? null : day.dateKey)}
                    title={`${day.dateKey}: ${day.count} completion${day.count !== 1 ? 's' : ''}`}
                    className={`w-3 h-3 rounded-sm border transition-all hover:scale-125 hover:z-10 relative ${getIntensityClass(day.count)} ${selectedDay === day.dateKey ? 'ring-1 ring-white/50' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lazy days flag */}
        {(() => {
          const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now); d.setDate(d.getDate() - i);
            return d.toISOString().slice(0, 10);
          });
          const lazyDays = last7.filter(dk => !completionMap[dk] || completionMap[dk].length === 0).length;
          if (lazyDays >= 3) return (
            <div className="mt-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-sm">warning</span>
              <p className="font-mono text-[10px] text-orange-300 font-bold">{lazyDays} out of the last 7 days had no completions — keep pushing!</p>
            </div>
          );
          return null;
        })()}

        {/* Clicked day details */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider mb-2">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {selectedDayItems.length === 0 ? (
                  <p className="font-sans text-xs text-gray-500 italic">Nothing completed this day.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedDayItems.map((item, i) => (
                      <span key={i} className={`font-mono text-[9px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${
                        item.type === 'task' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/10 border-secondary/20 text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-[10px]">{item.type === 'task' ? 'check_circle' : 'local_fire_department'}</span>
                        {item.title} (+{item.xp} XP)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Calendar view */}
      <section className="glass-panel rounded-2xl p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-base text-white">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }}
              className="px-3 py-1 rounded-full font-mono text-[9px] font-bold border border-white/5 text-gray-400 hover:text-white hover:border-white/15 transition-all uppercase tracking-wider">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-mono text-[9px] text-gray-500 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const count = completionMap[day.key]?.length || 0;
            const isToday = day.key === todayKey;
            const isSelected = day.key === selectedDay;
            const isFuture = day.date > now;

            return (
              <button
                key={day.key}
                onClick={() => !isFuture && setSelectedDay(isSelected ? null : day.key)}
                disabled={isFuture}
                className={`aspect-square rounded-lg border text-center flex flex-col items-center justify-center transition-all relative ${
                  isFuture ? 'border-transparent text-gray-700 cursor-default' :
                  isSelected ? 'border-primary bg-primary/20 ring-1 ring-primary' :
                  isToday ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' :
                  count > 0 ? 'border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer' :
                  'border-gray-800 hover:border-gray-600 cursor-pointer'
                }`}
              >
                <span className={`font-mono text-[11px] font-bold ${isToday ? 'text-primary' : isFuture ? 'text-gray-700' : 'text-gray-300'}`}>
                  {day.date.getDate()}
                </span>
                {count > 0 && !isFuture && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                    {count > 3 && <div className="w-1 h-1 rounded-full bg-secondary" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent completions list */}
      <section className="glass-panel rounded-2xl p-5">
        <h2 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400 text-base">task_alt</span>
          All Completed Tasks
        </h2>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {quests.filter(q => q.status === 'completed').length === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-600 block mb-2">task_alt</span>
              <p className="font-mono text-[10px] text-gray-500">No completed tasks yet. Complete your first task to build your history!</p>
            </div>
          ) : (
            quests.filter(q => q.status === 'completed').map(q => (
              <div key={q.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-white/5 bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <span className="material-symbols-outlined text-green-400 text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-xs text-gray-300 truncate">{q.title}</p>
                  <p className="font-mono text-[9px] text-gray-500 mt-0.5">
                    {q.completedAt ? new Date(q.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : q.deadline}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-primary font-bold shrink-0">+{q.xpReward} XP</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
