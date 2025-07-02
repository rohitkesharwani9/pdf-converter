# 📄 OmniConverter PDF Suite - Super Easy Setup!

Turn your files into PDFs! Convert Word documents, Excel spreadsheets, PowerPoint presentations, text files, and pictures to PDF format. Also convert PDFs to Word, Excel, PowerPoint, and more!

## 🎯 What This App Does

- **Word to PDF** - Turn your .doc or .docx files into PDFs
- **Excel to PDF** - Turn your .xls or .xlsx files into PDFs  
- **PowerPoint to PDF** - Turn your .ppt or .pptx files into PDFs
- **Text to PDF** - Turn your .txt files into PDFs
- **Image to PDF** - Turn your pictures (JPG, PNG, GIF) into PDFs
- **PDF to Word** - Convert PDFs back to editable Word documents
- **PDF to Excel** - Extract tables from PDFs to Excel spreadsheets
- **PDF to PowerPoint** - Convert PDFs to PowerPoint presentations
- **PDF to Image** - Convert PDF pages to images
- **PDF to RTF** - Convert PDFs to Rich Text Format with images and formatting
- **PDF to EPUB** - Convert PDFs to EPUB e-books with advanced options
- **PDF to HTML** - Convert PDFs to web pages with styling
- **PDF to Text** - Extract plain text from PDFs with OCR support

## 🚀 Super Easy Setup (Choose Your Computer Type)

### For Mac Users 🍎

#### Step 1: Install LibreOffice (The Magic Tool)
1. Open **Terminal** (press `Cmd + Space`, type "Terminal", press Enter)
2. Copy and paste this command:
   ```bash
   brew install --cask libreoffice
   ```
3. Press Enter and wait for it to finish (it might take a few minutes)

#### Step 2: Install Python Dependencies for PDF to PowerPoint
1. In **Terminal**, install the required system tools:
   ```bash
   brew install poppler
   ```
2. Install Python packages for PDF to PowerPoint conversion:
   ```bash
   cd Desktop/omniconverter-pdf-suite/server
   source pdf_converter_env/bin/activate
   pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl
   ```

#### Step 3: Install the App
1. Open **Terminal** again
2. Type these commands one by one (press Enter after each):
   ```bash
   cd Desktop
   git clone https://github.com/your-username/omniconverter-pdf-suite.git
   cd omniconverter-pdf-suite
   npm install
   cd server
   npm install
   cd ..
   ```

#### Step 4: Tell the App Where LibreOffice Is
1. Open the file `server/server.js` in any text editor
2. Find the line that says `const libreOfficePath =`
3. Make sure it looks like this:
   ```javascript
   const libreOfficePath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
   ```

#### Step 5: Run the App
1. Open **Terminal**
2. Type these commands in two different Terminal windows:

**Terminal 1 (for the backend):**
```bash
cd Desktop/omniconverter-pdf-suite/server
node server.js
```

**Terminal 2 (for the frontend):**
```bash
cd Desktop/omniconverter-pdf-suite
npm run dev
```

3. Open your web browser and go to: `http://localhost:5173`

### For Windows Users 🪟

