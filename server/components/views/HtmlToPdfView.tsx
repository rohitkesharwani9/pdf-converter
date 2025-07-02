import React, { useState } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import FileUpload from '../FileUpload';
import ProgressBar from '../ProgressBar';
import Button from '../Button';
import { Download, AlertCircle } from 'lucide-react';
import styled from 'styled-components';
import { ThemeContext } from '../../contexts/ThemeContext';
import AdSense from '../AdSense';

interface HtmlToPdfViewProps {
  task: ConversionTask;
}

type ConversionMode = 'upload' | 'code';

const PageBackground = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  min-height: 100vh;
  background: ${({ darkMode }) => darkMode ? 'linear-gradient(135deg, #18181b 0%, #23272f 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)'};
  padding: 2rem 0;
`;

const Card = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  max-width: 100%;
  margin: 2rem auto;
  background: ${({ darkMode }) => darkMode ? '#18181b' : '#fff'};
  border-radius: 18px;
  box-shadow: 0 4px 32px 0 rgba(60, 72, 100, 0.10);
  padding: 2.5rem 2rem 2rem 2rem;
  position: relative;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1.5px solid #e5e7eb;
  margin-bottom: 2rem;
  gap: 0.5rem;
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  padding: 0.85rem 2.2rem;
  border: none;
  background: ${({ active }) => (active ? 'var(--primary-color, #2563eb)' : 'transparent')};
  color: ${({ active }) => (active ? '#fff' : '#374151')};
  font-weight: ${({ active }) => (active ? 700 : 500)};
  font-size: 1.08rem;
  border-radius: 12px 12px 0 0;
  box-shadow: ${({ active }) => (active ? '0 2px 12px 0 rgba(37,99,235,0.10)' : 'none')};
  cursor: pointer;
  border-bottom: ${({ active }) => (active ? '2.5px solid var(--primary-color, #2563eb)' : '2.5px solid transparent')};
  transition: all 0.18s cubic-bezier(.4,0,.2,1);
  outline: none;
  &:hover {
    ${({ active }) =>
      active
        ? ''
        : `
      background: #f1f5f9;
      color: var(--primary-color, #2563eb);
    `}
  }
`;

const InputCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  background: ${({ darkMode }) => darkMode ? '#23272f' : '#f8fafc'};
  border: 1.5px solid ${({ darkMode }) => darkMode ? '#33364a' : '#e5e7eb'};
  border-radius: 12px;
  box-shadow: 0 1px 6px 0 rgba(60, 72, 100, 0.04);
  padding: 1.5rem 1.2rem;
  margin-bottom: 2rem;
  transition: border 0.2s;
`;

const UrlInput = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1.08rem;
  background-color: #fff;
  color: #374151;
  outline: none;
  transition: border 0.2s;
  &:focus {
    border-color: var(--primary-color, #2563eb);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10);
  }
`;

const CodeTextArea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  width: 100%;
  min-height: 220px;
  padding: 0.85rem 1rem;
  border: 1.5px solid ${({ darkMode }) => darkMode ? '#33364a' : '#cbd5e1'};
  border-radius: 8px;
  font-size: 1.08rem;
  background-color: ${({ darkMode }) => darkMode ? '#18181b' : '#fff'};
  color: ${({ darkMode }) => darkMode ? '#e5e7ef' : '#374151'};
  outline: none;
  resize: vertical;
  font-family: 'JetBrains Mono', 'Fira Mono', 'Courier New', Courier, monospace;
  transition: border 0.2s;
  &:focus {
    border-color: var(--primary-color, #2563eb);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10);
  }
`;

const ResultsContainer = styled.div`
  margin-top: 2.5rem;
`;

const ResultItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.2rem 1.2rem 1.2rem;
  background-color: ${({ darkMode }) => darkMode ? '#23272f' : '#f8fafc'};
  border: 1.5px solid ${({ darkMode }) => darkMode ? '#33364a' : '#e5e7eb'};
  border-radius: 12px;
  box-shadow: 0 1px 6px 0 rgba(60, 72, 100, 0.04);
  margin-bottom: 1.2rem;
`;

const FileName = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  font-weight: 600;
  color: ${({ darkMode }) => darkMode ? '#e5e7ef' : '#1e293b'};
`;

const ErrorMessage = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  color: ${({ darkMode }) => darkMode ? '#fca5a5' : '#dc2626'};
  background-color: ${({ darkMode }) => darkMode ? '#2b2323' : '#fef2f2'};
  padding: 1.1rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 500;
  margin-bottom: 1.2rem;
  border: 1.5px solid ${({ darkMode }) => darkMode ? '#7f1d1d' : '#fecaca'};
`;

const Heading = styled.h2.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  font-size: 2.1rem;
  font-weight: 800;
  color: ${({ darkMode }) => darkMode ? '#e5e7ef' : '#1e293b'};
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
`;

const Description = styled.p.withConfig({
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<{ darkMode?: boolean }>`
  color: ${({ darkMode }) => darkMode ? '#a3a3a3' : '#64748b'};
  font-size: 1.08rem;
  margin-bottom: 2.2rem;
`;

const StyledButton = styled(Button)`
  font-size: 1.15rem;
  padding: 0.9rem 2.2rem;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 2px 8px 0 rgba(37,99,235,0.08);
`;

const HtmlToPdfView: React.FC<HtmlToPdfViewProps> = ({ task }) => {
  const [mode, setMode] = useState<ConversionMode>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [htmlCode, setHtmlCode] = useState('<h1>Hello, World!</h1>');
  
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const themeContext = React.useContext(ThemeContext);
  const darkMode = themeContext?.darkMode ?? false;

  const handleFilesUpload = (files: UploadedFile[]) => {
    setError(null);
    if (files.length === 0) {
      setUploadedFiles([]);
      return;
    }
    if (files.length > 1) {
      setError('Please upload only one HTML file.');
      return;
    }
    const file = files[0];
    const acceptedMimeTypes = ['text/html'];
    const acceptedExtensions = ['.html', '.htm'];
    const fileExtension = file.file.name.substring(file.file.name.lastIndexOf('.')).toLowerCase();
    
    if (!acceptedMimeTypes.includes(file.file.type) && !acceptedExtensions.includes(fileExtension)) {
      setError(`File "${file.file.name}" is not a supported HTML file. Please upload .html or .htm files.`);
      setUploadedFiles([]);
    } else {
      setUploadedFiles(files);
    }
  };

  const performConversion = async () => {
    setIsConverting(true);
    setError(null);
    setProgress(0);
    setProcessedFiles([]);

    const formData = new FormData();
    let originalFileName = 'download.pdf';

    if (mode === 'upload') {
      if (uploadedFiles.length === 0) {
        setError('Please upload an HTML file.');
        setIsConverting(false);
        return;
      }
      formData.append('file', uploadedFiles[0].file);
      originalFileName = `${uploadedFiles[0].file.name.replace(/\.[^/.]+$/, "")}.pdf`;
    } else if (mode === 'code') {
      if (!htmlCode.trim()) {
        setError('Please enter some HTML code.');
        setIsConverting(false);
        return;
      }
      formData.append('htmlContent', htmlCode);
      originalFileName = 'from-code.pdf';
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 95 ? 95 : prev + 5));
    }, 200);

    try {
      const response = await fetch('/convert/html-to-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        // Try to parse error as JSON
        let errorMsg = 'Conversion failed on the server.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      // Always treat as Blob for PDF
      const blob = await response.blob();
      const headBuffer = await blob.slice(0, 8).arrayBuffer();
      const headArr = new Uint8Array(headBuffer);
      const headStr = String.fromCharCode(...headArr);
      if (!headStr.startsWith('%PDF')) {
        setError('The server did not return a valid PDF file.');
        setIsConverting(false);
        return;
      }
      const downloadUrl = URL.createObjectURL(blob);
      setProcessedFiles([{
        id: `processed-${Date.now()}`,
        name: originalFileName,
        type: 'PDF',
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl,
      }]);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsConverting(false);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'upload':
        return (
          <InputCard darkMode={darkMode}>
            <FileUpload
              onFilesChange={handleFilesUpload}
              multiple={false}
              uploadedFiles={uploadedFiles}
              maxFiles={1}
              accept=".html,.htm"
            />
          </InputCard>
        );
      case 'code':
        return (
          <InputCard darkMode={darkMode}>
            <CodeTextArea
              darkMode={darkMode}
              value={htmlCode}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setHtmlCode(e.target.value); setError(null); }}
            />
          </InputCard>
        );
      default:
        return null;
    }
  };

  return (
    <PageBackground darkMode={darkMode}>
      <Card darkMode={darkMode}>
        <Heading darkMode={darkMode}>{task.name}</Heading>
        <Description darkMode={darkMode}>{task.description}</Description>
        <ErrorMessage darkMode={darkMode} style={{ background: darkMode ? '#3b2f1a' : '#fffbe6', color: darkMode ? '#fde68a' : '#b45309', border: darkMode ? '1.5px solid #fde68a' : '1.5px solid #fde68a', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle className="w-24 h-24" style={{ color: darkMode ? '#fde68a' : '#f59e42', marginRight: 5 }} />
          Note: Only static HTML files and code (without external scripts or dynamic content) will render perfectly. Dynamic HTML (with JavaScript, external CSS, or interactive features) may not be converted correctly.
        </ErrorMessage>
        <TabContainer>
          <TabButton active={mode === 'upload'} onClick={() => setMode('upload')}>Upload File</TabButton>
          <TabButton active={mode === 'code'} onClick={() => setMode('code')}>Paste Code</TabButton>
        </TabContainer>
        {renderContent()}
        {error && (
          <ErrorMessage darkMode={darkMode}>
            <AlertCircle className="w-24 h-24" style={{ marginRight: 5 }} />
            {error}
          </ErrorMessage>
        )}
        <div style={{ marginTop: '2.2rem', display: 'flex', justifyContent: 'center' }}>
          <StyledButton onClick={performConversion} disabled={isConverting}>
            {isConverting ? 'Converting...' : 'Convert to PDF'}
          </StyledButton>
        </div>
        {isConverting && <ProgressBar progress={progress} />}
        {processedFiles.length > 0 && !isConverting && (
          <ResultsContainer>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: darkMode ? '#e5e7ef' : '#1e293b', marginBottom: '1.2rem' }}>Results</h3>
            {processedFiles.map(file => (
              <ResultItem key={file.id} darkMode={darkMode}>
                <div>
                  <FileName darkMode={darkMode}>{file.name}</FileName>
                  <div style={{ fontSize: '0.98rem', color: darkMode ? '#a3a3a3' : '#64748b', marginTop: 2 }}>{file.size}</div>
                </div>
                <a href={file.downloadUrl} download={file.name}>
                  <Button variant="secondary">
                    <Download size={18} style={{ marginRight: 8 }} />
                    Download
                  </Button>
                </a>
              </ResultItem>
            ))}
          </ResultsContainer>
        )}

        {/* AdSense Ad for HTML to PDF */}
        <AdSense 
          adSlot="6480016001" 
          adFormat="auto" 
          className="mt-8"
        />
      </Card>
    </PageBackground>
  );
};

export default HtmlToPdfView; 