import express from 'express';
import multer from 'multer';
import fs from 'fs/promises'; // Use promise-based fs
import fsOrig from 'fs';
import path from 'path';
import cors from 'cors';
import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5001;

// Set server timeouts for long-running operations
app.use((req, res, next) => {
  // Set timeout to 5 minutes for all requests
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Configure CORS for production and development
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://frontend:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });
const uploadsDir = 'uploads/';
const tempDir = 'temp/';

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(err => {
  console.error('Failed to create uploads directory:', err);
});

// Ensure temp directory exists
fs.mkdir(tempDir, { recursive: true }).catch(err => {
  console.error('Failed to create temp directory:', err);
});

// --- Automatic Cleanup System ---
const cleanupOrphanedFiles = async () => {
  try {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    // Clean up uploads directory
    const uploadsPath = path.join(__dirname, uploadsDir);
    const uploadsFiles = await fs.readdir(uploadsPath).catch(() => []);
    
    for (const file of uploadsFiles) {
      const filePath = path.join(uploadsPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`[CLEANUP] Removed old upload file: ${file}`);
        }
      } catch (err) {
        // File might have been deleted already
      }
    }
    
    // Clean up temp_pdf directory
    const tempPdfPath = path.join(__dirname, 'temp_pdf');
    const tempPdfFiles = await fs.readdir(tempPdfPath).catch(() => []);
    
    for (const file of tempPdfFiles) {
      const filePath = path.join(tempPdfPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`[CLEANUP] Removed old temp file: ${file}`);
        }
      } catch (err) {
        // File might have been deleted already
      }
    }
    
    // Clean up temp directory
    const tempPath = path.join(__dirname, 'temp');
    const tempFiles = await fs.readdir(tempPath).catch(() => []);
    
    for (const file of tempFiles) {
      const filePath = path.join(tempPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`[CLEANUP] Removed old temp file: ${file}`);
        }
      } catch (err) {
        // File might have been deleted already
      }
    }
    
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupOrphanedFiles, 15 * 60 * 1000);

// Run initial cleanup on startup
cleanupOrphanedFiles();

// --- Helper function to create stable file copy ---
const createStableFileCopy = async (originalPath, originalName) => {
  try {
    // Create a stable temp directory
    const tempDir = path.join(__dirname, 'temp_pdf');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const stableFileName = `stable_${timestamp}_${randomSuffix}_${path.basename(originalName)}`;
    const stableFilePath = path.join(tempDir, stableFileName);
    
    // Copy the uploaded file to our stable location
    await fs.copyFile(originalPath, stableFilePath);
    console.log('[FILE_COPY] Created stable copy:', stableFilePath);
    
    // Verify the copied file exists
    await fs.access(stableFilePath);
    console.log('[FILE_COPY] Verified stable file exists');
    
    return stableFilePath;
  } catch (error) {
    console.error('[FILE_COPY] Error creating stable copy:', error);
    throw error;
  }
};

// --- Helper function for LibreOffice conversion ---
const convertWithLibreOffice = (filePath, res, originalName = 'document.html') => {
  const outputDir = path.dirname(filePath);
  const ext = path.extname(originalName);

  const libreOfficeProcess = execFile(
    'libreoffice',
    ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, filePath],
    { timeout: 300000 }, // 5 minutes timeout
    async (error, stdout, stderr) => {
      try {
        if (error) {
          console.error('LibreOffice conversion error:', error, stderr);
          throw new Error(stderr || 'Conversion failed');
        }

        const baseName = path.basename(originalName, ext);
        const files = await fs.readdir(outputDir);
        console.log('Looking for PDF. baseName:', baseName, 'files:', files);

        let pdfFile = files.find(f => f.endsWith('.pdf') && f.startsWith(baseName));
        if (!pdfFile) {
          pdfFile = files.find(f => f.endsWith('.pdf'));
          if (!pdfFile) throw new Error('PDF not generated');
        }
        
        const pdfPath = path.join(outputDir, pdfFile);
        const pdfBuffer = await fs.readFile(pdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFile}"`);
        res.send(pdfBuffer);

        // Cleanup
        await fs.unlink(pdfPath);
      } catch (err) {
        res.status(500).json({ error: 'Conversion failed', details: err.message });
      } finally {
        await fs.unlink(filePath).catch(err => console.error("Failed to delete temp input file:", err));
      }
    }
  );
};

app.post('/convert/word-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filePath, originalname } = req.file;
  const ext = path.extname(originalname);

  if (!['.doc', '.docx'].includes(ext.toLowerCase())) {
    await fs.unlink(filePath);
    return res.status(400).json({ error: 'Only .doc and .docx files are supported' });
  }

  try {
    // Use the same convertWithLibreOffice function that works for other conversions
    convertWithLibreOffice(filePath, res, originalname);
  } catch (err) {
    console.error('Word to PDF conversion error:', err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

app.post('/convert/excel-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (!['.xls', '.xlsx'].includes(ext.toLowerCase())) {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .xls and .xlsx files are supported' });
  }
  convertWithLibreOffice(req.file.path, res, req.file.originalname);
});

app.post('/convert/powerpoint-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (!['.ppt', '.pptx'].includes(ext.toLowerCase())) {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .ppt and .pptx files are supported' });
  }
  convertWithLibreOffice(req.file.path, res, req.file.originalname);
});

app.post('/convert/text-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (!['.txt'].includes(ext.toLowerCase())) {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .txt files are supported' });
  }
  convertWithLibreOffice(req.file.path, res, req.file.originalname);
});

app.post('/convert/html-to-pdf', upload.single('file'), async (req, res) => {
  // Case 1: File Upload
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    if (!['.html', '.htm'].includes(ext.toLowerCase())) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Only .html and .htm files are supported' });
    }
    return convertWithLibreOffice(req.file.path, res, req.file.originalname);
  }

  // Case 2: URL
  if (req.body.url) {
    let tempFilePath;
    try {
      const response = await fetch(req.body.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const htmlContent = await response.text();
      const tempFileName = `${randomBytes(16).toString('hex')}.html`;
      tempFilePath = path.join('uploads', tempFileName);
      await fs.writeFile(tempFilePath, htmlContent);
      return convertWithLibreOffice(tempFilePath, res, 'webpage.html');
    } catch (error) {
      if (tempFilePath) await fs.unlink(tempFilePath).catch(err => console.error("Failed to delete temp file for URL:", err));
      return res.status(500).json({ error: 'Failed to process URL', details: error.message });
    }
  }

  // Case 3: Pasted HTML content
  if (req.body.htmlContent) {
    let tempFilePath;
    try {
      const tempFileName = `${randomBytes(16).toString('hex')}.html`;
      tempFilePath = path.join('uploads', tempFileName);
      await fs.writeFile(tempFilePath, req.body.htmlContent);
      return convertWithLibreOffice(tempFilePath, res, 'pasted-content.html');
    } catch (error) {
      if (tempFilePath) await fs.unlink(tempFilePath).catch(err => console.error("Failed to delete temp file for content:", err));
      return res.status(500).json({ error: 'Failed to process HTML content', details: error.message });
    }
  }

  return res.status(400).json({ error: 'No input provided. Please upload a file, provide a URL, or paste HTML content.' });
});

