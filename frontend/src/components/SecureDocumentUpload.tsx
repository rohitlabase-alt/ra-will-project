import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SecureDocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setWalletAddress(accounts[0]);
      } catch (err: any) {
        setError('Wallet connection failed: ' + err.message);
      }
    } else {
      setError('Please install MetaMask to connect your wallet.');
    }
  };

  const validateFile = (selectedFile: File) => {
    setError(null);
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only PDF, PNG, and JPEG are allowed.');
      return false;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
          setPreview(URL.createObjectURL(selectedFile));
        } else {
          setPreview(null);
        }
      } else {
        setFile(null);
        setPreview(null);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
          setPreview(URL.createObjectURL(selectedFile));
        } else {
          setPreview(null);
        }
      }
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    
    // In a real scenario, you'd fetch the JWT token after user logs in.
    // Here we're using a mock token for the required authMiddleware
    const mockJwtToken = 'mock_jwt_token';

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', 'Aadhaar / Legal Will'); // Example type

    try {
      const response = await axios.post('http://localhost:5000/api/v1/documents/secure-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${mockJwtToken}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setSuccessData(response.data.data);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed due to server/network error.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Futuristic Cyber Overlay Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6 text-center tracking-wider uppercase">
          Neural Vault Secured Upload
        </h2>

        {!walletAddress ? (
          <div className="flex justify-center mb-8">
            <button 
              onClick={connectWallet}
              className="px-6 py-3 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-400 rounded-xl transition-all duration-300 font-semibold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
            >
              Connect Web3 Wallet
            </button>
          </div>
        ) : (
          <div className="mb-6 flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10">
            <span className="text-sm text-gray-400">Connected Identity:</span>
            <span className="font-mono text-cyan-400 text-sm">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
          </div>
        )}

        <div 
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
            file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-gray-600 hover:border-cyan-400/50 hover:bg-white/5'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="application/pdf,image/png,image/jpeg"
          />
          
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          </div>
          
          <p className="text-gray-300 text-lg mb-2">Drag & Drop your encrypted legacy document</p>
          <p className="text-gray-500 text-sm">Supports: PDF, JPEG, PNG (Max 5MB)</p>
        </div>

        {file && (
          <div className="mt-6 bg-black/30 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-300 font-medium truncate">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            
            {preview && (
              <div className="mb-4 rounded-lg overflow-hidden border border-white/5 bg-black/50 flex justify-center">
                <img src={preview} alt="Preview" className="max-h-48 object-contain" />
              </div>
            )}

            {isUploading && (
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-300 relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={isUploading || !walletAddress}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              {isUploading ? `Encrypting & Uploading (${uploadProgress}%)...` : 'Secure & Initialize Upload'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start text-red-400">
            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {successData && (
          <div className="mt-6 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl">
            <div className="flex items-center mb-4 text-green-400">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-lg font-bold">Document Successfully Secured on Blockchain</h3>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-gray-300">
              <div className="bg-black/40 p-3 rounded-lg flex flex-col border border-white/5">
                <span className="text-gray-500 mb-1">AES-256 File Hash</span>
                <span className="truncate text-cyan-300">{successData.fileHash}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-lg flex flex-col border border-white/5">
                <span className="text-gray-500 mb-1">IPFS Decentralized CID</span>
                <span className="truncate text-cyan-300">{successData.ipfsCid}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-lg flex flex-col border border-white/5">
                <span className="text-gray-500 mb-1">Smart Contract Tx Hash</span>
                <span className="truncate text-cyan-300">{successData.txHash}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SecureDocumentUpload;
