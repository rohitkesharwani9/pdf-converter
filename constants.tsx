import React from 'react';
import { ConversionTask, ConversionOptionChoice, ConversionOption } from './types';
import { 
  FileImage, FileText, FileCode, FileSpreadsheet, Presentation, FileArchive,
  Settings, ShieldCheck, Merge, Split, Type, Edit3, Lock, Unlock, RefreshCw, Layers, Scissors, Info, ArrowRightLeft, FileType2, Grid, RotateCcw, Trash2,
  BookOpen, FileSignature, Shapes, Combine, FileJson, FileUp, FileDown, FlipHorizontal, SplitSquareHorizontal, Spline
} from 'lucide-react'; // Using lucide-react for icons

// Using an enum for ConversionType to ensure type safety
export enum ConversionType {
  // To PDF
  IMAGE_TO_PDF = 'image-to-pdf',
  WORD_TO_PDF = 'word-to-pdf',
  EXCEL_TO_PDF = 'excel-to-pdf',
  POWERPOINT_TO_PDF = 'powerpoint-to-pdf',
  TEXT_TO_PDF = 'text-to-pdf',
  HTML_TO_PDF = 'html-to-pdf',
  EPUB_TO_PDF = 'epub-to-pdf',
  RTF_TO_PDF = 'rtf-to-pdf',
  VECTOR_TO_PDF = 'vector-to-pdf',

  // From PDF
  PDF_TO_IMAGE = 'pdf-to-image',
  PDF_TO_WORD = 'pdf-to-word',
  PDF_TO_EXCEL = 'pdf-to-excel', // New
  PDF_TO_POWERPOINT = 'pdf-to-powerpoint', // New
  PDF_TO_TEXT = 'pdf-to-text', // New
  PDF_TO_HTML = 'pdf-to-html', // New
  PDF_TO_EPUB = 'pdf-to-epub', // New
  PDF_TO_RTF = 'pdf-to-rtf', // New
  PDF_TO_SVG = 'pdf-to-svg', // New
  PDF_TO_VECTOR = 'pdf-to-vector', // New

  // Editing & Tools
  MERGE_PDF = 'merge-pdf',
  SPLIT_PDF = 'split-pdf',
  REORDER_PAGES_PDF = 'reorder-pages-pdf',
  ADD_WATERMARK_PDF = 'add-watermark-pdf',
  EDIT_METADATA_PDF = 'edit-metadata-pdf',
  PASSWORD_PROTECT_PDF = 'password-protect-pdf',
  COMPRESS_PDF = 'compress-pdf', 
  OCR_PDF = 'ocr-pdf', 
}

export const TASK_CATEGORIES = {
  'to-pdf': 'Convert to PDF',
  'from-pdf': 'Convert from PDF',
  'edit-pdf': 'PDF Editing & Tools',
};

const commonImageOutputFormats: { value: string; label: string }[] = [
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WEBP' },
];

const qualityOptions: ConversionOptionChoice[] = [
    { value: 'low', label: 'Low (Smaller File)' },
    { value: 'normal', label: 'Normal (Balanced)' },
    { value: 'high', label: 'High (Best Quality)' },
];

const pageSetupOptions: ConversionOption[] = [
    { id: 'pageSize', label: 'Page Size', type: 'select', defaultValue: 'a4', choices: [{value: 'a4', label: 'A4'}, {value: 'letter', label: 'Letter'}, {value: 'legal', label: 'Legal'}]},
    { id: 'orientation', label: 'Page Orientation', type: 'select', defaultValue: 'portrait', choices: [{value: 'portrait', label: 'Portrait'}, {value: 'landscape', label: 'Landscape'}]},
    { id: 'margin', label: 'Margin Size', type: 'select', defaultValue: 'normal', choices: [{value: 'none', label: 'None'}, {value: 'small', label: 'Small'}, {value: 'normal', label: 'Normal'}, {value: 'large', label: 'Large'}]},
];

const fontOptions: ConversionOption[] = [
    { id: 'fontSize', label: 'Font Size', type: 'number', defaultValue: 12, min:8, max:72},
    { id: 'fontFamily', label: 'Font Family', type: 'select', defaultValue: 'sans-serif', choices: [{value: 'sans-serif', label: 'Sans-Serif'}, {value: 'serif', label: 'Serif'}, {value: 'monospace', label: 'Monospace'}]},
];

const ocrOption: ConversionOption = { 
  id: 'ocr', 
  label: 'Use OCR (for scanned PDFs)', 
  type: 'checkbox', 
  defaultValue: false, 
  info: 'Improves text/data recognition in scanned or image-based documents.'
};

