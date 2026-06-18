export interface FrameDef {
  id: string;
  title: string;
  rank: string;
  avatarBorder: string;
  borderReq?: number;
  desc?: string;
}

export const FRAMES: FrameDef[] = [
  { id: 'none', title: 'Default Frame', rank: 'Novice Scout', avatarBorder: 'border border-primary/30', desc: 'Standard scout baseline coordinates.' },
  { id: 'cyan_neon', title: 'Cyber Cyan Border', rank: 'Cyber Operative', avatarBorder: 'border-2 border-secondary ring-2 ring-secondary/20 shadow-[0_0_15px_rgba(76,215,246,0.5)]', desc: 'Intense glowing neon cyan border.' },
  { id: 'purple_hyper', title: 'Hyper Purple Aura', rank: 'Hyper Knight', avatarBorder: 'border-2 border-primary ring-2 ring-primary/30 shadow-[0_0_15px_rgba(221,183,255,0.6)]', desc: 'Vibrant over-driven brand electricity lines.' },
  { id: 'ruby_assassin', title: 'Ruby Assassin Glow', rank: 'Ruby Assassin', borderReq: 5000, avatarBorder: 'border-2 border-red-500 ring-2 ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.6)]', desc: 'Crimson aura radiating relentless execution.' },
  { id: 'emerald_sage', title: 'Emerald Sage Wreath', rank: 'Emerald Sage', borderReq: 10000, avatarBorder: 'border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.5)]', desc: 'Luminescent green frame signifying deep tactical wisdom.' },
  { id: 'gold_vanguard', title: 'Golden Vanguard Crest', rank: 'Fleet Admiral', borderReq: 15000, avatarBorder: 'border-2 border-tertiary ring-4 ring-tertiary/20 shadow-[0_0_20px_rgba(239,194,0,0.7)]', desc: 'Unlocked badge frame reserved for fleet strategists.' },
  { id: 'void_walker', title: 'Void Walker Halo', rank: 'Void Walker', borderReq: 25000, avatarBorder: 'border-[3px] border-slate-900 ring-4 ring-purple-900/50 shadow-[0_0_25px_rgba(88,28,135,0.8)]', desc: 'Dark matter distortion field reserved for legends.' },
  { id: 'prismatic_god', title: 'Prismatic Ascendant', rank: 'Ascendant Entity', borderReq: 50000, avatarBorder: 'border-[3px] border-white ring-4 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.8)]', desc: 'The ultimate chromatic display of dominance.' },
];

export function getFrameCss(frameId?: string | null): string {
  return FRAMES.find(f => f.id === frameId)?.avatarBorder || FRAMES[0].avatarBorder;
}

export function getFrameRank(frameId?: string | null): string {
  return FRAMES.find(f => f.id === frameId)?.rank || FRAMES[0].rank;
}
