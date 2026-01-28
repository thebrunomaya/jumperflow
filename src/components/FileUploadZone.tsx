
import React from 'react';
import { Upload } from 'lucide-react';
import { JumperButton } from '@/components/ui/jumper-button';
import type { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';

interface FileUploadZoneProps {
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
  isValidating: boolean;
  dimensions: string;
  enabled?: boolean;
  onUploadClick?: () => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isValidating,
  dimensions,
  enabled = true,
  onUploadClick
}) => {
  if (!enabled) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-4 w-full opacity-60">
          <div className="flex items-center space-x-3 justify-center">
            <Upload className="h-8 w-8 text-disabled-text flex-shrink-0" />
            <div className="text-center">
              <p className="text-base font-medium text-disabled-text">
                Posicionamento desativado
              </p>
              <p className="text-sm text-disabled-text mt-1">
                {dimensions}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()}
      className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 ${
        isDragActive
        ? 'bg-upload-zone-hover border-accent'
        : 'hover:bg-upload-zone-hover'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center space-y-4 p-4 w-full">
        <div className="flex items-center space-x-3 justify-center">
          <Upload className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div className="text-center">
            <p className="text-base font-medium text-foreground">
              {isDragActive 
              ? 'Solte o arquivo aqui' 
              : 'Clique ou arraste uma imagem/vídeo'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, MP4, MOV • {dimensions}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Máx: 30MB (imagens) / 4GB (vídeos)
            </p>
          </div>
        </div>
        
        {isValidating && (
          <div className="flex items-center space-x-2 justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-jumper-orange"></div>
            <span className="text-sm text-jumper-orange">Validando...</span>
          </div>
        )}
        
        {onUploadClick && !isDragActive && !isValidating && (
          <div className="mt-4">
            <JumperButton 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick();
              }}
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Escolher arquivo
            </JumperButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
