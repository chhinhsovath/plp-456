# Media Storage Server Setup Guide

## Overview
This guide will help you set up your VPS (157.10.73.52) as a media storage server using MinIO, which will integrate with your Vercel-hosted application at https://mentor.openplp.com

## Architecture
- **Application**: Hosted on Vercel (https://mentor.openplp.com)
- **Storage Server**: Your VPS (157.10.73.52) running MinIO
- **Storage API**: Node.js API server for handling file uploads

## Step 1: Connect to Your VPS

```bash
ssh ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

## Step 2: Run the Setup Script

1. Copy the setup script to your server:
```bash
# On your local machine
scp scripts/setup-media-server.sh ubuntu@157.10.73.52:~/
```

2. Connect to server and run setup:
```bash
ssh ubuntu@157.10.73.52
chmod +x setup-media-server.sh
./setup-media-server.sh
```

3. **IMPORTANT**: Save the Access Key and Secret Key displayed after setup!

## Step 3: Configure Domain (Optional but Recommended)

If you have a domain for storage (e.g., storage.openplp.com):

1. Point your domain to your VPS IP (157.10.73.52)
2. Update Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/minio
# Replace 'storage.yourdomain.com' with your actual domain
# Replace 'console.yourdomain.com' with your console domain
```

3. Get SSL certificate:
```bash
sudo certbot --nginx -d storage.openplp.com -d console.openplp.com
```

## Step 4: Deploy Storage API Server on VPS

1. Copy API server files:
```bash
# On your local machine
scp scripts/storage-api-server.js ubuntu@157.10.73.52:~/
scp scripts/storage-package.json ubuntu@157.10.73.52:~/package.json
```

2. On the VPS, install and run:
```bash
ssh ubuntu@157.10.73.52
npm install
```

3. Create environment file:
```bash
nano .env
```

Add:
```env
PORT=3500
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your-access-key-from-setup
MINIO_SECRET_KEY=your-secret-key-from-setup
DEFAULT_BUCKET=uploads
```

4. Create systemd service for API:
```bash
sudo nano /etc/systemd/system/storage-api.service
```

Add:
```ini
[Unit]
Description=Storage API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/node storage-api-server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

5. Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable storage-api
sudo systemctl start storage-api
```

## Step 5: Integrate with Your Vercel App

### Add Environment Variables in Vercel

Go to your Vercel project settings and add:
```
STORAGE_API_URL=http://157.10.73.52:3500
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

### Create Storage Service in Your App

Create `app/lib/storage.ts`:
```typescript
const STORAGE_API = process.env.STORAGE_API_URL || 'http://157.10.73.52:3500';

export async function uploadFile(file: File, bucket?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (bucket) formData.append('bucket', bucket);

  const response = await fetch(`${STORAGE_API}/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function getPresignedUrl(fileName: string, bucket?: string) {
  const params = new URLSearchParams({
    fileName,
    ...(bucket && { bucket }),
  });

  const response = await fetch(`${STORAGE_API}/presigned-download?${params}`);
  return response.json();
}

export async function listFiles(bucket?: string, prefix?: string) {
  const params = new URLSearchParams({
    ...(bucket && { bucket }),
    ...(prefix && { prefix }),
  });

  const response = await fetch(`${STORAGE_API}/list?${params}`);
  return response.json();
}

export async function deleteFile(fileName: string, bucket?: string) {
  const response = await fetch(`${STORAGE_API}/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, bucket }),
  });

  return response.json();
}
```

### Example Upload Component

Create `app/components/FileUpload.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/storage';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      setUploadedUrl(result.url);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && (
        <div>
          <p>File uploaded successfully!</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        </div>
      )}
    </div>
  );
}
```

## Step 6: Configure CORS for Vercel

Update the storage API server to allow your Vercel domain:

```bash
ssh ubuntu@157.10.73.52
nano storage-api-server.js
```

Update CORS configuration:
```javascript
app.use(cors({
  origin: ['https://mentor.openplp.com', 'http://localhost:3000'],
  credentials: true
}));
```

## Step 7: Test the Setup

1. **Test MinIO directly**:
   - Access console: http://157.10.73.52:9001
   - Login with your access/secret keys

2. **Test API**:
```bash
# Upload test
curl -X POST http://157.10.73.52:3500/upload \
  -F "file=@test.jpg" \
  -F "bucket=uploads"

# List files
curl http://157.10.73.52:3500/list?bucket=uploads
```

3. **Test from your app**:
   - Deploy the storage service to Vercel
   - Test file upload from your application

## Using the Storage Client

For local management, use the storage client:

```bash
# Setup
chmod +x scripts/storage-client.sh
./scripts/storage-client.sh setup

# Create bucket
./scripts/storage-client.sh create-bucket photos

# Upload file
./scripts/storage-client.sh upload image.jpg photos

# List files
./scripts/storage-client.sh list photos
```

## Security Recommendations

1. **Change default ports**: Modify MinIO ports in production
2. **Use SSL**: Always use HTTPS in production
3. **Restrict access**: Use firewall rules to limit access
4. **Regular backups**: Set up automated backups of your data
5. **Monitor usage**: Keep track of storage usage and access logs

## Monitoring

Check service status:
```bash
# MinIO status
sudo systemctl status minio
sudo journalctl -u minio -f

# API server status
sudo systemctl status storage-api
sudo journalctl -u storage-api -f

# Nginx status
sudo systemctl status nginx
```

## Troubleshooting

1. **Cannot connect to MinIO**:
   - Check firewall: `sudo ufw status`
   - Check MinIO service: `sudo systemctl status minio`

2. **CORS errors**:
   - Update CORS settings in storage-api-server.js
   - Ensure Vercel domain is whitelisted

3. **Upload fails**:
   - Check disk space: `df -h`
   - Check permissions: `ls -la /mnt/data`

## Support

For issues or questions:
- MinIO Documentation: https://docs.min.io
- Check logs: `sudo journalctl -u minio -f`
- API logs: `sudo journalctl -u storage-api -f`