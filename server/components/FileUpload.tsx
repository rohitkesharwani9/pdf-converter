import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, XCircle } from 'lucide-react';
import { UploadedFile } from '../types';
import Button from './Button';

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: string; // e.g., 'image/*,.pdf'
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMB?: number; // Max file size in MB
  label?: string;
  uploadedFiles: UploadedFile[];
  hideFileList?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  accept = '*',
  multiple = true,
  maxFiles,
  maxFileSizeMB = 100, // Default 100MB limit
  label = "Drag & drop files here, or click to select files",
  uploadedFiles,
  hideFileList = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = (file: File): boolean => {
    if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File "${file.name}" exceeds the ${maxFileSizeMB}MB size limit.`);
      return false;
    }
    // Add more validation if needed (e.g., file type against `accept` string more robustly)
    return true;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    let filesArray = Array.from(newFiles);
    
    if (!multiple && filesArray.length > 1) {
        filesArray = [filesArray[0]]; // Take only the first file if not multiple
    }
    
    const validFiles = filesArray.filter(handleFileValidation);
    if (validFiles.length !== filesArray.length && !error) {
         // Error set by handleFileValidation
    }

    const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${file.size}`, // Simple unique ID
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    let updatedFiles = [...uploadedFiles, ...newUploadedFiles];

    if (maxFiles && updatedFiles.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files.`);
      updatedFiles = updatedFiles.slice(0, maxFiles);
    }
    
    if(!multiple && updatedFiles.length > 1) {
        updatedFiles = [updatedFiles[updatedFiles.length -1]]; // Keep only the last one if not multiple
    }

    onFilesChange(updatedFiles);
  }, [onFilesChange, uploadedFiles, multiple, maxFiles, maxFileSizeMB, error]);


  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  }, [addFiles]);

  const handleRemoveFile = useCallback((fileId: string) => {
    const newFiles = uploadedFiles.filter(f => f.id !== fileId);
    // Revoke object URL for removed image previews to free memory
    const removedFile = uploadedFiles.find(f => f.id === fileId);
    if (removedFile?.previewUrl) {
        URL.revokeObjectURL(removedFile.previewUrl);
    }
    onFilesChange(newFiles);
  }, [uploadedFiles, onFilesChange]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
                    transition-colors duration-200 ease-in-out
                    ${isDragging 
                      ? 'border-primary bg-primary/10 dark:bg-primary-dark/20' 
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-primary/70 dark:hover:border-primary-light/70'
                    }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <UploadCloud className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-3" />
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">{label}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            {accept !== '*' ? `Accepted: ${accept}. ` : ''}Max size: {maxFileSizeMB}MB.
            {maxFiles ? ` Max files: ${maxFiles}.` : ''}
        </p>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {uploadedFiles.length > 0 && !hideFileList && (
        <div className="space-y-2 pt-4">
          <h4 className="text-md font-semibold text-neutral-700 dark:text-neutral-300">Selected Files:</h4>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 rounded-md border border-neutral-200 dark:border-neutral-700">
            {uploadedFiles.map((uploadedFile) => (
              <li key={uploadedFile.id} className="p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                <div className="flex items-center space-x-3">
                  {uploadedFile.previewUrl && (
                    <img src={uploadedFile.previewUrl} alt={uploadedFile.file.name} className="w-10 h-10 object-cover rounded" />
                  )}
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-xs" title={uploadedFile.file.name}>
                    {uploadedFile.file.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    ({(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(uploadedFile.id)} aria-label={`Remove ${uploadedFile.file.name}`}>
                  <XCircle className="w-5 h-5 text-red-500 hover:text-red-700" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

    