#### Step 1: Install LibreOffice (The Magic Tool)
1. Go to [LibreOffice.org](https://www.libreoffice.org/download/download/)
2. Click the big "Download" button
3. Run the installer and follow the instructions
4. Remember where you installed it (usually `C:\Program Files\LibreOffice\`)

#### Step 2: Install Python Dependencies for PDF to PowerPoint
1. Download and install Python from [python.org](https://www.python.org/downloads/)
2. Open **Command Prompt** as Administrator
3. Install the required system tools:
   ```cmd
   # Download poppler for Windows (you'll need to find a pre-built version)
   # Or use the Python-only approach without poppler
   ```
4. Install Python packages for PDF to PowerPoint conversion:
   ```cmd
   cd Desktop\omniconverter-pdf-suite\server
   pdf_converter_env\Scripts\activate
   pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl
   ```

#### Step 3: Install the App
1. Open **Command Prompt** (press `Windows + R`, type "cmd", press Enter)
2. Type these commands one by one (press Enter after each):
   ```cmd
   cd Desktop
   git clone https://github.com/your-username/omniconverter-pdf-suite.git
   cd omniconverter-pdf-suite
   npm install
   cd server
   npm install
   cd ..
   ```

#### Step 4: Tell the App Where LibreOffice Is
1. Open the file `server/server.js` in Notepad or any text editor
2. Find the line that says `const libreOfficePath =`
3. Make sure it looks like this:
   ```javascript
   const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
   ```

#### Step 5: Run the App
1. Open **Command Prompt**
2. Type these commands in two different Command Prompt windows:

**Command Prompt 1 (for the backend):**
```cmd
cd Desktop\omniconverter-pdf-suite\server
node server.js
```

**Command Prompt 2 (for the frontend):**
```cmd
cd Desktop\omniconverter-pdf-suite
npm run dev
```

3. Open your web browser and go to: `http://localhost:5173`

## 🔧 Installing Ghostscript (Required for PDF Compression)

**What is Ghostscript?** Ghostscript is a special tool that helps compress PDF files to make them smaller. It's like a magic shrinker for PDFs!

### For Mac Users 🍎

1. Open **Terminal** (press `Cmd + Space`, type "Terminal", press Enter)
2. Copy and paste this command:
   ```bash
   brew install ghostscript
   ```
3. Press Enter and wait for it to finish
4. Test if it worked by typing: `gs --version`
   - You should see something like: `GPL Ghostscript 10.05.1`

### For Windows Users 🪟

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

If you're using Docker to run the app, add this to your Dockerfile:

**For Ubuntu/Debian based images:**
```dockerfile
RUN apt-get update && apt-get install -y ghostscript
```

**For Alpine based images:**
```dockerfile
RUN apk add ghostscript
```

## 🎉 You're All Set!

Now you can use the **Compress PDF** feature in the app! It will make your PDF files smaller while keeping them readable.

## 🌐 For Web Hosting (VPS/Server)

### Step 1: Connect to Your Server
1. Use SSH to connect to your server
2. Make sure you have root or sudo access

### Step 2: Install System Dependencies
```bash
# Update your server
sudo apt update

# Install LibreOffice
sudo apt install libreoffice libreoffice-writer libreoffice-calc

# Install Python and pip
sudo apt install python3 python3-pip python3-venv

# Install poppler-utils for PDF to PowerPoint conversion
sudo apt install poppler-utils

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Download and Setup the App
```bash
# Download the app
git clone https://github.com/your-username/omniconverter-pdf-suite.git
cd omniconverter-pdf-suite
npm install
cd server
npm install

# Create and activate Python virtual environment
python3 -m venv pdf_converter_env
source pdf_converter_env/bin/activate

# Install Python packages for PDF conversions
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl pdf2docx fpdf2
```

### Step 4: Configure the App
1. Edit the server file:
   ```bash
   nano server/server.js
   ```
2. Make sure the LibreOffice path is:
   ```javascript
   const libreOfficePath = 'libreoffice';
   ```
3. Save and exit (Ctrl+X, then Y, then Enter)

### Step 5: Run the App
```bash
# Start the backend
cd server
node server.js

# In another terminal, start the frontend
cd ..
npm run dev
```

## 🔧 PDF to PowerPoint Conversion Setup

### Required Python Packages:
```bash
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl
```

### System Dependencies:
- **macOS**: `brew install poppler`
- **Ubuntu/Debian**: `sudo apt install poppler-utils`
- **Windows**: Download poppler binaries or use text-only conversion

### Conversion Methods:
1. **Image-based Conversion**: 
   - Converts PDF pages to high-quality images
   - Preserves original layout and formatting
   - Better visual quality
   - Requires `pdf2image` and `poppler`

2. **Text-based Conversion**:
   - Extracts text from PDF pages
   - Creates editable PowerPoint slides
   - Smaller file size
   - Works without `poppler`

### Troubleshooting PDF to PowerPoint:

#### "poppler not found" Error (macOS/Linux):
```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt install poppler-utils

# CentOS/RHEL
sudo yum install poppler-utils
```

#### "pdf2image import error" (Windows):
- Use text-based conversion instead
- Or install poppler binaries manually

#### "python-pptx not found":
```bash
pip install python-pptx
```

#### "PIL/Pillow not found":
```bash
pip install Pillow
```

## 🎮 How to Use the App

1. **Open the app** in your web browser
2. **Choose what you want to convert** (Word, Excel, Image, or PDF conversions)
3. **Click "Choose File"** and select your file
4. **Select conversion options** (for PDF to PowerPoint, choose image or text method)
5. **Click "Convert"**
6. **Wait for the magic to happen!** ✨
7. **Download your converted file**

## 🆘 If Something Goes Wrong

### "LibreOffice not found" Error
- **Mac:** Make sure you ran the `brew install` command
- **Windows:** Make sure you installed LibreOffice from the website
- **Linux:** Make sure you ran `sudo apt install libreoffice`

### "Python packages not found" Error
- Make sure you activated the virtual environment: `source pdf_converter_env/bin/activate`
- Install missing packages: `pip install [package-name]`

### "poppler not found" Error
- Install poppler as shown in the setup instructions above
- Or use text-based PDF to PowerPoint conversion

### "npm not found" Error
- Install Node.js from [nodejs.org](https://nodejs.org/)

### "Port already in use" Error
- Close other programs that might be using the same port
- Or change the port number in the code

### App won't start
- Make sure you're in the right folder
- Make sure you ran `npm install` in both the main folder and the server folder
- Check that both Terminal/Command Prompt windows are running

## 📁 What Files Can You Convert?

### To PDF:
- **Word files:** .doc, .docx
- **Excel files:** .xls, .xlsx  
- **PowerPoint files:** .ppt, .pptx
- **Text files:** .txt
- **Picture files:** .jpg, .jpeg, .png, .gif, .bmp

### From PDF:
- **PDF to Word:** .pdf → .docx
- **PDF to Excel:** .pdf → .xlsx
- **PDF to PowerPoint:** .pdf → .pptx
- **PDF to Image:** .pdf → .jpg, .png
- **PDF to Text:** .pdf → .txt

## 🎉 You're Done!

Now you can convert files to PDF and convert PDFs to other formats! The app will work on your computer and you can also put it on a web server so other people can use it too.

## 💡 Pro Tips

- **Keep both Terminal/Command Prompt windows open** while using the app
- **Restart the app** if something stops working
- **Check the file size** - very big files might take longer to convert
- **Use the same file types** that are listed above

## 🆘 Need More Help?

If you get stuck, check the detailed guide in `server/README.md` for more technical information.

# 📄 HTML to PDF & EPUB to PDF (Kid-Friendly Guide!)

## How to Use HTML to PDF

1. **Open the app in your web browser.**
2. **Find the "HTML to PDF" tool** in the sidebar.
3. You can:
   - **Upload an HTML file** (like `myfile.html`)
   - **Or paste your HTML code** in the box.
4. Click the **"Convert to PDF"** button.
5. Wait a few seconds. When it's done, click **"Download"** to get your PDF!

> **Note:** Only simple (static) HTML works best. If your page uses lots of magic (like JavaScript or fancy styles from the internet), it might not look perfect in the PDF.

## How to Set Up Calibre for EPUB to PDF (So It Works!)

### What is Calibre?
Calibre is a free program that helps turn eBooks (like `.epub` files) into PDFs. We use it on the server to do the magic!

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

### 🍏 On Mac
1. **Go to** [https://calibre-ebook.com/download](https://calibre-ebook.com/download)
2. Download and install Calibre like any other app.
3. To make sure the server can use it, use this path in your code:
   ```
   /Applications/calibre.app/Contents/MacOS/ebook-convert
   ```
   Or, open Terminal and type:
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

## If You Get Stuck
- Make sure the file you upload ends with `.html` or `.epub`.
- If you see an error, read the message. It usually tells you what went wrong.
- Ask an adult for help if you need it. 😊

Happy converting! 🚀

# 📄 RTF to PDF (Kid-Friendly Guide!)

## How to Use RTF to PDF

1. **Open the app in your web browser.**
2. **Find the "RTF to PDF" tool** in the sidebar.
3. **Upload an RTF file** (it should end with `.rtf`).
4. Click the **"Convert to PDF"** button.
5. Wait a few seconds. When it's done, click **"Download"** to get your PDF!

> **Note:** Only .rtf files are supported. If you upload something else, it won't work.

# 📄 Vector to PDF (SVG to PDF) (Kid-Friendly Guide!)

## How to Use Vector to PDF

1. **Open the app in your web browser.**
2. **Find the "Vector to PDF (SVG)" tool** in the sidebar.
3. **Upload an SVG file** (it should end with `.svg`).
4. Click the **"Convert to PDF"** button.
5. Wait a few seconds. When it's done, click **"Download"** to get your PDF!

> **Note:** Only .svg files are supported. If you upload something else, it won't work. Very fancy SVGs might not look perfect in the PDF.

# 📄 PDF to Word Conversion Setup Guide (For 10-Year-Olds!)

## What is PDF to Word Conversion?

This amazing feature turns PDF files back into Word documents (.docx format)! It can extract text, tables, and even some images from PDFs and put them into a Word document you can edit.

## What You Need for PDF to Word Conversion

The backend server needs these special Python tools:
- `pdf2docx` - The main tool that extracts text and tables from PDFs
- `fpdf2` - Helps process PDF files
- `python-docx` - Creates the Word documents

## How to Set Up PDF to Word Conversion on Your Backend Server

### For Linux VPS (Ubuntu/Debian) 🐧

#### Step 1: Install Python and pip
```bash
# Update your system first
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip (the tool installer)
sudo apt install python3 python3-pip python3-venv
```

#### Step 2: Create a Special Python Environment
```bash
# Go to your server folder
cd server

# Create a special environment for Python packages
python3 -m venv pdf_converter_env

# Turn on the environment
source pdf_converter_env/bin/activate
```

#### Step 3: Install the Magic Python Tools
```bash
# Install the special libraries for PDF to Word conversion
pip install pdf2docx fpdf2 python-docx
```

#### Step 4: Test if Everything Works
```bash
# Test if all the tools are installed correctly
python3 -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 5: Start Your Server
```bash
# Make sure you're in the server folder and the environment is on
cd server
source pdf_converter_env/bin/activate
npm start
```

🎉 **PDF to Word conversion is now working on your VPS!**

### For macOS Laptop 🍎

#### Step 1: Install Python (if you don't have it)
```bash
# Install Homebrew first (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python using Homebrew
brew install python
```

#### Step 2: Create a Special Python Environment
```bash
# Go to your server folder
cd server

# Create a special environment
python3 -m venv pdf_converter_env

# Turn on the environment
source pdf_converter_env/bin/activate
```

#### Step 3: Install the Magic Python Tools
```bash
# Install the special libraries
pip install pdf2docx fpdf2 python-docx
```

#### Step 4: Test if Everything Works
```bash
# Test if all the tools work
python3 -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 5: Start Your Server
```bash
# Make sure the environment is on and start the server
cd server
source pdf_converter_env/bin/activate
npm start
```

🎉 **PDF to Word conversion is now working on your Mac!**

### For Windows Laptop 💻

#### Step 1: Install Python (if you don't have it)
1. Go to https://python.org/
2. Download Python 3.x (the newest version)
3. Run the installer
4. **Very Important**: Check the box that says "Add Python to PATH" when installing!

#### Step 2: Open Command Prompt
1. Press `Windows + R` on your keyboard
2. Type `cmd` and press Enter
3. Use `cd` command to go to your project folder

#### Step 3: Create a Special Python Environment
```cmd
# Go to your server folder
cd server

# Create a special environment
python -m venv pdf_converter_env

# Turn on the environment
pdf_converter_env\Scripts\activate
```

#### Step 4: Install the Magic Python Tools
```cmd
# Install the special libraries
pip install pdf2docx fpdf2 python-docx
```

#### Step 5: Test if Everything Works
```cmd
# Test if all the tools work
python -c "import pdf2docx; import fpdf2; import docx; print('All libraries installed successfully!')"
```

#### Step 6: Start Your Server
```cmd
# Make sure the environment is on and start the server
cd server
pdf_converter_env\Scripts\activate
npm start
```

🎉 **PDF to Word conversion is now working on your Windows laptop!**

## How to Use PDF to Word Conversion in the App

1. **Open the app** in your web browser (usually http://localhost:5173)
2. **Look for "PDF to Word"** in the sidebar menu
3. **Click "Choose File"** and select a PDF file from your computer
4. **Click "Convert"** button
5. **Wait a moment** while the magic happens! ✨
6. **Click "Download"** when the Word file is ready

## What Can PDF to Word Conversion Do? ✨

- ✅ **Copy all text** from PDF pages into Word
- ✅ **Convert tables** into proper Word tables you can edit
- ✅ **Keep basic formatting** like bold and italic text
- ✅ **Handle multiple pages** - converts the whole PDF
- ✅ **Create .docx files** that work with Microsoft Word
- ⚠️ **Simple images only** - complex graphics might not work perfectly
- ⚠️ **Basic layouts** - very fancy PDF designs might look different

## If Something Goes Wrong 🔧

### Problem: "Module not found" error when converting
**What to do**: Make sure the Python environment is turned on in your server:
```bash
# Windows
pdf_converter_env\Scripts\activate

# Mac/Linux  
source pdf_converter_env/bin/activate
```

### Problem: Conversion button doesn't work
**What to do**: 
1. Check if your backend server is running
2. Look at the browser console for error messages (press F12)
3. Make sure your PDF file isn't too big (under 50MB works best)

### Problem: Tables look weird in the Word file
**What to do**: Simple tables work best! Very complex tables with merged cells might not convert perfectly.

### Problem: "Permission denied" error
**What to do**: Make sure you have permission to write files in the server folder

## Fun Facts About PDF to Word Conversion 🤓

- The conversion happens on your server, not in your browser
- PDF files are temporarily stored and then automatically deleted for security
- The Python tools are really smart and can understand most PDF structures
- Word files created are fully editable - you can change anything you want!

## Security Notes 🔒

- Your PDF files are processed safely on your own server
- Files are automatically deleted after conversion
- No files are stored permanently
- The conversion happens in a secure Python environment

Happy PDF to Word converting! Turn those PDFs into editable Word documents! 📄➡️📝

# 📚 Advanced PDF Conversion Features

## PDF to RTF (Rich Text Format) Conversion

Convert PDFs to RTF format with advanced formatting options:

### Features:
- **Page Selection**: Convert specific pages or all pages
- **Formatting Preservation**: Maintain original text formatting
- **Image Inclusion**: Embed images from PDF into RTF
- **Font Size**: Choose small, medium, or large text
- **Line Spacing**: Single, normal, or double spacing
- **Page Breaks**: Add page breaks between PDF pages
- **Custom Title**: Add a custom document title

### Setup Requirements:
```bash
# Install additional Python packages
pip install PyPDF2 Pillow pdf2image pytesseract

# Install Tesseract OCR (for image-based PDFs)
# macOS: brew install tesseract
# Ubuntu: sudo apt install tesseract-ocr
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
```

## PDF to EPUB (E-Book Format) Conversion

Convert PDFs to EPUB e-books with comprehensive options:

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

### Setup Requirements:
```bash
# Install additional Python packages
pip install PyPDF2 ebooklib pdf2image pytesseract
```

## PDF to HTML (Web Format) Conversion

Convert PDFs to HTML web pages with styling:

### Features:
- **Page Selection**: Convert specific pages or all pages
- **CSS Styling**: Include custom CSS for better appearance
- **Image Handling**: Embed or link images
- **Text Extraction**: Extract and format text content
- **Layout Options**: Preserve or simplify document layout

### Setup Requirements:
```bash
# Install additional Python packages
pip install PyPDF2 pdf2image pytesseract
```

## PDF to Text (Plain Text) Conversion

Extract plain text from PDFs with OCR support:

### Features:
- **Page Selection**: Extract text from specific pages or all pages
- **OCR Support**: Extract text from image-based PDFs
- **Text Formatting**: Clean and format extracted text
- **Encoding Options**: Choose text encoding (UTF-8, ASCII, etc.)

### Setup Requirements:
```bash
# Install additional Python packages
pip install PyPDF2 pdf2image pytesseract
```

## Testing the New Conversion Features

Test each conversion type with a sample PDF:

```bash
# Test PDF to RTF
python pdf_converter.py pdf-to-rtf sample.pdf output.rtf --options '{"include_images": true, "font_size": "medium"}'

# Test PDF to EPUB
python pdf_converter.py pdf-to-epub sample.pdf output.epub --options '{"pages_per_chapter": 5, "include_images": true}'

# Test PDF to HTML
python pdf_converter.py pdf-to-html sample.pdf output.html --options '{"include_css": true}'

# Test PDF to Text
python pdf_converter.py pdf-to-text sample.pdf output.txt --options '{"ocr": true}'
```

## Troubleshooting Advanced Conversions

### OCR Issues:
- **Tesseract not found**: Install Tesseract OCR for your platform
- **OCR not working**: Make sure language packs are installed
- **Poor OCR quality**: Try different image preprocessing options

### Image Conversion Issues:
- **Poppler not found**: Install poppler-utils for better image handling
- **Image quality**: Adjust image quality settings in conversion options
- **Large files**: Consider page selection for very large PDFs

### EPUB Generation Issues:
- **Invalid EPUB**: Check that all required metadata is provided
- **Large EPUB files**: Reduce image quality or exclude images
- **Chapter breaks**: Adjust pages per chapter setting

### RTF Formatting Issues:
- **Missing images**: Ensure image inclusion is enabled
- **Formatting lost**: Try different formatting preservation options
- **File size**: RTF files with images can be large

## Complete Python Package Installation

For all advanced PDF conversions, install these packages:

```bash
# Activate your virtual environment first
source pdf_converter_env/bin/activate  # Mac/Linux
# or
pdf_converter_env\Scripts\activate     # Windows

# Install all required packages
pip install pdf2image python-pptx Pillow pdfplumber pandas openpyxl pdf2docx fpdf2 PyPDF2 ebooklib pytesseract
```

## System Dependencies for All Platforms

### macOS:
```bash
brew install poppler tesseract
```

### Ubuntu/Debian:
```bash
sudo apt install poppler-utils tesseract-ocr tesseract-ocr-eng
```

### Windows:
- Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
- Install to `C:\Program Files\Tesseract-OCR`
- Add to PATH or specify full path in code

### CentOS/RHEL/Fedora:
```bash
sudo yum install poppler-utils tesseract  # CentOS/RHEL
# or
sudo dnf install poppler-utils tesseract  # Fedora
```

## Using the Advanced Features in the Web App

1. **Open the app** in your web browser
2. **Select the conversion type** from the sidebar:
   - PDF to RTF
   - PDF to EPUB
   - PDF to HTML
   - PDF to Text
3. **Upload your PDF file**
4. **Configure the options** for your conversion
5. **Click "Convert"** and wait for processing
6. **Download your converted file**

## Performance Tips

- **Large PDFs**: Use page selection to convert only needed pages
- **Image-heavy PDFs**: Consider excluding images for faster conversion
- **OCR Processing**: Can be slow for large documents, be patient
- **Memory Usage**: Close other applications when converting large files
- **Storage**: Ensure you have enough disk space for temporary files

## Security and Privacy

- All conversions happen on your local server
- Files are automatically cleaned up after conversion
- No data is sent to external services
- OCR processing is done locally with Tesseract
- Temporary files are securely deleted

Happy converting with all the new advanced PDF features! 🚀
