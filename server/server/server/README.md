# PDF Conversion Server Setup Guide

This server provides PDF conversion capabilities using LibreOffice in headless mode for various file formats including Word, Excel, and PowerPoint documents. It also supports converting PDFs to other formats using Python libraries including RTF, EPUB, HTML, and Text formats.

## Prerequisites

- Node.js (v14 or higher)
- LibreOffice installed on your system
- Python 3.7+ (for PDF to Word, Excel, PowerPoint, RTF, EPUB, HTML, Text conversions)
- pip (Python package manager)
- Tesseract OCR (for OCR-based conversions)
- Poppler-utils (for image-based conversions)
- **Ghostscript** (for PDF compression feature)

## 🔧 Installing Ghostscript (Required for PDF Compression)

**What is Ghostscript?** Ghostscript is a special command-line tool that helps compress PDF files to make them smaller. It's like a magic shrinker for PDFs! It's not a Python library - it's a system application that our Python script calls.

### For macOS 🍎

1. Open **Terminal** (press `Cmd + Space`, type "Terminal", press Enter)
2. Copy and paste this command:
   ```bash
   brew install ghostscript
   ```
3. Press Enter and wait for it to finish
4. Test if it worked by typing: `gs --version`
   - You should see something like: `GPL Ghostscript 10.05.1`

### For Windows 🪟

1. **Option 1 - Using Chocolatey (Easiest):**
   - Open **Command Prompt** as Administrator
   - Type: `choco install ghostscript`
   - Press Enter and wait for it to finish

