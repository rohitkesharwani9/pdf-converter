import React from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';

interface PdfToEpubViewProps {
  task: ConversionTask;
}

const PdfToEpubView: React.FC<PdfToEpubViewProps> = ({ task }) => {
  const performPdfToEpubConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (files.length === 0) return [];
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);
    
    // Add conversion options
    if (options.pages_per_chapter) {
      formData.append('pages_per_chapter', options.pages_per_chapter.toString());
    }
    
    // Add OCR option
    if (options.ocr !== undefined) {
      formData.append('ocr', options.ocr.toString());
    }
    
    // Add image options
    if (options.include_images !== undefined) {
      formData.append('include_images', options.include_images.toString());
    }
    if (options.image_quality) {
      formData.append('image_quality', options.image_quality);
    }
    
    // Add layout options
    if (options.page_break_style) {
      formData.append('page_break_style', options.page_break_style);
    }
    if (options.font_size) {
      formData.append('font_size', options.font_size);
    }
    if (options.line_spacing) {
      formData.append('line_spacing', options.line_spacing);
    }
    if (options.preserve_layout !== undefined) {
      formData.append('preserve_layout', options.preserve_layout.toString());
    }
    
    // Add metadata options
    if (options.add_toc !== undefined) {
      formData.append('add_toc', options.add_toc.toString());
    }
    if (options.custom_title) {
      formData.append('custom_title', options.custom_title);
    }
    if (options.custom_author) {
      formData.append('custom_author', options.custom_author);
    }
    
    try {
      const response = await fetch('http://localhost:5001/convert/pdf-to-epub', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${file.file.name.split('.')[0]}.epub`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(blob);

    return [{
        id: `processed-${file.id}`,
        name: filename,
        type: 'EPUB',
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: downloadUrl,
      }];
      
    } catch (error) {
      console.error('PDF to EPUB conversion error:', error);
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        performConversion={performPdfToEpubConversion}
        customValidation={validatePdfFile}
    />
  );
};

export default PdfToEpubView;
