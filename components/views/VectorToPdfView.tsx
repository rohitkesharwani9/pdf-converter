import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface VectorToPdfViewProps {
  task: ConversionTask;
}

const VectorToPdfView: React.FC<VectorToPdfViewProps> = ({ task }) => {
  // Perform SVG to PDF conversion by calling backend
  const performVectorToPdfConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    if (files.length > 1) {
      throw new Error('Please upload only one SVG file at a time.');
    }
    const uploadedFile = files[0];
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    // Append all options as form fields (if any)
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });
    let pdfBlob: Blob | null = null;
    let pdfSize = 0;
    try {
      const response = await fetch('/convert/vector-to-pdf', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to convert SVG file');
      }
      pdfBlob = await response.blob();
      pdfSize = pdfBlob.size;
    } catch (err: any) {
      throw new Error(`Failed to convert ${uploadedFile.file.name}: ${err.message}`);
    }
    const originalFileName = uploadedFile.file.name.substring(0, uploadedFile.file.name.lastIndexOf('.')) || uploadedFile.file.name;
    const blobUrl = URL.createObjectURL(pdfBlob!);
    return [{
      id: `processed-${uploadedFile.id}`,
      name: `${originalFileName}.pdf`,
      type: 'PDF',
      size: `${(pdfSize / 1024 / 1024).toFixed(2)}MB`,
      downloadUrl: blobUrl,
    }];
  };

  // Validate uploaded SVG file
  const validateVectorFile = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return 'Please upload an SVG file.';
    }
    if (files.length > 1) {
      return 'Please upload only one SVG file at a time.';
    }
    const acceptedExtensions = ['.svg'];
    for (const uploadedFile of files) {
      const fileExtension = uploadedFile.file.name.substring(uploadedFile.file.name.lastIndexOf('.')).toLowerCase();
      if (!acceptedExtensions.includes(fileExtension)) {
        return `File "${uploadedFile.file.name}" is not a supported SVG file. Please upload .svg files.`;
      }
    }
    return null;
  };

  return (
    <BaseConversionView
      task={task}
      performConversion={performVectorToPdfConversion}
      customValidation={validateVectorFile}
    />
  );
};

export default VectorToPdfView; 