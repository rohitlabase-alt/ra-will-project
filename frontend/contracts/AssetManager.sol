// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AssetManager {
    struct Asset {
        string name;
        address contractAddress;
        uint256 amountOrId;
        bool exists;
    }

    mapping(address => Asset[]) public userAssets;

    function registerAsset(string calldata _name, address _contract, uint256 _id) external {
        userAssets[msg.sender].push(Asset(_name, _contract, _id, true));
    }

    function getAssets(address _user) external view returns (Asset[] memory) {
        return userAssets[_user];
    }
}
