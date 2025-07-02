import React, { useState, useCallback, useEffect } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import { RefreshCw, Languages, Settings, Info } from 'lucide-react';

interface OCRSettings {
  language: string;
  confidence: number;
  preserveLayout: boolean;
  extractImages: boolean;
}

interface OCRPdfViewProps {
  task: ConversionTask;
}

const OCRPdfView: React.FC<OCRPdfViewProps> = ({ task }) => {
  const [ocrSettings, setOcrSettings] = useState<OCRSettings>({
    language: 'eng',
    confidence: 0.7,
    preserveLayout: true,
    extractImages: true
  });

  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleOcrSettingChange = useCallback((field: keyof OCRSettings, value: any) => {
    setOcrSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  // Cleanup download URL on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const performConversion = useCallback(async (files: UploadedFile[], options: Record<string, any>): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('No files provided for OCR processing');
    }

    const file = files[0];
    const outputFileName = `ocr_${file.file.name}`;

    try {
      setProcessingStatus('Loading PDF...');

      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('conversionType', 'ocr-pdf');
      formData.append('options', JSON.stringify({
        language: ocrSettings.language,
        confidence: ocrSettings.confidence,
        preserve_layout: ocrSettings.preserveLayout,
        extract_images: ocrSettings.extractImages
      }));

      // Call the OCR conversion
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR processing failed');
      }

      setProcessingStatus('OCR processing completed');

      // Handle direct file download
      const blob = await response.blob();
      const newDownloadUrl = URL.createObjectURL(blob);
      setDownloadUrl(newDownloadUrl);
      
      return [{
        id: file.id,
        name: `ocr_${file.file.name}`,
        type: 'application/pdf',
        size: `${Math.round(blob.size / 1024)} KB`,
        downloadUrl: newDownloadUrl
      }];

    } catch (error: any) {
      throw new Error(`Failed to process PDF with OCR: ${error.message}`);
    }
  }, [ocrSettings]);

  const customValidation = useCallback((files: UploadedFile[]): string | null => {
    if (files.length === 0) {
      return 'Please select a PDF file for OCR processing';
    }
    
    const file = files[0];
    if (!file.file.name.toLowerCase().endsWith('.pdf')) {
      return 'Please select a valid PDF file';
    }
    
    return null;
  }, []);

  return (
    <BaseConversionView
      task={task}
      performConversion={performConversion}
      customValidation={customValidation}
    >
      <div className="mt-6 p-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            OCR Settings
          </h3>
          {processingStatus && (
            <div className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {processingStatus}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <Languages className="w-4 h-4 mr-2" />
              Document Language
            </label>
            <select
              value={ocrSettings.language}
              onChange={(e) => handleOcrSettingChange('language', e.target.value)}
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            >
              <option value="eng">English</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
              <option value="ita">Italian</option>
              <option value="por">Portuguese</option>
              <option value="rus">Russian</option>
              <option value="chi_sim">Chinese (Simplified)</option>
              <option value="chi_tra">Chinese (Traditional)</option>
              <option value="jpn">Japanese</option>
              <option value="kor">Korean</option>
              <option value="ara">Arabic</option>
              <option value="hin">Hindi</option>
            </select>
          </div>

          {/* Confidence Level */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Confidence Level: {Math.round(ocrSettings.confidence * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={ocrSettings.confidence}
              onChange={(e) => handleOcrSettingChange('confidence', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>Lower (Faster)</span>
              <span>Higher (More Accurate)</span>
            </div>
          </div>

          {/* Preserve Layout - Mandatory */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary bg-gray-100 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Preserve Original Layout
              </span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">(Required)</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Maintain the original document formatting and positioning
            </p>
          </div>

          {/* Extract Images - Mandatory */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary bg-gray-100 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Extract and Preserve Images
              </span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">(Required)</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Keep images in the document while making text searchable
            </p>
          </div>
        </div>

        {/* OCR Information */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Enhanced OCR Processing
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Our advanced OCR technology uses multiple techniques to achieve maximum accuracy:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>High-Resolution Processing:</strong> 400 DPI for crisp text recognition</li>
                <li>• <strong>Image Enhancement:</strong> Noise reduction, contrast adjustment, and sharpening</li>
                <li>• <strong>Smart Filtering:</strong> Removes noise and improves text positioning</li>
                <li>• <strong>Adaptive Thresholding:</strong> Better text separation from background</li>
                <li>• <strong>Layout Preservation:</strong> Maintains original document formatting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Processing Tips */}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Tips for Better OCR Results:
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Use high-quality, clear scans for best results</li>
            <li>• Ensure good contrast between text and background</li>
            <li>• Avoid documents with heavy noise or watermarks</li>
            <li>• Choose the correct language for better accuracy</li>
            <li>• Higher confidence levels may take longer but provide better results</li>
          </ul>
        </div>
      </div>
    </BaseConversionView>
  );
};

export default OCRPdfView; 