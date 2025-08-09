'use client';

import { useState, useRef } from 'react';
import { uploadFile, uploadMultipleFiles } from '../lib/storage';
import { Upload, X, FileIcon, Image, Video, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (files: any[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  bucket?: string;
}

export function FileUpload({
  onUploadComplete,
  accept,
  multiple = false,
  maxSize = 100,
  bucket = 'uploads'
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${maxSize}MB limit`);
      return;
    }
    
    setError(null);
    setFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      if (multiple && files.length > 1) {
        // Upload multiple files
        const result = await uploadMultipleFiles(files, bucket);
        const successful = result.results.filter(r => r.success);
        setUploadedFiles(successful);
        
        if (onUploadComplete) {
          onUploadComplete(successful);
        }
      } else {
        // Upload single file
        const uploadedFile = await uploadFile(files[0], {
          bucket,
          onProgress: (progress) => {
            setUploadProgress({ [files[0].name]: progress });
          }
        });
        
        setUploadedFiles([uploadedFile]);
        
        if (onUploadComplete) {
          onUploadComplete([uploadedFile]);
        }
      }
      
      // Clear files after successful upload
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Validate file sizes
    const oversizedFiles = droppedFiles.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${maxSize}MB limit`);
      return;
    }
    
    setError(null);
    setFiles(droppedFiles);
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
        </p>
        <p className="text-xs text-gray-500">
          Maximum size: {maxSize}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={accept}
          multiple={multiple}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {uploadProgress[file.name] !== undefined && (
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`
            )}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Successfully
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.fileName}
                  </p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}