const fs = require('fs');

// Read the corrupted file to get the bottom half
const currentApp = fs.readFileSync('src/App.tsx', 'utf8');
const lines = currentApp.split('\n');

// The bottom half starts at line 23 (which is `<div className="flex flex-wrap gap-2">`)
const bottomHalf = lines.slice(22).join('\n');

const topHalf = `import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Wallet, Users, Clock, Plus, Trash2, ArrowRight, Lock, Zap, CheckCircle2,
  Activity, ChevronRight, ShieldCheck, AlertCircle, Fingerprint, TrendingUp,
  Coins, History, FileText, FileSignature, Edit2, X, GitBranch, Scale, Building, Landmark, User, LogOut
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function App() {
  const [account, setAccount] = useState('');
  const [view, setView] = useState('dashboard');
  const [isOwnerVerified, setIsOwnerVerified] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [state, setState] = useState({
    status: 'draft',
    willType: '',
    documentData: {},
    assets: [],
    beneficiaries: [],
    triggers: [{ type: 'time-lock' }]
  });

  const [totalAllocation, setTotalAllocation] = useState(0);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'Crypto', address: '', existence: 'Digital', liquidity: 'High', usage: 'Investment' });
  const [newBeneficiary, setNewBeneficiary] = useState({ name: '', address: '', allocation: 0, zkpEnabled: false });

  useEffect(() => {
    const total = state.beneficiaries.reduce((sum, b) => sum + (b.allocation || 0), 0);
    setTotalAllocation(total);
  }, [state.beneficiaries]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask!");
    }
  };

  const logout = () => {
    setAccount('');
    setView('dashboard');
    setIsOwnerVerified(false);
  };

  const verifyOwner = async () => {
    if (!account) return alert('Please connect wallet first.');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await signer.signMessage("Verify Identity for Digital Will Profile");
      setIsOwnerVerified(true);
      alert("Identity Verified successfully!");
    } catch (e) {
      alert("Verification failed or rejected.");
    }
  };

  const addBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.address || newBeneficiary.allocation <= 0) return;
    setState(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { ...newBeneficiary, id: Date.now().toString() }]
    }));
    setNewBeneficiary({ name: '', address: '', allocation: 0, zkpEnabled: false });
  };

  const removeBeneficiary = (id) => {
    setState(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter(b => b.id !== id)
    }));
  };

  const addAsset = () => {
    if (!newAsset.name || !newAsset.address) return;
    
    if (editingAssetId) {
       setState(prev => ({
         ...prev,
         assets: prev.assets.map(a => a.id === editingAssetId ? { ...newAsset, id: editingAssetId } : a)
       }));
       setEditingAssetId(null);
    } else {
       setState(prev => ({
         ...prev,
         assets: [...prev.assets, { ...newAsset, id: Date.now().toString() }]
       }));
    }
    
    setNewAsset({ name: '', type: 'Crypto', address: '', existence: 'Digital', liquidity: 'High', usage: 'Investment' });
    setIsAddAssetOpen(false);
  };

  const removeAsset = (id) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
    }));
  };

  const populateEditForm = (asset) => {
    setNewAsset({
      name: asset.name, type: asset.type, address: asset.address,
      existence: asset.existence || 'Digital', liquidity: asset.liquidity || 'High', usage: asset.usage || 'Investment'
    });
    setEditingAssetId(asset.id);
    setIsAddAssetOpen(true);
  };

  const handleDeploy = () => {
    setState(prev => ({ ...prev, status: 'deploying' }));
    setTimeout(() => {
      setState(prev => ({ ...prev, status: 'deployed' }));
    }, 2000);
  };

  const toggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    if (nextState) {
        alert("Two-Factor Authentication is now ENABLED.\\nHigh-value changes will require a second confirmation.");
    } else {
        alert("Two-Factor Authentication is now DISABLED.");
    }
  };

  const toggleBiometrics = () => {
    if (!biometricEnabled) {
      alert('Initializing biometric scan simulation...');
      setTimeout(() => {
        setBiometricEnabled(true);
        alert('Biometrics recorded & ZK-Proof generated! Recovery mechanism enabled.');
      }, 1500);
    } else {
      setBiometricEnabled(false);
      alert("Biometric Recovery is now DISABLED.");
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        </div>
        <div className="z-10 text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 border border-white/10">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black mb-4">RA Digital Will</h1>
            <p className="text-xl text-slate-400">Secure, non-custodial, decentralized legacy planning.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={connectWallet} className="px-8 py-4 bg-blue-500 hover:bg-blue-600 font-bold rounded-2xl flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Wallet className="w-5 h-5" /> Connect Wallet
            </button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 font-bold rounded-2xl flex items-center gap-3 transition-colors text-slate-300">
              <Fingerprint className="w-5 h-5" /> Login with ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => setView(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all group",
        active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex flex-col p-6 relative z-10 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">RA WILL</span>
        </div>

        <div className="space-y-2 flex-1">
          <SidebarItem icon={User} label="My Profile" id="profile" active={view === 'profile'} />
          <SidebarItem icon={TrendingUp} label="Dashboard" id="dashboard" active={view === 'dashboard'} />
          <SidebarItem icon={Coins} label="Asset Vault" id="assets" active={view === 'assets'} />
          <SidebarItem icon={Users} label="Beneficiaries" id="beneficiaries" active={view === 'beneficiaries'} />
          <SidebarItem icon={Clock} label="Triggers" id="triggers" active={view === 'triggers'} />
          <SidebarItem icon={Activity} label="Review & Deploy" id="deploy" active={view === 'deploy'} />
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="glass p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network Status</span>
            </div>
            <p className="text-sm font-medium">Localnet (Hardhat)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto h-screen p-8 lg:p-12">
        <header className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Welcome back</h1>
            <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setView('profile')} className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-bold rounded-xl border border-blue-500/20 transition-colors flex items-center gap-2">
               <User className="w-4 h-4" /> Profile
             </button>
             <button onClick={logout} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl border border-red-500/20 transition-colors flex items-center gap-2">
               <LogOut className="w-4 h-4" /> Logout
             </button>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Coins className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase">Total Assets</p>
                    <p className="text-3xl font-black text-white">{state.assets.length}</p>
                  </div>
                </div>
              </div>
              <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><Users className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase">Beneficiaries</p>
                    <p className="text-3xl font-black text-white">{state.beneficiaries.length}</p>
                  </div>
                </div>
              </div>
              <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-500/10 rounded-2xl text-green-400"><Activity className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase">Will Status</p>
                    <p className="text-2xl font-black text-white capitalize">{state.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && (
         <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-3xl font-bold text-white">User Profile</h2>
               <p className="text-slate-400">Manage your identity and wallet settings.</p>
             </div>
             <button
               onClick={() => setView('dashboard')}
               className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-medium"
             >
               <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
             </button>
           </div>

           <div className="grid md:grid-cols-3 gap-6">
             <div className="md:col-span-1 space-y-6">
               <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4">
                 <div className={cn(
                   "w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-500",
                   isOwnerVerified ? "bg-green-500/20 border-green-500/30" : "bg-blue-500/20 border-blue-500/30"
                 )}>
                   {isOwnerVerified ? <ShieldCheck className="w-12 h-12 text-green-400" /> : <User className="w-12 h-12 text-blue-400" />}
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white">{isOwnerVerified ? 'Verified Owner' : 'Pending Verification'}</h3>
                   <p className="text-sm text-slate-500 font-mono mt-1">{account.slice(0, 6)}...{account.slice(-4)}</p>
                 </div>
                 {!isOwnerVerified && (
                   <button
                     onClick={verifyOwner}
                     className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                   >
                     Verify Identity
                   </button>
                 )}
               </div>
             </div>

             <div className="md:col-span-2 space-y-6">
               <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                 <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">Security Settings</h3>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                     <div className="flex items-center gap-4">
                       <ShieldCheck className={cn("w-6 h-6", twoFactorEnabled ? "text-green-400" : "text-slate-500")} />
                       <div>
                         <p className="font-bold text-white text-sm">Two-Factor Auth</p>
                         <p className="text-xs text-slate-500">Requires signature for high-value changes.</p>
                       </div>
                     </div>
                     <button
                       onClick={toggle2FA}
                       className={cn(
                         "w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer",
                         twoFactorEnabled ? "bg-blue-500" : "bg-slate-700"
                       )}
                     >
                       <div className={cn(
                         "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                         twoFactorEnabled ? "right-1" : "left-1"
                       )}></div>
                     </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                     <div className="flex items-center gap-4">
                       <Fingerprint className={cn("w-6 h-6", biometricEnabled ? "text-blue-400" : "text-slate-500")} />
                       <div>
                         <p className="font-bold text-white text-sm">Biometric Recovery</p>
                         <p className="text-xs text-slate-500">Optional ZK-proof for account recovery.</p>
                       </div>
                     </div>
                     <button
                       onClick={toggleBiometrics}
                       className={cn(
                         "w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer",
                         biometricEnabled ? "bg-blue-500" : "bg-slate-700"
                       )}
                     >
                       <div className={cn(
                         "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                         biometricEnabled ? "right-1" : "left-1"
                       )}></div>
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
        )}

        {view === 'assets' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Asset Management</h2>
                <p className="text-slate-400">Register and classify your physical and digital assets</p>
              </div>
              <button
                onClick={() => {
                  setNewAsset({ name: '', type: 'Crypto', address: '', existence: 'Digital', liquidity: 'High', usage: 'Investment' });
                  setEditingAssetId(null);
                  setIsAddAssetOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" /> Add Asset
              </button>
            </div>

            {isAddAssetOpen && (
              <div className="glass p-8 rounded-3xl border border-white/10 space-y-6 bg-blue-500/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">{editingAssetId ? 'Edit Asset' : 'Add New Asset'}</h3>
                  <button onClick={() => setIsAddAssetOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Asset Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white"
                      value={newAsset.name}
                      onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="e.g. Primary ETH Wallet"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Asset Type</label>
                    <select
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white"
                      value={newAsset.type}
                      onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                    >
                      <option>Crypto</option>
                      <option>Hardware Wallets</option>
                      <option>Bank Accounts</option>
                      <option>Real Estate</option>
                      <option>Intellectual Property</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Address / Identifier</label>
                    <input
                      type="text"
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white font-mono"
                      value={newAsset.address}
                      onChange={e => setNewAsset({ ...newAsset, address: e.target.value })}
                      placeholder="0x... or Account Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Existence</label>
                    <select
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white"
                      value={newAsset.existence}
                      onChange={e => setNewAsset({ ...newAsset, existence: e.target.value })}
                    >
                      <option>Digital</option>
                      <option>Physical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Liquidity</label>
                    <select
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white"
                      value={newAsset.liquidity}
                      onChange={e => setNewAsset({ ...newAsset, liquidity: e.target.value })}
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button onClick={() => setIsAddAssetOpen(false)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold">Cancel</button>
                  <button onClick={addAsset} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">{editingAssetId ? 'Update Asset' : 'Save Asset'}</button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.assets.map(asset => (
                <div key={asset.id} className="glass rounded-3xl border border-white/5 overflow-hidden group">
                  <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                      {asset.type === 'Real Estate' ? <Building className="w-6 h-6" /> : asset.type === 'Bank Accounts' ? <Landmark className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => populateEditForm(asset)} className="text-slate-500 hover:text-blue-400 transition-colors p-2 bg-white/5 rounded-xl">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => removeAsset(asset.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2 bg-white/5 rounded-xl">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
`;
const combined = topHalf + bottomHalf;
fs.writeFileSync('src/App.tsx', combined);
console.log('App.tsx successfully rebuilt!');
