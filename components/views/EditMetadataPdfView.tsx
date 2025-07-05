import React, { useState, useCallback } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import { Edit3, FileText, User, Tag, Hash } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface EditMetadataPdfViewProps {
  task: ConversionTask;
}

interface MetadataSettings {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

const EditMetadataPdfView: React.FC<EditMetadataPdfViewProps> = ({ task }) => {
  const [metadataSettings, setMetadataSettings] = useState<MetadataSettings>({
    title: '',
    author: '',
    subject: '',
    keywords: ''
  });

  const [currentMetadata, setCurrentMetadata] = useState<MetadataSettings>({
    title: '',
    author: '',
    subject: '',
    keywords: ''
  });

  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const handleMetadataChange = useCallback((field: keyof MetadataSettings, value: string) => {
    setMetadataSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const loadExistingMetadata = useCallback(async (file: File) => {
    try {
      setIsLoadingMetadata(true);
      setMetadataLoaded(false); // Reset loading state
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const title = pdfDoc.getTitle() || '';
      const author = pdfDoc.getAuthor() || '';
      const subject = pdfDoc.getSubject() || '';
      const keywords = pdfDoc.getKeywords() || '';
      
      setCurrentMetadata({ title, author, subject, keywords });
      setMetadataSettings({ title, author, subject, keywords });
      setMetadataLoaded(true);
    } catch (error) {
      console.error('Failed to load existing metadata:', error);
      setMetadataLoaded(true);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  const handleFileChange = useCallback((files: UploadedFile[]) => {
    if (files.length > 0 && files[0].file.type === 'application/pdf') {
      loadExistingMetadata(files[0].file);
    } else {
      // Reset metadata when no file or invalid file
      setCurrentMetadata({ title: '', author: '', subject: '', keywords: '' });
      setMetadataSettings({ title: '', author: '', subject: '', keywords: '' });
      setMetadataLoaded(false);
    }
  }, [loadExistingMetadata]);

  const performConversion = useCallback(async (files: UploadedFile[], options: Record<string, any>): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('Please upload a PDF file to edit metadata.');
    }

    const file = files[0];
    if (file.file.type !== 'application/pdf') {
      throw new Error('Please upload a valid PDF file.');
    }

    try {
      // Load the existing PDF
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Update metadata - explicitly set or clear each field
      pdfDoc.setTitle(metadataSettings.title.trim());
      pdfDoc.setAuthor(metadataSettings.author.trim());
      pdfDoc.setSubject(metadataSettings.subject.trim());
      
      if (metadataSettings.keywords.trim() !== '') {
        // Split keywords by comma and trim whitespace
        const keywordsArray = metadataSettings.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        pdfDoc.setKeywords(keywordsArray);
      } else {
        // Clear keywords if empty
        pdfDoc.setKeywords([]);
      }
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const modifiedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const modifiedPdfUrl = URL.createObjectURL(modifiedPdfBlob);
      
      const result: ProcessedFile = {
        id: `metadata_edited_${file.id}`,
        name: `metadata_edited_${file.file.name}`,
        downloadUrl: modifiedPdfUrl,
        type: 'pdf',
        size: `${(modifiedPdfBlob.size / 1024).toFixed(1)}KB`
      };

      return [result];
    } catch (error: any) {
      throw new Error(`Failed to edit PDF metadata: ${error.message}`);
    }
  }, [metadataSettings]);

  const customValidation = useCallback((files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return 'Please upload a PDF file to edit metadata.';
    }
    
    const file = files[0];
    if (file.file.type !== 'application/pdf') {
      return 'Please upload a valid PDF file.';
    }
    
    // Load existing metadata when file is uploaded
    if (!metadataLoaded) {
      loadExistingMetadata(file.file);
    }
    
    return null;
  }, [metadataLoaded, loadExistingMetadata]);

  // Watch for file changes and load metadata
  React.useEffect(() => {
    // This effect will be triggered when the component re-renders
    // The customValidation will handle the actual metadata loading
  }, [metadataLoaded]);

  const handleClearAll = useCallback(() => {
    // Clear all metadata fields completely
    setMetadataSettings({
      title: '',
      author: '',
      subject: '',
      keywords: ''
    });
    setCurrentMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: ''
    });
    setMetadataLoaded(false);
    setIsLoadingMetadata(false);
  }, []);

  const handleClearMetadata = useCallback(() => {
    // Clear only the current input values, keep original metadata for reference
    setMetadataSettings({
      title: '',
      author: '',
      subject: '',
      keywords: ''
    });
  }, []);

  const handleRestoreOriginal = useCallback(() => {
    setMetadataSettings({ ...currentMetadata });
  }, [currentMetadata]);

  return (
    <BaseConversionView
      task={task}
      performConversion={performConversion}
      customValidation={customValidation}
      onClearAll={handleClearAll}
    >
      <div className="mt-6 p-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 flex items-center">
            <Edit3 className="w-5 h-5 mr-2" />
            PDF Metadata Editor
          </h3>
          <div className="flex space-x-2">
            {isLoadingMetadata && (
              <div className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading metadata...
              </div>
            )}
            <button
              onClick={handleClearMetadata}
              className="px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear Fields
            </button>
            <button
              onClick={handleRestoreOriginal}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Restore Original
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Title
            </label>
            <input
              type="text"
              value={metadataSettings.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              placeholder="Enter PDF title..."
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
            {currentMetadata.title && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Original: {currentMetadata.title}
              </p>
            )}
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Author
            </label>
            <input
              type="text"
              value={metadataSettings.author}
              onChange={(e) => handleMetadataChange('author', e.target.value)}
              placeholder="Enter author name..."
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
            {currentMetadata.author && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Original: {currentMetadata.author}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Subject
            </label>
            <input
              type="text"
              value={metadataSettings.subject}
              onChange={(e) => handleMetadataChange('subject', e.target.value)}
              placeholder="Enter subject..."
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
            {currentMetadata.subject && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Original: {currentMetadata.subject}
              </p>
            )}
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              Keywords
            </label>
            <input
              type="text"
              value={metadataSettings.keywords}
              onChange={(e) => handleMetadataChange('keywords', e.target.value)}
              placeholder="Enter keywords (comma separated)..."
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
            {currentMetadata.keywords && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Original: {currentMetadata.keywords}
              </p>
            )}
          </div>
        </div>

        {/* Metadata Preview */}
        <div className="mt-6 p-4 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg">
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Metadata Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium text-neutral-600 dark:text-neutral-400 w-20">Title:</span>
              <span className="text-neutral-800 dark:text-neutral-200">
                {metadataSettings.title || 'Not set'}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-neutral-600 dark:text-neutral-400 w-20">Author:</span>
              <span className="text-neutral-800 dark:text-neutral-200">
                {metadataSettings.author || 'Not set'}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-neutral-600 dark:text-neutral-400 w-20">Subject:</span>
              <span className="text-neutral-800 dark:text-neutral-200">
                {metadataSettings.subject || 'Not set'}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-neutral-600 dark:text-neutral-400 w-20">Keywords:</span>
              <span className="text-neutral-800 dark:text-neutral-200">
                {metadataSettings.keywords || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Leave fields empty to remove existing metadata. The PDF content remains unchanged - only the metadata properties are modified.
          </p>
        </div>
      </div>
    </BaseConversionView>
  );
};

export default EditMetadataPdfView; 