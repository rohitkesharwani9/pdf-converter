import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface RtfToPdfViewProps {
  task: ConversionTask;
}

const RtfToPdfView: React.FC<RtfToPdfViewProps> = ({ task }) => {
  // Perform RTF to PDF conversion by calling backend
  const performRtfToPdfConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    if (files.length > 1) {
      throw new Error('Please upload only one RTF file at a time.');
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
      const response = await fetch('http://localhost:5001/convert/rtf-to-pdf', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to convert RTF file');
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

  // Validate uploaded RTF file
  const validateRtfFile = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return 'Please upload an RTF file.';
    }
    if (files.length > 1) {
      return 'Please upload only one RTF file at a time.';
    }
    const acceptedExtensions = ['.rtf'];
    for (const uploadedFile of files) {
      const fileExtension = uploadedFile.file.name.substring(uploadedFile.file.name.lastIndexOf('.')).toLowerCase();
      if (!acceptedExtensions.includes(fileExtension)) {
        return `File "${uploadedFile.file.name}" is not a supported RTF file. Please upload .rtf files.`;
      }
    }
    return null;
  };

  return (
    <BaseConversionView
      task={task}
      performConversion={performRtfToPdfConversion}
      customValidation={validateRtfFile}
    />
  );
};

export default RtfToPdfView; 