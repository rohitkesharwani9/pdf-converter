import React, { useState, useEffect } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface SplitPdfViewProps {
  task: ConversionTask;
}

const SplitPdfView: React.FC<SplitPdfViewProps> = ({ task }) => {
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const getPdfPageCount = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdfDoc.numPages;
  };

  useEffect(() => {
    // This effect can be used to load page count when a file is uploaded.
    // We'll manage this through the custom validation logic for now.
    setTotalPages(null);
  }, [task]);

  const handlePerformConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error("Please upload a PDF file to split.");
    }
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);
    formData.append('options', JSON.stringify(options));

    const response = await fetch('/convert/split-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to split PDF.' }));
      throw new Error(errorData.error || 'Server error during split');
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'split.zip';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match && match.length > 1) filename = match[1];
    }
    
    return [{
      id: `split-${Date.now()}`,
      name: filename,
      type: 'ZIP',
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      downloadUrl: downloadUrl,
    }];
  };

  const handleCustomValidation = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<string | null> => {
    if (files.length === 0) {
      return null; // Don't show an error before a file is uploaded
    }
    const file = files[0].file;
    
    let pages = totalPages;
    if (pages === null) {
      try {
        pages = await getPdfPageCount(file);
        setTotalPages(pages);
      } catch (e) {
        return 'Could not read PDF. It may be corrupt or protected.';
      }
    }

    if (options.split_mode === 'ranges') {
      const ranges = options.page_ranges?.trim();
      if (!ranges) {
        return 'Pages to Extract: Please enter page ranges to split.';
      }

      // Regex to validate ranges: allows numbers, commas, and hyphens.
      // e.g., "1-3, 5, 8-10"
      const validRangeRegex = /^[0-9,\s-]*$/;
      if (!validRangeRegex.test(ranges)) {
        return 'Pages to Extract: Invalid characters found. Use only numbers, commas, and hyphens.';
      }
      
      const parts = ranges.split(',').map((p: string) => p.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const range = part.split('-');
          if (range.length !== 2 || !range[0] || !range[1]) {
            return `Pages to Extract: Invalid range format "${part}". Use format like "1-3".`;
          }
          const start = parseInt(range[0], 10);
          const end = parseInt(range[1], 10);
          if (isNaN(start) || isNaN(end) || start < 1 || end > pages || start > end) {
            return `Pages to Extract: Invalid range "${part}". Pages must be between 1 and ${pages}.`;
          }
        } else {
          const pageNum = parseInt(part, 10);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > pages) {
            return `Pages to Extract: Invalid page number "${part}". Must be between 1 and ${pages}.`;
          }
        }
      }
    }
    
    return null; // All good
  };

  // Note: We are using a custom async validation function here.
  // BaseConversionView doesn't support async validation directly.
  // This is a common challenge. We will work around it by storing the error in local state.
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const validationWrapper = (files: UploadedFile[], options: Record<string, any>): string | null => {
    // This function is synchronous, but it triggers the async validation.
    handleCustomValidation(files, options)
      .then(setValidationError)
      .catch(e => setValidationError(e.message));
      
    // Return the latest validation error state.
    return validationError;
  };

  return (
    <BaseConversionView
      task={task}
      performConversion={handlePerformConversion}
      customValidation={validationWrapper}
    />
  );
};

export default SplitPdfView; 