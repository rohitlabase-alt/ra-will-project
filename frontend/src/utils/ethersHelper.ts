import { ethers } from 'ethers';

// Format address to a standard readable format (e.g. 0x1234...abcd)
export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (!ethers.isAddress(address)) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Simple helper to parse standard Web3/Metamask/Ethers transaction errors
export const parseEthersError = (error: any): string => {
  let msg = error.reason || error.message || "";
  
  if (error.error && typeof error.error === 'object') {
    msg = error.error.message || error.error.reason || msg;
  }
  
  if (error.data && typeof error.data === 'object') {
    msg = error.data.message || msg;
  } else if (typeof error.data === 'string') {
    msg = error.data;
  }

  if (msg.includes("nonce too low") || msg.includes("NONCE_EXPIRED")) {
    return "MetaMask nonce is out of sync. Please reset your MetaMask account settings.";
  }

  return msg;
};
