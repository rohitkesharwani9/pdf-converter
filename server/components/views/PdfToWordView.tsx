import React, { useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { 
  Description as PdfIcon, 
  Description as WordIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import FileUpload from '../FileUpload';
import { UploadedFile } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';
import AdSense from '../AdSense';

const PdfToWordView: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  
  const themeContext = useContext(ThemeContext);
  const darkMode = themeContext?.darkMode ?? false;

  // Create MUI theme based on dark mode
  const muiTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#121212' : '#ffffff',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#b0b0b0' : '#666666',
      },
    },
  });

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setError(null);
    setSuccess(null);
    setDownloadUrl(null);
    setDownloadFileName(null);
  };

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) return;

    setIsConverting(true);
    setError(null);
    setSuccess(null);
    setDownloadUrl(null);
    setDownloadFileName(null);

    const file = uploadedFiles[0].file; // Take the first file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/convert/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'converted.docx';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download URL
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        setDownloadUrl(url);
        setDownloadFileName(filename);
        setSuccess(`Successfully converted to ${filename}`);
        setUploadedFiles([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && downloadFileName) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleClearDownload = () => {
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setDownloadFileName(null);
    setSuccess(null);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          PDF to Word Converter
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Convert your PDF documents to editable Word (.docx) format using advanced AI-powered conversion technology.
          This tool preserves formatting, tables, and images for the best possible conversion quality.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PdfIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Input PDF</Typography>
                </Box>
                
                <FileUpload
                  onFilesChange={handleFilesChange}
                  uploadedFiles={uploadedFiles}
                  accept=".pdf,application/pdf"
                  multiple={false}
                  maxFiles={1}
                  maxFileSizeMB={50}
                  label="Drop your PDF file here or click to browse"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WordIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Output Word Document</Typography>
                </Box>
                
                {downloadUrl ? (
                  <Box sx={{ 
                    height: 200, 
                    border: '2px solid', 
                    borderColor: 'success.main', 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: darkMode ? 'success.dark' : 'success.50',
                    p: 2
                  }}>
                    <DownloadIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body1" color="success.main" textAlign="center" sx={{ mb: 2 }}>
                      Conversion Complete!
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary', 
                      textAlign: 'center', 
                      mb: 2,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {downloadFileName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        size="small"
                      >
                        Download
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleClearDownload}
                        size="small"
                      >
                        Clear
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 200, 
                    border: '2px dashed', 
                    borderColor: 'primary.main', 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: darkMode ? 'primary.dark' : 'primary.50',
                    opacity: 0.7
                  }}>
                    <DownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="primary.main" textAlign="center">
                      Converted Word document will appear here
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleConvert}
            disabled={uploadedFiles.length === 0 || isConverting}
            startIcon={isConverting ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {isConverting ? 'Converting...' : 'Convert to Word'}
          </Button>
        </Box>

        {/* AdSense Ad for PDF to Word */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <AdSense 
            adSlot="6480016001" 
            adFormat="auto" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              margin: '0.5rem 0 !important',
              minHeight: '250px',
              maxWidth: '100%'
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && !downloadUrl && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mt: 4, p: 3, bgcolor: darkMode ? 'grey.800' : 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">✓</Typography>
                <Typography variant="body2">Preserves formatting</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">✓</Typography>
                <Typography variant="body2">Maintains tables</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">✓</Typography>
                <Typography variant="body2">Keeps images</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">✓</Typography>
                <Typography variant="body2">Editable text</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default PdfToWordView;
 