2. **Option 2 - Manual Download:**
   - Go to [Ghostscript Downloads](https://www.ghostscript.com/releases/gsdnld.html)
   - Download the Windows version (choose 64-bit if you have a modern computer)
   - Run the installer and follow the instructions
   - Add Ghostscript to your PATH (the installer usually does this automatically)

3. **Test if it worked:**
   - Open Command Prompt
   - Type: `gs --version`
   - You should see the version number

### For Linux VPS/Server 🌐

1. **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ghostscript
   ```

2. **CentOS/RHEL/Fedora:**
   ```bash
   # CentOS/RHEL 7/8
   sudo yum install ghostscript
   
   # CentOS/RHEL 9/Fedora
   sudo dnf install ghostscript
   ```

3. **Amazon Linux:**
   ```bash
   sudo yum install ghostscript
   ```

4. **Alpine Linux:**
   ```bash
   apk add ghostscript
   ```

5. **Test if it worked:**
   ```bash
   gs --version
   ```

### For Docker Users 🐳

If you're using Docker to run the server, add this to your Dockerfile:

**For Ubuntu/Debian based images:**
```dockerfile
RUN apt-get update && apt-get install -y ghostscript
```

**For Alpine based images:**
```dockerfile
RUN apk add ghostscript
```

### Testing Ghostscript Installation

After installation, test if Ghostscript works:

```bash
# Check version
gs --version

# Test basic functionality
gs -h
```

If you see version information and help text, Ghostscript is working correctly!

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Set up Python virtual environment:
```bash
python3 -m venv pdf_converter_env
source pdf_converter_env/bin/activate  # On Windows: pdf_converter_env\Scripts\activate
```

3. Install Python packages for all PDF conversions:
```bash
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl pdf2docx fpdf2 PyPDF2 ebooklib pytesseract
```

4. Start the server:
```bash
node server.js
```

The server will run on `http://localhost:5001` by default.

## PDF to PowerPoint Conversion Setup

### Required Python Packages
```bash
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl
```

### System Dependencies

#### macOS
```bash
# Install poppler for pdf2image
brew install poppler

# Verify installation
which pdftoppm
```

#### Ubuntu/Debian Linux
```bash
# Install poppler-utils
sudo apt update
sudo apt install poppler-utils

# Verify installation
which pdftoppm
```

#### CentOS/RHEL/Fedora
```bash
# Install poppler-utils
sudo yum install poppler-utils  # CentOS/RHEL
# OR
sudo dnf install poppler-utils  # Fedora

# Verify installation
which pdftoppm
```

#### Windows
```bash
# Option 1: Use text-based conversion (no poppler needed)
# This works without additional system dependencies

# Option 2: Install poppler binaries manually
# Download from: https://github.com/oschwartz10612/poppler-windows/releases
# Extract to C:\poppler and add to PATH
```

### Conversion Methods

#### 1. Image-based Conversion (Recommended)
- **Quality**: High - preserves original layout and formatting
- **File Size**: Larger - each page becomes an image
- **Requirements**: `pdf2image`, `python-pptx`, `poppler`
- **Best For**: Presentations, documents with complex layouts

#### 2. Text-based Conversion
- **Quality**: Medium - extracts text content
- **File Size**: Smaller - creates editable text slides
- **Requirements**: `pdfplumber`, `python-pptx`
- **Best For**: Text-heavy documents, when you need editable content

### Testing PDF to PowerPoint Conversion

1. **Test Python packages:**
```bash
python3 -c "from pdf2image import convert_from_path; from pptx import Presentation; from PIL import Image; print('All imports successful!')"
```

2. **Test poppler installation:**
```bash
pdftoppm -h
```

3. **Test conversion manually:**
```bash
# Create a test PDF or use an existing one
python3 pdf_converter.py pdf-to-powerpoint test.pdf output.pptx
```

## LibreOffice Installation & Path Configuration

### macOS

1. **Install LibreOffice:**
   - Download from [LibreOffice.org](https://www.libreoffice.org/download/download/)
   - Or install via Homebrew: `brew install --cask libreoffice`

2. **Default Path:**
   ```javascript
   const libreOfficePath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
   ```

3. **Verify Installation:**
   ```bash
   /Applications/LibreOffice.app/Contents/MacOS/soffice --version
   ```

4. **Alternative Paths (if different):**
   ```bash
   # Check if LibreOffice is in Applications
   ls /Applications/ | grep -i libreoffice
   
   # Or check if installed via Homebrew
   which soffice
   ```

### Windows

1. **Install LibreOffice:**
   - Download from [LibreOffice.org](https://www.libreoffice.org/download/download/)
   - Run the installer and note the installation directory

2. **Default Paths:**
   ```javascript
   // 64-bit Windows
   const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
   
   // 32-bit Windows (if installed in Program Files (x86))
   const libreOfficePath = 'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe';
   ```

3. **Find Your Installation Path:**
   ```cmd
   # Search for soffice.exe
   dir /s /b "C:\Program Files\LibreOffice\program\soffice.exe"
   dir /s /b "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
   ```

4. **Add to PATH (Optional):**
   - Add `C:\Program Files\LibreOffice\program\` to your system PATH
   - Then you can use: `const libreOfficePath = 'soffice';`

### Linux VPS/Server

1. **Install LibreOffice (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install libreoffice
   ```

2. **Install LibreOffice (CentOS/RHEL/Fedora):**
   ```bash
   # CentOS/RHEL
   sudo yum install libreoffice
   
   # Fedora
   sudo dnf install libreoffice
   ```

3. **Default Path:**
   ```javascript
   const libreOfficePath = 'libreoffice';
   ```

4. **Verify Installation:**
   ```bash
   libreoffice --version
   which libreoffice
   ```

5. **Install Headless Dependencies (Important for VPS):**
   ```bash
   # Ubuntu/Debian
   sudo apt install libreoffice-writer libreoffice-calc libreoffice-impress
   
   # CentOS/RHEL
   sudo yum install libreoffice-writer libreoffice-calc libreoffice-impress
   ```

6. **For Docker/Containerized Environments:**
   ```dockerfile
   # Add to your Dockerfile
   RUN apt-get update && apt-get install -y \
       libreoffice \
       libreoffice-writer \
       libreoffice-calc \
       libreoffice-impress \
       && rm -rf /var/lib/apt/lists/*
   ```

## Configuration in server.js

Update the `libreOfficePath` variable in `server.js` based on your operating system:

```javascript
// macOS
const libreOfficePath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';

// Windows
const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

// Linux
const libreOfficePath = 'libreoffice';
```

## Troubleshooting

### Common Issues

1. **"spawn libreoffice ENOENT" Error:**
   - Verify LibreOffice is installed
   - Check the path is correct
   - Ensure the executable has proper permissions

2. **Permission Denied:**
   ```bash
   # Linux/macOS
   chmod +x /path/to/soffice
   
   # Windows - Run as Administrator
   ```

3. **Headless Mode Issues on VPS:**
   ```bash
   # Install additional dependencies
   sudo apt install xvfb
   
   # Or use virtual display
   xvfb-run libreoffice --headless --convert-to pdf file.docx
   ```

4. **Memory Issues on VPS:**
   ```bash
   # Increase swap space if needed
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### PDF to PowerPoint Specific Issues

1. **"poppler not found" Error:**
   ```bash
   # macOS
   brew install poppler
   
   # Ubuntu/Debian
   sudo apt install poppler-utils
   
   # CentOS/RHEL
   sudo yum install poppler-utils
   ```

2. **"pdf2image import error":**
   ```bash
   # Reinstall pdf2image
   pip uninstall pdf2image
   pip install pdf2image
   
   # Or use text-based conversion instead
   ```

3. **"python-pptx not found":**
   ```bash
   pip install python-pptx
   ```

4. **"PIL/Pillow not found":**
   ```bash
   pip install Pillow
   ```

5. **Conversion fails silently:**
   ```bash
   # Check Python environment
   source pdf_converter_env/bin/activate
   
   # Test conversion manually
   python3 pdf_converter.py pdf-to-powerpoint test.pdf output.pptx
   ```

6. **Large files timeout:**
   - Increase server timeout settings
   - Use text-based conversion for large files
   - Consider splitting large PDFs first

### Testing LibreOffice Installation

Test if LibreOffice works correctly:

```bash
# Create a test file
echo "Hello World" > test.txt

# Convert to PDF
libreoffice --headless --convert-to pdf test.txt

# Check if PDF was created
ls -la test.pdf
```

## API Endpoints

- `POST /convert/word-to-pdf` - Convert Word documents to PDF
- `POST /convert/excel-to-pdf` - Convert Excel files to PDF
- `POST /convert/powerpoint-to-pdf` - Convert PowerPoint presentations to PDF
- `POST /convert/text-to-pdf` - Convert text files to PDF
- `POST /convert/html-to-pdf` - Convert HTML files to PDF
- `POST /convert/pdf-to-word` - Convert PDF to Word documents
- `POST /convert/pdf-to-excel` - Convert PDF to Excel spreadsheets
- `POST /convert/pdf-to-powerpoint` - Convert PDF to PowerPoint presentations

## Manual Cleanup Process

The server includes an automatic cleanup system that runs every 15 minutes to remove old temporary files, but you can also trigger manual cleanup when needed.

### Automatic Cleanup System

The server automatically cleans up:
- **Uploaded files** older than 30 minutes in the `uploads/` directory
- **Temporary files** older than 30 minutes in the `temp_pdf/` directory  
- **Temporary files** older than 30 minutes in the `temp/` directory

### Manual Cleanup Endpoint

You can trigger manual cleanup using the cleanup endpoint:

```bash
# Trigger manual cleanup via curl
curl -X POST http://localhost:5001/cleanup

# Or using any HTTP client
POST http://localhost:5001/cleanup
```

**Response:**
```json
{
  "message": "Cleanup completed successfully"
}
```

### Manual File Cleanup Commands

If you need to manually clean up files from the command line:

#### Clean up uploads directory:
```bash
# Remove all files in uploads directory
rm -rf server/uploads/*

# Remove files older than 1 hour
find server/uploads/ -type f -mmin +60 -delete
```

#### Clean up temp directories:
```bash
# Remove all files in temp_pdf directory
rm -rf server/temp_pdf/*

# Remove all files in temp directory
rm -rf server/temp/*

# Remove files older than 1 hour from both directories
find server/temp_pdf/ -type f -mmin +60 -delete
find server/temp/ -type f -mmin +60 -delete
```

#### Clean up all temporary files at once:
```bash
# Remove all temporary files from all directories
rm -rf server/uploads/* server/temp_pdf/* server/temp/*
```

### Cleanup Monitoring

You can monitor cleanup activities in the server console:

```bash
# Start the server and watch for cleanup logs
npm start

# Look for cleanup messages like:
# [CLEANUP] Removed old upload file: filename.pdf
# [CLEANUP] Removed old temp file: temp_filename.pdf
```

### Cleanup Configuration

The automatic cleanup system can be configured by modifying these values in `server.js`:

```javascript
// Cleanup interval (currently 15 minutes)
setInterval(cleanupOrphanedFiles, 15 * 60 * 1000);

// File age threshold (currently 30 minutes)
const maxAge = 30 * 60 * 1000; // 30 minutes
```

### Troubleshooting Cleanup Issues

#### Problem: Files not being cleaned up
**Solutions:**
1. Check if the server is running the automatic cleanup
2. Verify file permissions in the directories
3. Check server logs for cleanup errors
4. Trigger manual cleanup via the endpoint

#### Problem: Cleanup endpoint not responding
**Solutions:**
1. Ensure the server is running
2. Check if the endpoint is accessible at `http://localhost:5001/cleanup`
3. Verify there are no firewall issues
4. Check server logs for errors

#### Problem: Disk space still filling up
**Solutions:**
1. Check for files outside the monitored directories
2. Verify the cleanup function is working
3. Consider reducing the cleanup interval
4. Manually clean up files using command line tools

### Production Cleanup Recommendations

For production environments:

1. **Set up monitoring** for disk space usage
2. **Configure log rotation** to prevent log files from growing too large
3. **Set up alerts** for when disk space is low
4. **Regular manual cleanup** during maintenance windows
5. **Monitor cleanup logs** for any issues

### Cleanup Safety Features

The cleanup system includes several safety features:
- **Error handling**: Continues operation even if individual file deletions fail
- **Graceful degradation**: Handles missing directories without crashing
- **Logging**: Records all cleanup activities for monitoring
- **Non-blocking**: Cleanup doesn't interfere with ongoing conversions

## File Upload Limits

- Maximum file size: 50MB
- Supported formats: .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .jpg, .jpeg, .png, .gif, .bmp

## Security Notes

- The server creates temporary files in the `uploads/` directory
- Consider implementing file cleanup mechanisms for production use
- Ensure proper CORS configuration for your frontend domain 

# 📚 EPUB to PDF Conversion with Calibre (Kid-Friendly Server Guide)

## What is Calibre?
Calibre is a free program that helps turn eBooks (like `.epub` files) into PDFs. We use it on the server to do the magic!

## How to Set Up Calibre for EPUB to PDF

### 🐧 On Linux VPS (like Ubuntu)
1. **Open your terminal.**
2. Type this and press Enter:
   ```sh
   sudo apt update
   sudo apt install calibre
   ```
   Or, if that doesn't work, try:
   ```sh
   sudo -v && wget -nv -O- https://download.calibre-ebook.com/linux-installer.sh | sudo sh /dev/stdin
   ```
3. To check if it worked, type:
   ```sh
   ebook-convert --version
   ```
   If you see a version number, you're good!
4. **You do NOT need the full path** in your code if this works. Just use `'ebook-convert'`.
5. If you want to be sure, type:
   ```sh
   which ebook-convert
   ```
   If it prints something like `/usr/bin/ebook-convert`, you're all set!

### 🍏 On Mac
1. **Go to** [https://calibre-ebook.com/download](https://calibre-ebook.com/download)
2. Download and install Calibre like any other app.
3. In your server code, use this path:
   ```
   /Applications/calibre.app/Contents/MacOS/ebook-convert
   ```
4. To check, open Terminal and type:
   ```sh
   /Applications/calibre.app/Contents/MacOS/ebook-convert --version
   ```
   If you see a version number, it works!

### 🪟 On Windows
1. **Go to** [https://calibre-ebook.com/download](https://calibre-ebook.com/download)
2. Download and install Calibre (just click Next, Next, Next...)
3. Find where Calibre is installed. Usually it's:
   ```
   C:\Program Files\Calibre2\ebook-convert.exe
   ```
4. In your server code, use that full path for `ebook-convert.exe`.
5. To check, open Command Prompt and type:
   ```sh
   "C:\Program Files\Calibre2\ebook-convert.exe" --version
   ```
   If you see a version number, it works!

---

## If You Get Stuck
- Make sure the file you upload ends with `.epub`.
- If you see an error, read the message. It usually tells you what went wrong.
- Ask an adult for help if you need it. 😊

---

Happy converting! 🚀

# 📄 PDF to Word Conversion Setup Guide

## What is PDF to Word Conversion?

This feature converts PDF files back into Word documents (.docx format) using Python libraries. It can extract text, tables, and images from PDFs!

## Required Python Libraries

The PDF to Word conversion uses these Python libraries:
- `pdf2docx` - Extracts text and tables from PDFs
- `fpdf2` - Handles PDF processing
- `python-docx` - Creates Word documents

## How to Set Up PDF to Word Conversion

### For Linux VPS (Ubuntu/Debian)

#### Step 1: Install Python and pip
```bash
# Update your system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install python3 python3-pip python3-venv
```

#### Step 2: Create Python Virtual Environment
```bash
# Go to your server folder
cd server

# Create a virtual environment
python3 -m venv pdf_converter_env

# Activate the environment
source pdf_converter_env/bin/activate
```

#### Step 3: Install Required Python Packages
```bash
# Install the required libraries
pip install pdf2docx fpdf2 python-docx

# Or install from requirements.txt if you have one
pip install -r requirements.txt
```

#### Step 4: Test the Installation
```bash
# Test if the libraries work
python3 -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 5: Start Your Server
```bash
# Make sure you're in the server folder and environment is activated
cd server
source pdf_converter_env/bin/activate
npm start
```

🎉 **PDF to Word conversion is now ready on your VPS!**

### For macOS Laptop

#### Step 1: Install Python (if not already installed)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python
```

#### Step 2: Create Python Virtual Environment
```bash
# Go to your server folder
cd server

# Create a virtual environment
python3 -m venv pdf_converter_env

# Activate the environment
source pdf_converter_env/bin/activate
```

#### Step 3: Install Required Python Packages
```bash
# Install the required libraries
pip install pdf2docx fpdf2 python-docx
```

#### Step 4: Test the Installation
```bash
# Test if the libraries work
python3 -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 5: Start Your Server
```bash
# Make sure you're in the server folder and environment is activated
cd server
source pdf_converter_env/bin/activate
npm start
```

🎉 **PDF to Word conversion is now ready on your Mac!**

### For Windows Laptop

#### Step 1: Install Python (if not already installed)
1. Go to https://python.org/
2. Download Python 3.x (latest version)
3. Run the installer
4. **Important**: Check "Add Python to PATH" during installation

#### Step 2: Open Command Prompt
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Navigate to your project folder

#### Step 3: Create Python Virtual Environment
```cmd
# Go to your server folder
cd server

# Create a virtual environment
python -m venv pdf_converter_env

# Activate the environment
pdf_converter_env\Scripts\activate
```

#### Step 4: Install Required Python Packages
```cmd
# Install the required libraries
pip install pdf2docx fpdf2 python-docx
```

#### Step 5: Test the Installation
```cmd
# Test if the libraries work
python -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 6: Start Your Server
```cmd
# Make sure you're in the server folder and environment is activated
cd server
pdf_converter_env\Scripts\activate
npm start
```

🎉 **PDF to Word conversion is now ready on your Windows laptop!**

## How to Use PDF to Word Conversion

1. **Upload a PDF file** through the web interface
2. **Select "PDF to Word"** conversion option
3. **Click "Convert"**
4. **Download the .docx file** when conversion is complete

## Troubleshooting PDF to Word Conversion

### Problem: "Module not found" error
**Solution**: Make sure you activated the Python environment:
```bash
# Windows
pdf_converter_env\Scripts\activate

# macOS/Linux
source pdf_converter_env/bin/activate
```

### Problem: "Permission denied" error
**Solution**: Make sure you have write permissions in the server folder

### Problem: Conversion fails
**Solution**: 
1. Check if the PDF file is not corrupted
2. Make sure the PDF is not password-protected
3. Check the server console for error messages

### Problem: Tables not converting properly
**Solution**: Complex tables might not convert perfectly. Simple tables work best.

## What the PDF to Word Conversion Does

- ✅ **Extracts text** from PDF pages
- ✅ **Converts tables** to Word table format
- ✅ **Preserves basic formatting** (bold, italic, etc.)
- ✅ **Handles multiple pages**
- ⚠️ **Limited image support** (basic images only)
- ⚠️ **Complex layouts** may not convert perfectly

## Security Notes

- PDF files are processed temporarily and deleted after conversion
- No files are stored permanently on the server
- The conversion happens in a Python virtual environment for isolation

Happy PDF to Word converting! 📄➡️📝 

# Advanced PDF Conversion Features

## PDF to RTF (Rich Text Format) Conversion

Convert PDFs to RTF format with advanced formatting and image support.

### Features:
- **Page Selection**: Convert specific pages or all pages
- **Formatting Preservation**: Maintain original text formatting
- **Image Inclusion**: Embed images from PDF into RTF
- **Font Size Control**: Small, medium, or large text
- **Line Spacing**: Single, normal, or double spacing
- **Page Breaks**: Add page breaks between PDF pages
- **Custom Title**: Add a custom document title

### Required Python Packages:
```bash
pip install PyPDF2 Pillow pdf2image pytesseract
```

### System Dependencies:
- **Tesseract OCR**: For OCR support on image-based PDFs
- **Poppler-utils**: For better image handling

### Testing:
```bash
python pdf_converter.py pdf-to-rtf sample.pdf output.rtf --options '{"include_images": true, "font_size": "medium"}'
```

## PDF to EPUB (E-Book Format) Conversion

Convert PDFs to EPUB e-books with comprehensive formatting options.

### Features:
- **Page Selection**: Convert specific pages or all pages
- **Pages per Chapter**: Control chapter length
- **Image Options**: Include/exclude images with quality control
- **Page Break Style**: Choose between page breaks or continuous text
- **Font Size**: Adjust text size for better reading
- **Line Spacing**: Control line spacing for readability
- **Layout Preservation**: Maintain original document structure
- **Table of Contents**: Generate automatic TOC
- **Custom Metadata**: Add title, author, and description

### Required Python Packages:
```bash
pip install PyPDF2 ebooklib pdf2image pytesseract
```

### Testing:
```bash
python pdf_converter.py pdf-to-epub sample.pdf output.epub --options '{"pages_per_chapter": 5, "include_images": true}'
```

## PDF to HTML (Web Format) Conversion

Convert PDFs to HTML web pages with styling and formatting.

### Features:
- **Page Selection**: Convert specific pages or all pages
- **CSS Styling**: Include custom CSS for better appearance
- **Image Handling**: Embed or link images
- **Text Extraction**: Extract and format text content
- **Layout Options**: Preserve or simplify document layout

### Required Python Packages:
```bash
pip install PyPDF2 pdf2image pytesseract
```

### Testing:
```bash
python pdf_converter.py pdf-to-html sample.pdf output.html --options '{"include_css": true}'
```

## PDF to Text (Plain Text) Conversion

Extract plain text from PDFs with OCR support for image-based PDFs.

### Features:
- **Page Selection**: Extract text from specific pages or all pages
- **OCR Support**: Extract text from image-based PDFs
- **Text Formatting**: Clean and format extracted text
- **Encoding Options**: Choose text encoding (UTF-8, ASCII, etc.)

### Required Python Packages:
```bash
pip install PyPDF2 pdf2image pytesseract
```

### Testing:
```bash
python pdf_converter.py pdf-to-text sample.pdf output.txt --options '{"ocr": true}'
```

## System Dependencies Installation

### macOS:
```bash
# Install poppler and tesseract
brew install poppler tesseract

# Verify installation
which pdftoppm
which tesseract
```

### Ubuntu/Debian:
```bash
# Install poppler-utils and tesseract
sudo apt update
sudo apt install poppler-utils tesseract-ocr tesseract-ocr-eng

# Verify installation
which pdftoppm
which tesseract
```

### CentOS/RHEL/Fedora:
```bash
# Install poppler-utils and tesseract
sudo yum install poppler-utils tesseract  # CentOS/RHEL
# OR
sudo dnf install poppler-utils tesseract  # Fedora

# Verify installation
which pdftoppm
which tesseract
```

### Windows:
```cmd
# Download and install Tesseract OCR
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install to C:\Program Files\Tesseract-OCR
# Add to PATH or specify full path in code

# For poppler, use Python-only approach or download binaries
```

## Complete Setup for All Advanced Conversions

### Step 1: Install System Dependencies
Follow the platform-specific instructions above for poppler and tesseract.

### Step 2: Install Python Packages
```bash
# Activate your virtual environment
source pdf_converter_env/bin/activate  # Mac/Linux
# or
pdf_converter_env\Scripts\activate     # Windows

# Install all required packages
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl pdf2docx fpdf2 PyPDF2 ebooklib pytesseract
```

### Step 3: Test All Conversions
```bash
# Test PDF to RTF
python pdf_converter.py pdf-to-rtf test.pdf output.rtf --options '{"include_images": true}'

# Test PDF to EPUB
python pdf_converter.py pdf-to-epub test.pdf output.epub --options '{"pages_per_chapter": 3}'

# Test PDF to HTML
python pdf_converter.py pdf-to-html test.pdf output.html --options '{"include_css": true}'

# Test PDF to Text
python pdf_converter.py pdf-to-text test.pdf output.txt --options '{"ocr": true}'
```

## Troubleshooting Advanced Conversions

### OCR Issues:
- **"Tesseract not found"**: Install Tesseract OCR for your platform
- **"OCR not working"**: Make sure language packs are installed
- **"Poor OCR quality"**: Try different image preprocessing options

### Image Conversion Issues:
- **"Poppler not found"**: Install poppler-utils for better image handling
- **"Image quality issues"**: Adjust image quality settings in conversion options
- **"Large file issues"**: Consider page selection for very large PDFs

### EPUB Generation Issues:
- **"Invalid EPUB"**: Check that all required metadata is provided
- **"Large EPUB files"**: Reduce image quality or exclude images
- **"Chapter break issues"**: Adjust pages per chapter setting

### RTF Formatting Issues:
- **"Missing images"**: Ensure image inclusion is enabled
- **"Formatting lost"**: Try different formatting preservation options
- **"File size too large"**: RTF files with images can be large

## Performance Optimization

### For Large PDFs:
- Use page selection to convert only needed pages
- Consider excluding images for faster conversion
- Close other applications during conversion

### For Image-Heavy PDFs:
- Reduce image quality settings
- Use page selection to process in chunks
- Ensure sufficient disk space for temporary files

### For OCR Processing:
- OCR can be slow for large documents
- Consider processing during off-peak hours
- Monitor memory usage during conversion

## Security Considerations

- All conversions happen locally on your server
- Files are automatically cleaned up after conversion
- No data is sent to external services
- OCR processing is done locally with Tesseract
- Temporary files are securely deleted

## API Endpoints for Advanced Conversions

The server provides these endpoints for the new conversion features:

- `POST /convert/pdf-to-rtf` - Convert PDF to RTF
- `POST /convert/pdf-to-epub` - Convert PDF to EPUB
- `POST /convert/pdf-to-html` - Convert PDF to HTML
- `POST /convert/pdf-to-text` - Convert PDF to Text

Each endpoint accepts a PDF file and conversion options as JSON.

## Error Handling

The server includes comprehensive error handling for:
- Missing dependencies
- Invalid file formats
- OCR processing errors
- Image conversion failures
- Memory and disk space issues

Check the server console for detailed error messages during conversion.

Happy converting with all the advanced PDF features! 🚀 