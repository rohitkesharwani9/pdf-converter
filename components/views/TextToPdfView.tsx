import React, { useState, useRef } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import { Download, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import Button from '../Button';
import ProgressBar from '../ProgressBar';

interface TextToPdfViewProps {
  task: ConversionTask;
}

const TextToPdfView: React.FC<TextToPdfViewProps> = ({ task }) => {
  const [textContent, setTextContent] = useState('');
  
  // Separate states for text input conversion
  const [isConvertingText, setIsConvertingText] = useState(false);
  const [textConversionProgress, setTextConversionProgress] = useState(0);
  const [textProcessedFiles, setTextProcessedFiles] = useState<ProcessedFile[]>([]);
  const [textError, setTextError] = useState<string | null>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- File Upload Section State ---
  const [fileBulkError, setFileBulkError] = useState<string | null>(null);

  const performTextFileToPdfConversion = async (
    files: UploadedFile[],
    options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    setFileBulkError(null);
    if (files.length === 0) return [];
    if (files.length > 3) {
      setFileBulkError('Maximum 3 files supported in bulk conversion.');
      throw new Error('Maximum 3 files supported in bulk conversion.');
    }
    const results: ProcessedFile[] = [];
    for (const uploadedFile of files) {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      let pdfBlob: Blob | null = null;
      let pdfSize = 0;
      try {
        const response = await fetch('/convert/text-to-pdf', {
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

  const validateTextFiles = (files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return "Please upload at least one text file.";
    }
    if (files.length > 3) {
      return 'Maximum 3 files supported in bulk conversion.';
    }
    const acceptedMimeTypes = ['text/plain'];
    const acceptedExtensions = ['.txt'];
    for (const uploadedFile of files) {
      const fileExtension = uploadedFile.file.name.substring(uploadedFile.file.name.lastIndexOf('.')).toLowerCase();
      if (!acceptedMimeTypes.includes(uploadedFile.file.type) && !acceptedExtensions.includes(fileExtension)) {
        return `File "${uploadedFile.file.name}" is not a supported text file. Please upload .txt files.`;
      }
    }
    return null;
  };

  // Handle text input conversion
  const handleTextConvert = async () => {
    setTextError(null);
    
    if (!textContent.trim()) {
      setTextError("Please enter some text to convert.");
      return;
    }

    setIsConvertingText(true);
    setTextConversionProgress(0);
    setTextProcessedFiles([]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setTextConversionProgress(progress);
      } else {
        clearInterval(interval);
      }
    }, 200);
    
    try {
      // Create a text file from the input content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const textFile = new File([textBlob], 'input-text.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', textFile);
      
      const response = await fetch('/convert/text-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to convert text input');
      }
      
      const pdfBlob = await response.blob();
      const pdfSize = pdfBlob.size;
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      setTextProcessedFiles([{
        id: 'processed-text-input',
        name: 'input-text.pdf',
        type: 'PDF',
        size: `${(pdfSize / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: blobUrl,
      }]);
    } catch (e: any) {
      setTextError(e.message || 'An unexpected error occurred during conversion.');
      setTextProcessedFiles([]);
    } finally {
      clearInterval(interval);
      setTextConversionProgress(100);
      setIsConvertingText(false);
    }
  };

  const clearText = () => {
    setTextContent('');
    setTextProcessedFiles([]);
    setTextError(null);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 bg-white dark:bg-neutral-900 shadow-xl rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-primary dark:text-secondary-light">{task.icon}</span>
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{task.name}</h2>
        </div>
        <div className="mb-2 p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <strong>Note:</strong> Only one conversion can run at a time. You cannot convert both input text and uploaded files simultaneously.
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">{task.description}</p>

        {/* Text Input Section */}
        <div className="mb-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">
            📝 Enter or Paste Text
          </h3>
          
          {/* Simple Clear Text Button */}
          <div className="flex justify-end mb-3">
            <button
              onClick={clearText}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Text
            </button>
          </div>
          
          {/* Text Input Area */}
          <textarea
            ref={textAreaRef}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Enter or paste your text here..."
            className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-neutral-800 dark:text-neutral-200 resize-vertical"
          />
          
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Character count: {textContent.length} | Word count: {textContent.trim() ? textContent.trim().split(/\s+/).length : 0}
          </div>

          {/* Text Convert Button */}
          <div className="mt-4">
            <Button
              onClick={handleTextConvert}
              isLoading={isConvertingText}
              disabled={isConvertingText || !textContent.trim()}
              size="lg"
              className="w-full"
            >
              {isConvertingText ? 'Converting Text...' : 'Convert Text to PDF'}
            </Button>
          </div>

          {/* Text Conversion Error */}
          {textError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{textError}</span>
            </div>
          )}

          {/* Text Conversion Progress */}
          {isConvertingText && textConversionProgress < 100 && (
            <div className="mt-4">
              <ProgressBar progress={textConversionProgress} label="Converting text to PDF..."/>
            </div>
          )}

          {/* Text Conversion Results */}
          {textProcessedFiles.length > 0 && !isConvertingText && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Text Conversion Successful!</h4>
              </div>
              <ul className="space-y-2">
                {textProcessedFiles.map((file) => (
                  <li key={file.id} className="p-2 bg-white dark:bg-neutral-800 rounded-md shadow-sm flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate" title={file.name}>
                      {file.name} ({file.type}, {file.size})
                    </span>
                    {file.downloadUrl && (
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
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">
            📁 Upload Text Files
          </h3>
          {fileBulkError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {fileBulkError}
            </div>
          )}
          <BaseConversionView
            task={{ ...task, options: [] }}
            performConversion={performTextFileToPdfConversion}
            customValidation={validateTextFiles}
          />
        </div>
      </div>
    </div>
  );
};

export default TextToPdfView; 