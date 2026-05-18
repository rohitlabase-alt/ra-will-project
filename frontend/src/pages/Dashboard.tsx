import React from 'react';
import { ShieldCheck, Activity, Coins, ArrowRight, Key } from 'lucide-react';

interface DashboardProps {
  state: any;
  userAddress: string;
  setView: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, setView }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-primary-600 to-indigo-600 p-8 text-left border border-white/10 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            Secured by ChainLock
          </span>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Decentralized Cyber Legacy System
          </h1>
          <p className="text-white/80 text-lg">
            Ensure your digital wealth, assets, and secret vault documents are distributed according to your exact terms with on-chain immutable smart contract execution.
          </p>
          <div className="pt-2 flex gap-4">
            <button
              onClick={() => setView('will-type')}
              className="px-6 py-3 bg-white text-primary-600 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              Configure Will
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Secured Assets</p>
            <p className="text-2xl font-bold text-white mt-1">{state.assets.length}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Will Status</p>
            <p className="text-2xl font-bold text-white mt-1 capitalize">{state.status}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Will Type</p>
            <p className="text-2xl font-bold text-white mt-1">{state.willType}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Guardian Triggers</p>
            <p className="text-2xl font-bold text-white mt-1">{state.triggers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