app.post('/convert/epub-to-pdf', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  let renamedInputPath = null;
  
  try {
    if (!req.file) {
      console.error('[EPUB2PDF] No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    uploadedFilePath = req.file.path;
    const ext = path.extname(req.file.originalname);
    
    if (ext.toLowerCase() !== '.epub') {
      await fs.unlink(uploadedFilePath);
      console.error('[EPUB2PDF] Uploaded file is not .epub');
      return res.status(400).json({ error: 'Only .epub files are supported' });
    }
    console.log('[EPUB2PDF] File received:', req.file.originalname, 'at', uploadedFilePath);

    const inputPath = uploadedFilePath;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(req.file.originalname, ext);
    renamedInputPath = inputPath + '.epub';
    const outputPdf = path.join(outputDir, `${baseName}.pdf`);

    // Rename the uploaded file to have .epub extension
    await fs.rename(inputPath, renamedInputPath);
    console.log('[EPUB2PDF] File renamed to:', renamedInputPath);

    console.log('[EPUB2PDF] Starting Calibre conversion...');
    const calibreProcess = execFile(
      'ebook-convert',
      [renamedInputPath, outputPdf],
      { timeout: 300000 }, // 5 minutes timeout
      async (error, stdout, stderr) => {
        try {
          await fs.unlink(renamedInputPath); // Clean up input file
          if (error) {
            console.error('[EPUB2PDF] Calibre conversion error:', error, stderr);
            return res.status(500).json({ error: 'Conversion failed', details: stderr });
          }
          // Check if output PDF exists
          try {
            await fs.access(outputPdf);
          } catch {
            console.error('[EPUB2PDF] PDF not generated by Calibre.');
            return res.status(500).json({ error: 'PDF not generated by Calibre.' });
          }
          console.log('[EPUB2PDF] Conversion successful, sending PDF:', outputPdf);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
          fsOrig.createReadStream(outputPdf)
            .on('close', async () => {
              await fs.unlink(outputPdf).catch(() => {});
              console.log('[EPUB2PDF] Cleaned up output PDF:', outputPdf);
            })
            .pipe(res);
        } catch (err) {
          console.error('[EPUB2PDF] Error in Calibre callback:', err);
          if (!res.headersSent) res.status(500).json({ error: 'Conversion failed', details: err.message });
        }
      }
    );
  } catch (err) {
    console.error('[EPUB2PDF] Fatal error:', err);
    
    // Clean up any files that might have been created
    if (renamedInputPath) {
      await fs.unlink(renamedInputPath).catch(err => console.error('[EPUB2PDF] Failed to delete renamed input file:', err));
    }
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(err => console.error('[EPUB2PDF] Failed to delete uploaded file:', err));
    }
    
    if (!res.headersSent) res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

app.post('/convert/rtf-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (ext.toLowerCase() !== '.rtf') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .rtf files are supported' });
  }
  convertWithLibreOffice(req.file.path, res, req.file.originalname);
});

app.post('/convert/vector-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (ext.toLowerCase() !== '.svg') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .svg files are supported' });
  }
  convertWithLibreOffice(req.file.path, res, req.file.originalname);
});

// --- Helper function for PDF to Word conversion using Python pdf2docx ---
const convertPdfToWord = async (filePath, res, originalName = 'document.pdf') => {
  try {
    console.log('[PDF2WORD] Starting conversion with Python pdf2docx...');
    console.log('[PDF2WORD] Input file:', filePath);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.docx';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2WORD] Absolute input path:', absoluteInputPath);
    console.log('[PDF2WORD] Absolute output path:', absoluteOutputPath);
    
    // Call Python script with absolute paths and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-word',
      absoluteInputPath,
      absoluteOutputPath
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2WORD] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2WORD] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2WORD] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the DOCX file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2WORD] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2WORD] Conversion successful - DOCX file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2WORD] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2WORD] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2WORD] Python conversion failed with code:', code);
          console.error('[PDF2WORD] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdf2docx') || stderr.includes('No module named')) {
            reject(new Error('PDF to Word conversion requires Python libraries. Please install pdf2docx by running: cd server && source pdf_converter_env/bin/activate && pip install pdf2docx'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2WORD] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2WORD] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to Word conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2WORD] Error in conversion:', error);
    throw error;
  }
};

// --- Helper function for PDF to Excel conversion using Python pdfplumber ---
const convertPdfToExcel = async (filePath, res, originalName = 'document.pdf', pageSelection = 'all') => {
  try {
    console.log('[PDF2EXCEL] Starting conversion with Python pdfplumber...');
    console.log('[PDF2EXCEL] Input file:', filePath);
    console.log('[PDF2EXCEL] Page selection:', pageSelection);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.xlsx';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2EXCEL] Absolute input path:', absoluteInputPath);
    console.log('[PDF2EXCEL] Absolute output path:', absoluteOutputPath);
    
    // Call Python script with absolute paths and page selection
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-excel',
      absoluteInputPath,
      absoluteOutputPath,
      '--page-selection',
      pageSelection
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2EXCEL] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2EXCEL] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2EXCEL] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the Excel file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2EXCEL] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2EXCEL] Conversion successful - Excel file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2EXCEL] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2EXCEL] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2EXCEL] Python conversion failed with code:', code);
          console.error('[PDF2EXCEL] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdfplumber') || stderr.includes('pandas') || stderr.includes('openpyxl') || stderr.includes('No module named')) {
            reject(new Error('PDF to Excel conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pdfplumber pandas openpyxl'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2EXCEL] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2EXCEL] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to Excel conversion timed out. Please try with a smaller file or fewer pages.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2EXCEL] Error in conversion:', error);
    throw error;
  }
};

app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (ext.toLowerCase() !== '.pdf') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .pdf files are supported' });
  }

  let tempFilePath = null;
  try {
    console.log('[PDF2WORD] Processing file:', req.file.originalname);
    
    // Create a stable temp file that won't be cleaned up by multer
    const tempDir = path.join(__dirname, 'temp_pdf');
    await fs.mkdir(tempDir, { recursive: true });
    
    tempFilePath = path.join(tempDir, `temp_${Date.now()}_${path.basename(req.file.originalname)}`);
    
    // Copy the uploaded file to our stable location
    await fs.copyFile(req.file.path, tempFilePath);
    console.log('[PDF2WORD] Copied file to stable location:', tempFilePath);
    
    // Verify the copied file exists
    await fs.access(tempFilePath);
    console.log('[PDF2WORD] Verified temp file exists');
    
    // Now process the stable file
    await convertPdfToWord(tempFilePath, res, req.file.originalname);
    
  } catch (error) {
    console.error('[PDF2WORD] Error processing file:', error);
    res.status(500).json({ error: 'PDF to Word conversion failed', details: error.message });
  } finally {
    // Clean up our temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => console.error("Failed to delete temp file:", err));
    }
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("Failed to delete uploaded file:", err));
  }
});

