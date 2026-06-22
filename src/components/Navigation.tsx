import { ActiveTab, UserProfile, Quest, Habit } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  totalXp: number;
  quests?: Quest[];
  habits?: Habit[];
  onOpenNewTaskModal: () => void;
  onProfilePhotoChange?: (url: string) => void;
  onLogOut?: () => void;
}

const navItems: { tab: ActiveTab; label: string; icon: string; mobileLabel: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: 'dashboard', mobileLabel: 'Dash' },
  { tab: 'habits', label: 'Habits & Goals', icon: 'local_fire_department', mobileLabel: 'Habits' },
  { tab: 'tasks', label: 'My Tasks', icon: 'assignment', mobileLabel: 'Tasks' },
  { tab: 'awards', label: 'Awards & Badges', icon: 'emoji_events', mobileLabel: 'Awards' },
  { tab: 'analytics', label: 'Analytics', icon: 'insights', mobileLabel: 'Stats' },
  { tab: 'history', label: 'History', icon: 'calendar_month', mobileLabel: 'History' },
  { tab: 'team_hub', label: 'Team Hub', icon: 'diversity_3', mobileLabel: 'Team' },
  { tab: 'inventory', label: 'Inventory', icon: 'inventory_2', mobileLabel: 'Items' },
];

// Mobile nav: only show the most important tabs
const mobileNavItems = navItems.filter(n =>
  ['dashboard', 'habits', 'tasks', 'awards', 'analytics'].includes(n.tab)
);

export default function Navigation({
  activeTab,
  setActiveTab,
  userProfile,
  totalXp,
  quests = [],
  habits = [],
  onOpenNewTaskModal,
  onProfilePhotoChange,
  onLogOut
}: NavigationProps) {

  const activeTasksCount = quests.filter(q => q.status !== 'completed').length;
  // Count habits that haven't hit their frequency target
  const activeHabitsCount = habits.filter(h => h.completionsThisPeriod < h.frequency).length;

  const handleAvatarClick = () => {
    if (!onProfilePhotoChange) return;
    const url = prompt('Enter a URL for your profile photo:');
    if (url && url.trim()) onProfilePhotoChange(url.trim());
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b1326]/90 backdrop-blur-md border-b border-gray-800 flex justify-between items-center px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center overflow-visible">
            <img src="/logo.png" alt="Afrinias Logo" className="w-full h-full object-contain scale-[2]" />
          </div>
          <span className="font-display text-xl font-black tracking-tighter text-primary">Afrinias</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono font-bold leading-none">{userProfile.name}</p>
            <p className="text-[10px] text-primary font-mono mt-0.5">Lv. {userProfile.level} · {totalXp.toLocaleString()} XP</p>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
          </button>
          <button onClick={handleAvatarClick} className="relative group shrink-0">
            <div className={`w-8 h-8 rounded-full overflow-hidden transition-all duration-300 ${userProfile.equippedFrameCss || 'border border-primary/30'}`}>
              <img alt="Profile" className="w-full h-full object-cover" src={userProfile.avatar} />
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white">edit</span>
            </div>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#090f1d] border-r border-[#17223b] shadow-2xl z-40">
        
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 mt-5 mb-5">
          <div className="w-16 h-16 flex items-center justify-center shrink-0 overflow-visible">
            <img src="/logo.png" alt="Afrinias Logo" className="w-full h-full object-contain scale-[2]" />
          </div>
          <span className="font-display text-3xl font-extrabold text-white tracking-wider">Afrinias</span>
        </div>

        {/* User profile card */}
        <div className="mx-3 mb-4 p-3 rounded-xl border border-white/5 bg-[#121929]/90 relative overflow-hidden group shadow-md">
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
          <div className="flex items-center gap-3 relative z-10">
            <button onClick={handleAvatarClick} className="relative shrink-0 group/avatar">
              <div className={`w-10 h-10 rounded-full overflow-hidden transition-all duration-300 ${userProfile.equippedFrameCss || 'border border-primary/30 shadow-[0_0_10px_rgba(221,183,255,0.2)]'}`}>
                <img alt="Profile" className="w-full h-full object-cover" src={userProfile.avatar} />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-[11px] text-white">photo_camera</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#121929]" />
            </button>
            <div className="min-w-0">
              <p className="font-display font-extrabold text-xs text-white truncate leading-tight">{userProfile.name}</p>
              <p className="font-mono text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider">Level {userProfile.level} · {userProfile.title}</p>
              <p className="font-mono text-[9px] text-primary mt-0.5 font-bold">{totalXp.toLocaleString()} XP total</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <ul className="flex flex-col gap-0.5 flex-1 px-3 overflow-y-auto">
          {navItems.map(item => (
            <li key={item.tab}>
              <button
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-xs font-bold transition-all duration-200 ${
                  activeTab === item.tab
                    ? 'bg-primary/5 text-primary border-r-2 border-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span className="flex-1 text-left">{item.label.toUpperCase()}</span>
                {item.tab === 'tasks' && activeTasksCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm shadow-red-500/20">
                    {activeTasksCount}
                  </span>
                )}
                {item.tab === 'habits' && activeHabitsCount > 0 && (
                  <span className="bg-primary text-purple-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm shadow-primary/20">
                    {activeHabitsCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-auto px-3 py-4 border-t border-white/5 space-y-3">
          <button
            onClick={onOpenNewTaskModal}
            className="w-full py-2.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/15 text-primary font-mono text-[10px] font-bold tracking-widest flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-primary/5 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            ADD NEW TASK
          </button>

          <button 
            onClick={onLogOut}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group font-sans mt-1"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:text-red-400 transition-colors">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed right-5 z-50 transition-all" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={onOpenNewTaskModal}
          className="w-14 h-14 rounded-full bg-secondary text-on-secondary shadow-lg shadow-secondary/40 flex items-center justify-center hover:brightness-110 active:scale-90 transition-all text-neutral-950 glow-secondary">
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 pt-2 pb-4 h-20 bg-[#131b2e]/95 backdrop-blur-xl border-t border-gray-800 z-40 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden flex scroll-smooth">
        <div className="flex px-2 h-full mx-auto w-max">
          {navItems.map(item => (
            <button key={item.tab} onClick={() => setActiveTab(item.tab)}
              className={`flex shrink-0 flex-col items-center justify-center w-[76px] h-full transition-colors snap-center ${
                activeTab === item.tab ? 'text-primary' : 'text-gray-500 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[10px] font-mono tracking-widest mt-1">{item.mobileLabel.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
