package models

import "time"

type DocumentResponse struct {
	FileName   string `json:"fileName"`
	Hash       string `json:"hash"`
	StorageURL string `json:"storageUrl"`
	IpfsHash   string `json:"ipfsHash"`
}

type PinataResponse struct {
	IpfsHash  string `json:"IpfsHash"`
	PinSize   int    `json:"PinSize"`
	Timestamp string `json:"Timestamp"`
}

type WillDocument struct {
	WalletAddress string    `json:"walletAddress" bson:"walletAddress"`
	FileName      string    `json:"fileName" bson:"fileName"`
	FilePath      string    `json:"filePath" bson:"filePath"`
	Hash          string    `json:"hash" bson:"hash"`
	StorageURL    string    `json:"storageUrl" bson:"storageUrl"`
	IpfsHash      string    `json:"ipfsHash" bson:"ipfsHash"`
	UploadedAt    time.Time `json:"uploadedAt" bson:"uploadedAt"`
}

type WillRecord struct {
	UserAddress         string      `json:"userAddress" bson:"userAddress"`
	WillType            string      `json:"willType" bson:"willType"`
	Status              string      `json:"status" bson:"status"`
	TxHash              string      `json:"txHash" bson:"txHash"`
	Assets              interface{} `json:"assets" bson:"assets"`
	Beneficiaries       interface{} `json:"beneficiaries" bson:"beneficiaries"`
	DocumentHashes      []string    `json:"documentHashes" bson:"documentHashes"`
	WillTypeFormData    interface{} `json:"willTypeFormData" bson:"willTypeFormData"`
	Is2FAEnabled        bool        `json:"is2FAEnabled" bson:"is2FAEnabled"`
	IsBiometricsEnabled bool        `json:"isBiometricsEnabled" bson:"isBiometricsEnabled"`
	CreatedAt           time.Time   `json:"createdAt" bson:"createdAt"`
}