app.post('/convert/pdf-to-excel', upload.single('file'), async (req, res) => {
  console.log('[PDF2EXCEL] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2EXCEL] File received:', req.file.originalname);
  console.log('[PDF2EXCEL] File path:', req.file.path);
  
  // Get page selection from request body
  const pageSelection = req.body.pageSelection || 'all';
  console.log('[PDF2EXCEL] Page selection:', pageSelection);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2EXCEL] Stable file path:', stableFilePath);
    
    // Convert PDF to Excel with page selection
    await convertPdfToExcel(stableFilePath, res, req.file.originalname, pageSelection);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2EXCEL] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2EXCEL] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to Excel conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2EXCEL] Failed to delete uploaded file:", err));
    console.log('[PDF2EXCEL] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to PowerPoint conversion using Python ---
const convertPdfToPowerPoint = async (filePath, res, originalName = 'document.pdf', conversionType = 'image') => {
  try {
    console.log('[PDF2PPT] Starting conversion with Python...');
    console.log('[PDF2PPT] Input file:', filePath);
    console.log('[PDF2PPT] Conversion type:', conversionType);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.pptx';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2PPT] Absolute input path:', absoluteInputPath);
    console.log('[PDF2PPT] Absolute output path:', absoluteOutputPath);
    
    // Choose conversion method
    const conversionMethod = conversionType === 'text' ? 'pdf-to-powerpoint-text' : 'pdf-to-powerpoint';
    
    // Call Python script with absolute paths and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      conversionMethod,
      absoluteInputPath,
      absoluteOutputPath
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2PPT] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2PPT] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2PPT] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the PowerPoint file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2PPT] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2PPT] Conversion successful - PowerPoint file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2PPT] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2PPT] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2PPT] Python conversion failed with code:', code);
          console.error('[PDF2PPT] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdf2image') || stderr.includes('python-pptx') || stderr.includes('PIL') || stderr.includes('No module named')) {
            reject(new Error('PDF to PowerPoint conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pdf2image python-pptx Pillow'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2PPT] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2PPT] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to PowerPoint conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2PPT] Error in conversion:', error);
    throw error;
  }
};

// PDF to PowerPoint conversion endpoint
app.post('/convert/pdf-to-powerpoint', upload.single('file'), async (req, res) => {
  console.log('[PDF2PPT] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2PPT] File received:', req.file.originalname);
  console.log('[PDF2PPT] File path:', req.file.path);
  
  // Get conversion type from request body (image or text)
  const conversionType = req.body.conversionType || 'image';
  console.log('[PDF2PPT] Conversion type:', conversionType);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2PPT] Stable file path:', stableFilePath);
    
    // Convert PDF to PowerPoint
    await convertPdfToPowerPoint(stableFilePath, res, req.file.originalname, conversionType);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2PPT] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2PPT] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to PowerPoint conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2PPT] Failed to delete uploaded file:", err));
    console.log('[PDF2PPT] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to Text conversion using Python ---
const convertPdfToText = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDF2TEXT] Starting conversion with Python...');
    console.log('[PDF2TEXT] Input file:', filePath);
    console.log('[PDF2TEXT] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.txt';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2TEXT] Absolute input path:', absoluteInputPath);
    console.log('[PDF2TEXT] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with absolute paths and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-text',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2TEXT] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2TEXT] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2TEXT] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the text file
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2TEXT] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2TEXT] Conversion successful - Text file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2TEXT] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2TEXT] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2TEXT] Python conversion failed with code:', code);
          console.error('[PDF2TEXT] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdfplumber') || stderr.includes('No module named')) {
            reject(new Error('PDF to Text conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pdfplumber'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2TEXT] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2TEXT] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to Text conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2TEXT] Error in conversion:', error);
    throw error;
  }
};

// PDF to Text conversion endpoint
app.post('/convert/pdf-to-text', upload.single('file'), async (req, res) => {
  console.log('[PDF2TEXT] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2TEXT] File received:', req.file.originalname);
  console.log('[PDF2TEXT] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    ocr: req.body.ocr === 'true',
    layout: req.body.layout || 'simple'
  };
  console.log('[PDF2TEXT] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2TEXT] Stable file path:', stableFilePath);
    
    // Convert PDF to Text
    await convertPdfToText(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2TEXT] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2TEXT] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to Text conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2TEXT] Failed to delete uploaded file:", err));
    console.log('[PDF2TEXT] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to HTML conversion using Python ---
const convertPdfToHtml = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDF2HTML] Starting conversion with Python...');
    console.log('[PDF2HTML] Input file:', filePath);
    console.log('[PDF2HTML] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.html';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2HTML] Absolute input path:', absoluteInputPath);
    console.log('[PDF2HTML] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with absolute paths and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-html',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2HTML] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2HTML] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2HTML] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the HTML file
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2HTML] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2HTML] Conversion successful - HTML file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2HTML] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2HTML] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2HTML] Python conversion failed with code:', code);
          console.error('[PDF2HTML] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdfplumber') || stderr.includes('pdf2image') || stderr.includes('No module named')) {
            reject(new Error('PDF to HTML conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pdfplumber pdf2image pytesseract'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2HTML] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2HTML] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to HTML conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2HTML] Error in conversion:', error);
    throw error;
  }
};

// PDF to HTML conversion endpoint
app.post('/convert/pdf-to-html', upload.single('file'), async (req, res) => {
  console.log('[PDF2HTML] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2HTML] File received:', req.file.originalname);
  console.log('[PDF2HTML] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    ocr: req.body.ocr === 'true',
    embedImages: req.body.embedImages === 'true',
    responsive: req.body.responsive === 'true'
  };
  console.log('[PDF2HTML] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2HTML] Stable file path:', stableFilePath);
    
    // Convert PDF to HTML
    await convertPdfToHtml(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2HTML] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2HTML] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to HTML conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2HTML] Failed to delete uploaded file:", err));
    console.log('[PDF2HTML] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to EPUB conversion using Python (isolated) ---
const convertPdfToEpub = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDF2EPUB] Starting conversion with Python...');
    console.log('[PDF2EPUB] Input file:', filePath);
    console.log('[PDF2EPUB] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.epub';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2EPUB] Absolute input path:', absoluteInputPath);
    console.log('[PDF2EPUB] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with system Python and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-epub',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2EPUB] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2EPUB] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2EPUB] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the EPUB file
            res.setHeader('Content-Type', 'application/epub+zip');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2EPUB] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2EPUB] Conversion successful - EPUB file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2EPUB] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2EPUB] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2EPUB] Python conversion failed with code:', code);
          console.error('[PDF2EPUB] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pypdf2') || stderr.includes('ebooklib') || stderr.includes('No module named')) {
            reject(new Error('PDF to EPUB conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pypdf2 ebooklib'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2EPUB] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2EPUB] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to EPUB conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2EPUB] Error in conversion:', error);
    throw error;
  }
};

