import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../api/supabase';

interface DocumentUploadProps {
  patientId: string;
  onUploadComplete?: (url: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ patientId, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Cannot upload files.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('clinical-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('clinical-documents')
        .getPublicUrl(fileName);

      setSuccess(true);
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
      setFile(null); // Reset after successful upload
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center bg-surface/50 transition-colors hover:bg-surface relative">
      {!file ? (
        <>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-text-main mb-1">Upload Clinical Document</p>
          <p className="text-xs text-text-muted mb-4 text-center max-w-xs">
            Attach lab results, imaging reports, or transfer notes (PDF, PNG, JPEG).
          </p>
          <label className="btn btn-secondary cursor-pointer">
            <span>Select File</span>
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
          </label>
        </>
      ) : (
        <div className="w-full flex items-center justify-between p-4 bg-background rounded-lg border border-border-glass">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-text-main truncate">{file.name}</p>
              <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFile(null)} 
              className="p-2 rounded-lg hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
              disabled={uploading}
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleUpload} 
              className="btn btn-primary py-1.5 px-3 text-xs"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 w-full p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center gap-2 text-danger text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 w-full p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-500 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Document uploaded successfully.
        </div>
      )}
    </div>
  );
};
