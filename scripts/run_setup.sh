#!/bin/bash

# Direct MinIO Setup Execution Script
# This script will SSH into your server and run the complete setup

SERVER="157.10.73.52"
USER="ubuntu"
PASSWORD="en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"

echo "🚀 Starting MinIO Setup on $SERVER..."

# Create a temporary script with all commands
cat > /tmp/minio_setup.sh << 'SETUP_SCRIPT'
#!/bin/bash

echo "Starting MinIO installation..."

# Update system and install packages
echo "📦 Installing packages..."
sudo apt update && sudo apt upgrade -y && \
sudo apt install -y wget curl nginx nodejs npm openssl && \
echo "✅ Packages installed"

# Download and install MinIO
echo "⬇️  Downloading MinIO..."
cd /tmp && \
wget https://dl.min.io/server/minio/release/linux-amd64/minio && \
chmod +x minio && \
sudo mv minio /usr/local/bin/ && \
echo "✅ MinIO binary installed"

# Create MinIO user and directories
echo "👤 Creating MinIO user..."
sudo useradd -r minio-user -s /sbin/nologin 2>/dev/null || true && \
sudo mkdir -p /mnt/data && \
sudo mkdir -p /etc/minio && \
sudo chown -R minio-user:minio-user /mnt/data && \
sudo chown -R minio-user:minio-user /etc/minio && \
echo "✅ MinIO directories created"

# Generate secure credentials
echo "🔐 Generating credentials..."
ACCESS_KEY="plp456$(openssl rand -hex 10)" && \
SECRET_KEY="$(openssl rand -hex 32)" && \
echo "===================================" && \
echo "🔐 SAVE THESE CREDENTIALS:" && \
echo "Access Key: $ACCESS_KEY" && \
echo "Secret Key: $SECRET_KEY" && \
echo "==================================="

# Save credentials to file for later use
echo "ACCESS_KEY=$ACCESS_KEY" > ~/minio_credentials.txt
echo "SECRET_KEY=$SECRET_KEY" >> ~/minio_credentials.txt

# Create MinIO configuration
echo "⚙️  Creating MinIO configuration..."
sudo bash -c "cat > /etc/default/minio << EOF
MINIO_ROOT_USER=\"$ACCESS_KEY\"
MINIO_ROOT_PASSWORD=\"$SECRET_KEY\"
MINIO_VOLUMES=\"/mnt/data\"
MINIO_OPTS=\"--console-address :9001\"
EOF" && \
echo "✅ MinIO configuration created"

# Create systemd service
echo "📋 Creating systemd service..."
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
EOF' && \
echo "✅ Systemd service created"

# Start MinIO service
echo "🚀 Starting MinIO service..."
sudo systemctl daemon-reload && \
sudo systemctl enable minio && \
sudo systemctl start minio && \
echo "✅ MinIO service started"

# Setup Storage API
echo "📦 Setting up Storage API..."
mkdir -p ~/storage-api && \
cd ~/storage-api && \
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

# Create the API server file
cat > server.js << 'EOF'
const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3500;

const config = {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    defaultBucket: process.env.DEFAULT_BUCKET || 'uploads'
};

const minioClient = new Minio.Client(config);

app.use(cors({
    origin: ['https://mentor.openplp.com', 'https://plp-456.vercel.app', 'http://localhost:3000'],
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

# Create .env file with credentials
cat > .env << EOF
PORT=3500
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=$ACCESS_KEY
MINIO_SECRET_KEY=$SECRET_KEY
DEFAULT_BUCKET=uploads
EOF

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install && \
echo "✅ Storage API dependencies installed"

# Create systemd service for API
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
EOF' && \
echo "✅ Storage API service created"

# Start Storage API
sudo systemctl daemon-reload && \
sudo systemctl enable storage-api && \
sudo systemctl start storage-api && \
echo "✅ Storage API started"

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo bash -c 'cat > /etc/nginx/sites-available/storage << EOF
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location /api/ {
        proxy_pass http://localhost:3500/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /console/ {
        rewrite ^/console/(.*) /$1 break;
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /minio/ {
        rewrite ^/minio/(.*) /$1 break;
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF' && \
sudo ln -sf /etc/nginx/sites-available/storage /etc/nginx/sites-enabled/ && \
sudo rm -f /etc/nginx/sites-enabled/default && \
sudo nginx -t && sudo systemctl reload nginx && \
echo "✅ Nginx configured"

# Open firewall ports
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp && \
sudo ufw allow 80/tcp && \
sudo ufw allow 443/tcp && \
sudo ufw allow 3500/tcp && \
sudo ufw allow 9000/tcp && \
sudo ufw allow 9001/tcp && \
echo "y" | sudo ufw enable && \
echo "✅ Firewall configured"

# Final status check
echo ""
echo "==================================="
echo "🎉 SETUP COMPLETE!"
echo "==================================="
echo ""
echo "📋 Your Credentials (SAVED TO ~/minio_credentials.txt):"
echo "Access Key: $ACCESS_KEY"
echo "Secret Key: $SECRET_KEY"
echo ""
echo "🌐 Access URLs:"
echo "MinIO Console: http://157.10.73.52:9001"
echo "MinIO API: http://157.10.73.52:9000"
echo "Storage API: http://157.10.73.52:3500"
echo "Via Nginx: http://157.10.73.52/console/"
echo ""
echo "✅ Service Status:"
sudo systemctl status minio --no-pager | head -n 3
sudo systemctl status storage-api --no-pager | head -n 3
echo ""
echo "📱 Add to Vercel Environment Variables:"
echo "NEXT_PUBLIC_STORAGE_API=http://157.10.73.52:3500"
echo "STORAGE_ACCESS_KEY=$ACCESS_KEY"
echo "STORAGE_SECRET_KEY=$SECRET_KEY"
echo ""
echo "🧪 Test the setup:"
echo "curl http://157.10.73.52:3500/health"

SETUP_SCRIPT

# Execute the setup script on the remote server
echo "📡 Connecting to server and running setup..."
chmod +x /tmp/minio_setup.sh

# Use scp to copy script and then execute it
scp -o StrictHostKeyChecking=no /tmp/minio_setup.sh $USER@$SERVER:/tmp/minio_setup.sh

# SSH and execute the script
ssh -o StrictHostKeyChecking=no $USER@$SERVER 'chmod +x /tmp/minio_setup.sh && /tmp/minio_setup.sh'

# Clean up
rm /tmp/minio_setup.sh

echo ""
echo "🎉 Setup completed! Check the output above for your credentials."
echo "Visit http://localhost:3000/test-storage to test the integration!"