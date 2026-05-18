import WillSysArtifact from '../artifacts/contracts/WillSys.sol/WillSys.json';
import LegalVerificationArtifact from '../artifacts/contracts/LegalVerificationLedger.sol/LegalVerificationLedger.json';

export const WILL_SYS_ABI = [
  "constructor()",
  "function createWill(string _willType, bytes32[] _documentHashes, (string name, address contractAddress, uint256 amountOrId, uint8 assetType)[] _assets, (uint256 inactivityPeriod, address oracleAddress, address[] witnesses, uint256 requiredWitnesses, uint256 disputeWindow) _trigger) external",
  "function getWill(address _creator) external view returns (string, uint8, uint256, uint256)",
  "function ping() external",
  "event WillCreated(address indexed creator, string willType, uint256 timestamp)",
  "event WillPinged(address indexed creator, uint256 timestamp)"
];

export const WillSysBytecode = WillSysArtifact.bytecode;

export const LEGAL_VERIFICATION_ABI = LegalVerificationArtifact.abi;
export const LegalVerificationBytecode = LegalVerificationArtifact.bytecode;
