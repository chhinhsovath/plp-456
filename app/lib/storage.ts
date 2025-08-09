// Storage Service for MinIO Integration
// This service handles file uploads to your VPS storage server

const STORAGE_API = process.env.NEXT_PUBLIC_STORAGE_API || 'http://157.10.73.52:3500';

export interface UploadResponse {
  success: boolean;
  bucket: string;
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface PresignedUrlResponse {
  url: string;
  bucket: string;
  fileName: string;
  expiry: number;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: string;
  etag: string;
}

export interface ListResponse {
  bucket: string;
  prefix: string;
  objects: FileInfo[];
  count: number;
}

/**
 * Upload a single file to storage
 */
export async function uploadFile(
  file: File,
  options?: {
    bucket?: string;
    fileName?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.bucket) {
    formData.append('bucket', options.bucket);
  }
  
  if (options?.fileName) {
    formData.append('fileName', options.fileName);
  }

  const response = await fetch(`${STORAGE_API}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload multiple files at once
 */
export async function uploadMultipleFiles(
  files: FileList | File[],
  bucket?: string
): Promise<{ results: Array<UploadResponse | { success: false; fileName: string; error: string }> }> {
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  
  if (bucket) {
    formData.append('bucket', bucket);
  }

  const response = await fetch(`${STORAGE_API}/upload-multiple`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a presigned URL for direct upload
 */
export async function getPresignedUploadUrl(
  fileName: string,
  bucket?: string,
  expiry?: number
): Promise<PresignedUrlResponse> {
  const response = await fetch(`${STORAGE_API}/presigned-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      bucket,
      expiry,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a presigned URL for download
 */
export async function getPresignedDownloadUrl(
  fileName: string,
  bucket?: string,
  expiry?: number
): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({
    fileName,
    ...(bucket && { bucket }),
    ...(expiry && { expiry: expiry.toString() }),
  });

  const response = await fetch(`${STORAGE_API}/presigned-download?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List files in a bucket
 */
export async function listFiles(
  bucket?: string,
  prefix?: string,
  maxKeys?: number
): Promise<ListResponse> {
  const params = new URLSearchParams({
    ...(bucket && { bucket }),
    ...(prefix && { prefix }),
    ...(maxKeys && { maxKeys: maxKeys.toString() }),
  });

  const response = await fetch(`${STORAGE_API}/list?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  fileName: string,
  bucket?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${STORAGE_API}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      bucket,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get file information
 */
export async function getFileInfo(
  fileName: string,
  bucket?: string
): Promise<{
  bucket: string;
  fileName: string;
  size: number;
  lastModified: string;
  etag: string;
  metaData: Record<string, string>;
}> {
  const params = new URLSearchParams({
    fileName,
    ...(bucket && { bucket }),
  });

  const response = await fetch(`${STORAGE_API}/info?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new bucket
 */
export async function createBucket(
  bucketName: string,
  region?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${STORAGE_API}/bucket/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketName,
      region,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create bucket: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all buckets
 */
export async function listBuckets(): Promise<{ buckets: Array<{ name: string; creationDate: string }> }> {
  const response = await fetch(`${STORAGE_API}/buckets`);

  if (!response.ok) {
    throw new Error(`Failed to list buckets: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload file directly using presigned URL
 */
export async function uploadWithPresignedUrl(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 204) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}