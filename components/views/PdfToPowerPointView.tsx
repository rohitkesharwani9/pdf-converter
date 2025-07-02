import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PdfToPowerPointViewProps {
  task: ConversionTask;
}

const PdfToPowerPointView: React.FC<PdfToPowerPointViewProps> = ({ task }) => {
  const performPdfToPowerPointConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    
    const file = files[0].file;
    const conversionType = options.conversionType || 'image'; // 'image' or 'text'
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversionType', conversionType);

    try {
      const response = await fetch('/convert/pdf-to-powerpoint', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'converted.pptx';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download URL
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

    return [{
      id: `processed-${files[0].id}`,
          name: filename,
          type: 'PPTX',
          size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
          downloadUrl: url,
        }];
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred during conversion');
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
        performConversion={performPdfToPowerPointConversion}
        customValidation={validatePdfFile}
    />
  );
};

export default PdfToPowerPointView;
