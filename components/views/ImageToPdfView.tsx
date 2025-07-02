import React, { useState, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button, 
  LinearProgress,
  IconButton,
  Alert,
  Grid,
  createTheme,
  ThemeProvider,
  Slider,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Tooltip,
  Divider,
  SelectChangeEvent 
} from '@mui/material';
import AdSense from '../AdSense';
import { 
  Delete as DeleteIcon, 
  CloudUpload as CloudUploadIcon, 
  PictureAsPdf as PdfIcon, 
  Preview as PreviewIcon,
  Edit as EditIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Brightness4 as BrightnessIcon,
  Contrast as ContrastIcon,
  FilterVintage as FilterIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles'; 
import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas'; // Not directly used in the latest version for PDF generation
import ReactCrop, { centerCrop, makeAspectCrop, Crop as CropType } from 'react-image-crop';
import heic2any from 'heic2any';
import { ThemeContext } from '../../contexts/ThemeContext';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DropZone = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const ImagePreview = styled('img')(({ theme }) => ({ 
  maxWidth: '100%',
  maxHeight: '200px', // Set a max-height for consistency in grid
  height: 'auto', // Allow it to shrink
  objectFit: 'contain', // Ensure the whole image is visible
  marginBottom: theme.spacing(1), // Reduced margin
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  },
}));

const ImagePreviewContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(1), // Reduced padding
  height: '100%', // Ensure it fills the grid item for consistent alignment
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  '&:hover .action-overlay': { // Changed class name for clarity
    opacity: 1,
  },
}));

const ActionOverlay = styled(Box)(({ theme, color = 'rgba(244, 67, 54, 0.9)' }) => ({ // Allow color prop
  position: 'absolute',
  backgroundColor: color,
  borderRadius: '50%',
  padding: theme.spacing(0.8), // Slightly smaller padding
  cursor: 'pointer',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  zIndex: 1,
  '&:hover': {
    backgroundColor: color === 'rgba(244, 67, 54, 0.9)' ? 'rgba(244, 67, 54, 1)' : alpha(color, 1),
  },
}));


interface ImageEditDialogProps {
  open: boolean;
  onClose: () => void;
  image: string; 
  onSave: (editedImageUrl: string, index: number) => void;
  index: number;
  originalImage: string;
}

