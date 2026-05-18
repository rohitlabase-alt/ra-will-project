import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

interface TopbarProps {
  userAddress: string;
  status: string;
}

export const Topbar: React.FC<TopbarProps> = ({ status }) => {
  return (
    <header className="w-full flex items-center justify-between py-4 px-8 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Local Network Active
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Status</p>
            <p className="text-sm font-semibold text-white capitalize">{status}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
