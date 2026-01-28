
import React, { useState, useEffect } from 'react';
import { ValidatedFile, ExistingPostData } from '@/types/creative';
import { Button } from '@/components/ui/button';
import { Play, FileText, Instagram, Loader2 } from 'lucide-react';
import { getThumbnailDimensions } from '@/utils/thumbnailUtils';
import { useLazyThumbnail } from '@/hooks/useLazyThumbnail';
import { useFileCleanup } from '@/hooks/useFileCleanup';
import MetaZoneOverlay from './MetaZoneOverlay';

interface ThumbnailPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  file?: ValidatedFile;
  onPreviewClick: () => void;
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  enabled: boolean;
  urlMode?: boolean;
  existingPostData?: ExistingPostData;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  format,
  file,
  onPreviewClick,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  enabled,
  urlMode = false,
  existingPostData
}) => {
  // Get thumbnail dimensions for proper sizing
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  
  // File cleanup for memory management
  const { revokeUrl } = useFileCleanup();
  
  // Use lazy loading hook for thumbnail generation - ALWAYS call hooks first
  const { ref, thumbnailSrc, isLoading, error } = useLazyThumbnail({
    format,
    carouselMode,
    carouselAspectRatio,
    enabled: enabled && !file // Only generate for empty state
  });
  
  // Cleanup file preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (file?.preview) {
        revokeUrl(file.preview);
      }
    };
  }, [file?.preview, revokeUrl]);

  // Handle disabled state
  if (!enabled) {
    return (
      <div 
        className="flex items-center justify-center bg-disabled-bg rounded opacity-50"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-center">
          <FileText className="h-6 w-6 text-disabled-text mx-auto mb-1" />
          <span className="text-xs text-disabled-text">Desativado</span>
        </div>
      </div>
    );
  }

  // Handle URL mode (existing post) - Create Instagram-style thumbnail
  if (urlMode) {
    const createInstagramMockup = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Instagram solid background
        ctx.fillStyle = '#833AB4';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add Instagram icon placeholder
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📱', canvas.width / 2, canvas.height / 2 - 20);
        
        // Add text
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText('Instagram', canvas.width / 2, canvas.height / 2 + 15);
      }
      
      return canvas.toDataURL('image/png');
    };

    return (
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Button
          variant="ghost"
          className="w-full h-full p-0 hover:opacity-80 transition-opacity border-0"
          onClick={onPreviewClick}
        >
          <img
            src={createInstagramMockup()}
            alt="Instagram Post Preview"
            className="w-full h-full object-cover rounded"
          />
        </Button>
        
        {/* Status indicator */}
        <div className="absolute top-1 right-1">
          <div className={`w-3 h-3 rounded-full ${
            existingPostData?.valid ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>

        {/* Instagram indicator */}
        <div className="absolute top-1 left-1">
          <div className="bg-card bg-opacity-90 text-pink-600 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Instagram className="h-3 w-3" />
            <span>Post</span>
          </div>
        </div>
      </div>
    );
  }

  // Hook was moved to the top of the component to avoid conditional hook calls
  
  // Handle empty state (no file) - Show beautiful mockup for regular media
  if (!file) {
    return (
      <div ref={ref} className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Button
          variant="ghost"
          className="w-full h-full p-0 hover:opacity-80 transition-opacity border-0"
          onClick={onPreviewClick}
        >
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center rounded">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center rounded">
              <div className="bg-card/90 px-2 py-1 rounded text-xs font-bold text-red-700">
                Erro
              </div>
            </div>
          ) : thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={`Preview ${carouselMode 
                ? (carouselAspectRatio === '1:1' ? '1:1' : '4:5')
                : format
              }`}
              className="w-full h-full object-cover rounded"
              style={{ imageRendering: 'crisp-edges' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center rounded">
              <div className="bg-card/90 px-2 py-1 rounded text-sm font-bold text-muted-foreground">
                {carouselMode 
                  ? (carouselAspectRatio === '1:1' ? '1:1' : '4:5')
                  : (format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1')
                }
              </div>
            </div>
          )}
        </Button>
      </div>
    );
  }

  // Handle file preview with overlay
  const isVideo = file.file.type.startsWith('video/');
  const isValid = file.valid;

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
      <Button
        variant="ghost"
        className="w-full h-full p-0 hover:opacity-80 transition-opacity border-0"
        onClick={onPreviewClick}
        disabled={!isValid}
      >
        <div className="w-full h-full relative overflow-hidden rounded">
          {file.preview ? (
            <MetaZoneOverlay
              imageUrl={file.preview}
              format={format}
              file={file.file}
              size="thumbnail"
              carouselMode={carouselMode}
              carouselAspectRatio={carouselAspectRatio}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-thumbnail-bg">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {isVideo && file.preview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-card bg-opacity-90 rounded-full p-2">
                <Play className="h-4 w-4 text-gray-800 fill-current" />
              </div>
            </div>
          )}
        </div>
      </Button>
      
      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
};

export default ThumbnailPreview;
