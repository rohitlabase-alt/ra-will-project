import { useState } from 'react';
import { ethers } from 'ethers';
import {
  Wallet,
  Users,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  Lock,
  Key,
  Zap,
  CheckCircle2,
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Fingerprint,
  TrendingUp,
  Coins,
  History,
  FileText,
  FileSignature,
  Landmark,
  Building,
  GitBranch,
  Scale,
  X,
  LogOut,
  Check,
  Save,
  RefreshCw
} from 'lucide-react';
import type { Asset, WillState } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DocumentUpload from './components/DocumentUpload';
import SecureVerificationModule from './components/SecureVerificationModule';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { WILL_SYS_ABI, WillSysBytecode } from './contractData';

function App() {
  const [contractAddrs, setContractAddrs] = useState({
    willSys: import.meta.env.VITE_WILLSYS_ADDRESS,
    assetManager: import.meta.env.VITE_ASSET_MANAGER_ADDRESS,
    willTypeManager: import.meta.env.VITE_WILL_TYPE_MANAGER_ADDRESS,
    digitalWill: import.meta.env.VITE_DIGITAL_WILL_ADDRESS,
  });

  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [view, setView] = useState<'dashboard' | 'will-type' | 'document' | 'assets' | 'triggers' | 'deploy' | 'simulate' | 'user-profile' | 'beneficiary-vault' | 'secure-verification'>('dashboard');
  const [simulationStep, setSimulationStep] = useState(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // Beneficiary Vault states
  const [vaultHash, setVaultHash] = useState('');
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultResult, setVaultResult] = useState<any | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  const [state, setState] = useState<WillState>({
    assets: [
      { id: '1', name: 'Ethereum (ETH)', type: 'Crypto', address: '0x71C344A86C722CB8C6339185672054D132D53E12', existence: 'intangible', liquidity: 'current', usage: 'operating' },
      { id: '2', name: 'Bored Ape #4432', type: 'NFTs', address: '0xBC4CA0EDA7647A8AB7C2061C2E118A18A936FEDA', existence: 'intangible', liquidity: 'fixed', usage: 'non-operating' },
      { id: '3', name: 'Savings Wallet', type: 'Bank Account', address: '0x321344A86C722CB8C6339185672054D132D9876', existence: 'intangible', liquidity: 'current', usage: 'non-operating' }
    ],
    triggers: [
      { id: '1', type: 'time-lock', description: 'Inactivity Check', value: '12 Months', daysRemaining: 365 },
      { id: '2', type: 'oracle', description: 'Gov Registry', value: 'Verified Death Certificate' },
      { id: '3', type: 'conditional-rules', description: 'Condition Based', value: '3 Rules Active' },
      { id: '4', type: 'dispute-resolution', description: 'Legal Intervention', value: '14-Day Window' }
    ],
    status: 'draft',
    willType: 'Simple Will',
    willTypeFormData: {},
    documentData: {},
    is2FAEnabled: false,
    isBiometricsEnabled: false
  });

  const [newAsset, setNewAsset] = useState<Omit<Asset, 'id'>>({
    name: '',
    type: 'Crypto',
    address: '',
    existence: 'intangible',
    liquidity: 'current',
    usage: 'non-operating'
  });
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAssetTypeOpen, setIsAssetTypeOpen] = useState(false);
  const [isAssetPurposeOpen, setIsAssetPurposeOpen] = useState(false);


  const saveWillToBackend = async (currentState: WillState) => {
    if (!userAddress) return;
    try {
      const response = await fetch('http://localhost:3001/api/save-will', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentState,
          userAddress,
          documentHashes: currentState.documentData?.uploadedDocuments?.map((d: any) => d.hash) || []
        }),
      });
      if (response.ok) {
        console.log("Will data successfully saved to backend");
      }
    } catch (error) {
      console.error("Failed to save will to backend:", error);
    }
  };

  const fetchWillByHash = async (hash: string) => {
    if (!hash.trim()) {
      setVaultError("Please enter a transaction hash.");
      return;
    }
    setVaultLoading(true);
    setVaultError(null);
    setVaultResult(null);
    try {
      const trimmedHash = hash.trim();
      const response = await fetch(`http://localhost:3001/api/get-will-by-hash/${trimmedHash}`);
      if (!response.ok) {
        throw new Error("Failed to search will from server.");
      }
      const data = await response.json();
      if (data.success === false || !data.txHash) {
        setVaultError("No will found with this transaction hash.");
      } else {
        setVaultResult(data);
        showToast("Will successfully fetched!", "success");
      }
    } catch (err: any) {
      console.error(err);
      setVaultError("Failed to fetch will: connection or server error.");
    } finally {
      setVaultLoading(false);
    }
  };

  const ensureCorrectNetwork = async (ethereum: any) => {
    if (!ethereum) return false;
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const allowedChainIds = [31337n, 1337n, 11155111n];
      
      if (allowedChainIds.includes(chainId)) {
        return true;
      }
      
      const isLocal = import.meta.env.VITE_BLOCKCHAIN_NETWORK === 'localhost';
      const targetChainId = isLocal ? 31337n : 11155111n;
      const targetChainIdHex = '0x' + targetChainId.toString(16);
      
      showToast(`Switching MetaMask to ${isLocal ? 'Localhost 8545' : 'Sepolia'}...`, "info");
      
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
        // Short pause to let MetaMask network switch register
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      } catch (switchError: any) {
        // Error code 4902 means the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            if (targetChainId === 11155111n) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainIdHex,
                    chainName: 'Sepolia Test Network',
                    nativeCurrency: {
                      name: 'Sepolia Ether',
                      symbol: 'SEP',
                      decimals: 18,
                    },
                    rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
              await new Promise(resolve => setTimeout(resolve, 1000));
              return true;
            } else if (targetChainId === 31337n) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainIdHex,
                    chainName: 'Hardhat Localhost 8545',
                    nativeCurrency: {
                      name: 'Localhost Ether',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                  },
                ],
              });
              await new Promise(resolve => setTimeout(resolve, 1000));
              return true;
            }
          } catch (addError) {
            console.error("Failed to add network to MetaMask:", addError);
          }
        }
        console.error("Failed to switch network:", switchError);
      }
    } catch (err) {
      console.error("Error in network check/switch:", err);
    }
    return false;
  };

  const parseWeb3Error = (error: any): string => {
    console.log("Original Web3 Error:", error);
    
    let msg = error.reason || error.message || "";
    
    // Check nested errors (ethers v6 format)
    if (error.error && typeof error.error === 'object') {
      msg = error.error.message || error.error.reason || msg;
    }
    
    if (error.data && typeof error.data === 'object') {
      msg = error.data.message || msg;
    } else if (typeof error.data === 'string') {
      msg = error.data;
    }

    if (msg.includes("could not coalesce error")) {
      return "could not coalesce error (This usually happens when: 1. Local Hardhat node is not running/responsive. 2. MetaMask nonce is out of sync - go to MetaMask Settings > Advanced > Clear activity tab data. 3. Account has insufficient funds.)";
    }
    
    return msg;
  };

  const handleDeploy = async () => {
    if (!walletConnected || !userAddress) {
      showToast("Please connect your wallet first.", "warning");
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'deploying' }));
      console.log("Initializing Blockchain Deployment...");

      // 1. Get the document hashes from the state
      const docHashes = state.documentData?.uploadedDocuments?.map((d: any) => d.hash) || [];
      const primaryHash = docHashes.length > 0 ? docHashes[0] : "0000000000000000000000000000000000000000000000000000000000000000";
      let formattedHash = primaryHash.startsWith("0x") ? primaryHash : "0x" + primaryHash;
      if (formattedHash.length !== 66) {
        formattedHash = ethers.zeroPadValue(formattedHash, 32);
      }

      // 2. Setup ethers.js and MetaMask safely
      let ethereum = (window as any).ethereum;
      if (ethereum?.providers) {
        ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
      }
      if (!ethereum) throw new Error("MetaMask not found!");
      
      // Auto-switch network first if wrong chain is active
      await ensureCorrectNetwork(ethereum);

      const provider = new ethers.BrowserProvider(ethereum);
      
      // Ensure MetaMask is fully unlocked and connected on this active chain!
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();

      // Pre-flight balance check to prevent cryptic transaction failure toasts
      const balance = await provider.getBalance(userAddr);
      console.log("Pre-flight Balance Check for", userAddr, ":", ethers.formatEther(balance), "ETH");
      if (balance === 0n) {
        throw new Error("Insufficient Funds: Your MetaMask wallet has 0 ETH on this network. Please add test ETH (get free Sepolia test ETH, or import a pre-funded Hardhat account if using Localhost 8545).");
      }
      
      // Network Check
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      console.log("Current Chain ID:", chainId);

      const allowedChainIds = [31337n, 1337n, 11155111n];
      if (import.meta.env.VITE_BLOCKCHAIN_NETWORK === 'localhost' && !allowedChainIds.includes(chainId)) {
        throw new Error(`Wrong Network: Please switch MetaMask to "Localhost 8545" or "Sepolia". Current Chain ID: ${chainId}`);
      }

      // Pre-validation
      if (state.assets.length === 0) throw new Error("Please add at least one asset.");

      // 3. ABI matching the simple WillSys.sol (the one our bytecode deploys)
      const willSysAbi = [
        "function createWill(string _willType, bytes32[] _documentHashes, (string name, address contractAddress, uint256 amountOrId, uint8 assetType)[] _assets, (uint256 inactivityPeriod, address oracleAddress, address[] witnesses, uint256 requiredWitnesses, uint256 disputeWindow) _trigger) external",
        "function getWill(address _creator) external view returns (string, uint8, uint256, uint256)",
        "function ping() external"
      ];

      // 4. Format assets as a clean array for the contract
      const contractAssets = state.assets.map(a => ({
        name: String(a.name || "Unnamed"),
        contractAddress: ethers.isAddress(a.address) ? a.address : ethers.ZeroAddress,
        amountOrId: BigInt(0),
        assetType: 0
      }));

      const contractTrigger = {
        inactivityPeriod: BigInt(31536000),
        oracleAddress: ethers.ZeroAddress,
        witnesses: [] as string[],
        requiredWitnesses: BigInt(0),
        disputeWindow: BigInt(1209600)
      };

      // === DIAGNOSTIC LOGGING ===
      console.log("=== PRE-DEPLOY DIAGNOSTICS ===");
      console.log("User Address:", userAddress);
      console.log("Contract Address:", contractAddrs.willSys);
      console.log("Will Type:", state.willType);
      console.log("Total Assets:", state.assets.length);
      console.log("Formatted Assets:", JSON.stringify(contractAssets, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
      console.log("Document Hash:", formattedHash);
      console.log("==============================");

      // 5. Check if contract exists at address
      let currentContractAddr = contractAddrs.willSys;
      const code = await provider.getCode(currentContractAddr);
      
      const isSepolia = chainId === 11155111n;
      const isDefaultLocalAddr = currentContractAddr && currentContractAddr.toLowerCase() === "0x1c9a0a78e533c6de57d70861f38d38962af991be";

      if (code === "0x" || code === "0x0" || (isSepolia && isDefaultLocalAddr)) {
        console.log("No contract found or default local address detected on Sepolia. Auto-deploying fresh contract...");
        showToast(isSepolia && isDefaultLocalAddr 
          ? "Default localhost address detected on Sepolia. Deploying fresh contract automatically..." 
          : "No contract found. Deploying a fresh contract automatically...", "info");
        const freshAddr = await deployFreshContract(signer);
        if (!freshAddr) {
          setState(prev => ({ ...prev, status: 'draft' }));
          return;
        }
        currentContractAddr = freshAddr;
      }

      // 6. PRE-FLIGHT: Check blockchain state BEFORE calling createWill()
      const willSysContract = new ethers.Contract(currentContractAddr, willSysAbi, signer);
      
      try {
        const willData = await willSysContract.getWill(userAddress);
        const onChainStatus = Number(willData[1]);
        const statusNames = ["Draft", "Deployed", "Executing", "Executed", "Contested"];
        console.log(`Blockchain State: Will exists for ${userAddress}`);
        console.log(`  Status: ${statusNames[onChainStatus] || "Unknown"} (${onChainStatus})`);
        console.log(`  Last Ping: ${new Date(Number(willData[2]) * 1000).toLocaleString()}`);
        console.log(`  Asset Count: ${Number(willData[3])}`);
        showToast(`Existing Will detected on-chain. Overwriting configuration...`, "info");
      } catch (getWillError: any) {
        const errMsg = getWillError.message || getWillError.reason || "";
        if (errMsg.includes("Will not found")) {
          console.log("✅ No existing will found on blockchain — safe to create.");
        } else {
          console.warn("getWill() check returned:", errMsg);
        }
      }

      // 8. Normal flow: Log simulation warning, but still send the transaction
      console.log("Simulating createWill() transaction...");
      try {
        await willSysContract.createWill.staticCall(
          state.willType || "Standard Digital Will",
          [formattedHash],
          contractAssets,
          contractTrigger
        );
        console.log("✅ Simulation passed!");
      } catch (simError: any) {
        console.warn("⚠️ Simulation warning (proceeding with dispatch):", simError.reason || simError.message);
      }

      // 9. Send the real transaction with dynamic gas estimation
      console.log("Estimating gas for createWill() transaction...");
      let estimatedGas = 800000n;
      try {
        const gas = await willSysContract.createWill.estimateGas(
          state.willType || "Standard Digital Will",
          [formattedHash],
          contractAssets,
          contractTrigger
        );
        // Add 20% safety buffer
        estimatedGas = (gas * 120n) / 100n;
        console.log("Estimated Gas with 20% Buffer:", estimatedGas.toString());
      } catch (gasErr: any) {
        console.warn("⚠️ Gas estimation failed, using fallback 800,000:", gasErr.reason || gasErr.message);
      }

      console.log("Sending createWill() transaction...");
      const tx = await willSysContract.createWill(
        state.willType || "Standard Digital Will",
        [formattedHash],
        contractAssets,
        contractTrigger,
        { gasLimit: estimatedGas }
      );

      console.log("Transaction Hash:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed on-chain. Please check your balance or contract state.");
      }

      console.log("✅ Transaction Confirmed!", receipt);

      const newState: WillState = {
        ...state,
        status: 'deployed',
        txHash: receipt.hash,
        lastPing: Date.now()
      };
      setState(newState);
      await saveWillToBackend(newState);
      setActiveModal('deployment-success');
    } catch (error: any) {
      console.error("Blockchain Deployment Error:", error);
      let errorMessage = parseWeb3Error(error);
      
      // Clean up overly verbose error messages
      if (errorMessage.length > 300) {
        const shortReason = error.reason || errorMessage.split("(")[0];
        errorMessage = shortReason || errorMessage.substring(0, 300) + "...";
      }
      
      showToast(`Deployment failed: ${errorMessage}`, "error");
      setState(prev => ({ ...prev, status: 'draft' }));
    }
  };

  // Helper: Deploy a fresh WillSys contract and return the new address
  const deployFreshContract = async (signer: ethers.Signer): Promise<string | null> => {
    try {
      console.log("Deploying fresh WillSys contract...");
      showToast("Deploying fresh contract... Please confirm in MetaMask.", "info");
      const factory = new ethers.ContractFactory(WILL_SYS_ABI, WillSysBytecode, signer);
      const contract = await factory.deploy({ gasLimit: 3000000 });
      await contract.waitForDeployment();
      
      const newAddress = await contract.getAddress();
      console.log("✅ Fresh WillSys deployed to:", newAddress);
      
      setContractAddrs(prev => ({ ...prev, willSys: newAddress }));
      showToast(`Fresh contract deployed: ${newAddress.slice(0, 10)}...${newAddress.slice(-6)}`, "success");
      return newAddress;
    } catch (error: any) {
      console.error("Fresh deploy failed:", error);
      const errorMessage = parseWeb3Error(error);
      showToast(`Deploy failed: ${errorMessage}`, "error");
      return null;
    }
  };

  // Manual button: Force a fresh contract deployment
  const handleForceRedeploy = async () => {
    setConfirmDialog({
      title: "Confirm Fresh Deployment",
      message: "This will deploy a brand new WillSys contract on-chain. The old contract data will remain but won't be used. Gas limit: 3,000,000.",
      confirmText: "Deploy Now",
      cancelText: "Cancel",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setState(prev => ({ ...prev, status: 'deploying' }));
          let ethereum = (window as any).ethereum;
          if (ethereum?.providers) {
            ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
          }
          if (!ethereum) throw new Error("MetaMask not found!");

          await ensureCorrectNetwork(ethereum);

          const provider = new ethers.BrowserProvider(ethereum);
          
          // Request accounts first to ensure MetaMask is unlocked and active!
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          const userAddr = await signer.getAddress();
          
          // Pre-flight balance check
          const balance = await provider.getBalance(userAddr);
          if (balance === 0n) {
            throw new Error("Insufficient Funds: Your MetaMask wallet has 0 ETH on this network. Please add test ETH.");
          }
          
          const network = await provider.getNetwork();
          const allowedChainIds = [31337n, 1337n, 11155111n];
          if (!allowedChainIds.includes(network.chainId)) {
            throw new Error("Wrong Network: Please switch to Sepolia before re-deploying.");
          }

          const newAddress = await deployFreshContract(signer);
          if (newAddress) {
            showToast(`Fresh contract ready at: ${newAddress}. Click Deploy to create your will.`, "success");
          }
          setState(prev => ({ ...prev, status: 'draft' }));
        } catch (error: any) {
          console.error("Force Redeploy Failed:", error);
          const errorMessage = parseWeb3Error(error);
          showToast(`Redeploy failed: ${errorMessage}`, "error");
          setState(prev => ({ ...prev, status: 'draft' }));
        }
      }
    });
  };


  const loadUserWill = async (address: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/get-will/${address}`);
      if (response.ok) {
        const savedWill = await response.json();
        setState(prev => ({
          ...prev,
          willType: savedWill.willType || prev.willType,
          status: savedWill.status || prev.status,
          txHash: savedWill.txHash || prev.txHash,
          assets: (savedWill.assets && savedWill.assets.length > 0) 
            ? savedWill.assets.map((a: any) => ({ ...a, id: a.id || a._id || Math.random().toString(36).substr(2, 9) })) 
            : prev.assets,
          willTypeFormData: savedWill.willTypeFormData || prev.willTypeFormData,
          is2FAEnabled: savedWill.is2FAEnabled ?? prev.is2FAEnabled,
          isBiometricsEnabled: savedWill.isBiometricsEnabled ?? prev.isBiometricsEnabled,
          documentData: {
            ...prev.documentData,
            uploadedHashes: savedWill.documentHashes || []
          }
        }));
        console.log("Loaded will from MongoDB");
      }
    } catch (error) {
      console.error("Failed to fetch will from MongoDB:", error);
    }
  };


  const connectWallet = async () => {
    let ethereum = (window as any).ethereum;

    // Handle cases where multiple wallets are installed
    if (ethereum?.providers) {
      ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
    }

    if (ethereum) {
      try {
        // Request permissions first to ensure the MetaMask UI pops up
        await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts && accounts.length > 0) {
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();

          setUserAddress(address);
          setWalletConnected(true);

          // Fetch existing will from MongoDB
          await loadUserWill(address);
        }
      } catch (error: any) {
        // Fallback to simple request if permissions request is rejected or fails
        try {
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setUserAddress(address);
            setWalletConnected(true);
            await loadUserWill(address);
          }
        } catch (retryError: any) {
          if (retryError.code === 4001) {
            showToast("Connection request was rejected. Please open MetaMask and approve.", "warning");
          } else if (retryError.code === -32002) {
            showToast("A connection request is already pending in MetaMask.", "info");
          } else {
            console.error("Connection error:", retryError);
            showToast("Failed to connect to MetaMask. Please make sure it's unlocked.", "error");
          }
        }
      }
    } else {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const dappUrl = window.location.href.split('//')[1];
        window.open(`https://metamask.app.link/dapp/${dappUrl}`, '_blank');
      } else {
        showToast("MetaMask not detected! Please install the MetaMask extension.", "error");
      }
    }
  };

  const addAsset = () => {
    if (newAsset.name && newAsset.address) {
      setState(prev => ({
        ...prev,
        assets: [...prev.assets, { ...newAsset, id: Date.now().toString() }]
      }));
      setNewAsset({
        name: '',
        type: 'Crypto',
        address: '',
        existence: 'intangible',
        liquidity: 'current',
        usage: 'non-operating'
      });
    }
  };

  const removeAsset = (id: string) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
    }));
  };

  const toggle2FA = () => {
    setState(prev => ({ ...prev, is2FAEnabled: !prev.is2FAEnabled }));
    showToast(state.is2FAEnabled ? "Two-Factor Authentication Disabled" : "Two-Factor Authentication Enabled Successfully!", state.is2FAEnabled ? "info" : "success");
  };

  const toggleBiometrics = () => {
    if (!state.isBiometricsEnabled) {
      showToast("Scanning Biometrics... Please wait.", "info");
      setTimeout(() => {
        setState(prev => ({ ...prev, isBiometricsEnabled: true }));
        showToast("Biometric Fingerprint registered successfully!", "success");
      }, 2000);
    } else {
      setState(prev => ({ ...prev, isBiometricsEnabled: false }));
      showToast("Biometric Recovery Disabled", "info");
    }
  };

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        </div>

        <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary-500/20 rounded-3xl flex items-center justify-center border border-primary-500/30 shadow-lg shadow-primary-500/10">
              <ShieldCheck className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
              Digital Will & Inheritance
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Automate your asset transition with blockchain-powered smart contracts. Secure, non-custodial, and fully decentralized.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass p-6 rounded-2xl border border-white/5 text-left space-y-3">
              <Fingerprint className="w-6 h-6 text-primary-400" />
              <h3 className="font-bold text-white">Non-Custodial</h3>
              <p className="text-sm text-slate-400">You maintain full control. We never store your private keys or seed phrases.</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 text-left space-y-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="font-bold text-white">Automated</h3>
              <p className="text-sm text-slate-400">Smart contracts execute instantly when your predefined conditions are met.</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 text-left space-y-3">
              <Lock className="w-6 h-6 text-green-400" />
              <h3 className="font-bold text-white">Immutable</h3>
              <p className="text-sm text-slate-400">Once deployed, your rules are set in stone on the blockchain for ultimate security.</p>
            </div>
          </div>

            <button
              onClick={() => { connectWallet(); }}
              className="group relative px-10 py-5 bg-primary-500 text-white rounded-full font-bold text-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-2xl shadow-primary-500/20 mx-auto"
            >
              Login to WILLSYS
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-primary-400 blur-xl opacity-20 -z-10 group-hover:opacity-40 transition-opacity"></div>
            </button>
        </div>
      </div>
    );
  }

  const SidebarItem = ({ icon: Icon, label, id, active }: { icon: any, label: string, id: typeof view, active: boolean }) => (
    <button
      onClick={() => setView(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        active ? "bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );


  return (
    <div className="min-h-screen flex bg-[#0f172a] text-slate-200">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 p-6 space-y-8 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary-500 flex items-center justify-center rounded-xl font-bold shadow-lg shadow-primary-500/20">
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
            onClick={() => {
              saveWillToBackend(state);
              showToast("Progress saved to server!", "success");
            }}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-primary-400" /> Save Progress
          </button>

          <div className="glass p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Wallet</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-mono text-slate-300">{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '0x71C...3E12'}</p>
              <button
                onClick={() => {
                  setWalletConnected(false);
                  setUserAddress('');
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all group"
                title="Logout"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        {view === 'beneficiary-vault' && (
          <div className="space-y-8 animate-fade-in">
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
                    onClick={() => fetchWillByHash(vaultHash)}
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
            </div>

            {vaultResult && (
              <div className="space-y-8 animate-fade-in">
                {/* Overview Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Creator Wallet</p>
                    <p className="text-white font-mono font-bold text-sm truncate" title={vaultResult.userAddress}>
                      {vaultResult.userAddress}
                    </p>
                  </div>
                  <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Will Structure Type</p>
                    <p className="text-primary-400 font-bold text-lg">
                      {vaultResult.willType || "Simple Will"}
                    </p>
                  </div>
                  <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status on Blockchain</p>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20 uppercase tracking-widest inline-block mt-1">
                      {vaultResult.status || "Active"}
                    </span>
                  </div>
                </div>

                {/* Left Assets & Right Documents Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Coins className="w-5 h-5 text-primary-400" />
                      Inherited Assets Allocation
                    </h3>
                    <div className="space-y-4">
                      {vaultResult.assets && vaultResult.assets.length > 0 ? (
                        vaultResult.assets.map((asset: any, idx: number) => (
                          <div key={idx} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                {(asset.type === 'Crypto' || asset.type === 'Hardware Wallets') ? <Wallet className="text-slate-300 w-5 h-5" /> : asset.type === 'Real Estate' ? <Building className="text-slate-300 w-5 h-5" /> : <Landmark className="text-slate-300 w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-md">{asset.name || 'Unnamed Asset'}</h4>
                                <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={asset.address}>
                                  {asset.address || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400 uppercase font-black">
                              {asset.liquidity || 'Fixed'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-sm py-6">No assets registered in this Will.</div>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-400" />
                      Secured Legal Wills & Documents
                    </h3>
                    <div className="space-y-4">
                      {vaultResult.documentHashes && vaultResult.documentHashes.length > 0 ? (
                        vaultResult.documentHashes.map((hash: string, idx: number) => (
                          <div key={idx} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                <FileText className="text-slate-300 w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-md">Document Hash {idx + 1}</h4>
                                <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={hash}>
                                  {hash}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-green-400 font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Verified
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-sm py-6">No legal documents uploaded in this Will.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'user-profile' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-white">User Profile</h2>
                <p className="text-slate-400">Manage your account security and blockchain identity.</p>
              </div>
              <button
                onClick={() => { setWalletConnected(false); setUserAddress(''); setView('dashboard'); }}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout Account
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-[32px] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Wallet Connection</h3>
                    <p className="text-sm text-slate-500 font-mono">{userAddress}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Network Status</span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20 uppercase tracking-widest">Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Last Session</span>
                    <span className="text-sm text-white font-medium">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-[32px] border border-white/5 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Lock className="w-5 h-5 text-yellow-400" /> Security Settings
                </h3>
                <div className="space-y-4">
                  <div
                    onClick={toggle2FA}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div>
                      <p className="font-bold text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Require additional verification for deployments.</p>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      state.is2FAEnabled ? "bg-primary-500" : "bg-slate-700"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        state.is2FAEnabled ? "right-1" : "left-1"
                      )}></div>
                    </div>
                  </div>
                  <div
                    onClick={toggleBiometrics}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div>
                      <p className="font-bold text-white">Biometric Recovery</p>
                      <p className="text-xs text-slate-500">Enable ZK-Proof recovery for lost wallets.</p>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      state.isBiometricsEnabled ? "bg-primary-500" : "bg-slate-700"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        state.isBiometricsEnabled ? "right-1" : "left-1"
                      )}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (() => {
          const isWillTypeDone = !!state.willType;
          const isDocumentsDone = !!(state.documentData?.uploadedDocuments?.length > 0);
          const isAssetsDone = state.assets.length > 0;

          const steps = [
            { id: 'will-type', name: 'Will Type', done: isWillTypeDone },
            { id: 'document', name: 'Documents', done: isDocumentsDone },
            { id: 'assets', name: 'Assets', done: isAssetsDone }
          ];

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Header section */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">User Dashboard</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 font-mono">
                      <Wallet className="w-3 h-3 text-primary-400" />
                      {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Wallet Not Connected'}
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
                      state.status === 'deployed'
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : state.status === 'executed'
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    )}>
                      {state.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Coins className="w-4 h-4" /> Total Assets</span>
                  <span className="text-4xl font-black text-white">{state.assets.length}</span>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Lock className="w-4 h-4" /> System Status</span>
                  <span className="text-4xl font-black text-white capitalize">{state.status}</span>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-center col-span-2 md:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><History className="w-4 h-4" /> Blockchain Transaction Hash</span>
                  {state.status === 'deployed' ? (
                    <span className="text-sm font-mono text-primary-400 break-all bg-primary-500/10 p-3 rounded-xl border border-primary-500/20">
                      {state.txHash || '0x4f8a9...e92b (Simulated)'}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Not Deployed Yet
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="glass p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8">Setup Progress</h3>
                <div className="flex flex-col md:flex-row justify-between gap-4 relative">
                  {/* Connecting line (hidden on mobile) */}
                  <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-white/5 z-0" />

                  {steps.map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
                      <button
                        onClick={() => setView(step.id as any)}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                          step.done
                            ? "bg-primary-500 border-primary-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "bg-[#0f172a] border-white/10 hover:border-white/20"
                        )}
                      >
                        {step.done ? <Check className="w-6 h-6 text-white" /> : <span className="text-slate-500 font-bold">{idx + 1}</span>}
                      </button>
                      <div className="text-left md:text-center">
                        <p className={cn("text-sm font-bold", step.done ? "text-white" : "text-slate-500")}>{step.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract Maintenance (if deployed) */}
              {state.status === 'deployed' && (
                <div className="glass p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      Contract Maintenance
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Keep your time-lock active by sending a pulse to the smart contract.</p>
                  </div>
                  <button
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      const originalHTML = btn.innerHTML;
                      btn.innerHTML = 'Sending...';
                      setTimeout(() => {
                        setState(prev => ({ ...prev, lastPing: Date.now() }));
                        btn.innerHTML = originalHTML;
                      }, 1500);
                    }}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    Send Pulse
                  </button>
                </div>
              )}

              {/* Deploy Action */}
              {state.status === 'draft' && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setView('deploy')}
                    className="px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20"
                    disabled={steps.some(s => !s.done)}
                  >
                    Go to Final Deployment
                  </button>
                </div>
              )}

              {/* Simulation Call-to-Action (For Demo Purposes) */}
              {state.status === 'deployed' && (
                <div className="glass p-6 rounded-3xl border border-primary-500/30 bg-primary-500/5 flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary-500/10 transition-colors" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary-400" />
                      Demo: Test Will Execution
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Simulate the full inheritance flow to see how beneficiaries claim assets.</p>
                  </div>
                  <button
                    onClick={() => { setView('simulate'); setSimulationStep(0); }}
                    className="relative z-10 px-8 py-3 bg-white text-slate-900 font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    Start Demo Simulation <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {view === 'simulate' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white">Execution Simulation</h2>
              <p className="text-slate-400">Step-by-step demonstration of the Digital Will execution lifecycle.</p>
            </div>

            <div className="relative">
              {/* Simulation Progress Bar */}
              <div className="flex justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2 z-0" />
                <div className="absolute top-1/2 left-0 h-1 bg-primary-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(simulationStep / 3) * 100}%` }} />
                {[
                  { icon: Clock, label: 'Inactivity', id: 'step-inactivity' },
                  { icon: Zap, label: 'Trigger Event', id: 'step-trigger' },
                  { icon: ShieldCheck, label: 'Verification', id: 'step-verification' },
                  { icon: Users, label: 'Claim Assets', id: 'step-claim' }
                ].map((step, idx) => (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                      simulationStep >= idx ? "bg-primary-500 border-primary-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "bg-[#0f172a] border-white/10 text-slate-500"
                    )}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-widest", simulationStep >= idx ? "text-white" : "text-slate-600")}>{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="glass p-10 rounded-[40px] border border-white/5 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
                {simulationStep === 0 && (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto relative">
                      <Clock className="w-12 h-12 text-primary-400 animate-pulse" />
                      <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full border-t-primary-500 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Monitoring Inactivity</h3>
                      <p className="text-slate-400 max-w-md mx-auto">The smart contract is monitoring your "Heartbeat". If no pulse is detected for 180 days, the execution phase begins.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl font-mono font-black text-white">180 <span className="text-lg text-slate-500">Days</span></div>
                      <p className="text-xs text-primary-400 font-bold uppercase tracking-widest">Time-Lock Active</p>
                    </div>
                    <button
                      onClick={() => setSimulationStep(1)}
                      className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Fast-Forward 180 Days
                    </button>
                  </div>
                )}

                {simulationStep === 1 && (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto relative">
                      <Zap className="w-12 h-12 text-yellow-400 animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Trigger Fired!</h3>
                      <p className="text-slate-400 max-w-md mx-auto">The 180-day inactivity period has elapsed. The smart contract has automatically triggered the will execution process.</p>
                    </div>
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl inline-block">
                      <code className="text-yellow-400 text-sm">Event: Will_Triggered(owner_address, timestamp)</code>
                    </div>
                    <button
                      onClick={() => setSimulationStep(2)}
                      className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl transition-all active:scale-95"
                    >
                      Verify Conditions
                    </button>
                  </div>
                )}

                {simulationStep === 2 && (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-12 h-12 text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Conditions Verified</h3>
                      <p className="text-slate-400 max-w-md mx-auto">The Oracle has verified the legal status and document hashes. The assets are now ready for release to beneficiaries.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Assets</p>
                        <p className="text-white font-bold">{state.assets.length} Validated</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Documents</p>
                        <p className="text-white font-bold">Hashes Match</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSimulationStep(3)}
                      className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all active:scale-95"
                    >
                      Finalize Asset Release
                    </button>
                  </div>
                )}

                {simulationStep === 3 && (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500 w-full">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-2xl font-bold text-white">Execution Verified</h3>
                      <p className="text-slate-400 max-w-md mx-auto">The smart contract has successfully verified the triggers and secured all assets for distribution.</p>
                    </div>

                    <button
                      onClick={() => { setView('dashboard'); }}
                      className="text-slate-500 hover:text-white text-sm font-bold flex items-center gap-2 mx-auto"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'will-type' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-bold text-white">Select Will Type</h2>
              <p className="text-slate-400">Choose the legal structure for your digital inheritance.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { type: 'Simple Will', desc: 'A basic will that outlines how your digital assets will be distributed to beneficiaries.' },
                { type: 'Testamentary Trust Will', desc: 'Creates a trust that comes into effect after your passing, managing assets for beneficiaries over time.' },
                { type: 'Joint Will', desc: 'A single will created and signed by two individuals (usually spouses) to manage shared digital assets.' },
                { type: 'Mutual Will', desc: 'Two separate but identical wills where both parties agree not to change their terms without consent.' },
                { type: 'Land Transfer Will', desc: 'A specialized will type specifically for physical property and land asset transfers.' },
                { type: 'Business Succession Will', desc: 'Handles the transition of business ownership, digital shares, and operational control.' }
              ].map((will, i) => (
                <div key={i}
                  onClick={() => setState(prev => ({ ...prev, willType: will.type }))}
                  className={cn(
                    "cursor-pointer glass p-8 rounded-3xl border flex flex-col justify-between group transition-all",
                    state.willType === will.type ? "border-primary-500/30 bg-primary-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02] z-10 relative" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                  )}>
                  <div className="space-y-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                      state.willType === will.type ? "bg-primary-500 text-white" : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-primary-400"
                    )}>
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className={cn("text-xl font-bold transition-colors", state.willType === will.type ? "text-primary-400" : "text-white")}>{will.type}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{will.desc}</p>

                    {state.willType === will.type && will.type === 'Land Transfer Will' && (
                      <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3 animate-in slide-in-from-top-2">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Land Transfer Details</p>
                        <input
                          type="text"
                          placeholder="Survey Number / Plot ID"
                          className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary-500"
                        />
                        <input
                          type="text"
                          placeholder="Registry Number"
                          className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary-500"
                        />
                        <textarea
                          placeholder="Location Description"
                          className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white h-16 outline-none focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    {state.willType === will.type ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setView('document');
                        }}
                        className="flex items-center gap-2 text-white bg-primary-500 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition-all active:scale-95"
                      >
                        <FileSignature className="w-4 h-4" /> Go to Document
                      </button>
                    ) : (
                      <div className="text-sm font-bold text-slate-500 group-hover:text-white flex items-center gap-2 transition-colors">
                        Select Plan <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setView('document')}
                className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-primary-500/20"
              >
                Continue to Document <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {view === 'document' && (
          <DocumentUpload userAddress={userAddress || "0xDummyWallet"}
            setView={setView}
            onUploadSuccess={(results) => {
              setState(prev => ({
                ...prev,
                documentData: {
                  ...prev.documentData,
                  uploadedDocuments: results
                }
              }));
            }}
          />
        )}

        {view === 'secure-verification' && (
          <SecureVerificationModule
            userAddress={userAddress || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"}
            walletConnected={walletConnected}
            showToast={showToast}
          />
        )}

        {view === 'assets' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white">Asset Management</h2>
                <p className="text-slate-400">Register and manage your digital and physical assets.</p>
              </div>
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                style={{ display: isAddAssetOpen ? 'none' : 'flex' }}
              >
                <Plus className="w-5 h-5" /> Add Asset
              </button>
            </div>

            {isAddAssetOpen && (
              <div className="glass p-8 rounded-3xl border border-white/5 space-y-6 relative">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Add New Asset</h3>
                  <p className="text-sm font-bold text-white">Classification</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative z-50">
                  {/* LEFT COLUMN */}
                  <div className="space-y-6 relative">
                    <div className="space-y-2 relative">
                      <label className="text-xs font-medium text-slate-300">Asset Type</label>
                      <div
                        className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center hover:border-white/20 transition-colors"
                        onClick={() => {
                          setIsAssetTypeOpen(!isAssetTypeOpen);
                          setIsAssetPurposeOpen(false);
                        }}
                      >
                        <span className="text-sm font-medium text-slate-300">{newAsset.type}</span>
                        <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isAssetTypeOpen ? "rotate-270" : "rotate-90")} />
                      </div>

                      {isAssetTypeOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAssetTypeOpen(false)}></div>
                          <div className="absolute top-[100%] left-0 w-full md:w-[400px] mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-slate-300 mb-2 px-3">Tangible Assets</h4>
                              {['Real Estate', 'Gold', 'Vehicles', 'Hardware Wallets'].map(item => (
                                <div
                                  key={item}
                                  onClick={() => {
                                    setNewAsset({ ...newAsset, type: item, existence: 'tangible' });
                                    setIsAssetTypeOpen(false);
                                  }}
                                  className={cn("px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex justify-between items-center", newAsset.type === item ? "bg-[#5C4532] text-[#e6cda3]" : "text-white hover:bg-white/5")}
                                >
                                  {item}
                                  {newAsset.type === item && <Check className="w-4 h-4" />}
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-slate-300 mb-2 px-3">Intangible Assets</h4>
                              {['Crypto', 'NFTs', 'Intellectual Property', 'Patents', 'Software Licenses'].map(item => (
                                <div
                                  key={item}
                                  onClick={() => {
                                    setNewAsset({ ...newAsset, type: item, existence: 'intangible' });
                                    setIsAssetTypeOpen(false);
                                  }}
                                  className={cn("px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex justify-between items-center", newAsset.type === item ? "bg-[#5C4532] text-[#e6cda3]" : "text-white hover:bg-white/5")}
                                >
                                  {item}
                                  {newAsset.type === item && <Check className="w-4 h-4" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2 relative">
                      <div
                        className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center hover:border-white/20 transition-colors"
                        onClick={() => {
                          setIsAssetPurposeOpen(!isAssetPurposeOpen);
                          setIsAssetTypeOpen(false);
                        }}
                      >
                        <span className="text-sm font-medium text-slate-500">
                          {newAsset.usage === 'operating' ? 'Operating Asset' : newAsset.usage === 'non-operating' ? 'Non-Operating Asset' : 'Asset Purpose'}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isAssetPurposeOpen ? "rotate-270" : "rotate-90")} />
                      </div>

                      {isAssetPurposeOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAssetPurposeOpen(false)}></div>
                          <div className="absolute top-[100%] left-0 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                            <div
                              onClick={() => { setNewAsset({ ...newAsset, usage: 'operating' }); setIsAssetPurposeOpen(false); }}
                              className={cn("px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex justify-between items-center", newAsset.usage === 'operating' ? "bg-[#5C4532] text-[#e6cda3]" : "text-white hover:bg-white/5")}
                            >
                              Operating Asset
                            </div>
                            <div
                              onClick={() => { setNewAsset({ ...newAsset, usage: 'non-operating' }); setIsAssetPurposeOpen(false); }}
                              className={cn("px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex justify-between items-center", newAsset.usage === 'non-operating' ? "bg-[#5C4532] text-[#e6cda3]" : "text-white hover:bg-white/5")}
                            >
                              Non-Operating Asset
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Asset Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Savings"
                        className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors text-white text-sm placeholder:text-slate-500"
                        value={newAsset.name}
                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Convertibility / Liquidity</label>
                      <div className="flex p-1 bg-transparent rounded-xl border border-white/10 gap-1">
                        <button
                          onClick={() => setNewAsset({ ...newAsset, liquidity: 'current' })}
                          className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            newAsset.liquidity === 'current'
                              ? "bg-[#5C4532] text-[#e6cda3]"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          [ Short-term / Current ]
                        </button>
                        <button
                          onClick={() => setNewAsset({ ...newAsset, liquidity: 'fixed' })}
                          className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            newAsset.liquidity === 'fixed'
                              ? "bg-[#5C4532] text-[#e6cda3]"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          [ Long-term / Fixed ]
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Asset Details</h4>
                      </div>

                      <input
                        type="text"
                        placeholder="Enter asset address or specific details..."
                        className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors text-white text-sm"
                        value={newAsset.address}
                        onChange={e => setNewAsset({ ...newAsset, address: e.target.value })}
                      />

                      <div className="flex justify-between items-end pt-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">Operations</h4>
                          <p className="text-xs text-slate-500">These form are secure details.</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsAddAssetOpen(false)}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              addAsset();
                              setIsAddAssetOpen(false);
                            }}
                            className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                          >
                            Save Asset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.assets.map(asset => (
                <div key={asset.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      {(asset.type === 'Crypto' || asset.type === 'Hardware Wallets') ? <Wallet className="text-slate-300 w-5 h-5" /> : asset.type === 'Real Estate' ? <Building className="text-slate-300 w-5 h-5" /> : asset.type === 'document' ? <FileText className="text-slate-300 w-5 h-5" /> : <Landmark className="text-slate-300 w-5 h-5" />}
                    </div>
                    <div className="flex gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-tighter font-bold",
                        asset.existence === 'tangible' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}>
                        {asset.existence === 'tangible' ? 'Physical' : 'Digital'}
                      </span>
                      <button onClick={() => removeAsset(asset.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase font-black"
                      )}>
                        {asset.liquidity}
                      </span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase font-black"
                      )}>
                        {asset.usage}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{asset.name || 'Unnamed Asset'}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {(asset.type || '').replace('-', ' ')}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Details</span>
                        <span className="font-medium text-white truncate max-w-[200px]" title={asset.address || ''}>{asset.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5 mt-8">
              <button
                onClick={() => setView('deploy')}
                className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-primary-500/20"
              >
                Continue to Deployment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}



        {view === 'triggers' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-bold text-white">Execution Triggers</h2>
              <p className="text-slate-400">Define the conditions that will trigger the smart contract execution</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  type: 'time-lock',
                  title: 'Time-Lock / Inactivity',
                  desc: 'Executes if no "Pulse" transaction is received from your wallet within the allotted time.',
                  icon: Clock,
                  active: state.triggers.some(t => t.type === 'time-lock'),
                  config: '180 Days (Heartbeat)'
                },
                {
                  type: 'oracle',
                  title: 'Oracle Verification',
                  desc: 'Executes upon automated confirmation from a government registry.',
                  icon: ShieldCheck,
                  active: state.triggers.some(t => t.type === 'oracle'),
                  config: 'Verified Certificate'
                },
                {
                  type: 'multi-sig',
                  title: 'Multi-Sig Approval',
                  desc: 'Requires 2/3 trusted contacts to confirm the trigger manually.',
                  icon: Users,
                  active: state.triggers.some(t => t.type === 'multi-sig'),
                  config: '3 Witnesses set'
                },
                {
                  type: 'conditional-rules',
                  title: 'Conditional Distribution',
                  desc: 'Define rules for how and when beneficiaries receive assets (e.g. Age-based, Milestones).',
                  icon: GitBranch,
                  active: state.triggers.some(t => t.type === 'conditional-rules'),
                  config: `Configured: ${state.rules?.length || 0} Rules Active`
                },
                {
                  type: 'dispute-resolution',
                  title: 'Dispute & Legal Override',
                  desc: 'Allows beneficiaries or authorities to pause execution and resolve conflicts.',
                  icon: Scale,
                  active: state.triggers.some(t => t.type === 'dispute-resolution'),
                  config: 'Enabled: 14-Day Protection Window',
                  colorTheme: 'red'
                }
              ].map((trigger) => (
                <div key={trigger.type} className={cn(
                  "glass p-8 rounded-3xl border flex flex-col justify-between group transition-all",
                  trigger.active
                    ? (trigger.colorTheme === 'red' ? "border-red-500/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-primary-500/30 bg-primary-500/5")
                    : "border-white/5 hover:border-white/10"
                )}>
                  <div className="space-y-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                      trigger.active
                        ? (trigger.colorTheme === 'red' ? "bg-red-500 text-white" : "bg-primary-500 text-white")
                        : "bg-white/5 text-slate-500 group-hover:bg-white/10"
                    )}>
                      <trigger.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{trigger.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{trigger.desc}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    {trigger.active ? (
                      <>
                        <div className={cn("flex items-center gap-2 text-sm font-bold truncate", trigger.colorTheme === 'red' ? "text-red-400" : "text-primary-400")} title={trigger.config}>
                          {trigger.colorTheme === 'red' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                          <span className="truncate">{trigger.config}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (trigger.type === 'conditional-rules' || trigger.type === 'dispute-resolution') {
                              setActiveModal(trigger.type);
                            } else {
                              showToast(`Feature in development: Settings for ${trigger.title}`, "info");
                            }
                          }}
                          className={cn("text-xs font-bold px-3 py-1.5 rounded-lg transition-all ml-2 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100", trigger.colorTheme === 'red' ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-primary-500/10 text-primary-400 hover:bg-primary-500/20")}
                        >
                          Manage
                        </button>
                      </>
                    ) : (
                      <button className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2">
                        Configure Now <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary-500/5 border border-primary-500/20 p-8 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-400" />
                Trigger Safety Mechanism
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                To prevent accidental execution, the system will send multiple "Proof of Life" notifications to your connected devices before
                initiating any transfer. You can cancel the execution at any time or reset the timer by simply initiating a blockchain transaction.
              </p>
            </div>
          </div>
        )}

        {view === 'deploy' && (() => {
          const isWillTypeDone = !!state.willType;
          const isDocumentsDone = !!(state.documentData?.uploadedDocuments?.length > 0);
          const isAssetsDone = state.assets.length > 0;

          const completedStepsCount = [isWillTypeDone, isDocumentsDone, isAssetsDone].filter(Boolean).length;
          const progressPercentage = (completedStepsCount / 3) * 100;
          const isReadyToDeploy = completedStepsCount === 3;

          return (
            <div className="max-w-3xl mx-auto space-y-10 py-8 animate-fade-in">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                  <Activity className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-4xl font-bold text-white">Deployment Dashboard</h2>
                <p className="text-slate-400">Complete all required steps to secure your digital will on the blockchain.</p>
              </div>

              {/* Progress Bar */}
              <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white text-lg">Overall Readiness</span>
                  <span className="text-primary-400 font-bold text-lg">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-blue-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Completion Status List */}
              <div className="space-y-4">
                <div className={cn("glass p-6 rounded-2xl border flex items-center justify-between transition-colors", isWillTypeDone ? "border-green-500/30 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : "border-white/5")}>
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isWillTypeDone ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-500")}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">1. Will Type</h4>
                      <p className="text-sm text-slate-400">{isWillTypeDone ? `Selected: ${state.willType}` : "Not selected yet"}</p>
                    </div>
                  </div>
                  {isWillTypeDone ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <button onClick={() => setView('will-type')} className="text-sm font-bold text-primary-400 hover:underline">Review</button>}
                </div>

                <div className={cn("glass p-6 rounded-2xl border flex items-center justify-between transition-colors", isDocumentsDone ? "border-green-500/30 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : "border-white/5")}>
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isDocumentsDone ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-500")}>
                      <FileSignature className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">2. Documents</h4>
                      <p className="text-sm text-slate-400">{isDocumentsDone ? "Details filled or document uploaded" : "Missing required document details"}</p>
                    </div>
                  </div>
                  {isDocumentsDone ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <button onClick={() => setView('document')} className="text-sm font-bold text-primary-400 hover:underline">Complete</button>}
                </div>

                <div className={cn("glass p-6 rounded-2xl border flex items-center justify-between transition-colors", isAssetsDone ? "border-green-500/30 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : "border-white/5")}>
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isAssetsDone ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-500")}>
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">3. Assets Management</h4>
                      <p className="text-sm text-slate-400">{isAssetsDone ? `${state.assets.length} Assets Registered` : "Requires at least one asset"}</p>
                    </div>
                  </div>
                  {isAssetsDone ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <button onClick={() => setView('assets')} className="text-sm font-bold text-primary-400 hover:underline">Complete</button>}
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-4">
                <button
                  onClick={handleDeploy}
                  disabled={!isReadyToDeploy || state.status === 'executed' || state.status === 'deploying'}
                  className={cn(
                    "group relative w-full py-6 text-white font-black text-xl rounded-3xl transition-all",
                    state.status === 'executed' ? "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]" : state.status === 'deployed' ? "bg-primary-500 hover:bg-primary-600 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] active:scale-[0.98]" : state.status === 'deploying' ? "bg-primary-500/50 cursor-wait" : isReadyToDeploy ? "bg-primary-500 hover:bg-primary-600 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] active:scale-[0.98]" : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
                  )}
                >
                  {state.status === 'executed' ? (
                    <span className="flex items-center justify-center gap-3"><CheckCircle2 className="w-6 h-6" /> Will Executed</span>
                  ) : state.status === 'deployed' ? (
                    <div className="space-y-1">
                      <span className="flex items-center justify-center gap-3"><Zap className="w-6 h-6" /> Update Will on Blockchain</span>
                      <p className="text-[10px] text-primary-200 font-mono opacity-80">Previous Hash: {state.txHash}</p>
                    </div>
                  ) : state.status === 'deploying' ? (
                    <span className="flex items-center justify-center gap-3"><Activity className="w-6 h-6 animate-spin" /> Securing Will on Blockchain...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-3"><Zap className="w-6 h-6" /> Secure Digital Will on Blockchain</span>
                  )}
                  {isReadyToDeploy && state.status !== 'executed' && <div className="absolute inset-0 bg-primary-400 blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-3xl"></div>}
                </button>

                <button
                  onClick={handleForceRedeploy}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  title="If you see 'Invalid Status' or 'Already Exists', use this to deploy a fresh contract."
                >
                  <RefreshCw className="w-4 h-4" />
                  Force Fresh Contract Deployment (Solves Account Block)
                </button>
              </div>

                {!isReadyToDeploy && (
                  <p className="text-center text-sm text-slate-500 mt-4 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Please complete all steps above to enable deployment
                  </p>
                )}
            </div>
          );
        })()}


      </main>

      {/* Settings Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-3xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {activeModal === 'conditional-rules' && <><GitBranch className="w-5 h-5 text-primary-400" /> Conditional Distribution Rules</>}
                {activeModal === 'dispute-resolution' && <><Scale className="w-5 h-5 text-red-400" /> Dispute & Legal Override Config</>}
                {activeModal === 'deployment-success' && <><ShieldCheck className="w-5 h-5 text-green-400" /> Deployment Overview</>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {activeModal === 'conditional-rules' && (
                <>
                  <div className="flex gap-3 text-slate-400 text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                    <Activity className="w-5 h-5 flex-shrink-0 text-primary-400" />
                    <p>Build logic trees to define exactly how your beneficiaries receive assets. Rules execute sequentially when the main inheritance trigger fires.</p>
                  </div>

                  <div className="space-y-4">
                    {(state.rules || []).map((rule, idx) => (
                      <div key={rule.id} className="p-4 border border-white/10 rounded-2xl bg-white/5 space-y-4 relative group hover:border-white/20 transition-colors">
                        <button
                          onClick={() => setState(prev => ({ ...prev, rules: prev.rules?.filter(r => r.id !== rule.id) }))}
                          className="absolute top-4 right-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded uppercase">If</span>
                            <select
                              value={rule.type}
                              onChange={(e) => {
                                const newRules = [...(state.rules || [])];
                                newRules[idx].type = e.target.value;
                                setState(prev => ({ ...prev, rules: newRules }));
                              }}
                              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500">
                              <option>Beneficiary Age</option>
                              <option>Time Passed</option>
                              <option>Milestone Met</option>
                            </select>
                            <select
                              value={rule.operator}
                              onChange={(e) => {
                                const newRules = [...(state.rules || [])];
                                newRules[idx].operator = e.target.value;
                                setState(prev => ({ ...prev, rules: newRules }));
                              }}
                              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none w-20 focus:border-primary-500">
                              <option>&gt;=</option>
                              <option>&lt;=</option>
                              <option>==</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Value (e.g. 25)"
                              value={rule.value}
                              onChange={(e) => {
                                const newRules = [...(state.rules || [])];
                                newRules[idx].value = e.target.value;
                                setState(prev => ({ ...prev, rules: newRules }));
                              }}
                              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none w-full focus:border-primary-500" />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded uppercase">Then</span>
                            <span className="text-sm text-slate-300">Release Funds</span>
                            <input
                              type="text"
                              placeholder="%"
                              value={rule.release}
                              onChange={(e) => {
                                const newRules = [...(state.rules || [])];
                                newRules[idx].release = e.target.value;
                                setState(prev => ({ ...prev, rules: newRules }));
                              }}
                              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none w-24 ml-auto focus:border-green-500" />
                            <span className="text-sm text-slate-500">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const newRule = { id: Date.now().toString(), type: 'Beneficiary Age', operator: '>=', value: '25', release: '50' };
                      setState(prev => ({ ...prev, rules: [...(prev.rules || []), newRule] }));
                    }}
                    className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary-500/50 hover:bg-white/5 text-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Add Distribution Rule
                  </button>
                </>
              )}

              {activeModal === 'dispute-resolution' && (
                <>
                  <div className="flex gap-3 text-slate-400 text-sm bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                    <p>Configure emergency pauses and override mechanisms to prevent fraudulent or contested inheritance executions.</p>
                  </div>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Cooling Period / Dispute Window</label>
                      <select className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500">
                        <option>7 Days</option>
                        <option selected>14 Days (Recommended)</option>
                        <option>30 Days</option>
                        <option>None (Immediate Execution)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Arbitration Method</label>
                      <select className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500">
                        <option>Legal Authority Override (Oracle)</option>
                        <option selected>Multi-Sig Panel (Trusted Contacts)</option>
                        <option>DAO Consensus (Advanced)</option>
                      </select>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl mt-4">
                      <input type="checkbox" defaultChecked id="freeze" className="w-5 h-5 mt-1 cursor-pointer bg-white/5 border border-white/10 rounded text-red-500 focus:ring-red-500" />
                      <div>
                        <label htmlFor="freeze" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                          Enable Emergency Freeze
                        </label>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">If suspicious activity is detected by your arbitration method, automatically pause all execution logic until further notice.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'deployment-success' && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">System Deployed Successfully!</h3>
                  <p className="text-slate-400">Your modular inheritance system is now live on the blockchain.</p>

                  <div className="grid gap-3 text-left mt-8">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Main System (WillSys)</span>
                      <span className="text-xs font-mono text-primary-400 truncate">{contractAddrs.willSys}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Asset Manager</span>
                      <span className="text-xs font-mono text-primary-400 truncate">{contractAddrs.assetManager}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Will Type Manager</span>
                      <span className="text-xs font-mono text-primary-400 truncate">{contractAddrs.willTypeManager}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Digital Will Core</span>
                      <span className="text-xs font-mono text-primary-400 truncate">{contractAddrs.digitalWill}</span>
                    </div>
                    {state.txHash && (
                      <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30 flex items-center justify-between gap-4 mt-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <div className="flex items-center gap-2 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400 font-bold uppercase tracking-widest">MetaMask Hash</span>
                        </div>
                        <span className="text-sm font-mono text-green-300 truncate" title={state.txHash}>{state.txHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-3xl flex justify-end gap-4">
              <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-medium">Cancel</button>
              <button onClick={() => setActiveModal(null)} className={cn("px-6 py-2.5 rounded-xl text-white font-bold transition-transform hover:scale-[1.02] shadow-lg", activeModal === 'dispute-resolution' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : activeModal === 'deployment-success' ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-primary-500 hover:bg-primary-600 shadow-primary-500/20")}>
                {activeModal === 'deployment-success' ? 'Got it!' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in pointer-events-auto">
          <div className={cn(
            "glass flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl max-w-md transition-all duration-300 transform translate-y-0",
            toast.type === 'success' && "border-green-500/30 bg-green-500/10 text-green-300",
            toast.type === 'error' && "border-red-500/30 bg-red-500/10 text-red-300",
            toast.type === 'warning' && "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
            toast.type === 'info' && "border-blue-500/30 bg-blue-500/10 text-blue-300"
          )}>
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
              {toast.type === 'info' && <ShieldCheck className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-grow text-left">
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirmation/Alert Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-md rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-400" />
                {confirmDialog.title}
              </h3>
              <button 
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                }} 
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                }} 
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                {confirmDialog.cancelText || "Cancel"}
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                }} 
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 transition-transform active:scale-95"
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
