import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ConversionType, ALL_CONVERSION_TASKS } from './constants';
import { ConversionTask } from './types'; 
import MuiImageToPdfTool from './components/views/ImageToPdfView'; // Changed import for the new advanced view
import PdfToImageView from './components/views/PdfToImageView';
import MergePdfView from './components/views/MergePdfView';
import PasswordPdfView from './components/views/PasswordPdfView';
import PlaceholderView from './components/views/PlaceholderView';
import { ThemeContext } from './contexts/ThemeContext'; 

// Import other view components
import WordToPdfView from './components/views/WordToPdfView';
import ExcelToPdfView from './components/views/ExcelToPdfView';
import PowerPointToPdfView from './components/views/PowerPointToPdfView';
import TextToPdfView from './components/views/TextToPdfView';
import PdfToWordView from './components/views/PdfToWordView';
import PdfToExcelView from './components/views/PdfToExcelView';
import PdfToPowerPointView from './components/views/PdfToPowerPointView';
import PdfToTextView from './components/views/PdfToTextView';
import PdfToHtmlView from './components/views/PdfToHtmlView';
import HtmlToPdfView from './components/views/HtmlToPdfView';
import PdfToEpubView from './components/views/PdfToEpubView';
import PdfToRtfView from './components/views/PdfToRtfView';
import PdfToVectorView from './components/views/PdfToVectorView';
import EpubToPdfView from './components/views/EpubToPdfView';
import RtfToPdfView from './components/views/RtfToPdfView';
import VectorToPdfView from './components/views/VectorToPdfView';
import PdfToSvgView from './components/views/PdfToSvgView';
import SplitPdfView from './components/views/SplitPdfView';
import CompressPdfView from './components/views/CompressPdfView';
import OrganizePdfView from './components/views/OrganizePdfView';
import WatermarkPdfView from './components/views/WatermarkPdfView';
import EditMetadataPdfView from './components/views/EditMetadataPdfView';
import OCRPdfView from './components/views/OCRPdfView';

const componentMap: { [key: string]: React.ComponentType<any> } = {
  PdfToImageView,
  WordToPdfView,
  ExcelToPdfView,
  PowerPointToPdfView,
  TextToPdfView,
  PdfToWordView,
  MergePdfView,
  PasswordPdfView,
  PdfToExcelView,
  PdfToPowerPointView,
  PdfToTextView,
  PdfToHtmlView,
  PdfToEpubView,
  PdfToRtfView,
  PdfToVectorView,
  EpubToPdfView,
  RtfToPdfView,
  VectorToPdfView,
  PdfToSvgView,
  SplitPdfView,
  CompressPdfView,
  OrganizePdfView,
  WatermarkPdfView,
  EditMetadataPdfView,
  OCRPdfView,
};

