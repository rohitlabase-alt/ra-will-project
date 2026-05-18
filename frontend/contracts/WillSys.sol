// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract WillSys {
    enum AssetType { Native, ERC20, ERC721 }
    enum WillStatus { Draft, Deployed, Executing, Executed, Contested }

    struct Asset {
        string name;
        address contractAddress;
        uint256 amountOrId;
        AssetType assetType;
    }

    struct TriggerConfig {
        uint256 inactivityPeriod;
        address oracleAddress;
        address[] witnesses;
        uint256 requiredWitnesses;
        uint256 disputeWindow;
    }

    struct Will {
        string willType;
        bytes32[] documentHashes;
        Asset[] assets;
        TriggerConfig trigger;
        WillStatus status;
        uint256 lastPing;
        bool exists;
    }

    mapping(address => Will) private userWills;
    
    event WillCreated(address indexed creator, string willType, uint256 timestamp);
    event WillPinged(address indexed creator, uint256 timestamp);

    function createWill(
        string calldata _willType,
        bytes32[] calldata _documentHashes,
        Asset[] calldata _assets,
        TriggerConfig calldata _trigger
    ) external {
        require(bytes(_willType).length > 0, "Will Type required");
        require(_assets.length > 0, "Assets required");

        Will storage w = userWills[msg.sender];
        w.willType = _willType;
        w.status = WillStatus.Deployed;
        w.lastPing = block.timestamp;
        w.exists = true;
        w.trigger = _trigger;

        delete w.documentHashes;
        for (uint i = 0; i < _documentHashes.length; i++) {
            w.documentHashes.push(_documentHashes[i]);
        }

        delete w.assets;
        for (uint i = 0; i < _assets.length; i++) {
            w.assets.push(_assets[i]);
        }

        emit WillCreated(msg.sender, _willType, block.timestamp);
    }

    function ping() external {
        require(userWills[msg.sender].exists, "No will found");
        userWills[msg.sender].lastPing = block.timestamp;
        emit WillPinged(msg.sender, block.timestamp);
    }

    function getWill(address _creator) external view returns (
        string memory willType,
        WillStatus status,
        uint256 lastPing,
        uint256 assetCount
    ) {
        Will storage w = userWills[_creator];
        require(w.exists, "Will not found");
        return (w.willType, w.status, w.lastPing, w.assets.length);
    }
}