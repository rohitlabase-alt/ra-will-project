const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  \`  const toggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    if (nextState) {
        alert("Two-Factor Authentication is now ENABLED.\\\\nHigh-value changes will require a second confirmation.");
    } else {
        alert("Two-Factor Authentication is now DISABLED.");
    }
  };\`,
  \`  const toggle2FA = () => {
    if (!twoFactorEnabled) {
      setActiveModal('verify-2fa');
    } else {
      setTwoFactorEnabled(false);
    }
  };\`
);

code = code.replace(
  \`  const toggleBiometrics = () => {
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
  };\`,
  \`  const toggleBiometrics = () => {
    if (!biometricEnabled) {
      setActiveModal('biometric-scan');
      setTimeout(() => {
        setBiometricEnabled(true);
        setTimeout(() => setActiveModal(null), 1000);
      }, 2500);
    } else {
      setBiometricEnabled(false);
    }
  };\`
);

code = code.replace(
  \`                {activeModal === 'asset-details' && <><Coins className="w-5 h-5 text-primary-400" /> Asset Intelligence & Details</>}
              </h3>\`,
  \`                {activeModal === 'asset-details' && <><Coins className="w-5 h-5 text-primary-400" /> Asset Intelligence & Details</>}
                {activeModal === 'verify-2fa' && <><ShieldCheck className="w-5 h-5 text-blue-400" /> Enable Two-Factor Authentication</>}
                {activeModal === 'biometric-scan' && <><Fingerprint className="w-5 h-5 text-blue-400" /> Biometric Registration</>}
              </h3>\`
);

code = code.replace(
  \`                </div>
              )}
            </div>\`,
  \`                </div>
              )}

              {activeModal === 'verify-2fa' && (
                <div className="space-y-6 animate-fade-in py-4">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                      <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-slate-400">Enter the 6-digit code sent to your registered authenticator app or email.</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <input key={i} type="text" maxLength={1} className="w-12 h-14 bg-[#0f172a] border border-white/10 rounded-xl text-center text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors" placeholder="0" />
                    ))}
                  </div>
                  <button onClick={() => { setTwoFactorEnabled(true); setActiveModal(null); }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 mt-4">
                    Verify & Enable 2FA
                  </button>
                </div>
              )}

              {activeModal === 'biometric-scan' && (
                <div className="space-y-6 animate-fade-in py-8 text-center">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-full h-full bg-[#0f172a] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden">
                      {biometricEnabled ? <CheckCircle2 className="w-16 h-16 text-green-400" /> : <Fingerprint className="w-16 h-16 text-blue-400 animate-pulse" />}
                      {!biometricEnabled && <div className="absolute top-0 left-0 w-full h-2 bg-blue-400/50 blur-sm animate-[scan_2s_ease-in-out_infinite]"></div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">{biometricEnabled ? "Scan Successful!" : "Scanning Face/Fingerprint..."}</h4>
                    <p className="text-slate-400 mt-2">{biometricEnabled ? "ZK-Proof generated and saved to device." : "Please look at your camera or touch the sensor."}</p>
                  </div>
                  <style>{\`
                    @keyframes scan {
                      0%, 100% { top: 10%; opacity: 0; }
                      50% { top: 90%; opacity: 1; }
                    }
                  \`}</style>
                </div>
              )}
            </div>\`
);

code = code.replace(
  \`            <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-3xl flex justify-end gap-4">
              <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-medium">Close</button>
              {activeModal !== 'asset-details' && (
                <button onClick={() => setActiveModal(null)} className={cn("px-6 py-2.5 rounded-xl text-white font-bold transition-transform hover:scale-[1.02] shadow-lg", activeModal === 'dispute-resolution' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary-500 hover:bg-primary-600 shadow-primary-500/20")}>Save Configuration</button>
              )}
            </div>\`,
  \`            <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-3xl flex justify-end gap-4">
              {activeModal !== 'biometric-scan' && (
                <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-medium">Close</button>
              )}
              {activeModal !== 'asset-details' && activeModal !== 'verify-2fa' && activeModal !== 'biometric-scan' && (
                <button onClick={() => setActiveModal(null)} className={cn("px-6 py-2.5 rounded-xl text-white font-bold transition-transform hover:scale-[1.02] shadow-lg", activeModal === 'dispute-resolution' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20")}>Save Configuration</button>
              )}
            </div>\`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx modals injected successfully!');