// PDF to EPUB conversion endpoint (isolated)
app.post('/convert/pdf-to-epub', upload.single('file'), async (req, res) => {
  console.log('[PDF2EPUB] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2EPUB] File received:', req.file.originalname);
  console.log('[PDF2EPUB] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    pages_per_chapter: parseInt(req.body.pages_per_chapter) || 10,
    ocr: req.body.ocr === 'true',
    include_images: req.body.include_images !== 'false', // Default to true
    image_quality: req.body.image_quality || 'medium',
    page_break_style: req.body.page_break_style || 'chapter',
    font_size: req.body.font_size || 'medium',
    line_spacing: req.body.line_spacing || 'normal',
    preserve_layout: req.body.preserve_layout === 'true',
    add_toc: req.body.add_toc !== 'false', // Default to true
    custom_title: req.body.custom_title || null,
    custom_author: req.body.custom_author || null
  };
  console.log('[PDF2EPUB] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2EPUB] Stable file path:', stableFilePath);
    
    // Convert PDF to EPUB
    await convertPdfToEpub(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2EPUB] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2EPUB] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to EPUB conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2EPUB] Failed to delete uploaded file:", err));
    console.log('[PDF2EPUB] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to RTF conversion using Python (isolated) ---
const convertPdfToRtf = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDF2RTF] Starting conversion with Python...');
    console.log('[PDF2RTF] Input file:', filePath);
    console.log('[PDF2RTF] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.rtf';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2RTF] Absolute input path:', absoluteInputPath);
    console.log('[PDF2RTF] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with system Python and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-rtf',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2RTF] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2RTF] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2RTF] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the RTF file
            res.setHeader('Content-Type', 'application/rtf');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2RTF] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2RTF] Conversion successful - RTF file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2RTF] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2RTF] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2RTF] Python conversion failed with code:', code);
          console.error('[PDF2RTF] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pypdf2') || stderr.includes('No module named')) {
            reject(new Error('PDF to RTF conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pypdf2'));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2RTF] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2RTF] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to RTF conversion timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2RTF] Error in conversion:', error);
    throw error;
  }
};

