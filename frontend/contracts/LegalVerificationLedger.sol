// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LegalVerificationLedger {
    struct VerificationRecord {
        string docType;
        string ipfsCid;
        bytes32 docHash;
        uint256 timestamp;
        address verifiedBy;
        bool isValid;
    }

    // Owner address mapped to their document verification records
    mapping(address => VerificationRecord[]) private userRecords;

    event DocumentVerified(
        address indexed user,
        string docType,
        bytes32 docHash,
        string ipfsCid,
        uint256 timestamp
    );
    event DocumentRevoked(
        address indexed user,
        bytes32 docHash,
        uint256 timestamp
    );

    /**
     * @dev Records a validated document hash and its IPFS CID on-chain.
     * @param _docType The classified document category (e.g., Aadhaar, PAN, Property).
     * @param _ipfsCid The secure IPFS content identifier.
     * @param _docHash The secure SHA-256 hash of the document.
     */
    function recordVerification(
        string calldata _docType,
        string calldata _ipfsCid,
        bytes32 _docHash
    ) external {
        require(_docHash != bytes32(0), "Invalid document hash");
        require(bytes(_docType).length > 0, "Document type required");

        userRecords[msg.sender].push(VerificationRecord({
            docType: _docType,
            ipfsCid: _ipfsCid,
            docHash: _docHash,
            timestamp: block.timestamp,
            verifiedBy: msg.sender,
            isValid: true
        }));

        emit DocumentVerified(msg.sender, _docType, _docHash, _ipfsCid, block.timestamp);
    }

    /**
     * @dev Revokes a document hash if it is no longer valid or updated.
     * @param _docHash The secure SHA-256 hash to revoke.
     */
    function revokeVerification(bytes32 _docHash) external {
        VerificationRecord[] storage records = userRecords[msg.sender];
        bool found = false;
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].docHash == _docHash && records[i].isValid) {
                records[i].isValid = false;
                found = true;
                break;
            }
        }
        require(found, "Document record not found or already revoked");
        emit DocumentRevoked(msg.sender, _docHash, block.timestamp);
    }

    /**
     * @dev Fetches all verification records for a specific address.
     * @param _user The wallet address to query.
     */
    function getRecords(address _user) external view returns (VerificationRecord[] memory) {
        return userRecords[_user];
    }
}
