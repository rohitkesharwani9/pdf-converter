import { ReactNode } from 'react';
import { ConversionType } from './constants'; // Assuming ConversionType is an enum in constants

export interface NavLink {
  id: string; // Could be ConversionType or a general ID
  label: string;
  icon: ReactNode;
  category: string;
}

export interface ConversionOptionChoice {
  value: string | number;
  label: string;
}

export interface ConversionOption {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'number' | 'text' | 'password' | 'radio';
  defaultValue?: any;
  choices?: ConversionOptionChoice[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  info?: string; // Additional information text for the option
  error?: string; // To display a validation error message
  dependsOn?: {
    optionId: string;
    value: any;
  };
}

export interface ConversionTask {
  id: ConversionType;
  name: string;
  description: string;
  icon: ReactNode;
  categoryKey: string; // Key to group tasks, e.g., 'to-pdf', 'from-pdf'
  supportedInputTypes: string[]; // MIME types or extensions like '.jpg', '.docx'
  accept?: string; // For file input accept attribute
  supportedOutputFormats?: { value: string; label: string }[];
  options?: ConversionOption[];
  requiresFileUpload: boolean;
  allowMultipleFiles: boolean;
  isEditingTool?: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl?: string; // For images
}

export interface ProcessedFile {
  id: string;
  name: string;
  type: string; // e.g., 'PDF', 'JPG'
  size: string; // e.g., '2.5MB'
  downloadUrl: string; // Mock URL
}

export interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
    