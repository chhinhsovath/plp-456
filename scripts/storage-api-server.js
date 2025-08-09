const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3500;

// Configuration
const config = {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'your-access-key',
    secretKey: process.env.MINIO_SECRET_KEY || 'your-secret-key',
    defaultBucket: process.env.DEFAULT_BUCKET || 'uploads'
};

// Initialize MinIO client
const minioClient = new Minio.Client(config);

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for temporary file storage
const upload = multer({
    dest: 'temp/',
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Ensure temp directory exists
if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}

// Helper function to ensure bucket exists
async function ensureBucket(bucketName) {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`Bucket ${bucketName} created`);
        }
    } catch (error) {
        console.error('Error ensuring bucket:', error);
        throw error;
    }
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'storage-api' });
});

// Upload single file
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const bucket = req.body.bucket || config.defaultBucket;
        await ensureBucket(bucket);

        const fileStream = fs.createReadStream(req.file.path);
        const fileName = req.body.fileName || req.file.originalname;
        const metaData = {
            'Content-Type': req.file.mimetype,
            'X-Original-Name': req.file.originalname
        };

        await minioClient.putObject(bucket, fileName, fileStream, req.file.size, metaData);

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        // Generate URL
        const url = `${config.useSSL ? 'https' : 'http'}://${config.endPoint}:${config.port}/${bucket}/${fileName}`;

        res.json({
            success: true,
            bucket,
            fileName,
            size: req.file.size,
            mimeType: req.file.mimetype,
            url
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Upload failed', message: error.message });
    }
});

// Upload multiple files
app.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const bucket = req.body.bucket || config.defaultBucket;
        await ensureBucket(bucket);

        const results = [];

        for (const file of req.files) {
            try {
                const fileStream = fs.createReadStream(file.path);
                const fileName = `${Date.now()}-${file.originalname}`;
                const metaData = {
                    'Content-Type': file.mimetype,
                    'X-Original-Name': file.originalname
                };

                await minioClient.putObject(bucket, fileName, fileStream, file.size, metaData);
                fs.unlinkSync(file.path);

                results.push({
                    success: true,
                    fileName,
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype
                });
            } catch (error) {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                results.push({
                    success: false,
                    fileName: file.originalname,
                    error: error.message
                });
            }
        }

        res.json({ results });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ error: 'Upload failed', message: error.message });
    }
});

// Get presigned URL for upload
app.post('/presigned-upload', async (req, res) => {
    try {
        const { bucket = config.defaultBucket, fileName, expiry = 3600 } = req.body;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        await ensureBucket(bucket);

        const presignedUrl = await minioClient.presignedPutObject(bucket, fileName, expiry);

        res.json({
            url: presignedUrl,
            bucket,
            fileName,
            expiry
        });
    } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({ error: 'Failed to generate presigned URL', message: error.message });
    }
});

// Get presigned URL for download
app.get('/presigned-download', async (req, res) => {
    try {
        const { bucket = config.defaultBucket, fileName, expiry = 3600 } = req.query;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        const presignedUrl = await minioClient.presignedGetObject(bucket, fileName, parseInt(expiry));

        res.json({
            url: presignedUrl,
            bucket,
            fileName,
            expiry
        });
    } catch (error) {
        console.error('Presigned download URL error:', error);
        res.status(500).json({ error: 'Failed to generate presigned URL', message: error.message });
    }
});

// List files in bucket
app.get('/list', async (req, res) => {
    try {
        const { bucket = config.defaultBucket, prefix = '', maxKeys = 100 } = req.query;

        const objects = [];
        const stream = minioClient.listObjectsV2(bucket, prefix, true);

        stream.on('data', obj => {
            if (objects.length < maxKeys) {
                objects.push({
                    name: obj.name,
                    size: obj.size,
                    lastModified: obj.lastModified,
                    etag: obj.etag
                });
            }
        });

        stream.on('end', () => {
            res.json({
                bucket,
                prefix,
                objects,
                count: objects.length
            });
        });

        stream.on('error', error => {
            console.error('List error:', error);
            res.status(500).json({ error: 'Failed to list objects', message: error.message });
        });
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ error: 'Failed to list objects', message: error.message });
    }
});

// Delete file
app.delete('/delete', async (req, res) => {
    try {
        const { bucket = config.defaultBucket, fileName } = req.body;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        await minioClient.removeObject(bucket, fileName);

        res.json({
            success: true,
            bucket,
            fileName,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file', message: error.message });
    }
});

// Get file info
app.get('/info', async (req, res) => {
    try {
        const { bucket = config.defaultBucket, fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        const stat = await minioClient.statObject(bucket, fileName);

        res.json({
            bucket,
            fileName,
            size: stat.size,
            lastModified: stat.lastModified,
            etag: stat.etag,
            metaData: stat.metaData
        });
    } catch (error) {
        console.error('Info error:', error);
        res.status(500).json({ error: 'Failed to get file info', message: error.message });
    }
});

// Create bucket
app.post('/bucket/create', async (req, res) => {
    try {
        const { bucketName, region = 'us-east-1' } = req.body;

        if (!bucketName) {
            return res.status(400).json({ error: 'bucketName is required' });
        }

        await minioClient.makeBucket(bucketName, region);

        res.json({
            success: true,
            bucketName,
            region,
            message: 'Bucket created successfully'
        });
    } catch (error) {
        console.error('Create bucket error:', error);
        res.status(500).json({ error: 'Failed to create bucket', message: error.message });
    }
});

// List buckets
app.get('/buckets', async (req, res) => {
    try {
        const buckets = await minioClient.listBuckets();
        res.json({ buckets });
    } catch (error) {
        console.error('List buckets error:', error);
        res.status(500).json({ error: 'Failed to list buckets', message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Storage API server running on port ${PORT}`);
    console.log(`MinIO endpoint: ${config.endPoint}:${config.port}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('Cleaning up temp files...');
    if (fs.existsSync('temp')) {
        fs.readdirSync('temp').forEach(file => {
            fs.unlinkSync(path.join('temp', file));
        });
    }
    process.exit(0);
});