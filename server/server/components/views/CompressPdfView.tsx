import React from 'react';
import BaseConversionView from './BaseConversionView';
import { ConversionType, getTaskById } from '../../constants';
import { UploadedFile, ProcessedFile } from '../../types';

const CompressPdfView: React.FC = () => {
  const performConversion = async (files: UploadedFile[], options: Record<string, any>): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('No files uploaded');
    }

    const file = files[0].file;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compression_level', options.compression_level || 'ebook');
    formData.append('grayscale', options.grayscale ? 'true' : 'false');

    const response = await fetch('/convert/compress-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Compression failed');
    }

    const blob = await response.blob();
    const fileName = file.name.replace(/\.pdf$/i, '_compressed.pdf');
    
    return [{
      id: `compressed-${Date.now()}`,
      name: fileName,
      type: 'PDF',
      size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      downloadUrl: URL.createObjectURL(blob)
    }];
  };

  const task = getTaskById(ConversionType.COMPRESS_PDF);
  if (!task) {
    throw new Error('Compress PDF task not found');
  }

  return (
    <BaseConversionView
      task={task}
      performConversion={performConversion}
    />
  );
};

export default CompressPdfView; 