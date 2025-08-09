# 🚀 Simple MinIO Setup Guide

## Step 1: Connect to Your Server
```bash
ssh ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

## Step 2: Quick Setup (Copy & Paste Each Block)

### Block 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y wget curl nginx nodejs npm openssl
```

### Block 2: Install MinIO
```bash
cd /tmp
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

### Block 3: Create User & Directories
```bash
sudo useradd -r minio-user -s /sbin/nologin 2>/dev/null || true
sudo mkdir -p /mnt/data /etc/minio
sudo chown -R minio-user:minio-user /mnt/data /etc/minio
```

### Block 4: Generate Credentials & Config
```bash
ACCESS_KEY="plp456$(openssl rand -hex 10)"
SECRET_KEY="$(openssl rand -hex 32)"
echo "ACCESS_KEY=$ACCESS_KEY" > ~/minio_credentials.txt
echo "SECRET_KEY=$SECRET_KEY" >> ~/minio_credentials.txt
echo "=================================="
echo "SAVE THESE CREDENTIALS:"
echo "Access Key: $ACCESS_KEY"
echo "Secret Key: $SECRET_KEY"
echo "=================================="
```

### Block 5: Create MinIO Config
```bash
sudo bash -c "cat > /etc/default/minio << EOF
MINIO_ROOT_USER=\"$ACCESS_KEY\"
MINIO_ROOT_PASSWORD=\"$SECRET_KEY\"
MINIO_VOLUMES=\"/mnt/data\"
MINIO_OPTS=\"--console-address :9001\"
EOF"
```

### Block 6: Create SystemD Service
```bash
sudo bash -c 'cat > /etc/systemd/system/minio.service << EOF
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local/
User=minio-user
Group=minio-user
ProtectProc=invisible
EnvironmentFile=/etc/default/minio
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
StandardOutput=journal
StandardError=inherit
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF'
```

### Block 7: Start MinIO
```bash
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio
sudo systemctl status minio --no-pager
```

### Block 8: Setup Storage API
```bash
mkdir -p ~/storage-api && cd ~/storage-api

cat > package.json << 'EOF'
{
  "name": "storage-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "minio": "^7.1.3",
    "cors": "^2.8.5"
  }
}
EOF

npm install
```

### Block 9: Create API Server
```bash
cat > server.js << 'EOF'
const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3500;

const config = {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    defaultBucket: process.env.DEFAULT_BUCKET || 'uploads'
};

const minioClient = new Minio.Client(config);

app.use(cors({
    origin: ['https://mentor.openplp.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const upload = multer({
    dest: 'temp/',
    limits: { fileSize: 100 * 1024 * 1024 }
});

if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}

async function ensureBucket(bucketName) {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
        }
    } catch (error) {
        console.error('Error ensuring bucket:', error);
    }
}

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'storage-api' });
});

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
        fs.unlinkSync(req.file.path);
        const url = `http://157.10.73.52:9000/${bucket}/${fileName}`;
        res.json({
            success: true,
            bucket,
            fileName,
            size: req.file.size,
            mimeType: req.file.mimetype,
            url
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Upload failed', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Storage API running on port ${PORT}`);
});
EOF
```

### Block 10: Create Environment File
```bash
cat > .env << EOF
PORT=3500
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=$ACCESS_KEY
MINIO_SECRET_KEY=$SECRET_KEY
DEFAULT_BUCKET=uploads
EOF
```

### Block 11: Create API Service
```bash
sudo bash -c 'cat > /etc/systemd/system/storage-api.service << EOF
[Unit]
Description=Storage API Server
After=network.target minio.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/storage-api
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/storage-api/.env

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable storage-api
sudo systemctl start storage-api
```

### Block 12: Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3500/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
echo 'y' | sudo ufw enable
```

### Block 13: Test Everything
```bash
echo "==================================="
echo "🎉 SETUP COMPLETE!"
echo "==================================="
sudo systemctl status minio --no-pager | head -n 5
sudo systemctl status storage-api --no-pager | head -n 5
echo ""
echo "📋 Your Credentials:"
cat ~/minio_credentials.txt
echo ""
echo "🌐 Access URLs:"
echo "MinIO Console: http://157.10.73.52:9001"
echo "Storage API: http://157.10.73.52:3500"
echo ""
echo "🧪 Test Commands:"
echo "curl http://157.10.73.52:3500/health"
echo "curl -I http://157.10.73.52:9001"
```

## Step 3: Test From Your Local Machine

Once setup is complete, test the API:

```bash
curl http://157.10.73.52:3500/health
```

You should see: `{"status":"healthy","service":"storage-api"}`

## Step 4: Test in Your App

Visit: `http://localhost:3000/test-storage`

The test page will verify:
- ✅ API connection
- ✅ File uploads
- ✅ MinIO console access

## 🔐 Save Your Credentials!

After setup, your credentials will be displayed and saved to `~/minio_credentials.txt` on the server.

Make sure to:
1. Copy the Access Key and Secret Key
2. Add them to your Vercel environment variables if needed
3. Test the upload functionality

That's it! Your storage server should be ready! 🎉