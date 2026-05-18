// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WillTypeManager {
    enum WillType { Simple, Trust, Joint, LandTransfer, BusinessSuccession }
    
    struct WillDetails {
        WillType selectedType;
        string formData; // IPFS hash or metadata
        uint256 updatedAt;
    }

    mapping(address => WillDetails) public userWills;

    function setWillType(uint8 _type, string calldata _formData) external {
        userWills[msg.sender] = WillDetails(WillType(_type), _formData, block.timestamp);
    }

    function getWill(address _user) external view returns (WillType, string memory) {
        return (userWills[_user].selectedType, userWills[_user].formData);
    }
}