// PDF to RTF conversion endpoint (isolated)
app.post('/convert/pdf-to-rtf', upload.single('file'), async (req, res) => {
  console.log('[PDF2RTF] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2RTF] File received:', req.file.originalname);
  console.log('[PDF2RTF] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    page_selection: req.body.page_selection || 'all',
    ocr: req.body.ocr === 'true',
    preserve_formatting: req.body.preserve_formatting !== 'false', // Default to true
    include_images: req.body.include_images === 'true',
    font_size: req.body.font_size || 'medium',
    line_spacing: req.body.line_spacing || 'normal',
    page_breaks: req.body.page_breaks !== 'false', // Default to true
    custom_title: req.body.custom_title || null
  };
  console.log('[PDF2RTF] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2RTF] Stable file path:', stableFilePath);
    
    // Convert PDF to RTF
    await convertPdfToRtf(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2RTF] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2RTF] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to RTF conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2RTF] Failed to delete uploaded file:", err));
    console.log('[PDF2RTF] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to SVG conversion using Python (isolated) ---
const convertPdfToSvg = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDF2SVG] Starting conversion with Python...');
    console.log('[PDF2SVG] Input file:', filePath);
    console.log('[PDF2SVG] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '.svg';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDF2SVG] Absolute input path:', absoluteInputPath);
    console.log('[PDF2SVG] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with system Python and timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'pdf-to-svg',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDF2SVG] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDF2SVG] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDF2SVG] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the SVG file
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDF2SVG] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDF2SVG] Conversion successful - SVG file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDF2SVG] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDF2SVG] Output file not found:', error);
            reject(new Error('Conversion completed but output file not found'));
          }
        } else {
          console.error('[PDF2SVG] Python conversion failed with code:', code);
          console.error('[PDF2SVG] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('pdf2image') || stderr.includes('No module named')) {
            reject(new Error('PDF to SVG conversion requires Python libraries. Please install required packages by running: cd server && source pdf_converter_env/bin/activate && pip install pdf2image'));
          } else if (stderr.includes('Page selection error:')) {
            // Extract the specific page selection error for SVG only
            const errorMatch = stderr.match(/Page selection error: (.+)/);
            const errorMessage = errorMatch ? errorMatch[1] : 'Invalid page selection';
            reject(new Error(errorMessage));
          } else {
            reject(new Error(`Python conversion failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDF2SVG] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDF2SVG] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF to SVG conversion timed out. Please try with a smaller file or fewer pages.'));
      });
    });
    
  } catch (error) {
    console.error('[PDF2SVG] Error in conversion:', error);
    throw error;
  }
};

// PDF to SVG conversion endpoint (isolated)
app.post('/convert/pdf-to-svg', upload.single('file'), async (req, res) => {
  console.log('[PDF2SVG] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2SVG] File received:', req.file.originalname);
  console.log('[PDF2SVG] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    page_selection: req.body.page_selection || 'all',
    dpi: parseInt(req.body.dpi) || 300,
    width: parseInt(req.body.width) || 800,
    height: parseInt(req.body.height) || 600
  };
  console.log('[PDF2SVG] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2SVG] Stable file path:', stableFilePath);
    
    // Convert PDF to SVG
    await convertPdfToSvg(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2SVG] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2SVG] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to SVG conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2SVG] Failed to delete uploaded file:", err));
    console.log('[PDF2SVG] Cleaned up uploaded file');
  }
});

// Manual cleanup endpoint (for debugging/testing)
app.post('/cleanup', async (req, res) => {
  try {
    await cleanupOrphanedFiles();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (error) {
    console.error('[CLEANUP] Manual cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

app.post('/convert/merge-pdf', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: 'Please upload at least two PDF files to merge.' });
  }

  const stableFilePaths = [];
  const originalPaths = [];

  try {
    // Create stable copies of all uploaded files
    for (const file of req.files) {
      // Basic validation
      if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
        throw new Error(`Invalid file type: ${file.originalname}. Only PDFs are allowed.`);
      }
      const stablePath = await createStableFileCopy(file.path, file.originalname);
      stableFilePaths.push(stablePath);
      originalPaths.push(file.path);
    }
    
    const outputFileName = `merged_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, 'temp_pdf', outputFileName);
    
    const pythonScriptPath = path.join(__dirname, 'pdf_converter.py');
    const args = ['merge-pdf', outputPath, ...stableFilePaths];

    console.log(`[MERGE_PDF] Executing Python script: ${pythonScriptPath} with args: ${args.join(' ')}`);

    const pythonProcess = spawn(pythonScriptPath, args, { 
      stdio: 'pipe',
      timeout: 240000 // 4 minutes timeout
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[MERGE_PDF_PY_STDOUT] ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[MERGE_PDF_PY_STDERR] ${data.toString()}`);
    });

    // Handle timeout
    pythonProcess.on('timeout', () => {
      console.error('[MERGE_PDF] Python process timed out after 4 minutes');
      pythonProcess.kill('SIGKILL');
      res.status(500).json({ error: 'PDF merge timed out. Please try with smaller files.' });
      return;
    });

    pythonProcess.on('close', async (code) => {
      console.log(`[MERGE_PDF] Python script exited with code ${code}`);

      if (code === 0) {
        try {
          // Check if the output file was created
          await fs.access(outputPath);
          
          // Send the merged file back to the client
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
          const fileStream = fsOrig.createReadStream(outputPath);
          fileStream.pipe(res);
          
          // Cleanup after sending the file
          fileStream.on('close', async () => {
            console.log('[MERGE_PDF] File sent, starting cleanup.');
            await fs.unlink(outputPath).catch(e => console.error('Failed to delete output file:', e));
          });

        } catch (err) {
          console.error('[MERGE_PDF] Error sending file:', err);
          res.status(500).json({ error: 'Failed to create or send merged file.', details: stderr || stdout });
        }
      } else {
        res.status(500).json({ error: 'PDF merge failed.', details: stderr || stdout });
      }

      // Final cleanup of all stable copies
      for (const p of stableFilePaths) {
        await fs.unlink(p).catch(e => console.error('Failed to delete stable temp file:', e));
      }
    });

  } catch (err) {
    console.error('[MERGE_PDF] Server error:', err);
    res.status(500).json({ error: 'An error occurred during the merge process.', details: err.message });
  } finally {
    // Cleanup original uploaded files from multer
    for (const p of originalPaths) {
      await fs.unlink(p).catch(e => console.error('Failed to delete original upload file:', e));
    }
  }
});

const convertPdfAndZip = async (req, res, conversionType) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (path.extname(req.file.originalname).toLowerCase() !== '.pdf') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only PDF files are supported for this operation.' });
  }

  let stableFilePath;
  try {
    stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    
    const outputFileName = `${path.basename(req.file.originalname, '.pdf')}_${conversionType}_${Date.now()}.zip`;
    const outputPath = path.join(__dirname, 'temp', outputFileName);
    const options = req.body.options ? JSON.parse(req.body.options) : {};

    const pythonScriptPath = path.join(__dirname, 'pdf_converter.py');
    const args = [
      conversionType,
      stableFilePath,
      outputPath,
      '--options',
      JSON.stringify(options)
    ];

    console.log(`[${conversionType}] Executing:`, args.join(' '));

    const pythonProcess = spawn(pythonScriptPath, args, { 
      stdio: 'pipe',
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', data => {
      stdout += data.toString();
      console.log(`[${conversionType}_PY_STDOUT] ${data.toString()}`);
    });
    pythonProcess.stderr.on('data', data => {
      stderr += data.toString();
      console.error(`[${conversionType}_PY_STDERR] ${data.toString()}`);
    });

    // Handle timeout
    pythonProcess.on('timeout', () => {
      console.error(`[${conversionType}] Python process timed out after 4 minutes`);
      pythonProcess.kill('SIGKILL');
      res.status(500).json({ error: `${conversionType} conversion timed out. Please try with a smaller file.` });
      return;
    });

    pythonProcess.on('close', async (code) => {
      console.log(`[${conversionType}] Python script exited with code ${code}`);
      
      if (code === 0) {
        try {
          await fs.access(outputPath);
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
          const fileStream = fsOrig.createReadStream(outputPath);
          fileStream.pipe(res);
          fileStream.on('close', () => {
            fs.unlink(outputPath).catch(e => console.error('Failed to delete output ZIP:', e));
          });
        } catch (err) {
          console.error(`[${conversionType}] Error sending ZIP file:`, err);
          res.status(500).json({ error: 'Failed to create or send ZIP file.', details: stderr || stdout });
        }
      } else {
        res.status(500).json({ error: `Python script failed for ${conversionType}.`, details: stderr || stdout });
      }
      // Cleanup stable file
      fs.unlink(stableFilePath).catch(e => console.error('Failed to delete stable temp file:', e));
    });

  } catch (err) {
    console.error(`[${conversionType}] Server error:`, err);
    res.status(500).json({ error: 'An error occurred on the server.', details: err.message });
    if (stableFilePath) {
      fs.unlink(stableFilePath).catch(e => console.error('Failed to delete stable temp file on error:', e));
    }
  } finally {
    // Cleanup original multer upload
    fs.unlink(req.file.path).catch(e => console.error('Failed to delete original upload file:', e));
  }
};

app.post('/convert/split-pdf', upload.single('file'), (req, res) => {
  convertPdfAndZip(req, res, 'split-pdf');
});

app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const ext = path.extname(req.file.originalname);
  if (ext.toLowerCase() !== '.pdf') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only .pdf files are supported' });
  }

  let tempFilePath = null;
  try {
    console.log('[PDF2WORD] Processing file:', req.file.originalname);
    
    // Create a stable temp file that won't be cleaned up by multer
    const tempDir = path.join(__dirname, 'temp_pdf');
    await fs.mkdir(tempDir, { recursive: true });
    
    tempFilePath = path.join(tempDir, `temp_${Date.now()}_${path.basename(req.file.originalname)}`);
    
    // Copy the uploaded file to our stable location
    await fs.copyFile(req.file.path, tempFilePath);
    console.log('[PDF2WORD] Copied file to stable location:', tempFilePath);
    
    // Verify the copied file exists
    await fs.access(tempFilePath);
    console.log('[PDF2WORD] Verified temp file exists');
    
    // Now process the stable file
    await convertPdfToWord(tempFilePath, res, req.file.originalname);
    
  } catch (error) {
    console.error('[PDF2WORD] Error processing file:', error);
    res.status(500).json({ error: 'PDF to Word conversion failed', details: error.message });
  } finally {
    // Clean up our temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => console.error("Failed to delete temp file:", err));
    }
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("Failed to delete uploaded file:", err));
  }
});

app.post('/convert/pdf-to-excel', upload.single('file'), async (req, res) => {
  console.log('[PDF2EXCEL] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2EXCEL] File received:', req.file.originalname);
  console.log('[PDF2EXCEL] File path:', req.file.path);
  
  // Get page selection from request body
  const pageSelection = req.body.pageSelection || 'all';
  console.log('[PDF2EXCEL] Page selection:', pageSelection);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2EXCEL] Stable file path:', stableFilePath);
    
    // Convert PDF to Excel with page selection
    await convertPdfToExcel(stableFilePath, res, req.file.originalname, pageSelection);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2EXCEL] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2EXCEL] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to Excel conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2EXCEL] Failed to delete uploaded file:", err));
    console.log('[PDF2EXCEL] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to PowerPoint conversion using Python ---
app.post('/convert/pdf-to-powerpoint', upload.single('file'), async (req, res) => {
  console.log('[PDF2PPT] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2PPT] File received:', req.file.originalname);
  console.log('[PDF2PPT] File path:', req.file.path);
  
  // Get conversion type from request body (image or text)
  const conversionType = req.body.conversionType || 'image';
  console.log('[PDF2PPT] Conversion type:', conversionType);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2PPT] Stable file path:', stableFilePath);
    
    // Convert PDF to PowerPoint
    await convertPdfToPowerPoint(stableFilePath, res, req.file.originalname, conversionType);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2PPT] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2PPT] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to PowerPoint conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2PPT] Failed to delete uploaded file:", err));
    console.log('[PDF2PPT] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to Text conversion using Python ---
app.post('/convert/pdf-to-text', upload.single('file'), async (req, res) => {
  console.log('[PDF2TEXT] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2TEXT] File received:', req.file.originalname);
  console.log('[PDF2TEXT] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    ocr: req.body.ocr === 'true',
    layout: req.body.layout || 'simple'
  };
  console.log('[PDF2TEXT] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2TEXT] Stable file path:', stableFilePath);
    
    // Convert PDF to Text
    await convertPdfToText(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2TEXT] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2TEXT] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to Text conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2TEXT] Failed to delete uploaded file:", err));
    console.log('[PDF2TEXT] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to HTML conversion using Python ---
app.post('/convert/pdf-to-html', upload.single('file'), async (req, res) => {
  console.log('[PDF2HTML] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2HTML] File received:', req.file.originalname);
  console.log('[PDF2HTML] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    ocr: req.body.ocr === 'true',
    embedImages: req.body.embedImages === 'true',
    responsive: req.body.responsive === 'true'
  };
  console.log('[PDF2HTML] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2HTML] Stable file path:', stableFilePath);
    
    // Convert PDF to HTML
    await convertPdfToHtml(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2HTML] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2HTML] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to HTML conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2HTML] Failed to delete uploaded file:", err));
    console.log('[PDF2HTML] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to EPUB conversion using Python (isolated) ---
app.post('/convert/pdf-to-epub', upload.single('file'), async (req, res) => {
  console.log('[PDF2EPUB] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2EPUB] File received:', req.file.originalname);
  console.log('[PDF2EPUB] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    pages_per_chapter: parseInt(req.body.pages_per_chapter) || 10,
    ocr: req.body.ocr === 'true',
    include_images: req.body.include_images !== 'false', // Default to true
    image_quality: req.body.image_quality || 'medium',
    page_break_style: req.body.page_break_style || 'chapter',
    font_size: req.body.font_size || 'medium',
    line_spacing: req.body.line_spacing || 'normal',
    preserve_layout: req.body.preserve_layout === 'true',
    add_toc: req.body.add_toc !== 'false', // Default to true
    custom_title: req.body.custom_title || null,
    custom_author: req.body.custom_author || null
  };
  console.log('[PDF2EPUB] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2EPUB] Stable file path:', stableFilePath);
    
    // Convert PDF to EPUB
    await convertPdfToEpub(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2EPUB] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2EPUB] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to EPUB conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2EPUB] Failed to delete uploaded file:", err));
    console.log('[PDF2EPUB] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to RTF conversion using Python (isolated) ---
app.post('/convert/pdf-to-rtf', upload.single('file'), async (req, res) => {
  console.log('[PDF2RTF] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2RTF] File received:', req.file.originalname);
  console.log('[PDF2RTF] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    page_selection: req.body.page_selection || 'all',
    ocr: req.body.ocr === 'true',
    preserve_formatting: req.body.preserve_formatting !== 'false', // Default to true
    include_images: req.body.include_images === 'true',
    font_size: req.body.font_size || 'medium',
    line_spacing: req.body.line_spacing || 'normal',
    page_breaks: req.body.page_breaks !== 'false', // Default to true
    custom_title: req.body.custom_title || null
  };
  console.log('[PDF2RTF] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2RTF] Stable file path:', stableFilePath);
    
    // Convert PDF to RTF
    await convertPdfToRtf(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2RTF] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2RTF] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to RTF conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2RTF] Failed to delete uploaded file:", err));
    console.log('[PDF2RTF] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF to SVG conversion using Python (isolated) ---
app.post('/convert/pdf-to-svg', upload.single('file'), async (req, res) => {
  console.log('[PDF2SVG] Received conversion request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDF2SVG] File received:', req.file.originalname);
  console.log('[PDF2SVG] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    page_selection: req.body.page_selection || 'all',
    dpi: parseInt(req.body.dpi) || 300,
    width: parseInt(req.body.width) || 800,
    height: parseInt(req.body.height) || 600
  };
  console.log('[PDF2SVG] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDF2SVG] Stable file path:', stableFilePath);
    
    // Convert PDF to SVG
    await convertPdfToSvg(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDF2SVG] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDF2SVG] Conversion error:', error);
    res.status(500).json({ 
      error: 'PDF to SVG conversion failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDF2SVG] Failed to delete uploaded file:", err));
    console.log('[PDF2SVG] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF compression using Python ---
const convertPdfCompress = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDFCOMPRESS] Starting compression with Python...');
    console.log('[PDFCOMPRESS] Input file:', filePath);
    console.log('[PDFCOMPRESS] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '_compressed.pdf';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDFCOMPRESS] Absolute input path:', absoluteInputPath);
    console.log('[PDFCOMPRESS] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'compress-pdf',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDFCOMPRESS] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDFCOMPRESS] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDFCOMPRESS] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the compressed PDF file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDFCOMPRESS] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDFCOMPRESS] Compression successful - PDF file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDFCOMPRESS] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDFCOMPRESS] Output file not found:', error);
            reject(new Error('Compression completed but output file not found'));
          }
        } else {
          console.error('[PDFCOMPRESS] Python compression failed with code:', code);
          console.error('[PDFCOMPRESS] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('ghostscript') || stderr.includes('No module named')) {
            reject(new Error('PDF compression requires Ghostscript. Please install it: brew install ghostscript'));
          } else {
            reject(new Error(`Python compression failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDFCOMPRESS] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDFCOMPRESS] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF compression timed out. Please try with a smaller file or different compression settings.'));
      });
    });
    
  } catch (error) {
    console.error('[PDFCOMPRESS] Error in compression:', error);
    throw error;
  }
};

