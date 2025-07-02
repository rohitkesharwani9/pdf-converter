import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PasswordPdfViewProps {
  task: ConversionTask; // Could be 'password-protect-pdf' or 'unlock-pdf'
}

const PasswordPdfView: React.FC<PasswordPdfViewProps> = ({ task }) => {
  
  const performPasswordOperation = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('No files uploaded');
    }

    const file = files[0].file;
    const { password, confirmPassword } = options;
    
    // Validate password requirements when user clicks Convert
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    
    if (password.length < 6) {
      throw new Error('Password should be at least 6 characters long');
    }
    
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const response = await fetch('/convert/password-protect-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Password protection failed');
    }

    const blob = await response.blob();
    const fileName = file.name.replace(/\.pdf$/i, '_protected.pdf');
    
    return [{
      id: `protected-${Date.now()}`,
      name: fileName,
      type: 'PDF',
      size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      downloadUrl: URL.createObjectURL(blob)
    }];
  };
  
  return (
    <BaseConversionView 
        task={task} 
        performConversion={performPasswordOperation}
    />
  );
};

export default PasswordPdfView;
