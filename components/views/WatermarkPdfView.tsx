import React, { useState, useCallback } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import { Type, Download, Eye, EyeOff } from 'lucide-react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

interface WatermarkPdfViewProps {
  task: ConversionTask;
}

interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'diagonal';
  rotation: number;
}

const predefinedWatermarkColors = [
  { name: 'Gray', value: '#808080' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#008000' },
  { name: 'Black', value: '#000000' },
];

const WatermarkPdfView: React.FC<WatermarkPdfViewProps> = ({ task }) => {
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: 'CONFIDENTIAL',
    fontSize: 50,
    color: '#808080',
    opacity: 0.3,
    position: 'diagonal',
    rotation: -45
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleWatermarkChange = useCallback((field: keyof WatermarkSettings, value: any) => {
    setWatermarkSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0.5, g: 0.5, b: 0.5 }; // Default to gray
  };

  const performConversion = useCallback(async (files: UploadedFile[], options: Record<string, any>): Promise<ProcessedFile[]> => {
    if (files.length === 0) {
      throw new Error('Please upload a PDF file to add watermark.');
    }

    const file = files[0];
    if (file.file.type !== 'application/pdf') {
      throw new Error('Please upload a valid PDF file.');
    }

    try {
      // Load the existing PDF
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get the number of pages
      const pageCount = pdfDoc.getPageCount();
      
      // Convert hex color to RGB
      const rgbColor = hexToRgb(watermarkSettings.color);
      
      // Add watermark to each page
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Calculate watermark position with proper margins
        let x: number, y: number;
        let rotation = watermarkSettings.rotation;
        
        // Calculate text width and height for proper positioning
        const textWidth = watermarkSettings.text.length * (watermarkSettings.fontSize * 0.6); // Approximate character width
        const textHeight = watermarkSettings.fontSize;
        const margin = Math.max(20, textHeight / 2); // Dynamic margin based on font size
        
        switch (watermarkSettings.position) {
          case 'center':
            x = width / 2;
            y = height / 2;
            break;
          case 'top-left':
            x = margin + textWidth / 2; // Account for text width
            y = height - margin - textHeight / 2; // Account for text height
            break;
          case 'top-center':
            x = width / 2;
            y = height - margin - textHeight / 2; // Account for text height
            break;
          case 'top-right':
            x = width - margin - textWidth / 2; // Account for text width
            y = height - margin - textHeight / 2; // Account for text height
            break;
          case 'bottom-left':
            x = margin + textWidth / 2; // Account for text width
            y = margin + textHeight / 2; // Account for text height
            break;
          case 'bottom-center':
            x = width / 2;
            y = margin + textHeight / 2; // Account for text height
            break;
          case 'bottom-right':
            x = width - margin - textWidth / 2; // Account for text width
            y = margin + textHeight / 2; // Account for text height
            break;
          case 'diagonal':
            x = width / 2;
            y = height / 2;
            rotation = -45;
            break;
          default:
            x = width / 2;
            y = height / 2;
        }
        
        // Ensure watermark stays within page boundaries with full text consideration
        x = Math.max(margin + textWidth / 2, Math.min(width - margin - textWidth / 2, x));
        y = Math.max(margin + textHeight / 2, Math.min(height - margin - textHeight / 2, y));
        
        // Add watermark text
        if (watermarkSettings.text.trim() !== '') {
          // Calculate text width for center alignment
          const textWidth = watermarkSettings.text.length * (watermarkSettings.fontSize * 0.6);
          
          // Adjust x position for center alignment on center positions
          let adjustedX = x;
          if (watermarkSettings.position === 'center' || 
              watermarkSettings.position === 'top-center' || 
              watermarkSettings.position === 'bottom-center' ||
              watermarkSettings.position === 'diagonal') {
            adjustedX = x - textWidth / 2;
          }
          
          page.drawText(watermarkSettings.text, {
            x: adjustedX,
            y,
            size: watermarkSettings.fontSize,
            color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
            opacity: watermarkSettings.opacity,
            rotate: degrees(-rotation) // Negative rotation to match preview direction
          });
        }
      }
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const watermarkedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const watermarkedPdfUrl = URL.createObjectURL(watermarkedPdfBlob);
      
      const result: ProcessedFile = {
        id: `watermarked_${file.id}`,
        name: `watermarked_${file.file.name}`,
        downloadUrl: watermarkedPdfUrl,
        type: 'pdf',
        size: `${(watermarkedPdfBlob.size / 1024).toFixed(1)}KB`
      };

      return [result];
    } catch (error: any) {
      throw new Error(`Failed to add watermark to PDF: ${error.message}`);
    }
  }, [watermarkSettings]);

  const customValidation = useCallback((files: UploadedFile[], options: Record<string, any>): string | null => {
    if (files.length === 0) {
      return 'Please upload a PDF file to add watermark.';
    }
    
    const file = files[0];
    if (file.file.type !== 'application/pdf') {
      return 'Please upload a valid PDF file.';
    }
    
    if (!watermarkSettings.text.trim()) {
      return 'Please enter watermark text.';
    }
    
    return null;
  }, [watermarkSettings.text]);

  return (
    <BaseConversionView
      task={task}
      performConversion={performConversion}
      customValidation={customValidation}
    >
      <div className="mt-6 p-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 flex items-center">
            <Type className="w-5 h-5 mr-2" />
            Watermark Settings
          </h3>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Watermark Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={watermarkSettings.text}
              onChange={(e) => handleWatermarkChange('text', e.target.value)}
              placeholder="Enter watermark text..."
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Position
            </label>
            <select
              value={watermarkSettings.position}
              onChange={(e) => handleWatermarkChange('position', e.target.value)}
              className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            >
              <option value="diagonal">Diagonal (Center)</option>
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Color
            </label>
            <div className="flex items-center space-x-2">
              {predefinedWatermarkColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleWatermarkChange('color', color.value)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    watermarkSettings.color === color.value 
                      ? 'border-primary scale-110' 
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <input
                type="color"
                value={watermarkSettings.color}
                onChange={(e) => handleWatermarkChange('color', e.target.value)}
                className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Font Size: {watermarkSettings.fontSize}px
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={watermarkSettings.fontSize}
              onChange={(e) => handleWatermarkChange('fontSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Opacity: {Math.round(watermarkSettings.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={watermarkSettings.opacity}
              onChange={(e) => handleWatermarkChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Rotation (for non-diagonal positions) */}
          {watermarkSettings.position !== 'diagonal' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Rotation: {watermarkSettings.rotation}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={watermarkSettings.rotation}
                onChange={(e) => handleWatermarkChange('rotation', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Preview */}
        {previewMode && (
          <div className="mt-6 p-4 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Preview</h4>
            <div className="relative w-full h-64 bg-gray-100 dark:bg-neutral-800 rounded border overflow-hidden">
              <div
                className="absolute text-center whitespace-nowrap"
                style={{
                  color: watermarkSettings.color,
                  fontSize: `${Math.min(watermarkSettings.fontSize, 40)}px`, // Cap font size for preview
                  opacity: watermarkSettings.opacity,
                  transform: `rotate(${watermarkSettings.rotation}deg)`,
                  // Calculate position based on preview dimensions (256px width, 256px height)
                  ...(watermarkSettings.position === 'center' && {
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'top-left' && {
                    top: '20px',
                    left: '20px',
                    transform: `rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'top-center' && {
                    top: '20px',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'top-right' && {
                    top: '20px',
                    right: '20px',
                    transform: `rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'bottom-left' && {
                    bottom: '20px',
                    left: '20px',
                    transform: `rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'bottom-center' && {
                    bottom: '20px',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'bottom-right' && {
                    bottom: '20px',
                    right: '20px',
                    transform: `rotate(${watermarkSettings.rotation}deg)`
                  }),
                  ...(watermarkSettings.position === 'diagonal' && {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-45deg)'
                  })
                }}
              >
                {watermarkSettings.text}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseConversionView>
  );
};

export default WatermarkPdfView; 