// PDF compression endpoint
app.post('/convert/compress-pdf', upload.single('file'), async (req, res) => {
  console.log('[PDFCOMPRESS] Received compression request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDFCOMPRESS] File received:', req.file.originalname);
  console.log('[PDFCOMPRESS] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    compression_level: req.body.compression_level || 'ebook',
    grayscale: req.body.grayscale === 'true'
  };
  console.log('[PDFCOMPRESS] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDFCOMPRESS] Stable file path:', stableFilePath);
    
    // Compress PDF
    await convertPdfCompress(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDFCOMPRESS] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDFCOMPRESS] Compression error:', error);
    res.status(500).json({ 
      error: 'PDF compression failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDFCOMPRESS] Failed to delete uploaded file:", err));
    console.log('[PDFCOMPRESS] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF protection using Python ---
const convertPdfProtect = async (filePath, res, originalName = 'document.pdf', password = '') => {
  try {
    console.log('[PDFPROTECT] Starting protection with Python...');
    console.log('[PDFPROTECT] Input file:', filePath);
    console.log('[PDFPROTECT] Password length:', password.length);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '_protected.pdf';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDFPROTECT] Absolute input path:', absoluteInputPath);
    console.log('[PDFPROTECT] Absolute output path:', absoluteOutputPath);
    
    // Call Python script with timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'protect-pdf',
      absoluteInputPath,
      absoluteOutputPath,
      '--password',
      password
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDFPROTECT] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDFPROTECT] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDFPROTECT] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the protected PDF file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDFPROTECT] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDFPROTECT] Protection successful - PDF file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDFPROTECT] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDFPROTECT] Output file not found:', error);
            reject(new Error('Protection completed but output file not found'));
          }
        } else {
          console.error('[PDFPROTECT] Python protection failed with code:', code);
          console.error('[PDFPROTECT] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('PyPDF2') || stderr.includes('No module named')) {
            reject(new Error('PDF protection requires PyPDF2. Please install it: pip install PyPDF2'));
          } else {
            reject(new Error(`Python protection failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDFPROTECT] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDFPROTECT] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF protection timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDFPROTECT] Error in protection:', error);
    throw error;
  }
};

// PDF protection endpoint
app.post('/convert/password-protect-pdf', upload.single('file'), async (req, res) => {
  console.log('[PDFPROTECT] Received protection request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDFPROTECT] File received:', req.file.originalname);
  console.log('[PDFPROTECT] File path:', req.file.path);
  
  // Get password from request body
  const password = req.body.password || '';
  console.log('[PDFPROTECT] Password length:', password.length);
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDFPROTECT] Stable file path:', stableFilePath);
    
    // Protect PDF
    await convertPdfProtect(stableFilePath, res, req.file.originalname, password);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDFPROTECT] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDFPROTECT] Protection error:', error);
    res.status(500).json({ 
      error: 'PDF protection failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDFPROTECT] Failed to delete uploaded file:", err));
    console.log('[PDFPROTECT] Cleaned up uploaded file');
  }
});

// --- Helper function for PDF page organization using Python ---
const convertPdfOrganize = async (filePath, res, originalName = 'document.pdf', options = {}) => {
  try {
    console.log('[PDFORGANIZE] Starting page organization with Python...');
    console.log('[PDFORGANIZE] Input file:', filePath);
    console.log('[PDFORGANIZE] Options:', options);
    
    // Use absolute paths
    const absoluteInputPath = path.resolve(filePath);
    const outputFileName = path.basename(originalName, '.pdf') + '_organized.pdf';
    const absoluteOutputPath = path.resolve(uploadsDir, outputFileName);
    
    console.log('[PDFORGANIZE] Absolute input path:', absoluteInputPath);
    console.log('[PDFORGANIZE] Absolute output path:', absoluteOutputPath);
    
    // Prepare options for Python script
    const optionsArg = JSON.stringify(options);
    
    // Call Python script with timeout
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'pdf_converter.py'),
      'reorder-pages',
      absoluteInputPath,
      absoluteOutputPath,
      '--options',
      optionsArg
    ], {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'pdf_converter_env', 'lib', 'python3.11', 'site-packages') },
      timeout: 240000 // 4 minutes timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[PDFORGANIZE] Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[PDFORGANIZE] Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log('[PDFORGANIZE] Python process exited with code:', code);
        
        if (code === 0) {
          try {
            // Check if output file exists
            await fs.access(absoluteOutputPath);
            
            // Send the organized PDF file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(absoluteOutputPath, (err) => {
              if (err) {
                console.error('[PDFORGANIZE] Error sending file:', err);
                reject(err);
              } else {
                console.log('[PDFORGANIZE] Page organization successful - PDF file sent');
                // Clean up the output file after sending
                fs.unlink(absoluteOutputPath).catch(err => console.error("[PDFORGANIZE] Failed to delete output file:", err));
                resolve();
              }
            });
          } catch (error) {
            console.error('[PDFORGANIZE] Output file not found:', error);
            reject(new Error('Page organization completed but output file not found'));
          }
        } else {
          console.error('[PDFORGANIZE] Python page organization failed with code:', code);
          console.error('[PDFORGANIZE] stderr:', stderr);
          
          // Check if it's a missing library error
          if (stderr.includes('PyPDF2') || stderr.includes('No module named')) {
            reject(new Error('PDF page organization requires PyPDF2. Please install it: pip install PyPDF2'));
          } else {
            reject(new Error(`Python page organization failed: ${stderr}`));
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('[PDFORGANIZE] Failed to start Python process:', error);
        reject(error);
      });
      
      // Handle timeout
      pythonProcess.on('timeout', () => {
        console.error('[PDFORGANIZE] Python process timed out after 4 minutes');
        pythonProcess.kill('SIGKILL');
        reject(new Error('PDF page organization timed out. Please try with a smaller file.'));
      });
    });
    
  } catch (error) {
    console.error('[PDFORGANIZE] Error in page organization:', error);
    throw error;
  }
};

// PDF page organization endpoint
app.post('/convert/reorder-pages-pdf', upload.single('file'), async (req, res) => {
  console.log('[PDFORGANIZE] Received page organization request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('[PDFORGANIZE] File received:', req.file.originalname);
  console.log('[PDFORGANIZE] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    page_order: req.body.page_order || '',
    rotate_pages: req.body.rotate_pages || '',
    delete_pages: req.body.delete_pages || ''
  };
  console.log('[PDFORGANIZE] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[PDFORGANIZE] Stable file path:', stableFilePath);
    
    // Organize PDF pages
    await convertPdfOrganize(stableFilePath, res, req.file.originalname, options);
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[PDFORGANIZE] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[PDFORGANIZE] Page organization error:', error);
    res.status(500).json({ 
      error: 'PDF page organization failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[PDFORGANIZE] Failed to delete uploaded file:", err));
    console.log('[PDFORGANIZE] Cleaned up uploaded file');
  }
});

app.post('/convert/ocr-pdf', upload.single('file'), async (req, res) => {
  console.log('[OCR_PDF] Received OCR request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  if (path.extname(req.file.originalname).toLowerCase() !== '.pdf') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ error: 'Only PDF files are supported for this operation.' });
  }
  
  console.log('[OCR_PDF] File received:', req.file.originalname);
  console.log('[OCR_PDF] File path:', req.file.path);
  
  // Get options from request body
  const options = {
    language: req.body.language || 'eng',
    confidence: parseFloat(req.body.confidence) || 0.7,
    preserve_layout: req.body.preserve_layout === 'true',
    extract_images: req.body.extract_images === 'true'
  };
  console.log('[OCR_PDF] Options:', options);
  
  try {
    // Create a stable copy of the uploaded file
    const stableFilePath = await createStableFileCopy(req.file.path, req.file.originalname);
    console.log('[OCR_PDF] Stable file path:', stableFilePath);
    
    const outputFileName = `ocr_${path.basename(req.file.originalname, '.pdf')}_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, 'temp_pdf', outputFileName);
    
    const result = await performOcrConversion(stableFilePath, outputPath, options);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      const fileStream = fsOrig.createReadStream(outputPath);
      fileStream.pipe(res);
      fileStream.on('close', () => {
        fs.unlink(outputPath).catch(e => console.error('Failed to delete output file:', e));
      });
    } else {
      res.status(400).json({ error: result.error });
    }
    
    // Clean up the stable copy
    await fs.unlink(stableFilePath);
    console.log('[OCR_PDF] Cleaned up stable file copy');
    
  } catch (error) {
    console.error('[OCR_PDF] OCR error:', error);
    res.status(500).json({ 
      error: 'PDF OCR failed', 
      details: error.message 
    });
  } finally {
    // Clean up the original uploaded file
    await fs.unlink(req.file.path).catch(err => console.error("[OCR_PDF] Failed to delete uploaded file:", err));
    console.log('[OCR_PDF] Cleaned up uploaded file');
  }
});

