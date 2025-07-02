import React, { useState, useCallback } from 'react';
import { ConversionTask, UploadedFile, ProcessedFile } from '../../types';
import BaseConversionView from './BaseConversionView';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, X } from 'lucide-react';
import Button from '../Button';
import FileUpload from '../FileUpload';
import { StrictModeDroppable } from '../StrictModeDroppable';

interface MergePdfViewProps {
  task: ConversionTask;
}

const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const MergePdfView: React.FC<MergePdfViewProps> = ({ task }) => {
  const [orderedFiles, setOrderedFiles] = useState<UploadedFile[]>([]);

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    const pdfFiles = newFiles.filter(f => f.file.type === 'application/pdf');
    
    // Create a Set of existing file IDs for quick lookup
    const existingFileIds = new Set(orderedFiles.map(f => f.id));
    
    // Filter out files that are already in the list
    const uniqueNewFiles = pdfFiles.filter(f => !existingFileIds.has(f.id));

    // Add a more robust unique ID to the new files only
    const filesWithUniqueIds = uniqueNewFiles.map(f => ({
        ...f,
        id: `${f.id}-${Math.random().toString(36).substring(2, 9)}`
    }));

    setOrderedFiles(currentFiles => [...currentFiles, ...filesWithUniqueIds]);
  };

  const handleRemoveFile = (fileId: string) => {
    setOrderedFiles(currentFiles => currentFiles.filter(f => f.id !== fileId));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = reorder(
      orderedFiles,
      result.source.index,
      result.destination.index
    );
    setOrderedFiles(items);
  };

  const performMergeConversion = async (
    filesToMerge: UploadedFile[],
    _options: Record<string, any>
  ): Promise<ProcessedFile[]> => {
    if (filesToMerge.length < 2) {
      throw new Error("Please upload at least two PDF files to merge.");
    }

    const formData = new FormData();
    filesToMerge.forEach(uploadedFile => {
      formData.append('files', uploadedFile.file, uploadedFile.file.name);
    });

    const response = await fetch('http://localhost:5001/convert/merge-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to merge PDFs.' }));
      throw new Error(errorData.error || 'Server error during merge');
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'merged.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }

    return [{
      id: `merged-${Date.now()}`,
      name: filename,
      type: 'PDF',
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      downloadUrl: downloadUrl,
    }];
  };

  const validateMergeFiles = (files: UploadedFile[]): string | null => {
    if (files.length < 2) {
      return "Please upload at least two PDF files to merge.";
    }
    return null;
  };

  const handleClear = () => {
    setOrderedFiles([]);
  }

  const renderReorderableFileList = () => {
    if (orderedFiles.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-md font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Files to Merge (Drag to Reorder)</h4>
        <DragDropContext onDragEnd={onDragEnd}>
          <StrictModeDroppable droppableId="droppable">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="divide-y divide-neutral-200 dark:divide-neutral-700 rounded-md border border-neutral-200 dark:border-neutral-700"
              >
                {orderedFiles.map((uploadedFile, index) => (
                  <Draggable key={uploadedFile.id} draggableId={uploadedFile.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-3 flex items-center justify-between bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                      >
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-5 h-5 text-neutral-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-xs" title={uploadedFile.file.name}>
                            {index + 1}. {uploadedFile.file.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                           <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                ({(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(uploadedFile.id)} aria-label="Remove file">
                                <X className="w-4 h-4 text-red-500"/>
                            </Button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </div>
    );
  };
  
  const customFileUpload = (
      <FileUpload
        onFilesChange={handleFilesAdded}
        multiple={true}
        accept=".pdf"
        uploadedFiles={orderedFiles}
        hideFileList={true}
        label={`Drag & drop PDF files here, or click to select`}
      />
  )

  return (
    <BaseConversionView
      task={task}
      performConversion={(files, options) => performMergeConversion(orderedFiles, options)}
      customValidation={() => validateMergeFiles(orderedFiles)}
      uploadedFiles={orderedFiles}
      hideDefaultFileUpload={true}
      onClearAll={handleClear}
    >
        {customFileUpload}
        {renderReorderableFileList()}
    </BaseConversionView>
  );
};

export default MergePdfView;
