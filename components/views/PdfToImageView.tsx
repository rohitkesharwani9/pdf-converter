import React, { useState, useEffect, useRef, DragEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import Button from '../Button';
import ProgressBar from '../ProgressBar';
import { Download, AlertTriangle, CheckCircle, Trash2, Eye, X } from 'lucide-react';
import AdSense from '../AdSense';

// Initialize PDF.js worker - use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfToImageViewProps {
  task: ConversionTask;
}

type ImageQuality = 'hd' | 'medium' | 'email';
type ImageFormat = 'jpg' | 'png' | 'webp';

interface QualitySettings {
  scale: number;
  compression: number;
}

const qualitySettings: Record<ImageQuality, QualitySettings> = {
  hd: { scale: 2.0, compression: 1.0 },
  medium: { scale: 1.5, compression: 0.8 },
  email: { scale: 1.0, compression: 0.6 }
};

const formatMimeTypes: Record<ImageFormat, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

interface Alert {
  id: number;
  type: 'error' | 'warning' | 'success';
  message: string;
}

interface WatermarkSettings {
  enabled: boolean;
  text: string;
  position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'center' | 'diagonal';
  opacity: number;
  fontSize: number;
}

interface PageNumberSettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  fontSize: number;
  prefix: string;
}

interface ImageState {
  url: string;
  originalUrl: string;
}