app.post('/api/organize-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputPath = req.file.path;
        const outputPath = path.join(tempDir, `organized_${Date.now()}.pdf`);
        
        const pageOperations = {
            page_order: req.body.page_order || '',
            rotate_pages: req.body.rotate_pages || '',
            delete_pages: req.body.delete_pages || ''
        };

        console.log('Organize PDF request:', {
            inputPath,
            outputPath,
            pageOperations
        });

        const result = await organizePdfPages(inputPath, outputPath, pageOperations);
        
        if (result.success) {
            res.download(outputPath, 'organized.pdf', (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
                // Clean up temp files
                fs.unlink(inputPath, () => {});
                fs.unlink(outputPath, () => {});
            });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Organize PDF error:', error);
        res.status(500).json({ error: 'Failed to organize PDF' });
    }
});

app.post('/api/get-pdf-page-count', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputPath = req.file.path;
        
        console.log('Get PDF page count request:', inputPath);

        const result = await getPdfPageCount(inputPath);
        
        // Clean up uploaded file
        fs.unlink(inputPath, () => {});
        
        if (result.success) {
            res.json({ pageCount: result.pageCount });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Get PDF page count error:', error);
        res.status(500).json({ error: 'Failed to get PDF page count' });
    }
});

// OCR PDF endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
    let inputPath = null;
    let outputPath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { conversionType, options } = req.body;
        
        if (conversionType === 'ocr-pdf') {
            console.log('[OCR] Received OCR request for file:', req.file.originalname);
            
            inputPath = req.file.path;
            outputPath = path.join(tempDir, `ocr_${Date.now()}.pdf`);
            
            console.log('[OCR] Processing with options:', options);
            
            const result = await performOcrConversion(inputPath, outputPath, options);
            
            if (result.success) {
                res.download(outputPath, `ocr_${req.file.originalname}`, (err) => {
                    if (err) {
                        console.error('[OCR] Download error:', err);
                    }
                    // Clean up temp files
                    if (inputPath) fs.unlink(inputPath, () => {});
                    if (outputPath) fs.unlink(outputPath, () => {});
                });
            } else {
                res.status(400).json({ error: result.error });
            }
        } else {
            res.status(400).json({ error: 'Unsupported conversion type' });
        }
    } catch (error) {
        console.error('[OCR] Error:', error);
        res.status(500).json({ error: 'OCR processing failed' });
    } finally {
        // Clean up temp files in case of error
        if (inputPath) {
            await fs.unlink(inputPath).catch(err => console.error('[OCR] Failed to delete input file:', err));
        }
        if (outputPath) {
            await fs.unlink(outputPath).catch(err => console.error('[OCR] Failed to delete output file:', err));
        }
    }
});

