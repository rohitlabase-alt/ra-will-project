import React from 'react';
import DocumentUpload from '../components/DocumentUpload';

interface DocumentPanelProps {
  userAddress: string;
  onUploadSuccess: (data: any) => void;
  setView: (view: any) => void;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  userAddress,
  onUploadSuccess,
  setView
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-3xl font-bold text-white">Neural Legacy Vault</h2>
        <p className="text-slate-400">Upload your legal testament, ID documents, or sensitive files. Documents are hashed on-chain and stored via AES-256 and IPFS.</p>
      </div>

      <div className="glass p-8 rounded-[32px] border border-white/5 space-y-6">
        <DocumentUpload 
          userAddress={userAddress} 
          onUploadSuccess={onUploadSuccess} 
          setView={setView}
        />
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setView('will-type')}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all"
        >
          Previous Step
        </button>
        <button
          onClick={() => setView('secure-verification')}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
        >
          Proceed to Verification
        </button>
      </div>
    </div>
  );
};