const PdfToImageView: React.FC<PdfToImageViewProps> = ({ task }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('jpg');
  const [selectedImage, setSelectedImage] = useState<{ url: string; page: number; index?: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertIdCounter = useRef(0);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: false,
    text: 'Confidential',
    position: 'diagonal',
    opacity: 0.3,
    fontSize: 24
  });

  const [pageNumber, setPageNumber] = useState<PageNumberSettings>({
    enabled: false,
    position: 'bottom-right',
    fontSize: 16,
    prefix: 'Page '
  });

  const [processedImages, setProcessedImages] = useState<ImageState[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showAlert = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    const id = alertIdCounter.current++;
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  };

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setImages([]);
      setProcessedFiles([]);
      setProgress(0);
      setCurrentPage(0);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
        setTotalPages(pdf.numPages);
        setEndPage(pdf.numPages);
        setPdfLoaded(true);
        showAlert('PDF loaded successfully!', 'success');
      } catch (error) {
        console.error('Error loading PDF:', error);
        showAlert('Error loading PDF. Please try again.');
      }
    }
  };

  const validatePageRange = () => {
    if (startPage < 1) {
      showAlert('Start page cannot be less than 1');
      return false;
    }
    if (endPage > totalPages) {
      showAlert(`End page cannot be greater than total pages (${totalPages})`);
      return false;
    }
    if (startPage > endPage) {
      showAlert('Start page cannot be greater than end page');
      return false;
    }
    return true;
  };

  const drawTextOnCanvas = (
    context: CanvasRenderingContext2D,
    text: string,
    position: string,
    fontSize: number,
    opacity: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    context.save();
    context.globalAlpha = opacity;
    context.font = `${fontSize}px Arial`;
    context.fillStyle = '#000000';
    
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    const padding = 20;
    
    let x = padding;
    let y = padding + textHeight;
    
    if (position === 'diagonal') {
      context.translate(canvasWidth / 2, canvasHeight / 2);
      context.rotate(Math.PI / 4);
      x = -textWidth / 2;
      y = 0;
    } else {
      switch (position) {
        case 'top-right':
          x = canvasWidth - textWidth - padding;
          y = padding + textHeight;
          break;
        case 'top-center':
          x = (canvasWidth - textWidth) / 2;
          y = padding + textHeight;
          break;
        case 'bottom-left':
          x = padding;
          y = canvasHeight - padding;
          break;
        case 'bottom-center':
          x = (canvasWidth - textWidth) / 2;
          y = canvasHeight - padding;
          break;
        case 'bottom-right':
          x = canvasWidth - textWidth - padding;
          y = canvasHeight - padding;
          break;
        case 'center':
          x = (canvasWidth - textWidth) / 2;
          y = canvasHeight / 2;
          break;
      }
    }
    
    context.fillText(text, x, y);
    context.restore();
  };

  const performPdfToImageConversion = async () => {
    if (!pdfFile || !validatePageRange()) return;

    try {
      setIsLoading(true);
      setProgress(0);
      setCurrentPage(0);
      setProcessedFiles([]);
      setImages([]);
      setProcessedImages([]);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      const newImages: string[] = [];
      const newProcessedImages: ImageState[] = [];
      const newProcessedFiles: ProcessedFile[] = [];

      const { scale, compression } = qualitySettings[imageQuality];

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        setCurrentPage(pageNum);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas context not available');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        if (watermark.enabled) {
          drawTextOnCanvas(
            context,
            watermark.text,
            watermark.position,
            watermark.fontSize,
            watermark.opacity,
            canvas.width,
            canvas.height
          );
        }

        if (pageNumber.enabled) {
          const pageText = `${pageNumber.prefix}${pageNum}`;
          drawTextOnCanvas(
            context,
            pageText,
            pageNumber.position,
            pageNumber.fontSize,
            1.0,
            canvas.width,
            canvas.height
          );
        }

        const imageUrl = canvas.toDataURL(formatMimeTypes[imageFormat], compression);
        newImages.push(imageUrl);
        newProcessedImages.push({
          url: imageUrl,
          originalUrl: imageUrl
        });

        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        newProcessedFiles.push({
          id: `processed-page${pageNum}`,
          name: `${pdfFile.name.replace(/\.pdf$/i, '')}_page_${pageNum}_${imageQuality}.${imageFormat}`,
          type: imageFormat.toUpperCase(),
          size: `${(blob.size / (1024 * 1024)).toFixed(2)}MB`,
          downloadUrl: blobUrl,
        });

        setProgress(((pageNum - startPage + 1) / (endPage - startPage + 1)) * 100);
      }

      setImages(newImages);
      setProcessedImages(newProcessedImages);
      setProcessedFiles(newProcessedFiles);
      showAlert('Images converted successfully!', 'success');
    } catch (error) {
      console.error('Error converting PDF:', error);
      showAlert('Error converting PDF. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
      setCurrentPage(0);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `page-${startPage + index}.${imageFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      const zip = new JSZip();
      const imageFolder = zip.folder("converted-images");
      
      if (!imageFolder) {
        throw new Error("Failed to create ZIP folder");
      }

      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        const imageName = `page-${startPage + i}.${imageFormat}`;
        
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        imageFolder.file(imageName, blob);
        setProgress((i + 1) / images.length * 100);
      }

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      }, (metadata: { percent: number }) => {
        setProgress(metadata.percent);
      });

      const fileName = pdfFile ? `${pdfFile.name.replace('.pdf', '')}-pages-${startPage}-${endPage}.zip` : 'converted-images.zip';
      saveAs(content, fileName);
      showAlert('ZIP file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showAlert('Error creating ZIP file. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleStartPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setStartPage(value);
  };

  const handleEndPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setEndPage(value);
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setImageQuality(e.target.value as ImageQuality);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setImageFormat(e.target.value as ImageFormat);
  };

  const openImageModal = (imageUrl: string, pageNumber: number, index: number) => {
    setSelectedImage({ url: imageUrl, page: pageNumber, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files } } as any);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleWatermarkChange = (changes: Partial<WatermarkSettings>) => {
    setWatermark(prev => ({ ...prev, ...changes }));
  };

  const handlePageNumberChange = (changes: Partial<PageNumberSettings>) => {
    setPageNumber(prev => ({ ...prev, ...changes }));
  };

  const renderImageCard = (image: ImageState, index: number) => (
    <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
      <div 
        className="relative cursor-pointer group"
        onClick={() => openImageModal(image.url, startPage + index, index)}
      >
        <img 
          src={image.url} 
          alt={`Page ${startPage + index}`}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
            <Eye className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Click to view full screen</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-neutral-800 dark:text-neutral-200 mb-2">
          Page {startPage + index}
        </h3>
        <Button
          onClick={() => downloadImage(image.url, index)}
          size="sm"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );

  const handlePrevPage = () => {
    if (!selectedImage || selectedImage.index === undefined) return;
    const prevIndex = selectedImage.index - 1;
    if (prevIndex >= 0) {
      const prevImage = processedImages[prevIndex];
      setSelectedImage({
        url: prevImage.url,
        page: startPage + prevIndex,
        index: prevIndex
      });
    }
  };

  const handleNextPage = () => {
    if (!selectedImage || selectedImage.index === undefined) return;
    const nextIndex = selectedImage.index + 1;
    if (nextIndex < processedImages.length) {
      const nextImage = processedImages[nextIndex];
      setSelectedImage({
        url: nextImage.url,
        page: startPage + nextIndex,
        index: nextIndex
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Alerts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 rounded-lg shadow-lg max-w-sm ${
            alert.type === 'error' ? 'bg-red-100 border border-red-300 text-red-700' :
            alert.type === 'warning' ? 'bg-yellow-100 border border-yellow-300 text-yellow-700' :
            'bg-green-100 border border-green-300 text-green-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {alert.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
                {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 mr-2" />}
                {alert.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="p-6 bg-white dark:bg-neutral-900 shadow-xl rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-primary dark:text-secondary-light">{task.icon}</span>
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{task.name}</h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{task.description}</p>

        {/* File Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-neutral-500 dark:border-neutral-400 hover:border-primary'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="text-4xl mb-4">📄</div>
          <div className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">
            Drag & Drop your PDF here
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">or</div>
          <label 
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Choose PDF File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
            />
          </label>
          {pdfFile && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">📎</span>
                <span className="text-sm text-green-700 dark:text-green-300">{pdfFile.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Conversion Options */}
        {pdfLoaded && (
          <div className="mt-6 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> After changing any option, please click the <strong>"Convert Selected Pages to Images"</strong> button to apply it to the output images.
              </p>
            </div>

            {/* Page Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Start Page:
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={startPage}
                  onChange={handleStartPageChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  End Page:
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={endPage}
                  onChange={handleEndPageChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total Pages: <span className="font-medium">{totalPages}</span>
                </div>
              </div>
            </div>

            {/* Quality and Format Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Image Quality:
                </label>
                <select
                  value={imageQuality}
                  onChange={handleQualityChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="hd">HD Quality (Large Size)</option>
                  <option value="medium">Medium Quality (Balanced)</option>
                  <option value="email">Email Quality (Small Size)</option>
                </select>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {imageQuality === 'hd' && 'Best quality, larger file size'}
                  {imageQuality === 'medium' && 'Balanced quality and file size'}
                  {imageQuality === 'email' && 'Reduced quality, smaller file size'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Output Format:
                </label>
                <select
                  value={imageFormat}
                  onChange={handleFormatChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="jpg">JPG (Best for Photos)</option>
                  <option value="png">PNG (Best for Screenshots)</option>
                  <option value="webp">WebP (Modern Format, Smaller Size)</option>
                </select>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {imageFormat === 'jpg' && 'Compressed format, ideal for photographs'}
                  {imageFormat === 'png' && 'Lossless quality, larger file size'}
                  {imageFormat === 'webp' && 'Modern format with excellent compression'}
                </div>
              </div>
            </div>

            {/* Watermark Settings */}
            <div className="border-2 border-neutral-500 dark:border-neutral-400 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={watermark.enabled}
                  onChange={(e) => handleWatermarkChange({ enabled: e.target.checked })}
                  disabled={isLoading}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Add Watermark</span>
              </label>
              {watermark.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Watermark text (default: Confidential)
                    </label>
                    <input
                      type="text"
                      value={watermark.text}
                      onChange={(e) => handleWatermarkChange({ text: e.target.value })}
                      placeholder="Watermark text"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Position
                    </label>
                    <select
                      value={watermark.position}
                      onChange={(e) => handleWatermarkChange({ position: e.target.value as any })}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="diagonal">Diagonal (45° Center)</option>
                      <option value="center">Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Opacity: {watermark.opacity}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={watermark.opacity}
                      onChange={(e) => handleWatermarkChange({ opacity: parseFloat(e.target.value) })}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Font Size: {watermark.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      step="2"
                      value={watermark.fontSize}
                      onChange={(e) => handleWatermarkChange({ fontSize: parseInt(e.target.value) })}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Page Number Settings */}
            <div className="border-2 border-neutral-500 dark:border-neutral-400 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={pageNumber.enabled}
                  onChange={(e) => handlePageNumberChange({ enabled: e.target.checked })}
                  disabled={isLoading}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Add Page Numbers</span>
              </label>
              {pageNumber.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Prefix (default: Page)
                    </label>
                    <input
                      type="text"
                      value={pageNumber.prefix}
                      onChange={(e) => handlePageNumberChange({ prefix: e.target.value })}
                      placeholder="Page number prefix"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Position
                    </label>
                    <select
                      value={pageNumber.position}
                      onChange={(e) => handlePageNumberChange({ position: e.target.value as any })}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border-2 border-neutral-500 dark:border-neutral-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Font Size: {pageNumber.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="36"
                      step="2"
                      value={pageNumber.fontSize}
                      onChange={(e) => handlePageNumberChange({ fontSize: parseInt(e.target.value) })}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Convert Button */}
        <div className="mt-6">
          <Button
            onClick={performPdfToImageConversion}
            isLoading={isLoading}
            disabled={!pdfFile || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Converting...' : 'Convert Selected Pages to Images'}
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              {currentPage ? (
                <>
                  Converting PDF to Images<br />
                  Page {currentPage} of {endPage}
                </>
              ) : (
                'Creating ZIP file...'
              )}
            </div>
            <ProgressBar progress={progress} />
          </div>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <>
          <div className="bg-white dark:bg-neutral-900 shadow-xl rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4 sm:mb-0">
                Converted Images ({images.length} pages)
              </h3>
              <Button
                onClick={downloadAllImages}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All as ZIP
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedImages.map((image, index) => renderImageCard(image, index))}
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b-2 border-neutral-500 dark:border-neutral-400">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                Page {selectedImage.page}
              </h2>
              <button
                onClick={closeImageModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative p-4">
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-neutral-700 rounded-full p-2 shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePrevPage}
                disabled={selectedImage.index === 0}
              >
                ‹
              </button>
              <div className="flex justify-center">
                <img 
                  src={selectedImage.url} 
                  alt={`Page ${selectedImage.page} (Full Screen)`}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-neutral-700 rounded-full p-2 shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNextPage}
                disabled={selectedImage.index === processedImages.length - 1}
              >
                ›
              </button>
            </div>
            <div className="p-4 border-t-2 border-neutral-500 dark:border-neutral-400">
              <Button
                onClick={() => {
                  if (selectedImage.index !== undefined) {
                    downloadImage(selectedImage.url, selectedImage.index);
                  }
                  closeImageModal();
                }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download This Page
              </Button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* AdSense Ad for PDF to Image */}
      <div style={{ marginBottom: '10px' }}>
        <AdSense 
          adSlot="6480016001" 
          adFormat="auto" 
          className="mt-8"
        />
      </div>
      <br/>
    </div>
  );
};

export default PdfToImageView;
