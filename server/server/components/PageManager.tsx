import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Trash2, RotateCw, Move } from 'lucide-react';

interface Page {
  id: string;
  pageNumber: number;
  isDeleted: boolean;
  rotation: number;
  orderNumber: number;
}

interface PageManagerProps {
  totalPages: number;
  onPageOperationsChange: (operations: {
    pageOrder: string;
    rotatePages: string;
    deletePages: string;
  }) => void;
  resetKey?: number;
}

const PageManager: React.FC<PageManagerProps> = ({ totalPages, onPageOperationsChange, resetKey = 0 }) => {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    // Initialize pages when totalPages changes or resetKey changes
    const initialPages: Page[] = Array.from({ length: totalPages }, (_, index) => ({
      id: `page-${index + 1}`,
      pageNumber: index + 1,
      isDeleted: false,
      rotation: 0,
      orderNumber: index + 1,
    }));
    setPages(initialPages);
  }, [totalPages, resetKey]);

  useEffect(() => {
    // Update parent component whenever pages change
    const activePages = pages.filter(page => !page.isDeleted);
    const deletedPages = pages.filter(page => page.isDeleted);
    const rotatedPages = pages.filter(page => page.rotation !== 0);

    const pageOrder = activePages.map(page => page.pageNumber).join(',');
    const rotatePages = rotatedPages.map(page => `${page.pageNumber}:${page.rotation}`).join(',');
    const deletePages = deletedPages.map(page => page.pageNumber).join(',');

    onPageOperationsChange({
      pageOrder: pageOrder || '',
      rotatePages: rotatePages || '',
      deletePages: deletePages || '',
    });
  }, [pages, onPageOperationsChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      orderNumber: index + 1,
    }));

    setPages(updatedItems);
  };

  const handleDeletePage = (pageId: string) => {
    setPages(prevPages => {
      // Toggle the deleted status
      const updatedPages = prevPages.map(page => 
        page.id === pageId 
          ? { ...page, isDeleted: !page.isDeleted }
          : page
      );
      
      // Recalculate order numbers for non-deleted pages
      let orderCounter = 1;
      const finalPages = updatedPages.map(page => ({
        ...page,
        orderNumber: page.isDeleted ? page.orderNumber : orderCounter++
      }));
      
      return finalPages;
    });
  };

  const handleRotatePage = (pageId: string) => {
    setPages(prevPages => 
      prevPages.map(page => 
        page.id === pageId 
          ? { ...page, rotation: (page.rotation + 90) % 360 }
          : page
      )
    );
  };

  const getRotationText = (rotation: number) => {
    switch (rotation) {
      case 90: return '90°';
      case 180: return '180°';
      case 270: return '270°';
      default: return '0°';
    }
  };

  const getRotationColor = (rotation: number) => {
    switch (rotation) {
      case 90: return 'text-blue-600';
      case 180: return 'text-purple-600';
      case 270: return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Page Manager ({totalPages} pages)
        </h3>
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Move size={16} className="text-gray-500" />
            <span>Drag to reorder</span>
          </div>
          <div className="flex items-center space-x-2">
            <RotateCw size={16} className="text-blue-500" />
            <span>Click to rotate</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trash2 size={16} className="text-red-500" />
            <span>Click to delete</span>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <StrictModeDroppable droppableId="pages">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {pages.map((page, index) => (
                <Draggable key={page.id} draggableId={page.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-200
                        ${page.isDeleted 
                          ? 'bg-red-50 border-red-300 opacity-60' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }
                        ${snapshot.isDragging ? 'shadow-lg scale-105' : 'shadow-sm'}
                        ${page.rotation !== 0 ? 'border-blue-300 dark:border-blue-600' : ''}
                      `}
                    >
                      {/* Drag Handle - Centered vertically */}
                      <div
                        {...provided.dragHandleProps}
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 cursor-move rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Move size={16} />
                      </div>

                      {/* Page Content */}
                      <div className="flex items-center justify-between ml-12">
                        <div className="flex items-center space-x-4">
                          {/* Page Number */}
                          <div className={`
                            text-lg font-bold
                            ${page.isDeleted ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}
                          `}>
                            PDF Page {page.pageNumber}
                          </div>

                          {/* Rotation Display */}
                          {page.rotation !== 0 && (
                            <div className={`
                              px-2 py-1 rounded text-sm font-medium
                              ${getRotationColor(page.rotation)}
                              bg-blue-50 dark:bg-blue-900/20
                            `}>
                              {getRotationText(page.rotation)}
                            </div>
                          )}

                          {/* Deleted Status */}
                          {page.isDeleted && (
                            <div className="px-2 py-1 rounded text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20">
                              Deleted
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {/* Rotate Button */}
                          <button
                            onClick={() => handleRotatePage(page.id)}
                            disabled={page.isDeleted}
                            className={`
                              p-2 rounded-lg transition-colors
                              ${page.isDeleted 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }
                            `}
                            title={`Rotate page ${page.pageNumber}`}
                          >
                            <RotateCw size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className={`
                              p-2 rounded-lg transition-colors
                              ${page.isDeleted 
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                : 'text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              }
                            `}
                            title={page.isDeleted ? `Restore page ${page.pageNumber}` : `Delete page ${page.pageNumber}`}
                          >
                            <Trash2 size={16} />
                          </button>

                          {/* Order Number - Only show for non-deleted pages */}
                          {!page.isDeleted && (
                            <div className={`
                              ml-4 px-3 py-1 rounded-full text-sm font-bold
                              bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300
                            `}>
                              Output Page #{page.orderNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Pages:</span>
            <span className="ml-2 font-medium">{totalPages}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Active Pages:</span>
            <span className="ml-2 font-medium">{pages.filter(p => !p.isDeleted).length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Rotated Pages:</span>
            <span className="ml-2 font-medium">{pages.filter(p => p.rotation !== 0).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageManager; 