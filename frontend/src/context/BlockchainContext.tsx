import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';

interface BlockchainContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  userAddress: string;
  walletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [walletConnected, setWalletConnected] = useState<boolean>(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        const address = await userSigner.getAddress();
        
        setProvider(browserProvider);
        setSigner(userSigner);
        setUserAddress(address);
        setWalletConnected(true);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app!");
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setUserAddress('');
    setWalletConnected(false);
  };

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        signer,
        userAddress,
        walletConnected,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};
