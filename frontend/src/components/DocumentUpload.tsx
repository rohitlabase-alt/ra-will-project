import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

interface FileData {
  file: File;
  previewUrl: string;
}

interface DocumentUploadProps {
  userAddress: string;
  onUploadSuccess?: (results: any[]) => void;
  setView: (view: any) => void;
}

export default function DocumentUpload({ userAddress, onUploadSuccess, setView }: DocumentUploadProps) {
  const [aadhar, setAadhar] = useState<FileData | null>(null);
  const [pan, setPan] = useState<FileData | null>(null);
  const [propertyDocs, setPropertyDocs] = useState<FileData[]>([]);
  const [bankDocs, setBankDocs] = useState<FileData[]>([]);
  const [otherDocs, setOtherDocs] = useState<FileData[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[] | null>(null);

  // Helper to validate and generate previews
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: string, isMultiple: boolean) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`${file.name} is not a supported format (PDF, DOC, JPG, PNG only).`);
        return false;
      }
      return true;
    }).map(file => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    if (isMultiple) {
      if (category === 'property') setPropertyDocs(prev => [...prev, ...newFiles]);
      if (category === 'bank') setBankDocs(prev => [...prev, ...newFiles]);
      if (category === 'other') setOtherDocs(prev => [...prev, ...newFiles]);
    } else {
      const singleFile = newFiles[0] || null;
      if (category === 'aadhar') setAadhar(singleFile);
      if (category === 'pan') setPan(singleFile);
    }
  };

  const removeFile = (category: string, index?: number) => {
    if (category === 'aadhar') setAadhar(null);
    if (category === 'pan') setPan(null);
    if (category === 'property' && index !== undefined) {
      setPropertyDocs(prev => prev.filter((_, i) => i !== index));
    }
    if (category === 'bank' && index !== undefined) {
      setBankDocs(prev => prev.filter((_, i) => i !== index));
    }
    if (category === 'other' && index !== undefined) {
      setOtherDocs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    const formData = new FormData();
    if (userAddress) {
      formData.append('walletAddress', userAddress);
    }

    // Append files with their categories
    if (aadhar) formData.append('documents', aadhar.file, `aadhar_${aadhar.file.name}`);
    if (pan) formData.append('documents', pan.file, `pan_${pan.file.name}`);
    propertyDocs.forEach(d => formData.append('documents', d.file, `property_${d.file.name}`));
    bankDocs.forEach(d => formData.append('documents', d.file, `bank_${d.file.name}`));
    otherDocs.forEach(d => formData.append('documents', d.file, `other_${d.file.name}`));

    try {
      const response = await fetch('http://localhost:3001/api/upload-will-documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadResults(data.documents);
        if (onUploadSuccess) {
          onUploadSuccess(data.documents);
        }
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server. Please make sure the backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const FilePreviewCard = ({ data, onRemove }: { data: FileData, onRemove: () => void }) => (
    <div className="relative group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {data.previewUrl ? (
        <img src={data.previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
      ) : (
        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-white truncate">{data.file.name}</p>
        <p className="text-xs text-slate-400">{(data.file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button onClick={onRemove} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const UploadSection = ({ title, category, isMultiple, files }: { title: string, category: string, isMultiple: boolean, files: FileData[] }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="space-y-3">
        <h3 className="font-bold text-white flex justify-between items-center">
          {title}
          <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-1 rounded">{isMultiple ? 'Multiple files allowed' : 'Single file'}</span>
        </h3>

        {(!files.length || isMultiple) && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple={isMultiple}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, category, isMultiple)}
            />
            <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">Click to upload {title}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {files.map((file, idx) => (
            <FilePreviewCard key={idx} data={file} onRemove={() => removeFile(category, isMultiple ? idx : undefined)} />
          ))}
        </div>
      </div>
    );
  };

  if (uploadResults) {
    return (
      <div className="max-w-3xl mx-auto p-8 glass rounded-3xl border border-white/10 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Documents Uploaded & Hashed</h2>
          <p className="text-slate-400">Your documents are securely stored and ready for the blockchain.</p>
        </div>
        <div className="space-y-3">
          {uploadResults.map((res, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <p className="font-medium text-white truncate">{res.fileName}</p>
              <div className="flex flex-col text-xs space-y-1">
                <span className="text-slate-400">Hash: <span className="text-green-400 font-mono">{res.hash}</span></span>
                <span className="text-slate-400">Storage: <a href={res.storageUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{res.storageUrl}</a></span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setView('assets')}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all"
        >
          Continue to Asset Management
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 glass rounded-3xl border border-white/10 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-white">Upload Digital Will Documents</h2>
        <p className="text-slate-400">Securely upload your legal documents. We only store the cryptographic hash on the blockchain.</p>
      </div>

      <div className="space-y-8">
        <UploadSection title="Aadhar Card" category="aadhar" isMultiple={false} files={aadhar ? [aadhar] : []} />
        <UploadSection title="PAN Card" category="pan" isMultiple={false} files={pan ? [pan] : []} />
        <div className="h-px bg-white/10"></div>
        <UploadSection title="Property Documents" category="property" isMultiple={true} files={propertyDocs} />
        <UploadSection title="Bank Documents" category="bank" isMultiple={true} files={bankDocs} />
        <UploadSection title="Other Legal Documents" category="other" isMultiple={true} files={otherDocs} />
      </div>

      <div className="pt-6 border-t border-white/10">
        <button
          onClick={handleSubmit}
          disabled={isUploading || (!aadhar && !pan && !propertyDocs.length && !bankDocs.length && !otherDocs.length)}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing & Hashing...</> : "Hash & Upload Documents"}
        </button>
      </div>
    </div>
  );
}
