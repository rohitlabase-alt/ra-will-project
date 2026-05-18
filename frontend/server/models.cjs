const mongoose = require('mongoose');

// Define Mongoose Schema for User
const UserSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Define Mongoose Schema for Document
const DocumentSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    category: { type: String, enum: ['Aadhaar', 'PAN', 'Property', 'Bank', 'Legal', 'Other', 'Unknown'], required: true },
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
    maskedValue: { type: String, default: "" }, // masked Aadhaar/PAN
    ipfsCid: { type: String, required: true },
    docHash: { type: String, required: true, unique: true },
    txHash: { type: String, default: "" },
    blockchainStatus: { type: String, enum: ['Pending', 'Confirmed', 'Revoked'], default: 'Pending' },
    uploadedBy: { type: String, required: true }, // User wallet address
    uploadedAt: { type: Date, default: Date.now }
});

// Define Mongoose Schema for Verification Status
const VerificationStatusSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    ocrTextSnippet: { type: String, default: "" },
    ocrStatus: { type: String, enum: ['Success', 'Failed', 'Skipped'], default: 'Skipped' },
    aiClassification: { type: String, default: "Pending" },
    isFraudAlert: { type: Boolean, default: false },
    fraudDetails: { type: String, default: "" },
    validatedAt: { type: Date, default: Date.now }
});

// Define Mongoose Schema for Hash Logs
const HashLogSchema = new mongoose.Schema({
    docHash: { type: String, required: true },
    ipfsCid: { type: String, required: true },
    txHash: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
});

// Define Mongoose Schema for Audit Logs
const AuditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    userWallet: { type: String, required: true },
    description: { type: String, required: true },
    ipAddress: { type: String, default: "127.0.0.1" },
    timestamp: { type: Date, default: Date.now }
});

// Mongoose Models
const User = mongoose.model('User', UserSchema);
const Document = mongoose.model('Document', DocumentSchema);
const VerificationStatus = mongoose.model('VerificationStatus', VerificationStatusSchema);
const HashLog = mongoose.model('HashLog', HashLogSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = {
    User,
    Document,
    VerificationStatus,
    HashLog,
    AuditLog
};
