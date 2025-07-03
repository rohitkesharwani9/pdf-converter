import React, { useState, useCallback } from 'react';
import BaseConversionView from './BaseConversionView';
import { ConversionType, getTaskById } from '../../constants';
import { UploadedFile, ProcessedFile } from '../../types';
import PageManager from '../PageManager';
import { Box, Typography, CircularProgress } from '@mui/material';

interface PageValidationErrors {
  pageOrder?: string;
  rotatePages?: string;
  deletePages?: string;
}

const OrganizePdfView: React.FC = () => {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [lastProcessedFile, setLastProcessedFile] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<PageValidationErrors>({});
  const [pageOperations, setPageOperations] = useState({
    pageOrder: '',
    rotatePages: '',
    deletePages: ''
  });
  const [resetKey, setResetKey] = useState(0);

  const getPageCount = async (file: File) => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    // Reset state for new file
    setPageCount(null);
    setPageOperations({
      pageOrder: '',
      rotatePages: '',
      deletePages: ''
    });
    setValidationErrors({});
    setResetKey(prev => prev + 1);
    setLastProcessedFile(fileKey);
    
    setIsLoadingPageCount(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/get-pdf-page-count', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPageCount(data.pageCount);
        return data.pageCount;
      } else {
        console.error('Failed to get page count');
        setPageCount(null);
        return null;
      }
    } catch (error) {
      console.error('Error getting page count:', error);
      setPageCount(null);
      return null;
    } finally {
      setIsLoadingPageCount(false);
    }
  };

  const validatePageInputs = (options: Record<string, any>, totalPages: number): string | null => {
    const errors: string[] = [];

    // Validate page order
    if (options.page_order && totalPages) {
      const pageNumbers = options.page_order.split(',').map((s: string) => s.trim());
      for (const pageStr of pageNumbers) {
        const pageNum = parseInt(pageStr);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          errors.push(`Page ${pageNum} does not exist (PDF has ${totalPages} pages)`);
          break;
        }
      }
    }

    // Validate rotate pages
    if (options.rotate_pages && totalPages) {
      const rotations = options.rotate_pages.split(',').map((s: string) => s.trim());
      for (const rotation of rotations) {
        if (!rotation.includes(':')) {
          errors.push('Invalid rotation format. Use "page:angle" (e.g., 2:90,3:180)');
          break;
        }
        const [pageStr, angleStr] = rotation.split(':');
        const pageNum = parseInt(pageStr.trim());
        const angle = parseInt(angleStr.trim());
        
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          errors.push(`Page ${pageNum} does not exist for rotation (PDF has ${totalPages} pages)`);
          break;
        }
        
        if (isNaN(angle) || ![90, 180, 270].includes(angle)) {
          errors.push(`Invalid rotation angle ${angle}. Use 90, 180, or 270 degrees`);
          break;
        }
      }
    }

    // Validate delete pages
    if (options.delete_pages && totalPages) {
      const pageNumbers = options.delete_pages.split(',').map((s: string) => s.trim());
      for (const pageStr of pageNumbers) {
        const pageNum = parseInt(pageStr);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          errors.push(`Page ${pageNum} does not exist for deletion (PDF has ${totalPages} pages)`);
          break;
        }
      }
    }

    return errors.length > 0 ? errors.join('; ') : null;
  };

  const customValidation = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return 'No files uploaded';
    }

    // Get page count when files are uploaded
    if (files.length > 0 && !isLoadingPageCount) {
      const file = files[0].file;
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      
      // Only process if this is a different file
      if (lastProcessedFile !== fileKey) {
        getPageCount(file);
      }
    }

    return null;
  };

  const performOrganization = async (files: UploadedFile[], options: Record<string, any>): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('No files uploaded');
    }

    const file = files[0].file;
    
    // Get page count for validation
    const totalPages = await getPageCount(file);
    if (!totalPages) {
      throw new Error('Could not determine PDF page count');
    }

    // Use the page operations from the PageManager
    const finalOptions = {
      page_order: pageOperations.pageOrder,
      rotate_pages: pageOperations.rotatePages,
      delete_pages: pageOperations.deletePages
    };

    // Validate page numbers against actual page count
    const pageValidationError = validatePageInputs(finalOptions, totalPages);
    if (pageValidationError) {
      throw new Error(pageValidationError);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_order', finalOptions.page_order || '');
    formData.append('rotate_pages', finalOptions.rotate_pages || '');
    formData.append('delete_pages', finalOptions.delete_pages || '');

    const response = await fetch('/api/organize-pdf', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF page organization failed');
    }

    const blob = await response.blob();
    const fileName = file.name.replace(/\.pdf$/i, '_organized.pdf');
    
    return [{
      id: `organized-${Date.now()}`,
      name: fileName,
      type: 'PDF',
      size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      downloadUrl: URL.createObjectURL(blob)
    }];
  };

  const handlePageOperationsChange = useCallback((operations: {
    pageOrder: string;
    rotatePages: string;
    deletePages: string;
  }) => {
    setPageOperations(operations);
  }, []);

  const handleClearAll = useCallback(() => {
    // Reset all state to initial values
    setPageCount(null);
    setIsLoadingPageCount(false);
    setLastProcessedFile('');
    setPageOperations({
      pageOrder: '',
      rotatePages: '',
      deletePages: ''
    });
    setValidationErrors({});
    // Increment reset key to trigger PageManager reset
    setResetKey(prev => prev + 1);
  }, []);

  const task = getTaskById(ConversionType.REORDER_PAGES_PDF);
  if (!task) {
    throw new Error('Organize PDF task not found');
  }

  return (
    <BaseConversionView
      task={task}
      performConversion={performOrganization}
      customValidation={customValidation}
      onClearAll={handleClearAll}
    >
      {isLoadingPageCount && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 3,
          p: 3,
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 2
        }}>
          <CircularProgress 
            size={40} 
            sx={{ 
              color: 'var(--primary-color)',
              mb: 2
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'var(--text-primary)',
              mb: 1
            }}
          >
            Processing PDF...
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}
          >
            Please wait while we analyze your PDF file to show organization options.
          </Typography>
        </Box>
      )}
      
      {pageCount && !isLoadingPageCount && (
        <div className="mt-6">
          <PageManager 
            totalPages={pageCount}
            onPageOperationsChange={handlePageOperationsChange}
            resetKey={resetKey}
          />
        </div>
      )}
    </BaseConversionView>
  );
};

export default OrganizePdfView; 