const wordToPdfOptions: ConversionOption[] = [
  {
    id: 'embedFonts',
    label: 'Embed Fonts for Fidelity',
    type: 'checkbox',
    defaultValue: true,
    info: 'Helps maintain the original look and feel of your document.'
  }
];

const ICON_SIZE = 20;

export const ALL_CONVERSION_TASKS: ConversionTask[] = [
  // == Convert to PDF ==
  {
    id: ConversionType.IMAGE_TO_PDF,
    name: 'Image to PDF',
    description: 'Convert images (JPG, PNG, WEBP, HEIC, GIF) to PDF with advanced editing, layout, and formatting options.',
    icon: <FileImage className="w-5 h-5" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
    accept: 'image/jpeg,image/png,image/webp,image/heic,.heic,image/gif',
    requiresFileUpload: true, // Conceptually true, handled by the new component
    allowMultipleFiles: true, // Conceptually true, handled by the new component
    options: [], // Options are handled internally by the new MuiImageToPdfTool component
  },
  {
    id: ConversionType.WORD_TO_PDF,
    name: 'Word to PDF',
    description: 'Convert DOCX and DOC files to PDF, aiming to preserve document structure and appearance.',
    icon: <FileType2 className="w-5 h-5 text-blue-500" />, 
    categoryKey: 'to-pdf',
    supportedInputTypes: [
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    requiresFileUpload: true,
    allowMultipleFiles: true,
    options: wordToPdfOptions,
  },
  {
    id: ConversionType.EXCEL_TO_PDF,
    name: 'Excel to PDF',
    description: 'Convert XLSX and XLS spreadsheets to PDF.',
    icon: <FileSpreadsheet className="w-5 h-5 text-green-500" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['.xlsx', '.xls'],
    accept: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    requiresFileUpload: true,
    allowMultipleFiles: true,
    options: [], // Ensure options property exists for consistency
  },
  {
    id: ConversionType.POWERPOINT_TO_PDF,
    name: 'PowerPoint to PDF',
    description: 'Convert PPTX and PPT presentations to PDF.',
    icon: <Presentation className="w-5 h-5 text-orange-500" />, 
    categoryKey: 'to-pdf',
    supportedInputTypes: ['.pptx', '.ppt'],
    accept: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    requiresFileUpload: true,
    allowMultipleFiles: true,
  },
  {
    id: ConversionType.TEXT_TO_PDF,
    name: 'Text to PDF',
    description: 'Convert plain text files (.txt) to PDF.',
    icon: <FileText className="w-5 h-5" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['text/plain'],
    accept: '.txt',
    requiresFileUpload: true,
    allowMultipleFiles: true,
     options: [
        ...fontOptions,
        ...pageSetupOptions.filter(opt => opt.id !== 'orientation' && opt.id !== 'pageSize'), 
        { id: 'pageSize', label: 'Page Size', type: 'select', defaultValue: 'a4', choices: [{value: 'a4', label: 'A4'}, {value: 'letter', label: 'Letter'}]},
    ],
  },
   {
    id: ConversionType.HTML_TO_PDF,
    name: 'HTML to PDF',
    description: 'Convert HTML files or URLs to PDF.',
    icon: <FileCode className="w-5 h-5" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['text/html', '.html', '.htm'], 
    accept: '.html,.htm',
    requiresFileUpload: true, 
    allowMultipleFiles: false, 
    options: [] // Removing page setup options as they are not supported by LibreOffice for HTML
  },
  {
    id: ConversionType.EPUB_TO_PDF,
    name: 'EPUB to PDF',
    description: 'Convert EPUB e-book files to PDF.',
    icon: <BookOpen className="w-5 h-5" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['application/epub+zip'],
    accept: '.epub',
    requiresFileUpload: true,
    allowMultipleFiles: true,
  },
  {
    id: ConversionType.RTF_TO_PDF,
    name: 'RTF to PDF',
    description: 'Convert Rich Text Format files (.rtf) to PDF.',
    icon: <FileSignature className="w-5 h-5" />, 
    categoryKey: 'to-pdf',
    supportedInputTypes: ['application/rtf', 'text/rtf'],
    accept: '.rtf',
    requiresFileUpload: true,
    allowMultipleFiles: true,
  },
  {
    id: ConversionType.VECTOR_TO_PDF,
    name: 'Vector to PDF (SVG)',
    description: 'Convert SVG vector graphics to PDF.',
    icon: <Shapes className="w-5 h-5" />,
    categoryKey: 'to-pdf',
    supportedInputTypes: ['image/svg+xml'],
    accept: '.svg',
    requiresFileUpload: true,
    allowMultipleFiles: true, 
  },

  // == Convert from PDF ==
  {
    id: ConversionType.PDF_TO_IMAGE,
    name: 'PDF to Image',
    description: 'Convert PDF pages to JPG, PNG, WEBP, etc.',
    icon: <ArrowRightLeft className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false, 
    supportedOutputFormats: commonImageOutputFormats,
    options: [
      { id: 'outputFormat', label: 'Output Format', type: 'select', defaultValue: 'jpg', choices: commonImageOutputFormats },
      { id: 'dpi', label: 'Image DPI', type: 'select', defaultValue: '150', choices: [{value:'72', label:'72 DPI (Screen)'},{value:'150', label:'150 DPI (Standard)'}, {value:'300', label:'300 DPI (High Quality)'}, {value:'600', label:'600 DPI (Print)'}]},
      { id: 'pages', label: 'Pages to Convert', type: 'text', placeholder: 'e.g., 1-3, 5, 7-end', info: 'Leave blank for all pages.'},
    ],
  },
  {
    id: ConversionType.PDF_TO_WORD,
    name: 'PDF to Word',
    description: 'Convert PDF to editable DOCX files.',
    icon: <FileType2 className="w-5 h-5 text-blue-500 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'docx', label: 'DOCX (Word Document)'}, {value: 'doc', label: 'DOC (Older Word)'}],
     options: [
      { id: 'outputFormat', label: 'Output Format', type: 'select', defaultValue: 'docx', choices: [{value: 'docx', label: 'DOCX (Word Document)'}, {value: 'doc', label: 'DOC (Older Word)'}] },
      ocrOption
    ]
  },
  {
    id: ConversionType.PDF_TO_EXCEL,
    name: 'PDF to Excel',
    description: 'Convert PDF tables to editable XLSX or XLS spreadsheets.',
    icon: <FileSpreadsheet className="w-5 h-5 text-green-500 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'xlsx', label: 'XLSX (Excel Spreadsheet)'}],
    options: [
      { 
        id: 'pageSelection', 
        label: 'Page Selection', 
        type: 'text', 
        placeholder: 'e.g., 1, 3-5, 7, 9-12', 
        defaultValue: 'all',
        info: 'Specify page numbers or ranges (e.g., 1, 3-5, 7). Leave empty or type "all" for all pages.' 
      }
    ]
  },
  {
    id: ConversionType.PDF_TO_POWERPOINT,
    name: 'PDF to PowerPoint',
    description: 'Convert PDF to editable PPTX presentations.',
    icon: <Presentation className="w-5 h-5 text-orange-500 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'pptx', label: 'PPTX (PowerPoint Presentation)'}],
    options: [
      { id: 'conversionType', label: 'Conversion Method', type: 'select', defaultValue: 'image', choices: [
        {value: 'image', label: 'Image-based (Better quality, preserves layout)'}, 
        {value: 'text', label: 'Text-based (Smaller file, editable text)'}
      ], info: 'Image-based preserves the original layout as images. Text-based extracts text for editing.' }
    ]
  },
  {
    id: ConversionType.PDF_TO_TEXT,
    name: 'PDF to Text',
    description: 'Extract text content from PDF to a plain TXT file.',
    icon: <FileText className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'txt', label: 'TXT (Plain Text)'}],
    options: [
      {...ocrOption, defaultValue: true }, // Default OCR to true for text extraction
      { id: 'layout', label: 'Layout Preservation', type: 'select', defaultValue: 'formatted', choices: [{value: 'simple', label: 'Simple Text Flow'}, {value: 'formatted', label: 'Formatted (Attempt to keep layout)'}]},
    ]
  },
  {
    id: ConversionType.PDF_TO_HTML,
    name: 'PDF to HTML',
    description: 'Convert PDF documents to HTML web pages.',
    icon: <FileCode className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'html', label: 'HTML (Web Page)'}],
    options: [
      ocrOption,
      { id: 'embedImages', label: 'Embed Images', type: 'checkbox', defaultValue: true, info: 'Include images directly in the HTML or link them.'},
      { id: 'responsive', label: 'Responsive Design', type: 'checkbox', defaultValue: false, info: 'Attempt to make the HTML responsive.'},
    ]
  },
  {
    id: ConversionType.PDF_TO_EPUB,
    name: 'PDF to EPUB',
    description: 'Convert PDF to EPUB e-book format.',
    icon: <BookOpen className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'epub', label: 'EPUB (eBook)'}],
    options: [
      ocrOption,
      { id: 'pages_per_chapter', label: 'Pages per Chapter', type: 'number', defaultValue: 1, min: 1, max: 100, info: 'Number of pages to group into each chapter. Use 0 for single chapter.'},
      { id: 'include_images', label: 'Include Images', type: 'checkbox', defaultValue: true, info: 'Extract and include images from the PDF in the EPUB.'},
      { id: 'image_quality', label: 'Image Quality', type: 'select', defaultValue: 'medium', choices: [
        {value: 'low', label: 'Low (Smaller file size)'},
        {value: 'medium', label: 'Medium (Balanced)'},
        {value: 'high', label: 'High (Better quality)'}
      ], info: 'Quality of extracted images.'},
      { id: 'page_break_style', label: 'Page Break Style', type: 'select', defaultValue: 'chapter', choices: [
        {value: 'none', label: 'No page breaks'},
        {value: 'page', label: 'Break at each PDF page'},
        {value: 'chapter', label: 'Break at chapters only'}
      ], info: 'How to handle page breaks in the EPUB.'},
      { id: 'font_size', label: 'Base Font Size', type: 'select', defaultValue: 'medium', choices: [
        {value: 'small', label: 'Small (12px)'},
        {value: 'medium', label: 'Medium (16px)'},
        {value: 'large', label: 'Large (20px)'}
      ], info: 'Base font size for the EPUB.'},
      { id: 'line_spacing', label: 'Line Spacing', type: 'select', defaultValue: 'normal', choices: [
        {value: 'tight', label: 'Tight (1.2)'},
        {value: 'normal', label: 'Normal (1.5)'},
        {value: 'loose', label: 'Loose (1.8)'}
      ], info: 'Line spacing for better readability.'},
      { id: 'preserve_layout', label: 'Preserve Layout', type: 'checkbox', defaultValue: true, info: 'Attempt to preserve the original PDF layout and formatting.'},
      { id: 'add_toc', label: 'Add Table of Contents', type: 'checkbox', defaultValue: true, info: 'Generate a table of contents for the EPUB.'},
      { id: 'custom_title', label: 'Custom Title', type: 'text', placeholder: 'Enter custom book title', info: 'Custom title for the EPUB (optional).'},
      { id: 'custom_author', label: 'Custom Author', type: 'text', placeholder: 'Enter custom author name', info: 'Custom author for the EPUB (optional).'}
    ]
  },
  {
    id: ConversionType.PDF_TO_RTF,
    name: 'PDF to RTF',
    description: 'Convert PDF to Rich Text Format (RTF).',
    icon: <FileSignature className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'rtf', label: 'RTF (Rich Text Format)'}],
    options: [
      ocrOption,
      { id: 'page_selection', label: 'Pages to Convert', type: 'text', placeholder: 'e.g., 1-3, 5, all', defaultValue: 'all', info: 'Specify pages or "all" to convert all pages.'},
      { id: 'preserve_formatting', label: 'Preserve Formatting', type: 'checkbox', defaultValue: true, info: 'Attempt to preserve original text formatting, fonts, and layout.'},
      { id: 'include_images', label: 'Include Images', type: 'checkbox', defaultValue: true, info: 'Extract and include images from the PDF (may increase file size).'},
      { id: 'font_size', label: 'Base Font Size', type: 'select', defaultValue: 'medium', choices: [
        {value: 'small', label: 'Small (10pt)'},
        {value: 'medium', label: 'Medium (12pt)'},
        {value: 'large', label: 'Large (14pt)'}
      ], info: 'Base font size for the RTF document.'},
      { id: 'line_spacing', label: 'Line Spacing', type: 'select', defaultValue: 'normal', choices: [
        {value: 'single', label: 'Single (1.0)'},
        {value: 'normal', label: 'Normal (1.15)'},
        {value: 'double', label: 'Double (2.0)'}
      ], info: 'Line spacing for better readability.'},
      { id: 'page_breaks', label: 'Add Page Breaks', type: 'checkbox', defaultValue: true, info: 'Insert page breaks between PDF pages in the RTF.'},
      { id: 'custom_title', label: 'Document Title', type: 'text', placeholder: 'Enter document title', info: 'Custom title for the RTF document (optional).'}
    ]
  },
  {
    id: ConversionType.PDF_TO_SVG,
    name: 'PDF to SVG',
    description: 'Convert PDF pages to Scalable Vector Graphics (SVG).',
    icon: <Shapes className="w-5 h-5 transform -rotate-45" />,
    categoryKey: 'from-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    supportedOutputFormats: [{value: 'svg', label: 'SVG (Scalable Vector Graphics)'}],
    options: [
      { id: 'page_selection', label: 'Pages to Convert', type: 'text', placeholder: 'e.g., 1-3, 5, all', defaultValue: 'all', info: 'Specify pages or "all" to convert all pages.'},
      { id: 'dpi', label: 'Image DPI', type: 'select', defaultValue: '300', choices: [
        {value: '150', label: 'Low (150 DPI)'},
        {value: '300', label: 'Medium (300 DPI)'},
        {value: '600', label: 'High (600 DPI)'}
      ], info: 'Resolution for image conversion. Higher DPI = better quality but larger file.'},
      { id: 'width', label: 'Max Width', type: 'number', defaultValue: 800, min: 100, max: 2000, info: 'Maximum width in pixels for each page.'},
      { id: 'height', label: 'Max Height', type: 'number', defaultValue: 600, min: 100, max: 2000, info: 'Maximum height in pixels for each page.'}
    ]
  },

  // == PDF Editing & Tools ==
  {
    id: ConversionType.MERGE_PDF,
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document.',
    icon: <Merge size={ICON_SIZE} />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['.pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: true,
    isEditingTool: true,
  },
  {
    id: ConversionType.SPLIT_PDF,
    name: 'Split PDF',
    description: 'Extract pages or page ranges from a PDF file.',
    icon: <Scissors size={ICON_SIZE} />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['.pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: [
        {
            id: 'split_mode',
            label: 'Split Mode',
            type: 'select',
            defaultValue: 'ranges',
            choices: [
                { value: 'ranges', label: 'Custom Page Ranges' },
                { value: 'all', label: 'Extract All Pages as Separate PDFs' }
            ]
        },
        {
            id: 'page_ranges',
            label: 'Pages to Extract',
            type: 'text',
            placeholder: 'e.g., 1-3, 5, 8-10',
            defaultValue: '',
            dependsOn: { optionId: 'split_mode', value: 'ranges' }
        }
    ]
  },
  {
    id: ConversionType.COMPRESS_PDF,
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality.',
    icon: <FileArchive className="w-5 h-5" />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: [
        { 
          id: 'compression_level', 
          label: 'Compression Level', 
          type: 'select', 
          defaultValue: 'ebook', 
          choices: [
            {value: 'screen', label: 'High Compression'},
            {value: 'ebook', label: 'Recommended Medium Compression'},
            {value: 'printer', label: 'Low Compression'}
          ],
          info: 'Higher compression = smaller file size but lower quality'
        },
        { 
          id: 'grayscale', 
          label: 'Convert to Grayscale', 
          type: 'checkbox', 
          defaultValue: false,
          info: 'Convert to grayscale to reduce file size further'
        }
    ]
  },
  {
    id: ConversionType.PASSWORD_PROTECT_PDF,
    name: 'Protect PDF',
    description: 'Add a password to encrypt your PDF.',
    icon: <Lock className="w-5 h-5" />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: [
        { id: 'password', label: 'Set Password', type: 'password', placeholder: 'Enter password', info: 'Password must be at least 6 characters long' },
        { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm password', info: 'Re-enter the same password to confirm' },
    ]
  },
  {
    id: ConversionType.REORDER_PAGES_PDF,
    name: 'Organize PDF Pages',
    description: 'Reorder, rotate, or delete pages in a PDF using the interactive page manager.',
    icon: <Grid className="w-5 h-5" />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: [] // Options are handled by the visual PageManager component
  },
  {
    id: ConversionType.ADD_WATERMARK_PDF,
    name: 'Add Watermark',
    description: 'Add text or image watermark to PDF pages.',
    icon: <Type className="w-5 h-5" />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: []
  },
   {
    id: ConversionType.EDIT_METADATA_PDF,
    name: 'Edit PDF Metadata',
    description: 'Change title, author, subject, keywords of a PDF.',
    icon: <Edit3 className="w-5 h-5" />,
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf'],
    accept: '.pdf',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: []
  },
  {
    id: ConversionType.OCR_PDF,
    name: 'OCR PDF',
    description: 'Make scanned PDFs searchable and selectable.',
    icon: <RefreshCw className="w-5 h-5" />, 
    categoryKey: 'edit-pdf',
    supportedInputTypes: ['application/pdf', 'image/*'], 
    accept: '.pdf,image/*',
    requiresFileUpload: true,
    allowMultipleFiles: false,
    isEditingTool: true,
    options: []
  }
];

// Helper to get task by ID
export const getTaskById = (id: ConversionType): ConversionTask | undefined => {
  return ALL_CONVERSION_TASKS.find(task => task.id === id);
};
