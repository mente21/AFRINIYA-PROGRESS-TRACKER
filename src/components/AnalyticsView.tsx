import React, { useState } from 'react';
import { UserProfile, Quest } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AnalyticsViewProps {
  userProfile: UserProfile;
  totalXp: number;
  quests: Quest[];
}

export default function AnalyticsView({
  userProfile,
  totalXp,
  quests,
}: AnalyticsViewProps) {
  // Interactive Skill Distribution parameters
  const [selectedSkill, setSelectedSkill] = useState<'dev' | 'design' | 'strategy' | 'admin' | null>(null);

  const skillsData = {
    all: { label: 'Overall', lvl: userProfile.level, pct: '0%' },
    dev: { label: 'Development', lvl: 1, pct: '0%', xp: '0 XP', info: 'Focuses on structural refactors, OAuth database deployments, and microservices logic.' },
    design: { label: 'Design', lvl: 1, pct: '0%', xp: '0 XP', info: 'Centered around custom gamified UI elements, bento grids, vector assets, and glassmorphic graphics.' },
    strategy: { label: 'Strategy', lvl: 1, pct: '0%', xp: '0 XP', info: 'Represents department alignment goals, OKR assemblies, and quarterly roadmap sessions.' },
    admin: { label: 'Admin', lvl: 1, pct: '0%', xp: '0 XP', info: 'Covers support queues, server housekeeping, clean documentation edits, and ticket approvals.' }
  };

  // Interactive Heatmap hover state
  const [heatmapTooltip, setHeatmapTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

  // Productivity points hover details
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const velocityPoints = [
    { label: 'Wk 1', xp: '0 XP', focus: '0%', desc: 'No data yet.' },
    { label: 'Wk 2', xp: '0 XP', focus: '0%', desc: 'No data yet.' },
    { label: 'Wk 3', xp: '0 XP', focus: '0%', desc: 'No data yet.' },
    { label: 'Wk 4', xp: '0 XP', focus: '0%', desc: 'No data yet.' },
    { label: 'Today', xp: '0 XP', focus: '0%', desc: 'Awaiting first task completion.' }
  ];

  const handleHeatmapClick = (dateStr: string, count: number, event: React.MouseEvent) => {
    const textStr = count > 0 ? `Completed ${count} task${count > 1 ? 's' : ''} on ${dateStr}. Keep it up! 🎯` : `No tasks completed on ${dateStr}.`;
    setHeatmapTooltip({
      x: event.clientX - 100,
      y: event.clientY - 60,
      text: textStr
    });
    setTimeout(() => {
      setHeatmapTooltip(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Insight Hub</h1>
          <p className="font-sans text-sm text-gray-400 mt-1">Performance metrics, anomaly radars and strategic analysis.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => alert("Raw performance telemetry data exported as .CSV file successfully.")}
            className="px-4 py-2 rounded-lg border border-secondary/30 text-secondary font-mono text-[10px] tracking-wider font-bold uppercase hover:bg-secondary/15 hover:shadow-[0_0_12px_rgba(76,215,246,0.2)] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[13px]">download</span> Export Telemetry
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#222a3d] border border-white/5 text-gray-300 font-mono text-[10px] tracking-wider font-bold uppercase flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span> Last 30 Days
          </button>
        </div>
      </header>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total XP */}
        <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Total XP Earned</span>
            <span className="material-symbols-outlined text-primary text-xl">military_tech</span>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="font-display text-3xl font-black text-white text-glow-primary">
              {totalXp.toLocaleString()}
            </span>
            <span className="font-sans text-xs text-green-400 font-semibold mb-1 flex items-center">
              <span className="material-symbols-outlined text-xs leading-none">trending_up</span> +12%
            </span>
          </div>
        </div>

        {/* Card 2: Focus Score */}
        <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Avg Focus Score</span>
            <span className="material-symbols-outlined text-secondary text-xl">center_focus_strong</span>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="font-display text-3xl font-black text-white text-glow-cyan">{userProfile.productivityScore}%</span>
            <span className="font-sans text-xs text-gray-500 font-semibold mb-1 flex items-center">
              <span className="material-symbols-outlined text-xs leading-none">horizontal_rule</span> --
            </span>
          </div>
        </div>

        {/* Card 3: Global Percentile */}
        <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group border-l-2 border-l-tertiary">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Global Percentile</span>
            <span className="material-symbols-outlined text-tertiary text-xl">public</span>
          </div>
          <div className="flex items-end gap-2 mt-auto">
            <span className="font-display text-3xl font-black text-gray-500">Unranked</span>
            <span className="font-sans text-xs text-gray-400 mb-1">Awaiting Data</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity Velocity SVG Chart (Col 2) */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-base text-white">Productivity Velocity</h2>
            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">XP / WEEK</span>
          </div>

          <div className="flex-1 w-full min-h-[220px] relative flex items-end pb-8 pt-6">
            {/* Visual Grid Lines */}
            <div className="absolute inset-x-0 bottom-8 top-6 flex flex-col justify-between pointer-events-none opacity-20 border-b border-white/5">
              <div className="w-full border-t border-white/10"></div>
              <div className="w-full border-t border-white/10"></div>
              <div className="w-full border-t border-white/10"></div>
              <div className="w-full border-t border-white/10"></div>
            </div>

            {/* Simulated Line Chart using SVG pathing */}
            <svg className="w-full h-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="lineGlowArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ddb7ff" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#ddb7ff" stopOpacity="0"></stop>
                </linearGradient>
                <filter id="glowEffect" height="140%" width="140%" x="-20%" y="-20%">
                  <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>

              {/* Area Under Curve */}
              <path 
                d="M 50,150 Q 250,120 450,130 T 850,50 L 950,20 L 950,200 L 50,200 Z" 
                fill="url(#lineGlowArea)"
              ></path>

              {/* Main Vector Stroke */}
              <path 
                d="M 50,150 Q 250,120 450,130 T 850,50 L 950,20" 
                fill="none" 
                stroke="#ddb7ff" 
                strokeWidth="4.5"
                filter="url(#glowEffect)"
              ></path>

              {/* Data Interactive Node Points */}
              <circle cx="50" cy="150" r="5" fill="#020617" stroke="#ddb7ff" strokeWidth="2.5" className="cursor-pointer" onMouseEnter={() => setHoveredPoint(0)} onMouseLeave={() => setHoveredPoint(null)}></circle>
              <circle cx="275" cy="120" r="5" fill="#020617" stroke="#ddb7ff" strokeWidth="2.5" className="cursor-pointer" onMouseEnter={() => setHoveredPoint(1)} onMouseLeave={() => setHoveredPoint(null)}></circle>
              <circle cx="500" cy="130" r="7" fill="#4cd7f6" stroke="#020617" strokeWidth="2" className="cursor-pointer shadow-lg" onMouseEnter={() => setHoveredPoint(2)} onMouseLeave={() => setHoveredPoint(null)}></circle>
              <circle cx="725" cy="70" r="5" fill="#020617" stroke="#ddb7ff" strokeWidth="2.5" className="cursor-pointer" onMouseEnter={() => setHoveredPoint(3)} onMouseLeave={() => setHoveredPoint(null)}></circle>
              <circle cx="950" cy="20" r="7" fill="#efc200" stroke="#020617" strokeWidth="2" className="cursor-pointer" onMouseEnter={() => setHoveredPoint(4)} onMouseLeave={() => setHoveredPoint(null)}></circle>
            </svg>

            {/* Live Chart Point Details Modal Overlay */}
            <AnimatePresence>
              {hoveredPoint !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 p-3 rounded-lg border border-primary/20 bg-[#171f33]/95 backdrop-blur-md z-30 shadow-xl max-w-xs text-xs font-mono"
                >
                  <p className="text-primary font-bold">{velocityPoints[hoveredPoint].label} Objective State</p>
                  <p className="text-white font-display text-base font-bold mt-1Value">{velocityPoints[hoveredPoint].xp}</p>
                  <p className="text-secondary mt-0.5 font-bold">Focus Ratio: {velocityPoints[hoveredPoint].focus}</p>
                  <p className="text-gray-400 mt-1.5 text-[11px] font-sans leading-normal">{velocityPoints[hoveredPoint].desc}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* X Axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between font-mono text-[9px] text-gray-500 uppercase tracking-widest px-4 pt-2 border-t border-white/5">
              <span>Wk 1</span>
              <span>Wk 2</span>
              <span>Wk 3</span>
              <span>Wk 4</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Skill Distribution Panel (Col 1) */}
        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <h2 className="font-display font-semibold text-base text-white">Skill Distribution</h2>
          <p className="font-sans text-xs text-gray-400 mt-0.5">Explore specific attribute queues</p>

          <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
            {/* Double Radial ring graphics mapping */}
            <div className="w-40 h-40 rounded-full border-4 border-gray-900 relative flex items-center justify-center shadow-[inset_0_0_20px_rgba(76,215,246,0.1)]">
              
              {/* Dynamic decorative colors vector lines */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#ddb7ff" strokeDasharray="80 208" strokeDashoffset="0" strokeWidth="8" className="transition-all"></circle>
                <circle cx="50" cy="50" r="46" fill="none" stroke="#4cd7f6" strokeDasharray="60 228" strokeDashoffset="-80" strokeWidth="8" className="transition-all"></circle>
                <circle cx="50" cy="50" r="46" fill="none" stroke="#efc200" strokeDasharray="40 248" strokeDashoffset="-140" strokeWidth="8" className="transition-all"></circle>
                <circle cx="50" cy="50" r="46" fill="none" stroke="#988d9f" strokeDasharray="108 180" strokeDashoffset="-180" strokeWidth="8" className="transition-all"></circle>
              </svg>

              <div className="text-center z-10 bg-[#0b1326]/90 rounded-full w-24 h-24 border border-white/5 flex flex-col justify-center items-center">
                <span className="font-display text-white text-lg font-black leading-none">Lv.{selectedSkill ? skillsData[selectedSkill].lvl : skillsData.all.lvl}</span>
                <span className="font-sans text-[10px] text-gray-400 mt-1 block tracking-wider uppercase leading-none">
                  {selectedSkill ? skillsData[selectedSkill].label : 'ALL SCOUTS'}
                </span>
              </div>
            </div>

            {/* Interactive distribution selectors */}
            <div className="w-full mt-6 grid grid-cols-2 gap-2">
              <button 
                onClick={() => setSelectedSkill(selectedSkill === 'dev' ? null : 'dev')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                  selectedSkill === 'dev' ? 'bg-primary/10 border-primary/45 shadow' : 'bg-transparent border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 shadow-[0_0_5px_#ddb7ff]"></span>
                <span className="font-mono text-[9px] text-gray-300 font-bold uppercase">Dev ({skillsData.dev.pct})</span>
              </button>
              <button 
                onClick={() => setSelectedSkill(selectedSkill === 'design' ? null : 'design')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                  selectedSkill === 'design' ? 'bg-secondary/10 border-secondary/45 shadow' : 'bg-transparent border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] shrink-0 shadow-[0_0_5px_#4cd7f6]"></span>
                <span className="font-mono text-[9px] text-gray-300 font-bold uppercase">Design ({skillsData.design.pct})</span>
              </button>
              <button 
                onClick={() => setSelectedSkill(selectedSkill === 'strategy' ? null : 'strategy')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                  selectedSkill === 'strategy' ? 'bg-tertiary/10 border-tertiary/45 shadow' : 'bg-transparent border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0 shadow-[0_0_5px_#efc200]"></span>
                <span className="font-mono text-[9px] text-gray-300 font-bold uppercase">Strategic ({skillsData.strategy.pct})</span>
              </button>
              <button 
                onClick={() => setSelectedSkill(selectedSkill === 'admin' ? null : 'admin')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                  selectedSkill === 'admin' ? 'bg-gray-800 border-white/5 shadow' : 'bg-transparent border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-mono text-[9px] text-gray-300 font-bold uppercase">Admin ({skillsData.admin.pct})</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedSkill && (
              <motion.div 
                key={selectedSkill}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 p-3 rounded-lg border border-white/5 bg-gray-900/60 font-sans text-xs text-gray-300 space-y-1"
              >
                <div className="flex justify-between items-center font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Class Volume</span>
                  <span className="text-secondary">{skillsData[selectedSkill].xp}</span>
                </div>
                <p className="font-normal leading-normal mt-1">{skillsData[selectedSkill].info}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Panel (GitHub Continuous Heatmap + Radar Radar Anomaly flags) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap Section */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-semibold text-base text-white">Consistency Heatmap</h2>
            
            <div className="flex items-center gap-1 font-mono text-[9px] text-gray-500 uppercase tracking-wide">
              <span>Less</span>
              <div className="heatmap-cell heatmap-0 shrink-0"></div>
              <div className="heatmap-cell heatmap-1 shrink-0"></div>
              <div className="heatmap-cell heatmap-2 shrink-0"></div>
              <div className="heatmap-cell heatmap-3 shrink-0"></div>
              <div className="heatmap-cell heatmap-4 shrink-0"></div>
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-hide">
            {/* Generate historical activity tiles */}
            <div className="inline-flex gap-1 p-1">
              {Array.from({ length: 18 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    const daysAgo = (17 - weekIdx) * 7 + (6 - dayIdx);
                    d.setDate(d.getDate() - daysAgo);
                    
                    // Format as local YYYY-MM-DD
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    // Count completed quests for this date
                    const count = quests.filter(q => q.status === 'completed' && q.completedAt?.startsWith(dateStr)).length;

                    let intensity = 0;
                    if (count === 1) intensity = 1;
                    else if (count === 2) intensity = 2;
                    else if (count === 3 || count === 4) intensity = 3;
                    else if (count >= 5) intensity = 4;

                    return (
                      <div 
                        key={dayIdx} 
                        onClick={(e) => handleHeatmapClick(d.toLocaleDateString(), count, e)}
                        className={`heatmap-cell heatmap-${intensity} cursor-pointer hover:scale-115`}
                        title={`${count} tasks on ${d.toLocaleDateString()}`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between font-mono text-[10px] text-gray-500 mt-3 uppercase tracking-wider">
            <span>3 Months Ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Anomaly Detection radar */}
        <div className="glass-panel rounded-xl p-5 border border-red-950/30 bg-gradient-to-b from-transparent to-red-950/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-red-500 text-8xl font-black">warning</span>
          </div>

          <div className="z-10">
            <h2 className="font-display font-bold text-base text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">radar</span>
              Anomaly Detection
            </h2>
            <p className="text-[10px] font-mono text-gray-400 tracking-wider uppercase mt-1">Automatic issue triage</p>
          </div>

          <div className="space-y-3 mt-4 z-10 flex-1">
            <div className="p-3 rounded-lg border border-white/5 bg-[#171f33]/40 space-y-2 flex gap-3 items-start">
              <span className="material-symbols-outlined text-gray-500 mt-0.5 shrink-0 text-lg">check_circle</span>
              <div>
                <h4 className="font-mono text-[10px] text-white font-bold uppercase tracking-wider leading-none">System Normal</h4>
                <p className="font-sans text-xs text-gray-400 mt-1.5 leading-normal">No operational anomalies detected. Gather more data to begin analysis.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Mouse tooltip element for heatmap */}
      {heatmapTooltip && (
        <div 
          className="fixed p-2.5 rounded border border-primary/20 bg-[#171f33]/95 backdrop-blur-md text-[10px] font-mono text-primary shadow-xl z-50 transition-all pointer-events-none"
          style={{ left: `${heatmapTooltip.x}px`, top: `${heatmapTooltip.y}px` }}
        >
          {heatmapTooltip.text}
        </div>
      )}
    </div>
  );
}
