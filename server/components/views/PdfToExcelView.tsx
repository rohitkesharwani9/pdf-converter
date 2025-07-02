import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Card, 
  CardContent,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  TableChart as TableIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import AdSense from '../AdSense';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface TableInfo {
  page: number;
  tableIndex: number;
  rows: number;
  cols: number;
  bounds: { x: number; y: number; width: number; height: number };
}

interface PdfToExcelViewProps {
  onFileUpload: (file: File) => void;
  onConversionStart: () => void;
  onConversionComplete: (downloadUrl: string, filename: string) => void;
  onError: (error: string) => void;
  isConverting: boolean;
  uploadedFile: File | null;
  downloadUrl?: string | null;
  downloadFilename?: string;
}

const PdfToExcelView: React.FC<PdfToExcelViewProps> = ({
  onFileUpload,
  onConversionStart,
  onConversionComplete,
  onError,
  isConverting,
  uploadedFile,
  downloadUrl,
  downloadFilename
}) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [pageSelection, setPageSelection] = useState('all');
  const [detectedTables, setDetectedTables] = useState<TableInfo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [pageSelectionError, setPageSelectionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      loadPdfPreview(file);
    }
  };

  // Handle preview button click
  const handlePreviewClick = () => {
    if (pdfDoc && previewLoaded) {
      setShowPreview(true);
      // Render first page after a short delay to ensure canvas is ready
      setTimeout(() => {
        renderPage(1, pdfDoc);
      }, 100);
    }
  };

  // Clear all data
  const handleClear = () => {
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset all state
    setPdfDoc(null);
    setCurrentPage(1);
    setTotalPages(0);
    setScale(1.0);
    setPageSelection('all');
    setDetectedTables([]);
    setSelectedTables(new Set());
    setShowPreview(false);
    setPreviewLoaded(false);
    setPageSelectionError(null);
    
    // Clear file URL
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    
    // Notify parent to clear file
    onFileUpload(null as any);
  };

  // Load PDF preview
  const loadPdfPreview = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setScale(1.0);
      setDetectedTables([]);
      setSelectedTables(new Set());
      setShowPreview(false); // Don't show preview automatically
      setPreviewLoaded(true); // Mark as loaded but not shown
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      onError('Failed to load PDF');
    }
  };

  // Render specific page
  const renderPage = async (pageNum: number, doc?: PDFDocumentProxy) => {
    if (!doc && !pdfDoc) return;
    
    const pdf = doc || pdfDoc!;
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef;
      
      if (!canvas) {
        console.log('Canvas not ready, retrying...');
        setTimeout(() => renderPage(pageNum, doc), 200);
        return;
      }
      
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to get canvas context');
        return;
      }
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      console.log(`Page ${pageNum} rendered successfully at ${Math.round(scale * 100)}%`);
      
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
      // Retry once on error
      setTimeout(() => renderPage(pageNum, doc), 500);
    }
  };

  // Navigate pages
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      renderPage(pageNum);
    }
  };

  // Zoom controls
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Analyze PDF for tables
  const analyzeTables = async () => {
    if (!pdfDoc) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setDetectedTables([]);
    
    const tables: TableInfo[] = [];
    
    try {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setAnalysisProgress((pageNum / totalPages) * 100);
        
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Simple table detection based on text positioning
        const lines = groupTextIntoLines(textContent);
        const detectedTable = detectTableStructure(lines, pageNum);
        
        if (detectedTable) {
          tables.push(detectedTable);
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setDetectedTables(tables);
      
    } catch (error) {
      console.error('Error analyzing tables:', error);
      onError('Failed to analyze PDF for tables');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Group text items into lines
  const groupTextIntoLines = (textContent: any) => {
    const lines: any[] = [];
    let currentLine: any[] = [];
    let lastY = -1;
    
    textContent.items.forEach((item: any) => {
      if (lastY === -1 || Math.abs(item.transform[5] - lastY) < 5) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [item];
      }
      lastY = item.transform[5];
    });
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Detect table structure
  const detectTableStructure = (lines: any[], pageNum: number): TableInfo | null => {
    // Simple table detection: look for lines with multiple columns
    const tableLines = lines.filter(line => {
      const items = line.length;
      return items >= 3; // At least 3 columns to be considered a table
    });
    
    if (tableLines.length >= 2) { // At least 2 rows
      const cols = Math.max(...tableLines.map(line => line.length));
      const rows = tableLines.length;
      
      return {
        page: pageNum,
        tableIndex: 1,
        rows,
        cols,
        bounds: { x: 0, y: 0, width: 100, height: 100 } // Placeholder
      };
    }
    
    return null;
  };

  // Handle table selection
  const toggleTableSelection = (tableKey: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableKey)) {
      newSelected.delete(tableKey);
    } else {
      newSelected.add(tableKey);
    }
    setSelectedTables(newSelected);
  };

  // Generate page selection from selected tables
  const generatePageSelection = () => {
    if (selectedTables.size === 0) return 'all';
    
    const pages = new Set<number>();
    selectedTables.forEach(tableKey => {
      const [page] = tableKey.split('-');
      pages.add(parseInt(page));
    });
    
    return Array.from(pages).sort((a, b) => a - b).join(',');
  };

  // Handle conversion
  const handleConvert = async () => {
    if (!uploadedFile) return;
    
    // Validate page selection before conversion
    if (!validatePageSelection(pageSelection)) {
      onError('Please fix the page selection errors before converting.');
      return;
    }
    
    const finalPageSelection = pageSelection === 'all' ? generatePageSelection() : pageSelection;
    
    onConversionStart();
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('pageSelection', finalPageSelection);
      
      const response = await fetch('/convert/pdf-to-excel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const filename = uploadedFile.name.replace('.pdf', '.xlsx');
      
      onConversionComplete(downloadUrl, filename);
      
    } catch (error) {
      console.error('Conversion error:', error);
      onError(error instanceof Error ? error.message : 'Conversion failed');
    }
  };

  // Update scale effect
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [scale]);

  // Ensure first page renders when PDF is loaded
  useEffect(() => {
    if (pdfDoc && showPreview && currentPage === 1) {
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        renderPage(1, pdfDoc);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pdfDoc, showPreview, currentPage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Validate page selection
  const validatePageSelection = (selection: string): boolean => {
    if (!selection || selection.toLowerCase() === 'all') {
      setPageSelectionError(null);
      return true;
    }
    
    const pages = new Set<number>();
    const parts = selection.split(',');
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        // Handle range like "3-5"
        try {
          const [start, end] = trimmedPart.split('-').map(p => parseInt(p.trim()));
          if (isNaN(start) || isNaN(end) || start > end) {
            setPageSelectionError(`Invalid range format: ${trimmedPart}`);
            return false;
          }
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        } catch {
          setPageSelectionError(`Invalid range format: ${trimmedPart}`);
          return false;
        }
      } else {
        // Handle single page
        try {
          const pageNum = parseInt(trimmedPart);
          if (isNaN(pageNum)) {
            setPageSelectionError(`Invalid page number: ${trimmedPart}`);
            return false;
          }
          pages.add(pageNum);
        } catch {
          setPageSelectionError(`Invalid page number: ${trimmedPart}`);
          return false;
        }
      }
    }
    
    // Check if all pages are within valid range
    const maxPage = totalPages;
    const invalidPages = Array.from(pages).filter(page => page < 1 || page > maxPage);
    
    if (invalidPages.length > 0) {
      setPageSelectionError(`Invalid page(s): ${invalidPages.join(', ')}. PDF has ${maxPage} page${maxPage !== 1 ? 's' : ''}.`);
      return false;
    }
    
    setPageSelectionError(null);
    return true;
  };

  // Handle page selection change
  const handlePageSelectionChange = (value: string) => {
    setPageSelection(value);
    if (totalPages > 0) {
      validatePageSelection(value);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 3,
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ 
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        textAlign: 'center',
        mb: 2
      }}>
        PDF to Excel Converter
      </Typography>

      {/* File Upload Section */}
      <Card sx={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: 'var(--text-primary)',
            mb: 2
          }}>
            Upload PDF File
          </Typography>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isConverting}
              sx={{
                backgroundColor: 'var(--primary-color)',
                '&:hover': { backgroundColor: 'var(--primary-hover)' },
                '&:disabled': { backgroundColor: 'var(--disabled-bg)' }
              }}
            >
              Choose PDF File
            </Button>
            
            {uploadedFile && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={isConverting}
                sx={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  '&:hover': { 
                    borderColor: 'var(--error-color)',
                    color: 'var(--error-color)'
                  }
                }}
              >
                Clear
              </Button>
            )}
          </Box>
          
          {uploadedFile && (
            <Typography variant="body2" sx={{ 
              mt: 1,
              color: 'var(--text-secondary)',
              fontFamily: 'monospace'
            }}>
              Selected: {uploadedFile.name}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Preview Button Section */}
      {uploadedFile && previewLoaded && !showPreview && (
        <Card sx={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ 
              color: 'var(--text-primary)',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <VisibilityIcon sx={{ color: 'var(--primary-color)' }} />
              PDF Ready for Preview
            </Typography>
            
            <Typography variant="body2" sx={{ 
              color: 'var(--text-secondary)',
              mb: 3
            }}>
              Your PDF has been loaded successfully. Click the button below to preview it.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<VisibilityIcon />}
              onClick={handlePreviewClick}
              disabled={isConverting}
              sx={{
                backgroundColor: 'var(--primary-color)',
                '&:hover': { backgroundColor: 'var(--primary-hover)' },
                '&:disabled': { backgroundColor: 'var(--disabled-bg)' },
                px: 4,
                py: 1.5
              }}
            >
              Click to Preview PDF
            </Button>
            
            <Typography variant="caption" sx={{ 
              display: 'block',
              mt: 2,
              color: 'var(--text-secondary)'
            }}>
              {totalPages} page{totalPages !== 1 ? 's' : ''} • Ready to view
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Section */}
      {showPreview && pdfDoc && (
        <Card sx={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <VisibilityIcon sx={{ color: 'var(--primary-color)' }} />
                PDF Preview
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowPreview(false)}
                  sx={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    '&:hover': { borderColor: 'var(--primary-color)' }
                  }}
                >
                  Hide Preview
                </Button>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  alignItems: 'center',
                  backgroundColor: 'var(--chip-bg)',
                  borderRadius: 2,
                  px: 2,
                  py: 1
                }}>
                  <Tooltip title="First Page">
                    <IconButton 
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{ 
                        color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                        '&:hover': { backgroundColor: 'var(--primary-bg)' }
                      }}
                    >
                      <FirstPageIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Previous Page">
                    <IconButton 
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{ 
                        color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                        '&:hover': { backgroundColor: 'var(--primary-bg)' }
                      }}
                    >
                      <PrevIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {currentPage} / {totalPages}
                  </Typography>
                  
                  <Tooltip title="Next Page">
                    <IconButton 
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      size="small"
                      sx={{ 
                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                        '&:hover': { backgroundColor: 'var(--primary-bg)' }
                      }}
                    >
                      <NextIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Last Page">
                    <IconButton 
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      size="small"
                      sx={{ 
                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                        '&:hover': { backgroundColor: 'var(--primary-bg)' }
                      }}
                    >
                      <LastPageIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}>
              <Typography variant="body1" sx={{ 
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                textAlign: 'center',
                mb: 1,
                fontSize: '1.1rem',
                fontWeight: 500
              }}>
                💡 Click on Zoom in or out icon to start showing PDF
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}>
              <Tooltip title="Zoom Out">
                <IconButton 
                  onClick={zoomOut} 
                  disabled={scale <= 0.5}
                  sx={{ 
                    color: scale <= 0.5 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    '&:hover': { backgroundColor: 'var(--primary-bg)' }
                  }}
                >
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              
              <Typography variant="body2" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 500,
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {Math.round(scale * 100)}%
              </Typography>
              
              <Tooltip title="Zoom In">
                <IconButton 
                  onClick={zoomIn}
                  disabled={scale >= 3.0}
                  sx={{ 
                    color: scale >= 3.0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    '&:hover': { backgroundColor: 'var(--primary-bg)' }
                  }}
                >
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              border: '2px solid var(--border-color)',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#f8f9fa',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              position: 'relative'
            }}>
              <canvas
                ref={setCanvasRef}
                style={{ 
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  backgroundColor: 'white'
                }}
              />
              
              {/* Loading overlay */}
              {!canvasRef && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1
                }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </Box>
            
            <Typography variant="caption" sx={{ 
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'var(--text-secondary)'
            }}>
              Page {currentPage} of {totalPages} • {Math.round(scale * 100)}% zoom
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Table Analysis Section */}
      {previewLoaded && (
        <Card sx={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                Table Analysis
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<TableIcon />}
                onClick={analyzeTables}
                disabled={isAnalyzing}
                sx={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  '&:hover': { borderColor: 'var(--primary-color)' }
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Tables'}
              </Button>
            </Box>
            
            {isAnalyzing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Analyzing pages... {Math.round(analysisProgress)}%
                </Typography>
              </Box>
            )}
            
            {detectedTables.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: 'var(--text-secondary)',
                  mb: 1
                }}>
                  Detected Tables:
                </Typography>
                
                <List dense>
                  {detectedTables.map((table, index) => {
                    const tableKey = `${table.page}-${table.tableIndex}`;
                    const isSelected = selectedTables.has(tableKey);
                    
                    return (
                      <ListItem
                        key={tableKey}
                        button
                        onClick={() => toggleTableSelection(tableKey)}
                        sx={{
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: isSelected ? 'var(--primary-bg)' : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          <TableIcon sx={{ color: 'var(--primary-color)' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Page ${table.page}, Table ${table.tableIndex}`}
                          secondary={`${table.rows} rows × ${table.cols} columns`}
                          sx={{
                            '& .MuiListItemText-primary': { color: 'var(--text-primary)' },
                            '& .MuiListItemText-secondary': { color: 'var(--text-secondary)' }
                          }}
                        />
                        <Chip 
                          label={isSelected ? 'Selected' : 'Click to select'}
                          size="small"
                          color={isSelected ? 'primary' : 'default'}
                          sx={{ 
                            backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--chip-bg)',
                            color: isSelected ? 'white' : 'var(--text-secondary)'
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
            
            {detectedTables.length === 0 && !isAnalyzing && (
              <Alert severity="info" sx={{ 
                backgroundColor: 'var(--info-bg)',
                color: 'var(--text-primary)'
              }}>
                Click "Analyze Tables" to detect tables in your PDF
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Page Selection Section */}
      <Card sx={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: 'var(--text-primary)',
            mb: 2
          }}>
            Page Selection
          </Typography>
          
          <TextField
            fullWidth
            label="Page Selection"
            placeholder="e.g., 1, 3-5, 7, 9-12"
            value={pageSelection}
            onChange={(e) => handlePageSelectionChange(e.target.value)}
            helperText={pageSelectionError || `Specify page numbers or ranges (e.g., 1, 3-5, 7). Leave empty or type 'all' for all pages.${totalPages > 0 ? ` PDF has ${totalPages} page${totalPages !== 1 ? 's' : ''}.` : ''}`}
            error={!!pageSelectionError}
            disabled={isConverting}
            sx={{
              '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
              '& .MuiInputBase-input': { color: 'var(--text-primary)' },
              '& .MuiFormHelperText-root': { 
                color: pageSelectionError ? 'var(--error-color)' : 'var(--text-secondary)' 
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { 
                  borderColor: pageSelectionError ? 'var(--error-color)' : 'var(--border-color)' 
                },
                '&:hover fieldset': { 
                  borderColor: pageSelectionError ? 'var(--error-color)' : 'var(--primary-color)' 
                },
                '&.Mui-focused fieldset': { 
                  borderColor: pageSelectionError ? 'var(--error-color)' : 'var(--primary-color)' 
                }
              }
            }}
          />
          
          {selectedTables.size > 0 && (
            <Alert severity="info" sx={{ 
              mt: 2,
              backgroundColor: 'var(--info-bg)',
              color: 'var(--text-primary)'
            }}>
              {selectedTables.size} table(s) selected from {Array.from(new Set(Array.from(selectedTables).map(key => key.split('-')[0]))).length} page(s)
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Convert Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isConverting ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={handleConvert}
          disabled={!uploadedFile || isConverting}
          sx={{
            backgroundColor: 'var(--primary-color)',
            '&:hover': { backgroundColor: 'var(--primary-hover)' },
            '&:disabled': { backgroundColor: 'var(--disabled-bg)' },
            px: 4,
            py: 1.5
          }}
        >
          {isConverting ? 'Converting...' : 'Convert to Excel'}
        </Button>
      </Box>

      {/* AdSense Ad for PDF to Excel */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <AdSense 
          adSlot="6480016001" 
          adFormat="auto" 
          style={{ 
            width: '100%', 
            height: 'auto', 
            margin: '0rem 0 !important',
            minHeight: '250px',
            maxWidth: '100%'
          }}
        />
      </Box>

      {/* Download Button - Show after successful conversion */}
      {downloadUrl && downloadFilename && (
        <Card sx={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          mt: 2
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Alert severity="success" sx={{ 
                backgroundColor: 'var(--success-bg)',
                color: 'var(--text-primary)',
                width: '100%'
              }}>
                ✅ Conversion completed successfully!
              </Alert>
              
              <Typography variant="body2" sx={{ 
                color: 'var(--text-secondary)',
                fontFamily: 'monospace'
              }}>
                File: {downloadFilename}
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = downloadFilename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                sx={{
                  backgroundColor: 'var(--success-color)',
                  '&:hover': { backgroundColor: 'var(--success-hover)' },
                  px: 4,
                  py: 1.5
                }}
              >
                Download Excel File
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Features Section */}
      <Card sx={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: 'var(--text-primary)',
            mb: 2
          }}>
            Features
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                📄 PDF Preview
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                View your PDF pages and navigate through them
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                🔍 Table Detection
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Automatically detect tables in your PDF
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                📊 Page Selection
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Choose specific pages or ranges to convert
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                📈 Excel Output
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Get properly formatted Excel files with tables
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PdfToExcelView;
