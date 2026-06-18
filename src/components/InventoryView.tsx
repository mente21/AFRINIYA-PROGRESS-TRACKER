import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { FRAMES } from '../lib/frames';

interface InventoryViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  totalXp: number;
  onEquipFrame?: (frameId: string, rank: string, frameCss: string) => void;
}

export default function InventoryView({
  userProfile,
  setUserProfile,
  totalXp,
  onEquipFrame,
}: InventoryViewProps) {
  const [equippedFrame, setEquippedFrame] = useState<string>(userProfile.equippedFrameId || 'none');
  const [equippedMultiplier, setEquippedMultiplier] = useState<string>('none');

  useEffect(() => {
    setEquippedFrame(userProfile.equippedFrameId || 'none');
  }, [userProfile.equippedFrameId]);

  const frames = FRAMES;

  const multiplierNodes = [
    { id: 'baseline', title: 'Scout Multiplier Node', multiplier: '1.0x', active: true, desc: 'Operational base coordinates.' },
    { id: 'active_2_5', title: 'Fleet Admiral Hyper-Drive', multiplier: '2.5x', active: true, desc: 'Currently equipped and multiplying focus output.' }
  ];

  const handleEquipFrame = (item: any) => {
    if (item.borderReq && totalXp < item.borderReq) {
      alert(`LOCKED: ${item.title} requires ${item.borderReq.toLocaleString()} XP (Currently: ${totalXp.toLocaleString()} XP)`);
      return;
    }
    setEquippedFrame(item.id);
    setUserProfile(prev => ({
      ...prev,
      title: item.rank,
      equippedFrameId: item.id,
      equippedFrameCss: item.avatarBorder
    }));
    if (onEquipFrame) onEquipFrame(item.id, item.rank, item.avatarBorder);
  };

  const activeBorderObj = frames.find(f => f.id === equippedFrame);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-white">Operative Inventory</h1>
        <p className="font-sans text-sm text-gray-400 mt-1">Configure multiplier nodes and equip visual elements.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile preview HUD panel (Col 1) */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <h2 className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-6 self-start">Active Character Display</h2>
          
          <div className="relative mb-5 shrink-0">
            {/* The avatar element matching user equipped frames in real-time! */}
            <div className={`w-28 h-28 rounded-full overflow-hidden transition-all duration-300 ${activeBorderObj?.avatarBorder || 'border border-primary'}`}>
              <img 
                alt="Active Commander Profile" 
                className="w-full h-full object-cover" 
                src={userProfile.avatar} 
              />
            </div>
            
            {/* Holographic level badge overlay */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gray-950 border border-primary/50 text-[10px] text-primary px-3 py-0.5 rounded-full font-mono font-bold shadow-lg">
              LV {userProfile.level}
            </div>
          </div>

          <p className="font-display font-extrabold text-lg text-white mt-1">{userProfile.name}</p>
          <span className="bg-primary/10 border border-primary/25 text-primary text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 mt-2 rounded tracking-widest leading-none">
            {userProfile.title.toUpperCase()}
          </span>

          <div className="w-full mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-left font-mono">
            <div>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">XP Volume</span>
              <span className="text-white text-xs font-bold leading-none">{totalXp.toLocaleString()} XP</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Rank Crest</span>
              <span className="text-secondary text-xs font-bold leading-none">{activeBorderObj?.rank}</span>
            </div>
          </div>
        </div>

        {/* Frames Equip Shop (Col 2) */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-base text-white">Visual Avatar Frames</h2>
            <p className="font-sans text-xs text-gray-400 mt-0.5">Customize your appearance across public rosters</p>
          </div>

          <div className="grid gap-3 select-none">
            {frames.map((f) => {
              const curLock = f.borderReq && totalXp < f.borderReq;
              const isEquipped = equippedFrame === f.id;

              return (
                <div 
                  key={f.id}
                  onClick={() => handleEquipFrame(f)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isEquipped 
                      ? 'border-primary bg-primary/5' 
                      : curLock 
                        ? 'border-gray-800 opacity-60 bg-gray-950/20' 
                        : 'border-white/5 hover:border-gray-600 hover:bg-[#1e293b]/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Frame Miniature Circle */}
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${f.avatarBorder}`}>
                      <span className="material-symbols-outlined text-xs text-gray-500">face</span>
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                        <span>{f.title}</span>
                        {curLock && (
                          <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        )}
                      </h4>
                      <p className="font-sans text-xs text-gray-400 mt-1 leading-normal">{f.desc}</p>
                    </div>
                  </div>

                  <button 
                    className={`px-3 py-1 rounded text-[10px] font-mono font-extrabold uppercase transition-all ${
                      isEquipped 
                        ? 'bg-primary text-purple-950' 
                        : curLock 
                          ? 'border border-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'border border-gray-600 text-gray-300 hover:text-white hover:border-white'
                    }`}
                  >
                    {isEquipped ? 'Equipped' : curLock ? 'Locked' : 'Equip'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
