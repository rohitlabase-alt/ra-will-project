import React from 'react';
import {
  TrendingUp,
  FileText,
  FileSignature,
  Fingerprint,
  Coins,
  ShieldCheck,
  Key,
  Users,
  Save,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  userAddress: string;
  onLogout: () => void;
  onSaveProgress: () => void;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  userAddress,
  onLogout,
  onSaveProgress
}) => {
  const SidebarItem = ({ icon: Icon, label, id, active }: { icon: any, label: string, id: string, active: boolean }) => (
    <button
      onClick={() => setView(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
        active ? "bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  return (
    <aside className="w-72 border-r border-white/5 p-6 space-y-8 flex flex-col sticky top-0 h-screen overflow-y-auto bg-[#0f172a]/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-primary-500 flex items-center justify-center rounded-xl font-bold shadow-lg shadow-primary-500/20 text-white">
          W
        </div>
        <span className="text-xl font-bold tracking-tight text-white">WILLSYS</span>
      </div>

      <nav className="space-y-2 flex-grow">
        <SidebarItem icon={TrendingUp} label="Dashboard" id="dashboard" active={view === 'dashboard'} />
        <SidebarItem icon={FileText} label="Will Type" id="will-type" active={view === 'will-type'} />
        <SidebarItem icon={FileSignature} label="Will Document" id="document" active={view === 'document'} />
        <SidebarItem icon={Fingerprint} label="Secure Verification" id="secure-verification" active={view === 'secure-verification'} />
        <SidebarItem icon={Coins} label="Asset Management" id="assets" active={view === 'assets'} />
        <SidebarItem icon={ShieldCheck} label="Final Deployment" id="deploy" active={view === 'deploy'} />
        <SidebarItem icon={Key} label="Beneficiary Vault" id="beneficiary-vault" active={view === 'beneficiary-vault'} />
        
        <div className="pt-4 border-t border-white/5">
          <SidebarItem icon={Users} label="User Profile" id="user-profile" active={view === 'user-profile'} />
        </div>
      </nav>

      <div className="mt-auto space-y-4">
        <button
          onClick={onSaveProgress}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 text-primary-400" /> Save Progress
        </button>

        <div className="glass p-4 rounded-xl space-y-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Wallet</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-mono text-slate-300">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '0x71C...3E12'}
            </p>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all group"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