const ImageEditDialog: React.FC<ImageEditDialogProps> = ({ open, onClose, image, onSave, index, originalImage }) => {
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [filter, setFilter] = useState('none');
  const [currentImage, setCurrentImage] = useState(image);
  const [previewKey, setPreviewKey] = useState(0);
  const [crop, setCrop] = useState<CropType | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setCurrentImage(image);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setFilter('none');
      setCrop(null);
      setIsCropping(false);
      setPreviewKey(prev => prev + 1);
    }
  }, [open, image]);

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setFilter('none');
    setCrop(null);
    setIsCropping(false);
    setPreviewKey(prev => prev + 1); 
  };

  const handleResetToOriginal = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setFilter('none');
    setCrop(null);
    setIsCropping(false);
    setCurrentImage(originalImage);
    setPreviewKey(prev => prev + 1);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => prev + (direction === 'left' ? -90 : 90));
    setPreviewKey(prev => prev + 1); 
  };

  const handleBrightnessChange = (event: Event, newValue: number | number[]) => {
    setBrightness(newValue as number);
  };

  const handleContrastChange = (event: Event, newValue: number | number[]) => {
    setContrast(newValue as number);
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilter(event.target.value);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget; 
    const cropVal = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        naturalWidth / naturalHeight, 
        naturalWidth, 
        naturalHeight 
      ),
      naturalWidth, 
      naturalHeight 
    );
    setCrop(cropVal);
    // setImgRef(e.currentTarget); // Ensure imgRef is set on load if using it for dimensions elsewhere
  };
  
  const applyCrop = () => {
    if (crop && imgRef && imgRef.naturalWidth > 0 && imgRef.naturalHeight > 0) { // Check natural dims
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scaleX = imgRef.naturalWidth / imgRef.width;
      const scaleY = imgRef.naturalHeight / imgRef.height;

      const cropWidth = crop.width > 0 ? crop.width : 1;
      const cropHeight = crop.height > 0 ? crop.height : 1;

      canvas.width = cropWidth * scaleX;
      canvas.height = cropHeight * scaleY;

      ctx.drawImage(
        imgRef,
        crop.x * scaleX,
        crop.y * scaleY,
        cropWidth * scaleX,
        cropHeight * scaleY,
        0,
        0,
        cropWidth * scaleX,
        cropHeight * scaleY
      );

      canvas.toBlob(blob => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            setCurrentImage(url); 
            setIsCropping(false); 
            setPreviewKey(prev => prev + 1); 
        }
      }, 'image/jpeg');
    } else {
        console.warn("Cannot apply crop: Crop data or image reference is invalid or image not loaded.");
    }
  };

  const applyEdits = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth; 
      canvas.height = img.naturalHeight;
      
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-canvas.width/2, -canvas.height/2);
      
      let currentFilterString = `brightness(${brightness}%) contrast(${contrast}%)`;
      switch(filter) {
        case 'grayscale': currentFilterString += ' grayscale(100%)'; break;
        case 'sepia': currentFilterString += ' sepia(100%)'; break;
        case 'blur': currentFilterString += ' blur(2px)'; break;
        case 'saturate': currentFilterString += ' saturate(200%)'; break;
      }
      ctx.filter = currentFilterString;
      
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      
      canvas.toBlob(blob => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            onSave(url, index); 
            onClose();
        }
      }, 'image/jpeg');
    };
    img.crossOrigin = "anonymous"; 
    img.src = currentImage; 
  };

  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '300px', 
    transform: `rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) ${
      filter === 'grayscale' ? 'grayscale(100%)' :
      filter === 'sepia' ? 'sepia(100%)' :
      filter === 'blur' ? 'blur(2px)' :
      filter === 'saturate' ? 'saturate(200%)' : ''
    }`
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Image</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isCropping && (
              <Typography variant="body2" color="text.secondary" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: 1, borderRadius: 1, textAlign: 'center'}}>
                Click & drag to select crop area, then "Apply Crop".
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '320px', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden', position: 'relative'}}>
              {isCropping ? (
                <ReactCrop
                  crop={crop ?? undefined} 
                  onChange={c => setCrop(c)}
                >
                  <img
                    key={`crop-${previewKey}`} 
                    ref={el => el && setImgRef(el)} // Ensure ref is correctly passed
                    src={currentImage} 
                    alt="Crop Preview"
                    style={imageStyle} 
                    onLoad={onImageLoad}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              ) : (
                <img
                  key={`nocrop-${previewKey}`}
                  src={currentImage}
                  alt="Preview"
                  style={imageStyle}
                  crossOrigin="anonymous"
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Tooltip title="Rotate Left"><IconButton onClick={() => handleRotate('left')} color="primary"><RotateLeftIcon /></IconButton></Tooltip>
            <Tooltip title="Rotate Right"><IconButton onClick={() => handleRotate('right')} color="primary"><RotateRightIcon /></IconButton></Tooltip>
            <Tooltip title={isCropping ? "Cancel Crop" : "Crop Tool"}><IconButton onClick={() => setIsCropping(!isCropping)} color={isCropping ? "secondary" : "primary"}><CropIcon /></IconButton></Tooltip>
          </Box>

          <FormControl fullWidth>
            <FormLabel>Brightness ({brightness}%)</FormLabel>
            <Slider value={brightness} onChange={handleBrightnessChange} min={0} max={200} step={1} marks valueLabelDisplay="auto" />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Contrast ({contrast}%)</FormLabel>
            <Slider value={contrast} onChange={handleContrastChange} min={0} max={200} step={1} marks valueLabelDisplay="auto" />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Filter</FormLabel>
            <Select value={filter} onChange={handleFilterChange} startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}>
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="grayscale">Grayscale</MenuItem>
              <MenuItem value="sepia">Sepia</MenuItem>
              <MenuItem value="blur">Blur (2px)</MenuItem>
              <MenuItem value="saturate">Saturate (200%)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{flexWrap: 'wrap', justifyContent:'center', p:2}}>
        <Button onClick={handleResetToOriginal} variant="outlined" color="error">Reset Original</Button>
        <Button onClick={handleReset} variant="outlined" color="warning">Reset Current</Button>
        {isCropping && (<Button onClick={applyCrop} variant="contained" color="primary">Apply Crop</Button>)}
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={applyEdits} variant="contained" color="primary">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    const conversionResult = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }); 
    const jpegBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    return new File([jpegBlob as BlobPart], file.name.replace(/\.(heic|HEIC)$/i, '.jpg'), { type: 'image/jpeg' });
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw error; 
  }
};

const predefinedWatermarkColors = [
  { name: 'Gray', value: '#808080' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#008000' },
  { name: 'Black', value: '#000000' },
];

const predefinedSignatureColors = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#008000' },
  { name: 'Gray', value: '#808080' },
];


