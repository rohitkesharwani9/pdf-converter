import React, { useState } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfToRtfViewProps {
  task: ConversionTask;
}

const PdfToRtfView: React.FC<PdfToRtfViewProps> = ({ task }) => {
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadedFileId, setLoadedFileId] = useState<string | null>(null);

  const loadPdfForValidation = async (file: File, fileId: string) => {
    if (loadingPdf || fileId === loadedFileId) return;

    setLoadingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setLoadedFileId(fileId);
    } catch (err) {
      console.error("Failed to load PDF for validation:", err);
      setTotalPages(0);
      setLoadedFileId(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const validatePageSelection = (selection: string): string | null => {
    if (totalPages === 0) return null; // Don't validate if PDF isn't loaded yet

    if (!selection || selection.toLowerCase() === 'all') {
      return null;
    }

    const pages = new Set<number>();
    const parts = selection.split(',');
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        try {
          const [start, end] = trimmedPart.split('-').map(p => parseInt(p.trim()));
          if (isNaN(start) || isNaN(end) || start > end) {
            return `Pages to Convert: Invalid range format: ${trimmedPart}`;
          }
          for (let i = start; i <= end; i++) pages.add(i);
        } catch {
          return `Pages to Convert: Invalid range format: ${trimmedPart}`;
        }
      } else {
        try {
          const pageNum = parseInt(trimmedPart);
          if (isNaN(pageNum)) {
            return `Pages to Convert: Invalid page number: ${trimmedPart}`;
          }
          pages.add(pageNum);
        } catch {
          return `Pages to Convert: Invalid page number: ${trimmedPart}`;
        }
      }
    }

    const invalidPages = Array.from(pages).filter(page => page < 1 || page > totalPages);
    if (invalidPages.length > 0) {
      return `Pages to Convert: Invalid page(s): ${invalidPages.join(', ')}. PDF has ${totalPages} pages.`;
    }

    return null;
  };

  const performPdfToRtfConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    
    const pageSelectionError = validatePageSelection(options.page_selection || 'all');
    if (pageSelectionError) {
      throw new Error(pageSelectionError);
    }
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);
    
    // Add conversion options
    Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
    });
    
    try {
      const response = await fetch('http://localhost:5001/convert/pdf-to-rtf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${file.file.name.split('.')[0]}.rtf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      return [{
        id: `processed-${file.id}`,
        name: filename,
        type: 'RTF',
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: downloadUrl,
      }];
      
    } catch (error) {
      console.error('PDF to RTF conversion error:', error);
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const customFileValidation = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0 && task.requiresFileUpload) {
      // Reset when file is cleared
      if (loadedFileId) {
        setTotalPages(0);
        setLoadedFileId(null);
      }
      return "Please upload a PDF file.";
    }
    if (files.length > 1) {
      return `Please upload only one PDF file for ${task.name}.`;
    }
    const file = files[0];
    if (file.file.type !== 'application/pdf') {
      return "Only PDF files (.pdf) are allowed for this conversion.";
    }

    // Load PDF if it's new
    if (file.id !== loadedFileId) {
      loadPdfForValidation(file.file, file.id);
    }

    // Perform page selection validation
    return validatePageSelection(options.page_selection || 'all');
  };

  return (
    <BaseConversionView 
        task={task} 
        performConversion={performPdfToRtfConversion}
        customValidation={customFileValidation}
    />
  );
};

export default PdfToRtfView;
