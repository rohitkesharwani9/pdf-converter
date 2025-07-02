import React, { useState } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PowerPointToPdfViewProps {
  task: ConversionTask;
}

const PowerPointToPdfView: React.FC<PowerPointToPdfViewProps> = ({ task }) => {
  const [bulkError, setBulkError] = useState<string | null>(null);

  const performPowerPointToPdfConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    setBulkError(null);
    if (files.length === 0) return [];
    if (files.length > 3) {
      setBulkError('Maximum 3 files supported in bulk conversion.');
      throw new Error('Maximum 3 files supported in bulk conversion.');
    }
    const results: ProcessedFile[] = [];
    for (const uploadedFile of files) {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      let pdfBlob: Blob | null = null;
      let pdfSize = 0;
      try {
        const response = await fetch('http://localhost:5001/convert/powerpoint-to-pdf', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to convert file');
        }
        pdfBlob = await response.blob();
        pdfSize = pdfBlob.size;
      } catch (err: any) {
        throw new Error(`Failed to convert ${uploadedFile.file.name}: ${err.message}`);
      }
      const originalFileName = uploadedFile.file.name.substring(0, uploadedFile.file.name.lastIndexOf('.')) || uploadedFile.file.name;
      const blobUrl = URL.createObjectURL(pdfBlob!);
      results.push({
        id: `processed-${uploadedFile.id}`,
        name: `${originalFileName}.pdf`,
        type: 'PDF',
        size: `${(pdfSize / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: blobUrl,
      });
    }
    return results;
  };

  const validatePowerPointFiles = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (task.requiresFileUpload && files.length === 0) {
      return "Please upload at least one PowerPoint file.";
    }
    if (files.length > 3) {
      return 'Maximum 3 files supported in bulk conversion.';
    }
    const acceptedMimeTypes = [
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
    ];
    const acceptedExtensions = ['.ppt', '.pptx'];
    for (const uploadedFile of files) {
      const fileExtension = uploadedFile.file.name.substring(uploadedFile.file.name.lastIndexOf('.')).toLowerCase();
      if (!acceptedMimeTypes.includes(uploadedFile.file.type) && !acceptedExtensions.includes(fileExtension)) {
        return `File \"${uploadedFile.file.name}\" is not a supported PowerPoint file. Please upload .ppt or .pptx files.`;
      }
    }
    return null;
  };

  return (
    <>
      {bulkError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {bulkError}
        </div>
      )}
      <BaseConversionView
        task={task}
        performConversion={performPowerPointToPdfConversion}
        customValidation={validatePowerPointFiles}
      />
    </>
  );
};

export default PowerPointToPdfView; 