async function performOcrConversion(inputPath, outputPath, options) {
    return new Promise((resolve) => {
        const optionsJson = JSON.stringify(options || {});
        const pythonProcess = spawn('python3', ['pdf_converter.py', 'ocr-pdf', inputPath, outputPath, '--options', optionsJson], {
            timeout: 300000 // 5 minutes timeout for OCR
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                const errorMessage = errorOutput || output || 'OCR processing failed';
                resolve({ success: false, error: errorMessage });
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('[OCR] Failed to start Python process:', error);
            resolve({ success: false, error: 'Failed to start OCR process' });
        });
        
        pythonProcess.on('timeout', () => {
            console.error('[OCR] Python process timed out after 5 minutes');
            pythonProcess.kill('SIGKILL');
            resolve({ success: false, error: 'OCR processing timed out. Please try with a smaller file or different settings.' });
        });
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    cors_origin: process.env.CORS_ORIGIN || 'default'
  });
});

app.listen(port, () => {
  console.log(`PDF Converter backend running on http://localhost:${port}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || 'default'}`);
}); 

async function organizePdfPages(inputPath, outputPath, pageOperations) {
    return new Promise((resolve) => {
        const pythonProcess = spawn('python3', ['pdf_converter.py', 'organize_pdf', inputPath, outputPath], {
            timeout: 240000 // 4 minutes timeout
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                // Check if it's a validation error
                if (output.includes('Validation error:') || output.includes('Validation errors:')) {
                    const errorMatch = output.match(/Validation error[s]?: (.+)/);
                    const errorMessage = errorMatch ? errorMatch[1].trim() : 'Validation failed';
                    resolve({ success: false, error: errorMessage });
                } else {
                    const errorMessage = errorOutput || output || 'Failed to organize PDF';
                    resolve({ success: false, error: errorMessage });
                }
            }
        });
        
        // Send page operations as JSON to stdin
        pythonProcess.stdin.write(JSON.stringify(pageOperations));
        pythonProcess.stdin.end();
        
        pythonProcess.on('timeout', () => {
            console.error('[ORGANIZE] Python process timed out after 4 minutes');
            pythonProcess.kill('SIGKILL');
            resolve({ success: false, error: 'PDF organization timed out. Please try with a smaller file.' });
        });
    });
}

async function getPdfPageCount(inputPath) {
    return new Promise((resolve) => {
        const pythonProcess = spawn('python3', ['pdf_converter.py', 'get_page_count', inputPath], {
            timeout: 60000 // 1 minute timeout for page count
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const pageCount = parseInt(output.trim());
                    if (isNaN(pageCount) || pageCount <= 0) {
                        resolve({ success: false, error: 'Invalid page count returned' });
                    } else {
                        resolve({ success: true, pageCount });
                    }
                } catch (error) {
                    resolve({ success: false, error: 'Failed to parse page count' });
                }
            } else {
                const errorMessage = errorOutput || output || 'Failed to get page count';
                resolve({ success: false, error: errorMessage });
            }
        });
        
        pythonProcess.on('timeout', () => {
            console.error('[PAGE_COUNT] Python process timed out after 1 minute');
            pythonProcess.kill('SIGKILL');
            resolve({ success: false, error: 'Page count retrieval timed out. Please try with a smaller file.' });
        });
    });
}