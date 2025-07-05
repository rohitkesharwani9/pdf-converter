import React, { useState, useCallback, ReactNode, useEffect } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile, ConversionOption } from '../../types';
import FileUpload from '../FileUpload';
import ConversionOptionsPanel from '../ConversionOptionsPanel';
import Button from '../Button';
import ProgressBar from '../ProgressBar';
import { Download, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import AdSense from '../AdSense';

interface BaseConversionViewProps {
  task: ConversionTask;
  children?: ReactNode; // For additional UI elements specific to a view
  customValidation?: (files: UploadedFile[], options: Record<string, any>) => string | null;
  performConversion: (files: UploadedFile[], options: Record<string, any>) => Promise<ProcessedFile[]>;
  uploadedFiles?: UploadedFile[];
  hideDefaultFileUpload?: boolean;
  onClearAll?: () => void;
}

const BaseConversionView: React.FC<BaseConversionViewProps> = ({ 
  task, 
  children, 
  customValidation, 
  performConversion,
  uploadedFiles: parentUploadedFiles,
  hideDefaultFileUpload = false,
  onClearAll
}) => {
  const [internalUploadedFiles, setInternalUploadedFiles] = useState<UploadedFile[]>([]);
  const [optionValues, setOptionValues] = useState<Record<string, any>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadedFiles = parentUploadedFiles ?? internalUploadedFiles;
  const setUploadedFiles = parentUploadedFiles ? () => {} : setInternalUploadedFiles;

  useEffect(() => {
    // Initialize option values with defaults when task changes
    const initialOptions: Record<string, any> = {};
    task.options?.forEach(opt => {
      if (opt.defaultValue !== undefined) {
        initialOptions[opt.id] = opt.defaultValue;
      } else if (opt.type === 'checkbox') {
        initialOptions[opt.id] = false;
      } else if (opt.type === 'select' && opt.choices && opt.choices.length > 0) {
        initialOptions[opt.id] = opt.choices[0].value;
      } else {
        initialOptions[opt.id] = '';
      }
    });
    setOptionValues(initialOptions);
    setInternalUploadedFiles([]);
    setProcessedFiles([]);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
  }, [task]);

  useEffect(() => {
    // This effect hook enables immediate validation by calling customValidation
    // whenever files or options change.
    if (customValidation) {
      // Only run validation if files are present or if the tool doesn't require a file upload.
      if (uploadedFiles.length > 0 || !task.requiresFileUpload) {
        const validationError = customValidation(uploadedFiles, optionValues);
        setError(validationError);
      } else {
        // Clear errors if the file is removed.
        setError(null);
      }
    }
  }, [uploadedFiles, optionValues, customValidation, task.requiresFileUpload]);

  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
    setProcessedFiles([]); // Clear previous results
    setError(null);
  }, []);

  const handleOptionChange = useCallback((optionId: string, value: any) => {
    setOptionValues(prev => ({ ...prev, [optionId]: value }));
    setProcessedFiles([]); // Clear previous results if options change
    setError(null);
  }, []);

  const handleConvert = async () => {
    setError(null);
    if (task.requiresFileUpload && uploadedFiles.length === 0) {
      setError(`Please upload at least one file for ${task.name}.`);
      return;
    }

    if (customValidation) {
      const validationError = customValidation(uploadedFiles, optionValues);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsConverting(true);
    setConversionProgress(0);
    setProcessedFiles([]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setConversionProgress(progress);
      } else {
        clearInterval(interval);
      }
    }, 200);
    
    try {
      const results = await performConversion(uploadedFiles, optionValues);
      setProcessedFiles(results);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during conversion.');
      setProcessedFiles([]);
    } finally {
      clearInterval(interval); // Ensure interval is cleared
      setConversionProgress(100); // Show 100% on completion or error
      setIsConverting(false);
      // Keep progress at 100 for a bit before hiding, or hide immediately
      // setTimeout(() => { if (!error) setConversionProgress(0); }, 2000); 
    }
  };

  const handleClearAll = () => {
    setInternalUploadedFiles([]);
    setProcessedFiles([]);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
    // Reset options to default
     const initialOptions: Record<string, any> = {};
      task.options?.forEach(opt => {
        if (opt.defaultValue !== undefined) initialOptions[opt.id] = opt.defaultValue;
      });
      setOptionValues(initialOptions);
    if (onClearAll) {
      onClearAll();
    }
  };

  const handleSimulatedDownload = (file: ProcessedFile) => {
    const simulatedContent = `This is a simulated ${file.type.toUpperCase()} file for: ${file.name}\n\nOriginal file size (approx. if known): ${file.size}\nConversion Task: ${task.name}\n\nThis is part of a demonstration application (OmniConverter PDF Suite) and does not contain actual converted data. All operations are simulated.`;
    
    let mimeType = 'application/octet-stream'; // Default generic MIME type
    const fileTypeUpper = file.type.toUpperCase();

    if (fileTypeUpper === 'PDF') {
      mimeType = 'application/pdf';
    } else if (fileTypeUpper === 'JPG' || fileTypeUpper === 'JPEG') {
      mimeType = 'image/jpeg';
    } else if (fileTypeUpper === 'PNG') {
      mimeType = 'image/png';
    } else if (fileTypeUpper === 'TXT') {
      mimeType = 'text/plain';
    } else if (fileTypeUpper === 'HTML') {
      mimeType = 'text/html';
    } else if (fileTypeUpper === 'DOCX') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileTypeUpper === 'XLSX') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileTypeUpper === 'PPTX') {
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    // Add more specific MIME types as needed based on `file.type`

    const blob = new Blob([simulatedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // This logic is designed to find which specific option has a validation error.
  // It checks if the error message contains a keyword from an option's label or ID,
  // allowing the error to be displayed directly under the relevant input field.
  const optionsWithErrors = task.options?.map(opt => {
    if (error && (error.toLowerCase().includes(opt.label.toLowerCase()) || error.toLowerCase().includes(opt.id.toLowerCase()))) {
      return { ...opt, error };
    }
    return opt;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 bg-white dark:bg-neutral-900 shadow-xl rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-primary dark:text-secondary-light">{task.icon}</span>
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{task.name}</h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{task.description}</p>

        {task.requiresFileUpload && !hideDefaultFileUpload && (
          <FileUpload
            onFilesChange={handleFilesChange}
            accept={task.accept || task.supportedInputTypes.join(',')}
            multiple={task.allowMultipleFiles}
            uploadedFiles={uploadedFiles}
            label={`Drag & drop ${task.name} files here, or click to select`}
          />
        )}
        
        {children /* For custom UI elements like text input for Text-to-PDF */}

        {task.options && task.options.length > 0 && (
          <ConversionOptionsPanel
            options={optionsWithErrors || task.options}
            optionValues={optionValues}
            onOptionChange={handleOptionChange}
          />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            onClick={handleConvert}
            isLoading={isConverting}
            disabled={isConverting || (task.requiresFileUpload && uploadedFiles.length === 0 && !children)} // Disable if no files and no special child input
            size="lg"
            className="w-full sm:w-auto flex-grow"
          >
            {isConverting ? 'Converting...' : `Convert to ${task.isEditingTool ? 'Apply Changes' : task.supportedOutputFormats?.[0]?.label || 'Output'}`} 
          </Button>
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="lg"
            disabled={isConverting && uploadedFiles.length === 0}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Clear All
          </Button>
        </div>

        {isConverting && conversionProgress < 100 && (
          <div className="mt-6">
            <ProgressBar progress={conversionProgress} label="Conversion in progress..."/>
          </div>
        )}

        {processedFiles.length > 0 && !isConverting && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Conversion Successful!</h3>
            </div>
            <ul className="space-y-2">
              {processedFiles.map((file) => (
                <li key={file.id} className="p-3 bg-white dark:bg-neutral-800 rounded-md shadow-sm flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate" title={file.name}>
                    {file.name} ({file.type}, {file.size})
                  </span>
                  {file.downloadUrl && file.downloadUrl !== '#' ? (
                    <a
                      href={file.downloadUrl}
                      download={file.name}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="w-4 h-4" />}
                      >
                        Download
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSimulatedDownload(file)}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Download
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AdSense Ads for specific conversion types */}
        {['image-to-pdf', 'word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf', 'text-to-pdf', 'html-to-pdf', 'epub-to-pdf', 'rtf-to-pdf', 'vector-to-pdf', 'pdf-to-powerpoint', 'pdf-to-text', 'pdf-to-html', 'pdf-to-epub', 'pdf-to-rtf', 'pdf-to-svg', 'merge-pdf', 'split-pdf', 'compress-pdf', 'password-protect-pdf', 'reorder-pages-pdf', 'add-watermark-pdf', 'edit-metadata-pdf', 'ocr-pdf'].includes(task.id) && (
          <AdSense 
            adSlot="6480016001" 
            adFormat="auto" 
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
};

export default BaseConversionView;
