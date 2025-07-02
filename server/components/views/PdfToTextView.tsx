import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PdfToTextViewProps {
  task: ConversionTask;
}

const PdfToTextView: React.FC<PdfToTextViewProps> = ({ task }) => {
  const performPdfToTextConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);
    
    // Add conversion options
    formData.append('ocr', options.ocr ? 'true' : 'false');
    formData.append('layout', options.layout || 'formatted');
    
    try {
      const response = await fetch('/convert/pdf-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${file.file.name.split('.')[0]}.txt`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download URL
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

    return [{
        id: `processed-${file.id}`,
        name: filename,
        type: 'TXT',
        size: `${(blob.size / 1024).toFixed(2)}KB`,
        downloadUrl: downloadUrl,
      }];
      
    } catch (error) {
      console.error('PDF to Text conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`PDF to Text conversion failed: ${errorMessage}`);
    }
  };
  
  const validatePdfFile = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0 && task.requiresFileUpload) {
      return "Please upload a PDF file.";
    }
    if (files.length > 1) {
      return `Please upload only one PDF file for ${task.name}.`;
    }
    if (files.length === 1 && files[0].file.type !== 'application/pdf') {
      return "Only PDF files (.pdf) are allowed for this conversion.";
    }
    console.log(`${task.name} options:`, options);
    return null;
  };

  return (
    <BaseConversionView 
        task={task} 
        performConversion={performPdfToTextConversion}
        customValidation={validatePdfFile}
    />
  );
};

export default PdfToTextView;
