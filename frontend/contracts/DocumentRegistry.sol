// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentRegistry {
    address public owner;

    struct Document {
        string fileHash;
        string ipfsCid;
        uint256 timestamp;
        address uploader;
        string documentType;
    }

    mapping(string => Document) public documents;

    event DocumentUploaded(
        string indexed fileHash,
        string ipfsCid,
        address indexed uploader,
        uint256 timestamp,
        string documentType
    );

    constructor() {
        owner = msg.sender;
    }

    function storeDocument(
        string memory _fileHash,
        string memory _ipfsCid,
        string memory _documentType
    ) public {
        require(bytes(documents[_fileHash].fileHash).length == 0, "Document already exists");

        documents[_fileHash] = Document({
            fileHash: _fileHash,
            ipfsCid: _ipfsCid,
            timestamp: block.timestamp,
            uploader: msg.sender,
            documentType: _documentType
        });

        emit DocumentUploaded(_fileHash, _ipfsCid, msg.sender, block.timestamp, _documentType);
    }

    function verifyDocument(string memory _fileHash) public view returns (Document memory) {
        require(bytes(documents[_fileHash].fileHash).length != 0, "Document does not exist");
        return documents[_fileHash];
    }
}
