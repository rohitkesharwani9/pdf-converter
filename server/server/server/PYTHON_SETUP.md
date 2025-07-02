# Python Setup for PDF to Word Conversion

This document explains how to set up the Python environment for PDF to Word conversion using the `pdf2docx` library.

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Installation Steps

### 1. Activate the Virtual Environment

```bash
cd server
source pdf_converter_env/bin/activate
```

### 2. Install Required Libraries

```bash
pip install pdf2docx fpdf2 python-docx
```

Or install from the requirements file:

```bash
pip install -r requirements.txt
```

### 3. Verify Installation

```bash
python -c "import pdf2docx; print('pdf2docx is installed successfully')"
```

## Troubleshooting

### Network Issues
If you encounter network connectivity issues during installation:

1. Try using a different network connection
2. Use a VPN if available
3. Try installing with trusted hosts:
   ```bash
   pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org pdf2docx
   ```

### Alternative Installation Methods

If pip installation fails, you can try:

1. **Using conda** (if available):
   ```bash
   conda install -c conda-forge pdf2docx
   ```

2. **Manual installation** from source:
   ```bash
   git clone https://github.com/dothinking/pdf2docx.git
   cd pdf2docx
   python setup.py install
   ```

## Testing the Conversion

Once installed, you can test the conversion:

```bash
python pdf_converter.py input.pdf output.docx
```

## Features

The `pdf2docx` library provides:

- ✅ Preserves text formatting
- ✅ Maintains tables and their structure
- ✅ Keeps images and their positioning
- ✅ Supports complex layouts
- ✅ Handles multiple pages
- ✅ OCR support for scanned documents

## Limitations

- Complex vector graphics may not convert perfectly
- Some advanced PDF features might be simplified
- Very large files may take longer to process

## Support

If you continue to have issues:

1. Check the [pdf2docx documentation](https://github.com/dothinking/pdf2docx)
2. Ensure you have sufficient disk space
3. Verify Python version compatibility
4. Check system permissions for file operations 