const App: React.FC = () => {
  const [activeTask, setActiveTask] = useState<ConversionTask | null>(ALL_CONVERSION_TASKS[0] || null);
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const themeContext = React.useContext(ThemeContext);
  const darkMode = themeContext?.darkMode ?? false;

  const handleTaskSelect = useCallback((taskId: ConversionType) => {
    const task = ALL_CONVERSION_TASKS.find(t => t.id === taskId) || null;
    setActiveTask(task);
    // Reset state when switching tasks
    setUploadedFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setConversionError(null);
  }, []);

  // Handler to be passed to conversion views
  const handleStartConversion = () => {
    if (conversionInProgress) {
      setConversionError('One conversion is in process. Please finish that conversion before starting a new one.');
      return false;
    }
    setConversionError(null);
    setConversionInProgress(true);
    return true;
  };
  
  const handleFinishConversion = () => {
    setConversionInProgress(false);
  };

  // Handlers for PDF to Excel view
  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    if (!file) {
      // Clear download state when file is cleared
      setDownloadUrl(null);
      setDownloadFilename('');
      setConversionError(null);
    }
  };

  const handleConversionStart = () => {
    setConversionInProgress(true);
    setConversionError(null);
  };

  const handleConversionComplete = (url: string, filename: string) => {
    setDownloadUrl(url);
    setDownloadFilename(filename);
    setConversionInProgress(false);
  };

  const handleError = (error: string) => {
    setConversionError(error);
    setConversionInProgress(false);
  };

  const renderActiveView = () => {
    if (!activeTask) {
      return <PlaceholderView title="No Task Selected" message="Please select a conversion task from the sidebar." />;
    }

    const commonProps = {
      conversionInProgress,
      onStartConversion: handleStartConversion,
      onFinishConversion: handleFinishConversion,
    };

    switch (activeTask.id) {
      case ConversionType.IMAGE_TO_PDF:
        return <MuiImageToPdfTool />; // Render the new advanced MUI component directly
      case ConversionType.WORD_TO_PDF:
        return <WordToPdfView task={activeTask} {...commonProps} />;
      case ConversionType.EXCEL_TO_PDF:
        return <ExcelToPdfView task={activeTask} {...commonProps} />;
      case ConversionType.POWERPOINT_TO_PDF:
        return <PowerPointToPdfView task={activeTask} {...commonProps} />;
      case ConversionType.TEXT_TO_PDF:
        return <TextToPdfView task={activeTask} {...commonProps} />;
      case ConversionType.HTML_TO_PDF:
        return <HtmlToPdfView task={activeTask} />;
      case ConversionType.PDF_TO_IMAGE:
        return <PdfToImageView task={activeTask} />;
      case ConversionType.PDF_TO_WORD:
        return <PdfToWordView />;
      case ConversionType.MERGE_PDF:
        return <MergePdfView task={activeTask} />;
      case ConversionType.PASSWORD_PROTECT_PDF:
        return <PasswordPdfView task={activeTask} />;
      case ConversionType.PDF_TO_EXCEL:
        return (
          <PdfToExcelView 
            onFileUpload={handleFileUpload}
            onConversionStart={handleConversionStart}
            onConversionComplete={handleConversionComplete}
            onError={handleError}
            isConverting={conversionInProgress}
            uploadedFile={uploadedFile}
            downloadUrl={downloadUrl}
            downloadFilename={downloadFilename}
          />
        );
      case ConversionType.PDF_TO_POWERPOINT:
        return <PdfToPowerPointView task={activeTask} {...commonProps} />;
      case ConversionType.PDF_TO_TEXT:
        return <PdfToTextView task={activeTask} {...commonProps} />;
      case ConversionType.PDF_TO_HTML:
        return <PdfToHtmlView task={activeTask} {...commonProps} />;
      case ConversionType.PDF_TO_EPUB:
        return <PdfToEpubView task={activeTask} />;
      case ConversionType.PDF_TO_RTF:
        return <PdfToRtfView task={activeTask} />;
      case ConversionType.PDF_TO_VECTOR:
        return <PdfToVectorView task={activeTask} />;
      case ConversionType.EPUB_TO_PDF:
        return <EpubToPdfView task={activeTask} />;
      case ConversionType.RTF_TO_PDF:
        return <RtfToPdfView task={activeTask} />;
      case ConversionType.VECTOR_TO_PDF:
        return <VectorToPdfView task={activeTask} />;
      case ConversionType.PDF_TO_SVG:
        return <PdfToSvgView task={activeTask} />;
      case ConversionType.SPLIT_PDF:
        return <SplitPdfView task={activeTask} />;
      case ConversionType.COMPRESS_PDF:
        return <CompressPdfView />;
      case ConversionType.REORDER_PAGES_PDF:
        return <OrganizePdfView />;
      case ConversionType.ADD_WATERMARK_PDF:
        return <WatermarkPdfView task={activeTask} />;
      case ConversionType.EDIT_METADATA_PDF:
        return <EditMetadataPdfView task={activeTask} />;
      case ConversionType.OCR_PDF:
        return <OCRPdfView task={activeTask} />;
      default:
        return <PlaceholderView title={activeTask.name} message="This feature is under construction. Check back soon!" icon={activeTask.icon} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans ${darkMode ? 'dark' : ''}`}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onTaskSelect={handleTaskSelect} activeTaskId={activeTask?.id || null} />
        <main className="flex-1 p-0 md:p-6 overflow-y-auto bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
          {conversionError && (
            <div className="p-4 mb-4 bg-red-100 border border-red-300 text-red-700 rounded text-center font-semibold">
              {conversionError}
            </div>
          )}
          {/* Apply p-0 for IMAGE_TO_PDF to allow MUI component to control its padding, else p-6 */}
          {activeTask?.id === ConversionType.IMAGE_TO_PDF ? renderActiveView() : (
            <div className="p-6 h-full"> {/* Ensure other views still have padding */}
              {renderActiveView()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
