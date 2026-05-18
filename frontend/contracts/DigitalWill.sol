// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WillSys is ReentrancyGuard {
    enum AssetType { Native, ERC20, ERC721 }
    enum WillStatus { Draft, Deployed, Executing, Executed, Contested }

    struct Beneficiary {
        address wallet;
        uint256 allocationPercentage;
        bool exists;
        bool zkpProtected;
    }

    struct Asset {
        string name;
        address contractAddress;
        uint256 amountOrId;
        AssetType assetType;
        bool registered;
    }

    struct TriggerConfig {
        uint256 inactivityPeriod;
        address oracleAddress;
        address[] witnesses;
        uint256 requiredWitnesses;
        uint256 disputeWindow;
    }

    address public owner;
    WillStatus public status;
    uint256 public lastPing;
    TriggerConfig public config;
    string public willType;
    bytes32[] public documentHashes;

    Beneficiary[] public beneficiaries;
    mapping(address => uint256) public beneficiaryIndex;

    Asset[] public assets;

    mapping(address => bool) public isWitness;
    mapping(address => bool) public witnessApproved;
    uint256 public witnessApprovalCount;

    event WillPinged(address indexed owner, uint256 timestamp);
    event AssetRegistered(string name, address contractAddress, AssetType assetType);
    event BeneficiaryAdded(address indexed wallet, uint256 allocation);
    event ExecutionTriggered(uint256 timestamp, string reason);
    event WillExecuted(uint256 timestamp);
    event WillContested(address indexed by, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Not owner");
        _;
    }

    modifier onlyWitness() {
        require(isWitness[msg.sender], "Unauthorized: Not witness");
        _;
    }

    modifier inStatus(WillStatus _status) {
        require(status == _status, "Invalid status for this action");
        _;
    }

    constructor() {
        owner = msg.sender;
        status = WillStatus.Draft;
        lastPing = block.timestamp;
    }

    function ping() external onlyOwner {
        lastPing = block.timestamp;
        emit WillPinged(owner, block.timestamp);
    }

    function addBeneficiary(address _wallet, uint256 _allocation, bool _zkp) external onlyOwner inStatus(WillStatus.Draft) {
        require(_wallet != address(0), "Invalid beneficiary address");
        require(_allocation > 0 && _allocation <= 100, "Invalid allocation");

        beneficiaries.push(Beneficiary({
            wallet: _wallet,
            allocationPercentage: _allocation,
            exists: true,
            zkpProtected: _zkp
        }));

        emit BeneficiaryAdded(_wallet, _allocation);
    }

    function registerAsset(
        string memory _name,
        address _contractAddress,
        uint256 _amountOrId,
        AssetType _type
    ) external onlyOwner inStatus(WillStatus.Draft) {
        assets.push(Asset({
            name: _name,
            contractAddress: _contractAddress,
            amountOrId: _amountOrId,
            assetType: _type,
            registered: true
        }));

        emit AssetRegistered(_name, _contractAddress, _type);
    }

    function configureTriggers(
        uint256 _inactivity,
        address _oracle,
        address[] memory _witnesses,
        uint256 _requiredWitnesses,
        uint256 _disputeWindow
    ) external onlyOwner inStatus(WillStatus.Draft) {
        config.inactivityPeriod = _inactivity;
        config.oracleAddress = _oracle;
        config.witnesses = _witnesses;
        config.requiredWitnesses = _requiredWitnesses;
        config.disputeWindow = _disputeWindow;

        for(uint i = 0; i < _witnesses.length; i++) {
            isWitness[_witnesses[i]] = true;
        }
    }

    struct AssetInput {
        string name;
        address contractAddress;
        uint256 amountOrId;
        AssetType assetType;
    }

    struct BeneficiaryInput {
        address wallet;
        uint256 allocationPercentage;
        bool zkpProtected;
    }

    struct TriggerInput {
        uint256 inactivityPeriod;
        address oracleAddress;
        address[] witnesses;
        uint256 requiredWitnesses;
        uint256 disputeWindow;
    }

    function createWill(
        string calldata _willType,
        bytes32[] calldata _documentHashes,
        AssetInput[] calldata _assets,
        BeneficiaryInput[] calldata _beneficiaries,
        TriggerInput calldata _trigger
    ) external onlyOwner inStatus(WillStatus.Draft) {
        require(bytes(_willType).length > 0, "Will Type is required");
        require(_documentHashes.length > 0, "At least one document hash required");
        require(_assets.length > 0, "At least one asset required");
        require(_beneficiaries.length > 0, "At least one beneficiary required");

        willType = _willType;
        for (uint i = 0; i < _documentHashes.length; i++) {
            documentHashes.push(_documentHashes[i]);
        }

        uint256 totalAlloc = 0;
        for (uint i = 0; i < _beneficiaries.length; i++) {
            require(_beneficiaries[i].wallet != address(0), "Invalid beneficiary address");
            require(_beneficiaries[i].allocationPercentage > 0, "Invalid allocation");

            beneficiaries.push(Beneficiary({
                wallet: _beneficiaries[i].wallet,
                allocationPercentage: _beneficiaries[i].allocationPercentage,
                exists: true,
                zkpProtected: _beneficiaries[i].zkpProtected
            }));
            totalAlloc += _beneficiaries[i].allocationPercentage;
            emit BeneficiaryAdded(_beneficiaries[i].wallet, _beneficiaries[i].allocationPercentage);
        }
        require(totalAlloc == 100, "Total allocation must be 100%");

        for (uint i = 0; i < _assets.length; i++) {
            assets.push(Asset({
                name: _assets[i].name,
                contractAddress: _assets[i].contractAddress,
                amountOrId: _assets[i].amountOrId,
                assetType: _assets[i].assetType,
                registered: true
            }));
            emit AssetRegistered(_assets[i].name, _assets[i].contractAddress, _assets[i].assetType);
        }

        config.inactivityPeriod = _trigger.inactivityPeriod;
        config.oracleAddress = _trigger.oracleAddress;
        config.witnesses = _trigger.witnesses;
        config.requiredWitnesses = _trigger.requiredWitnesses;
        config.disputeWindow = _trigger.disputeWindow;

        for(uint i = 0; i < _trigger.witnesses.length; i++) {
            isWitness[_trigger.witnesses[i]] = true;
        }

        status = WillStatus.Deployed;
        lastPing = block.timestamp;
    }

    function deployWill(string calldata _willType, bytes32 _documentHash) external onlyOwner inStatus(WillStatus.Draft) {
        require(bytes(_willType).length > 0, "Will Type is required");
        require(_documentHash != bytes32(0), "Document Hash is required");

        uint256 totalAlloc = 0;
        for(uint i = 0; i < beneficiaries.length; i++) {
            totalAlloc += beneficiaries[i].allocationPercentage;
        }
        require(totalAlloc == 100, "Total allocation must be 100%");
        require(assets.length > 0, "At least one asset required");

        willType = _willType;
        documentHashes.push(_documentHash);
        status = WillStatus.Deployed;
        lastPing = block.timestamp;
    }

    function triggerExecution() external nonReentrant {
        bool timeLockExpired = block.timestamp > lastPing + config.inactivityPeriod;
        bool oracleTrigger = (msg.sender == config.oracleAddress && config.oracleAddress != address(0));

        require(timeLockExpired || oracleTrigger, "Conditions not met");
        require(status == WillStatus.Deployed, "Already executing or finished");

        status = WillStatus.Executing;
        emit ExecutionTriggered(block.timestamp, timeLockExpired ? "Time-lock" : "Oracle");
    }

    function approveByWitness() external onlyWitness inStatus(WillStatus.Deployed) {
        require(!witnessApproved[msg.sender], "Already approved");
        witnessApproved[msg.sender] = true;
        witnessApprovalCount++;

        if (witnessApprovalCount >= config.requiredWitnesses) {
            status = WillStatus.Executing;
            emit ExecutionTriggered(block.timestamp, "Multi-sig");
        }
    }

    function finalizeExecution() external nonReentrant inStatus(WillStatus.Executing) {
        status = WillStatus.Executed;

        for (uint i = 0; i < assets.length; i++) {
            _distributeAsset(assets[i]);
        }

        emit WillExecuted(block.timestamp);
    }

    function _distributeAsset(Asset storage asset) internal {
        if (asset.assetType == AssetType.Native) {
            uint256 balance = address(this).balance;
            if (balance > 0) {
                for (uint j = 0; j < beneficiaries.length; j++) {
                    uint256 share = (balance * beneficiaries[j].allocationPercentage) / 100;
                    (bool success, ) = payable(beneficiaries[j].wallet).call{value: share}("");
                    require(success, "ETH transfer failed");
                }
            }
        } else if (asset.assetType == AssetType.ERC20) {
            IERC20 token = IERC20(asset.contractAddress);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) {
                for (uint j = 0; j < beneficiaries.length; j++) {
                    uint256 share = (balance * beneficiaries[j].allocationPercentage) / 100;
                    token.transfer(beneficiaries[j].wallet, share);
                }
            }
        } else if (asset.assetType == AssetType.ERC721) {
            IERC721 nft = IERC721(asset.contractAddress);
            if (nft.ownerOf(asset.amountOrId) == address(this)) {
                nft.transferFrom(address(this), beneficiaries[0].wallet, asset.amountOrId);
            }
        }
    }

    function contestWill(string calldata reason) external inStatus(WillStatus.Executing) {
        require(isWitness[msg.sender] || msg.sender == owner, "Unauthorized");
        status = WillStatus.Contested;
        emit WillContested(msg.sender, reason);
    }

    receive() external payable {
        if (msg.sender == owner) {
            lastPing = block.timestamp;
        }
    }
}