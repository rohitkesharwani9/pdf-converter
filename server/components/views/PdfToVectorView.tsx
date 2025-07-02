
import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PdfToVectorViewProps {
  task: ConversionTask;
}

const PdfToVectorView: React.FC<PdfToVectorViewProps> = ({ task }) => {
  const performPdfToVectorConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    await new Promise(resolve => setTimeout(resolve, 2200 + Math.random() * 800));

    if (files.length === 0) return [];
    
    const outputFormat = task.supportedOutputFormats?.[0]?.value || 'svg';
    const originalFileName = files[0].file.name.split('.')[0];

    // Simulate multiple SVGs if 'pages' option implies multiple outputs, or one combined
    // For simplicity, one SVG output for now.
    return [{
      id: `processed-${files[0].id}`,
      name: `${originalFileName}.${outputFormat}`,
      type: outputFormat.toUpperCase(),
      size: `${(files[0].file.size / 1024 / 1024 * 0.4).toFixed(2)}MB (simulated)`, // SVG size varies a lot
      downloadUrl: '#',
    }];
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
        performConversion={performPdfToVectorConversion}
        customValidation={validatePdfFile}
    />
  );
};

export default PdfToVectorView;