const MuiImageToPdfTool: React.FC = () => {
  const themeContext = React.useContext(ThemeContext);
  const darkMode = themeContext?.darkMode ?? false;

  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      secondary: {
        main: '#f50057',
      },
      background: darkMode
        ? {
            default: '#18181b',
            paper: '#23272f',
          }
        : {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
      text: darkMode
        ? {
            primary: '#e5e7ef',
            secondary: '#a3a3a3',
            disabled: 'rgba(255,255,255,0.5)',
          }
        : {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
            disabled: 'rgba(0, 0, 0, 0.38)',
          },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 24px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  }), [darkMode]);

  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string} | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [originalPreviews, setOriginalPreviews] = useState<string[]>([]); 
  const [borderSpacing, setBorderSpacing] = useState(10); 
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [watermark, setWatermark] = useState('');
  const [watermarkFontSize, setWatermarkFontSize] = useState(50);
  const [watermarkColor, setWatermarkColor] = useState('#808080'); // Default to gray
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [pageNumbers, setPageNumbers] = useState(false);
  const [addWatermark, setAddWatermark] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [heicConverting, setHeicConverting] = useState(false);
  const [heicConversionProgress, setHeicConversionProgress] = useState(0);
  const [addSignature, setAddSignature] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [signatureFontSize, setSignatureFontSize] = useState(12);
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [signaturePosition, setSignaturePosition] = useState('bottom-right');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [pageNumberStyle, setPageNumberStyle] = useState('bottom-right');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [headerFontSize, setHeaderFontSize] = useState(10);
  const [footerFontSize, setFooterFontSize] = useState(10);
  const [addHeaderFooter, setAddHeaderFooter] = useState(false);

  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingImageIndex(null);
  };

  const handleEditSave = async (editedImageBlobUrl: string, index: number) => {
    try {
      const response = await fetch(editedImageBlobUrl);
      const blob = await response.blob();
      const originalFile = files[index];
      const newFileName = originalFile.name.replace(/\.[^/.]+$/, "") + ".jpg"; 
      const editedFile = new File([blob], newFileName, { type: 'image/jpeg' });

      setPreviews(prev => { const newPreviews = [...prev]; newPreviews[index] = editedImageBlobUrl; return newPreviews; });
      setFiles(prev => { const newFiles = [...prev]; newFiles[index] = editedFile; return newFiles; });
    } catch (err) {
      console.error('Error saving edited image:', err);
      setError('Failed to save edited image. Please try again.');
    }
  };

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
    
    const unsupportedFiles = droppedFiles.filter(file => 
        !(supportedTypes.includes(file.type.toLowerCase()) || file.name.toLowerCase().endsWith('.heic'))
    );
    if (unsupportedFiles.length > 0) {
      setNotification({ type: 'error', message: `Unsupported file type(s): ${unsupportedFiles.map(f => f.name).join(', ')}. Please upload JPG, PNG, WEBP, HEIC, or GIF.` });
      return;
    }
    setError(null); setNotification(null);
    await handleFiles(droppedFiles);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index?: number) => {
    e.preventDefault();
    if (index === undefined || draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const newPreviews = [...previews];
    const newOriginalPreviews = [...originalPreviews];

    const draggedFile = newFiles.splice(draggedIndex, 1)[0];
    const draggedPreview = newPreviews.splice(draggedIndex, 1)[0];
    const draggedOriginalPreview = newOriginalPreviews.splice(draggedIndex,1)[0];

    newFiles.splice(index, 0, draggedFile);
    newPreviews.splice(index, 0, draggedPreview);
    newOriginalPreviews.splice(index,0,draggedOriginalPreview);

    setFiles(newFiles);
    setPreviews(newPreviews);
    setOriginalPreviews(newOriginalPreviews);
    setDraggedIndex(index);
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
    
    const unsupportedFiles = selectedFiles.filter(file => 
        !(supportedTypes.includes(file.type.toLowerCase()) || file.name.toLowerCase().endsWith('.heic'))
    );
    if (unsupportedFiles.length > 0) {
      setNotification({ type: 'error', message: `Unsupported file type(s): ${unsupportedFiles.map(f => f.name).join(', ')}. Please upload JPG, PNG, WEBP, HEIC, or GIF.` });
      return;
    }
    setError(null); setNotification(null);
    await handleFiles(selectedFiles);
    if (event.target) event.target.value = ''; 
  }, []);

  const handleFiles = useCallback(async (newFilesArray: File[]) => {
    const heicFiles = newFilesArray.filter(file => file.type.toLowerCase() === 'image/heic' || file.name.toLowerCase().endsWith('.heic'));
    if (heicFiles.length > 0) { 
      setHeicConverting(true); 
      setHeicConversionProgress(0); 
    }

    const currentFiles: File[] = [];
    const currentPreviews: string[] = [];
    const currentOriginalPreviews: string[] = [];
    let heicProcessedCount = 0;

    for (const file of newFilesArray) {
      try {
        let processedFile = file;
        if (file.type.toLowerCase() === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
          processedFile = await convertHeicToJpeg(file);
          heicProcessedCount++;
          if (heicFiles.length > 0) {
            setHeicConversionProgress((heicProcessedCount / heicFiles.length) * 100);
          }
        }
        const previewUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(new Error("File reading error"));
          reader.readAsDataURL(processedFile);
        });
        currentFiles.push(processedFile);
        currentPreviews.push(previewUrl);
        currentOriginalPreviews.push(previewUrl); 
      } catch(fileError: any) {
         console.error("Error processing file:", file.name, fileError);
         setError(`Error processing file ${file.name}: ${fileError.message}. Skipped.`);
      }
    }
    
    setFiles(prev => [...prev, ...currentFiles]);
    setPreviews(prev => [...prev, ...currentPreviews]);
    setOriginalPreviews(prev => [...prev, ...currentOriginalPreviews]);

    if (heicFiles.length > 0) { 
      setHeicConverting(false); 
    }
  }, []);


  const removeFile = useCallback((index: number) => {
    const previewToRemove = previews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
        URL.revokeObjectURL(previewToRemove);
    }
    const originalPreviewToRemove = originalPreviews[index];
     if (originalPreviewToRemove && originalPreviewToRemove.startsWith('blob:')) {
        URL.revokeObjectURL(originalPreviewToRemove);
    }

    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setOriginalPreviews(prev => prev.filter((_, i) => i !== index));
  }, [previews, originalPreviews]);

  const convertToPdf = async (compressionLevel = 'normal') => {
    if (files.length === 0) return;
    setConverting(true); setProgress(0); setError(null);

    try {
      const pdf = new jsPDF({ orientation: orientation as 'portrait' | 'landscape', unit: 'mm', format: pageSize });
      let imageQuality: number; let maxDimension: number;
      switch (compressionLevel) {
        case 'compressed': imageQuality = 0.6; maxDimension = 1200; break;
        case 'ultra': imageQuality = 0.3; maxDimension = 800; break;
        default: imageQuality = 1; maxDimension = 3000; break;
      }

      for (let i = 0; i < files.length; i++) {
        const imgSrc = previews[i]; 
        const img = new Image();
        img.crossOrigin = "anonymous"; // Important for canvas with blob URLs
        img.src = imgSrc;
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = (e) => reject(new Error("Image load error for PDF conversion")); });

        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        if(!ctx) throw new Error("Could not get canvas context");

        let newWidth = img.naturalWidth; let newHeight = img.naturalHeight;
        if (img.naturalWidth > maxDimension || img.naturalHeight > maxDimension) {
          const ratio = Math.min(maxDimension / img.naturalWidth, maxDimension / img.naturalHeight);
          newWidth = Math.round(img.naturalWidth * ratio); newHeight = Math.round(img.naturalHeight * ratio);
        }
        canvas.width = newWidth; canvas.height = newHeight;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const compressedImageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', imageQuality));
        if(!compressedImageBlob) throw new Error("Could not create blob from canvas");

        const compressedImg = new Image();
        compressedImg.crossOrigin = "anonymous";
        const compressedImgSrc = URL.createObjectURL(compressedImageBlob);
        compressedImg.src = compressedImgSrc;
        await new Promise<void>((resolve, reject) => { compressedImg.onload = () => resolve(); compressedImg.onerror = (e) => reject(new Error("Compressed image load error")); });

        const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
        const availableWidth = pageWidth - (2 * borderSpacing); const availableHeight = pageHeight - (2 * borderSpacing);
        let finalWidth, finalHeight;
        if (maintainAspectRatio) {
          const ratio = Math.min(availableWidth / compressedImg.naturalWidth, availableHeight / compressedImg.naturalHeight);
          finalWidth = compressedImg.naturalWidth * ratio; finalHeight = compressedImg.naturalHeight * ratio;
        } else {
          finalWidth = availableWidth; finalHeight = availableHeight;
        }
        const x = (pageWidth - finalWidth) / 2; const y = (pageHeight - finalHeight) / 2;
        if (i > 0) pdf.addPage(pageSize, orientation as 'portrait' | 'landscape');
        
        pdf.addImage(compressedImg, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
        URL.revokeObjectURL(compressedImgSrc); 

        pdf.setTextColor(0,0,0); // Reset to black for subsequent text
        if (addHeaderFooter && headerText.trim() !== '') { pdf.setFontSize(headerFontSize); pdf.text(headerText, pageWidth / 2, 10, { align: 'center' }); }
        if (addHeaderFooter && footerText.trim() !== '') { pdf.setFontSize(footerFontSize); pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' }); }
        
        pdf.setTextColor(0,0,0); // Explicitly set page number color to black
        if (pageNumbers) {
            pdf.setFontSize(10);
            let pnX, pnY, pnAlign: "left" | "center" | "right" | "justify" | undefined;
            switch(pageNumberStyle){
                case 'bottom-center': pnX = pageWidth/2; pnY = pageHeight - 10; pnAlign = 'center'; break;
                case 'top-right': pnX = pageWidth - 10; pnY = 10; pnAlign = 'right'; break;
                case 'top-center': pnX = pageWidth/2; pnY = 10; pnAlign = 'center'; break;
                default: pnX = pageWidth - 10; pnY = pageHeight - 10; pnAlign = 'right'; break; // bottom-right
            }
            pdf.text(`Page ${i + 1}`, pnX, pnY, { align: pnAlign });
        }
        
        if (addWatermark && watermark.trim() !== '') { 
            pdf.setFontSize(watermarkFontSize);
            pdf.setTextColor(watermarkColor); 
            const watermarkTextOptions: any = { angle: -45, align: 'center', opacity: watermarkOpacity }; // jsPDF types might not have opacity directly here
            pdf.saveGraphicsState();
            pdf.setGState(new (pdf as any).GState({opacity: watermarkOpacity})); // Use GState for opacity
            pdf.text(watermark, pageWidth/2, pageHeight/2, watermarkTextOptions);
            pdf.restoreGraphicsState();
        }

        pdf.setTextColor(0,0,0); // Reset to black
        if (addSignature && signatureText.trim() !== '') { 
            pdf.setFontSize(signatureFontSize);
            pdf.setTextColor(signatureColor);
            let sigX, sigY, sigAlign: "left" | "center" | "right" | "justify" | undefined;
            const margin = 10;
             switch(signaturePosition){
                case 'bottom-center': sigX = pageWidth/2; sigY = pageHeight - margin; sigAlign = 'center'; break;
                case 'bottom-left': sigX = margin; sigY = pageHeight - margin; sigAlign = 'left'; break;
                case 'top-right': sigX = pageWidth - margin; sigY = margin; sigAlign = 'right'; break;
                case 'top-center': sigX = pageWidth/2; sigY = margin; sigAlign = 'center'; break;
                case 'top-left': sigX = margin; sigY = margin; sigAlign = 'left'; break;
                default: sigX = pageWidth - margin; sigY = pageHeight - margin; sigAlign = 'right'; break; // bottom-right
            }
            pdf.text(signatureText, sigX, sigY, {align: sigAlign});
        }
        setProgress(((i + 1) / files.length) * 100);
      }
      let filename = 'image-to-pdf-maker.pdf';
      if (compressionLevel === 'compressed') filename = 'image-to-pdf-maker-compressed.pdf';
      else if (compressionLevel === 'ultra') filename = 'image-to-pdf-maker-email.pdf';
      pdf.save(filename);
      setTimeout(() => { setConverting(false); }, 1000); 
    } catch (err: any) {
      console.error("PDF Conversion Error:", err);
      setError('Failed to convert images to PDF: ' + err.message);
      setConverting(false);
    }
  };
  
  const generatePdfPreview = async () => { 
    if (files.length === 0) return;
    setPreviewOpen(true); setPreviewLoading(true); setError(null);
     try {
      const pdf = new jsPDF({ orientation: orientation as 'portrait' | 'landscape', unit: 'mm', format: pageSize });
      for (let i = 0; i < files.length; i++) {
        const imgSrc = previews[i]; 
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgSrc;
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = (e) => reject(new Error("Image load error for preview")); });

        const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
        const availableWidth = pageWidth - (2 * borderSpacing); const availableHeight = pageHeight - (2 * borderSpacing);
        let newWidth, newHeight;
        if (maintainAspectRatio) {
          const ratio = Math.min(availableWidth / img.naturalWidth, availableHeight / img.naturalHeight);
          newWidth = img.naturalWidth * ratio; newHeight = img.naturalHeight * ratio;
        } else {
          newWidth = availableWidth; newHeight = availableHeight;
        }
        const x = (pageWidth - newWidth) / 2; const y = (pageHeight - newHeight) / 2;
        if (i > 0) pdf.addPage(pageSize, orientation as 'portrait' | 'landscape');
        pdf.addImage(img, 'JPEG', x, y, newWidth, newHeight, undefined, 'FAST'); 
        
        pdf.setTextColor(0,0,0); // Reset to black
        if (addHeaderFooter && headerText.trim() !== '') { pdf.setFontSize(headerFontSize); pdf.text(headerText, pageWidth / 2, 10, { align: 'center' }); }
        if (addHeaderFooter && footerText.trim() !== '') { pdf.setFontSize(footerFontSize); pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' }); }
        
        pdf.setTextColor(0,0,0); // Explicitly set page number color to black
        if (pageNumbers) { 
            pdf.setFontSize(10);
            let pnX, pnY, pnAlign: "left" | "center" | "right" | "justify" | undefined;
             switch(pageNumberStyle){ /* ... same as convertToPdf ... */ 
                case 'bottom-center': pnX = pageWidth/2; pnY = pageHeight - 10; pnAlign = 'center'; break;
                case 'top-right': pnX = pageWidth - 10; pnY = 10; pnAlign = 'right'; break;
                case 'top-center': pnX = pageWidth/2; pnY = 10; pnAlign = 'center'; break;
                default: pnX = pageWidth - 10; pnY = pageHeight - 10; pnAlign = 'right'; break;
            }
            pdf.text(`Page ${i + 1}`, pnX, pnY, { align: pnAlign });
        }
        
        if (addWatermark && watermark.trim() !== '') { 
            pdf.setFontSize(watermarkFontSize);
            pdf.setTextColor(watermarkColor);
            pdf.saveGraphicsState();
            pdf.setGState(new (pdf as any).GState({opacity: watermarkOpacity}));
            pdf.text(watermark, pageWidth/2, pageHeight/2, {angle: -45, align: 'center'});
            pdf.restoreGraphicsState();
        }

        pdf.setTextColor(0,0,0); // Reset to black
        if (addSignature && signatureText.trim() !== '') { 
            pdf.setFontSize(signatureFontSize);
            pdf.setTextColor(signatureColor);
            let sigX, sigY, sigAlign: "left" | "center" | "right" | "justify" | undefined;
            const margin = 10;
            switch(signaturePosition){ /* ... same as convertToPdf ... */ 
                case 'bottom-center': sigX = pageWidth/2; sigY = pageHeight - margin; sigAlign = 'center'; break;
                case 'bottom-left': sigX = margin; sigY = pageHeight - margin; sigAlign = 'left'; break;
                case 'top-right': sigX = pageWidth - margin; sigY = margin; sigAlign = 'right'; break;
                case 'top-center': sigX = pageWidth/2; sigY = margin; sigAlign = 'center'; break;
                case 'top-left': sigX = margin; sigY = margin; sigAlign = 'left'; break;
                default: sigX = pageWidth - margin; sigY = pageHeight - margin; sigAlign = 'right'; break;
            }
            pdf.text(signatureText, sigX, sigY, {align: sigAlign});
        }
      }
      const pdfBlob = pdf.output('blob');
      const currentPreviewUrl = URL.createObjectURL(pdfBlob);
      setPreviewUrl(currentPreviewUrl);
    } catch (err: any) {
      console.error("PDF Preview Generation Error:", err);
      setError('Failed to generate PDF preview: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnd = () => setDraggedIndex(null);
  const handleClosePreview = () => { 
    setPreviewOpen(false); 
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } 
  };

  const NotificationComponent = ({ notification: currentNotification, onClose }: { notification: {type: 'success' | 'error' | 'warning' | 'info', message: string} | null, onClose: () => void}) => {
    if (!currentNotification) return null;
    return <Alert severity={currentNotification.type} onClose={onClose} sx={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, minWidth: 300 }}>{currentNotification.message}</Alert>;
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: muiTheme.palette.background.default, p: {xs: 1, sm: 2} }}>
        <NotificationComponent notification={notification} onClose={() => setNotification(null)} />
        <Container maxWidth="lg" sx={{ flex: 1, py: {xs:1, sm:2, md:3} }}>
          <Box sx={{ my: {xs: 2, md: 3} }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: muiTheme.palette.text.primary, fontWeight: 600, mb: 1, fontSize: {xs: '1.8rem', sm: '2.125rem'} }}>Image to PDF Converter</Typography>
            <Typography variant="subtitle1" align="center" sx={{ color: 'text.secondary', mb: {xs:3, md:4}, fontWeight: 'bold' }}>Convert images (PNG, JPG, WEBP, HEIC, GIF) to PDF with advanced options.</Typography>

            <DropZone onDrop={handleDrop} onDragOver={(e)=>e.preventDefault()} component="label" htmlFor="file-upload-input-mui">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CloudUploadIcon sx={{ fontSize: {xs:48, sm:64}, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontSize: {xs: '1rem', sm: '1.25rem'} }}>Drag & drop images or</Typography>
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} sx={{ px: {xs:3, sm:4}, py: {xs:1, sm:1.5}, fontSize: {xs: '0.9rem', sm: '1rem'} }}>
                  Choose Files
                  <VisuallyHiddenInput id="file-upload-input-mui" type="file" multiple accept="image/png,image/jpeg,image/webp,image/heic,.heic,image/gif" onChange={handleFileSelect} />
                </Button>
              </Box>
            </DropZone>

            {heicConverting && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="h6" color="primary" gutterBottom>Converting HEIC Files... ({Math.round(heicConversionProgress)}%)</Typography>
                <StyledLinearProgress variant="determinate" value={heicConversionProgress} sx={{ mt: 2, maxWidth: '400px', mx: 'auto' }}/>
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

            {files.length > 0 && (
              <Paper sx={{ mt: 3, p: {xs: 2, md:3} }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>PDF Settings</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>Page Layout</Typography>
                    <FormControl fullWidth sx={{mb:2}}><FormLabel>Page Size</FormLabel><Select value={pageSize} onChange={(e) => setPageSize(e.target.value)} size="small"><MenuItem value="a4">A4</MenuItem><MenuItem value="letter">Letter</MenuItem><MenuItem value="legal">Legal</MenuItem></Select></FormControl>
                    <FormControl fullWidth><FormLabel>Orientation</FormLabel><Select value={orientation} onChange={(e) => setOrientation(e.target.value)} size="small"><MenuItem value="portrait">Portrait</MenuItem><MenuItem value="landscape">Landscape</MenuItem></Select></FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>Image Settings</Typography>
                    <FormControlLabel control={<Switch checked={maintainAspectRatio} onChange={(e) => setMaintainAspectRatio(e.target.checked)}/>} label="Maintain Aspect Ratio" sx={{mb:1, display:'block'}}/>
                    <FormLabel>Border Spacing: {borderSpacing}mm</FormLabel><Slider value={borderSpacing} onChange={(_, val) => setBorderSpacing(val as number)} min={0} max={30} step={1} marks valueLabelDisplay="auto"/>
                  </Grid>
                 <Grid item xs={12}><Divider sx={{my:1}}/></Grid>
                  <Grid item xs={12} md={6}>
                     <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>Header & Footer</Typography>
                     <FormControlLabel control={<Switch checked={addHeaderFooter} onChange={(e) => setAddHeaderFooter(e.target.checked)}/>} label="Add Header/Footer" sx={{mb:1, display:'block'}}/>
                     {addHeaderFooter && <>
                        <TextField fullWidth label="Header Text" value={headerText} onChange={e=>setHeaderText(e.target.value)} sx={{mb:1}} variant="outlined" size="small"/>
                        <FormLabel>Header Font Size: {headerFontSize}pt</FormLabel><Slider value={headerFontSize} onChange={(_,v)=>setHeaderFontSize(v as number)} min={8} max={24} step={1} marks valueLabelDisplay="auto" sx={{mb:1}}/>
                        <TextField fullWidth label="Footer Text" value={footerText} onChange={e=>setFooterText(e.target.value)} sx={{mb:1}} variant="outlined" size="small"/>
                        <FormLabel>Footer Font Size: {footerFontSize}pt</FormLabel><Slider value={footerFontSize} onChange={(_,v)=>setFooterFontSize(v as number)} min={8} max={24} step={1} marks valueLabelDisplay="auto"/>
                     </>}
                  </Grid>
                   <Grid item xs={12} md={6}>
                     <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>Page Numbers</Typography>
                     <FormControlLabel control={<Switch checked={pageNumbers} onChange={(e) => setPageNumbers(e.target.checked)}/>} label="Add Page Numbers" sx={{mb:1, display:'block'}}/>
                     {pageNumbers && <FormControl fullWidth><FormLabel>Style</FormLabel><Select value={pageNumberStyle} onChange={e=>setPageNumberStyle(e.target.value)} size="small"><MenuItem value="bottom-right">Bottom Right</MenuItem><MenuItem value="bottom-center">Bottom Center</MenuItem><MenuItem value="top-right">Top Right</MenuItem><MenuItem value="top-center">Top Center</MenuItem></Select></FormControl>}
                  </Grid>
                  <Grid item xs={12}><Divider sx={{my:1}}/></Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>Watermark</Typography>
                    <FormControlLabel control={<Switch checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)}/>} label="Add Watermark" sx={{mb:1, display:'block'}}/>
                    {addWatermark && <>
                        <TextField fullWidth label="Watermark Text" value={watermark} onChange={e=>setWatermark(e.target.value)} sx={{mb:1}} variant="outlined" size="small"/>
                        <FormLabel sx={{mb:1, display:'block'}}>Color</FormLabel>
                        <Box sx={{ display: 'flex', gap: 1, mb:1, alignItems: 'center' }}>
                            {predefinedWatermarkColors.map(color => (
                                <Tooltip title={color.name} key={color.value}>
                                <Button
                                    variant='outlined'
                                    onClick={()=>setWatermarkColor(color.value)}
                                    sx={{
                                        minWidth:30, width:30, height:30, p:0,
                                        bgcolor: color.value,
                                        borderColor: watermarkColor === color.value ? muiTheme.palette.primary.dark : color.value, // Highlight border
                                        borderWidth: watermarkColor === color.value ? '2px' : '1px',
                                        boxShadow: watermarkColor === color.value ? `0 0 8px ${alpha(color.value, 0.7)}` : 'none',
                                        '&:hover': { bgcolor: alpha(color.value, 0.8), borderColor: muiTheme.palette.primary.light }
                                    }}
                                />
                                </Tooltip>
                            ))}
                             <input 
                                type="color" 
                                value={watermarkColor} 
                                onChange={(e) => setWatermarkColor(e.target.value)}
                                style={{ marginLeft: '8px', width: '30px', height: '30px', border: 'none', cursor: 'pointer', padding:0, background: 'none' }}
                                title="Custom Color"
                            />
                             <Box sx={{width:24, height:24, backgroundColor: watermarkColor, border:'1px solid grey', ml:1, borderRadius:'4px'}}/>
                        </Box>
                        <FormLabel>Opacity: {Math.round(watermarkOpacity*100)}%</FormLabel><Slider value={watermarkOpacity} onChange={(_,v)=>setWatermarkOpacity(v as number)} min={0.1} max={1} step={0.1} marks valueLabelDisplay="auto" sx={{mb:1}}/>
                        <FormLabel>Font Size: {watermarkFontSize}px</FormLabel><Slider value={watermarkFontSize} onChange={(_,v)=>setWatermarkFontSize(v as number)} min={30} max={100} step={1} marks valueLabelDisplay="auto"/>
                    </>}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>Signature</Typography>
                    <FormControlLabel control={<Switch checked={addSignature} onChange={(e) => setAddSignature(e.target.checked)}/>} label="Add Signature" sx={{mb:1, display:'block'}}/>
                     {addSignature && <>
                        <TextField fullWidth label="Signature Text" value={signatureText} onChange={e=>setSignatureText(e.target.value)} sx={{mb:1}} variant="outlined" size="small"/>
                        <FormLabel sx={{mb:1, display:'block'}}>Color</FormLabel>
                        <Box sx={{ display: 'flex', gap: 1, mb:1, alignItems: 'center' }}>
                            {predefinedSignatureColors.map(color => (
                                <Tooltip title={color.name} key={color.value}>
                                <Button 
                                    variant='outlined'
                                    onClick={()=>setSignatureColor(color.value)} 
                                    sx={{
                                        minWidth:30,width:30,height:30,p:0, bgcolor:color.value, 
                                        borderColor: signatureColor === color.value ? muiTheme.palette.primary.dark : color.value,
                                        borderWidth: signatureColor === color.value ? '2px' : '1px',
                                        boxShadow: signatureColor === color.value ? `0 0 8px ${alpha(color.value, 0.7)}` : 'none',
                                        '&:hover':{bgcolor:alpha(color.value, 0.8), borderColor: muiTheme.palette.primary.light}
                                    }}/>
                                </Tooltip>
                            ))}
                            <input 
                                type="color" 
                                value={signatureColor} 
                                onChange={(e) => setSignatureColor(e.target.value)}
                                style={{ marginLeft: '8px', width: '30px', height: '30px', border: 'none', cursor: 'pointer', padding:0, background: 'none' }}
                                title="Custom Signature Color"
                            />
                            <Box sx={{width:24, height:24, backgroundColor: signatureColor, border:'1px solid grey', ml:1, borderRadius:'4px'}}/>
                        </Box>
                        <FormLabel>Font Size: {signatureFontSize}pt</FormLabel><Slider value={signatureFontSize} onChange={(_,v)=>setSignatureFontSize(v as number)} min={8} max={24} step={1} marks valueLabelDisplay="auto" sx={{mb:1}}/>
                        <FormControl fullWidth><FormLabel>Position</FormLabel><Select value={signaturePosition} onChange={e=>setSignaturePosition(e.target.value)} size="small"><MenuItem value="bottom-right">Bottom Right</MenuItem><MenuItem value="bottom-center">Bottom Center</MenuItem><MenuItem value="bottom-left">Bottom Left</MenuItem><MenuItem value="top-right">Top Right</MenuItem><MenuItem value="top-center">Top Center</MenuItem><MenuItem value="top-left">Top Left</MenuItem></Select></FormControl>
                     </>}
                  </Grid>
                </Grid>
              </Paper>
            )}

            {previews.length > 0 && ( <>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3, mb: 1, fontStyle: 'italic' }}>Drag images to reorder. Click edit icon on image for more options.</Typography>
                <Grid container spacing={{xs:1.5, sm:2}} sx={{ mt: 1, mb: 4}}>
                    {previews.map((preview, index) => (
                    <Grid item xs={12} sm={6} md={4} key={preview + index + files[index]?.name} 
                        draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}
                        sx={{ opacity: draggedIndex === index ? 0.5 : 1, cursor:'grab'}}>
                        <ImagePreviewContainer>
                          <Box sx={{position:'relative'}}>
                            <ImagePreview src={preview} alt={`${files[index]?.name || `Image ${index+1}`} preview`} draggable={false} />
                            <ActionOverlay className="action-overlay" onClick={() => removeFile(index)} sx={{ top: muiTheme.spacing(0.5), right: muiTheme.spacing(0.5) }}><DeleteIcon sx={{ color: 'white', fontSize: '1.2rem' }} /></ActionOverlay>
                            <ActionOverlay className="action-overlay" onClick={() => handleEditImage(index)} sx={{ top: muiTheme.spacing(0.5), left: muiTheme.spacing(0.5), backgroundColor: alpha(muiTheme.palette.primary.main, 0.9), '&:hover': { backgroundColor: muiTheme.palette.primary.main}}}><EditIcon sx={{ color: 'white', fontSize: '1.2rem' }} /></ActionOverlay>
                          </Box>
                         <Typography variant="caption" display="block" align="center" sx={{p:0.5, wordBreak: 'break-all', color: 'text.secondary'}}> {index+1}. {files[index]?.name} ({(files[index]?.size / 1024 / 1024).toFixed(2)} MB)</Typography>
                        </ImagePreviewContainer>
                    </Grid>
                    ))}
                </Grid>
            </>)}

            {converting && (<Box sx={{ mt: 3 }}><StyledLinearProgress variant="determinate" value={progress} /><Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>Converting... {Math.round(progress)}%</Typography></Box>)}

            {files.length > 0 && !converting && (
              <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: {xs:1, sm:2}, justifyContent: 'center', flexWrap: 'wrap', width: '100%'}}>
                  <Button variant="contained" onClick={generatePdfPreview} startIcon={<PreviewIcon />} size="large" sx={{flexGrow:1, minWidth:{xs:'150px', sm:'200px'}}}>Preview PDF</Button>
                  <Button variant="contained" onClick={() => convertToPdf('normal')} startIcon={<PdfIcon />} size="large" sx={{flexGrow:1, minWidth:{xs:'150px', sm:'200px'}}}>Download Full Size</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: {xs:1, sm:2}, justifyContent: 'center', flexWrap: 'wrap', width: '100%'}}>
                  <Button variant="contained" onClick={() => convertToPdf('compressed')} startIcon={<PdfIcon />} size="large" color="primary" sx={{flexGrow:1, minWidth:{xs:'150px', sm:'200px'}, bgcolor:'primary.light','&:hover':{bgcolor:'primary.main'}}}>Download Compressed</Button>
                  <Button variant="contained" onClick={() => convertToPdf('ultra')} startIcon={<PdfIcon />} size="large" color="secondary" sx={{flexGrow:1, minWidth:{xs:'150px', sm:'200px'}, bgcolor:'secondary.light','&:hover':{bgcolor:'secondary.main'}}}>Ultra Low Size (Email)</Button>
                </Box>
              </Box>
            )}

            <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh', maxHeight: '90vh' } }}>
              <DialogTitle>
                PDF Preview
                <IconButton onClick={handleClosePreview} sx={{position:'absolute', right:8, top:8, color: (theme) => theme.palette.grey[500]}}><DeleteIcon/></IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 0, height: 'calc(100% - 64px)', position: 'relative', overflow:'hidden' }}>
                {previewLoading && <Box sx={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:2, bgcolor:alpha(muiTheme.palette.background.paper, 0.9), position:'absolute',inset:0,zIndex:1}}><CircularProgress size={60} /><Typography variant="h6" color="primary">Generating Preview...</Typography></Box>}
                {previewUrl && <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />}
                 {!previewLoading && !previewUrl && error && <Box sx={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}><Alert severity="error">Could not load preview: {error}</Alert></Box>}
              </DialogContent>
            </Dialog>

            {editingImageIndex !== null && previews[editingImageIndex] && originalPreviews[editingImageIndex] && (
              <ImageEditDialog open={editDialogOpen} onClose={handleEditDialogClose} image={previews[editingImageIndex]} onSave={handleEditSave} index={editingImageIndex} originalImage={originalPreviews[editingImageIndex]} />
            )}

            {/* AdSense Ad for Image to PDF */}
            <AdSense 
              adSlot="6480016001" 
              adFormat="auto" 
              className="mt-8"
            />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default MuiImageToPdfTool;
