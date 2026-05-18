import React from 'react';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';

interface BeneficiaryVaultPanelProps {
  vaultHash: string;
  setVaultHash: (hash: string) => void;
  vaultLoading: boolean;
  vaultResult: any;
  vaultError: string | null;
  onFetchWill: (hash: string) => void;
}

export const BeneficiaryVaultPanel: React.FC<BeneficiaryVaultPanelProps> = ({
  vaultHash,
  setVaultHash,
  vaultLoading,
  vaultResult,
  vaultError,
  onFetchWill
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-3xl font-bold text-white">Inheritance Beneficiary Vault</h2>
        <p className="text-slate-400">Securely access documents and assets left for you by pasting the Transaction Hash.</p>
      </div>

      <div className="glass p-8 rounded-[32px] border border-white/5 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Transaction Hash (Access Key)</label>
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Will deployment transaction hash (e.g. 0x...)"
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary-500/50 transition-colors text-white font-mono text-sm placeholder:text-slate-500"
                value={vaultHash}
                onChange={(e) => setVaultHash(e.target.value)}
              />
            </div>
            <button
              onClick={() => onFetchWill(vaultHash)}
              disabled={vaultLoading}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary-500/25"
            >
              {vaultLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Access Vault
                </>
              )}
            </button>
          </div>
        </div>

        {vaultError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {vaultError}
          </div>
        )}

        {vaultResult && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Will Found & Verified</h3>
                <p className="text-xs text-slate-500 font-mono">Owner: {vaultResult.userAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-400">WILL DETAILS</h4>
                <div className="glass p-4 rounded-xl border border-white/5 space-y-2 text-sm">
                  <p className="text-slate-300">Will Type: <span className="font-semibold text-white">{vaultResult.willType}</span></p>
                  <p className="text-slate-300">Status: <span className="font-semibold text-white capitalize">{vaultResult.status}</span></p>
                  <p className="text-slate-300">Created: <span className="font-semibold text-white">{new Date(vaultResult.createdAt).toLocaleDateString()}</span></p>
                </div>
              </div>

              {vaultResult.documentHashes && vaultResult.documentHashes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-400">LEGACY DOCUMENTS</h4>
                  <div className="glass p-4 rounded-xl border border-white/5 space-y-2">
                    {vaultResult.documentHashes.map((hash: string, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-4 text-xs font-mono">
                        <span className="text-slate-400">Doc #{index + 1}: {hash.substring(0, 16)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
