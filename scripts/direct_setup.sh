#!/bin/bash

# MinIO Direct Setup Script
# This script will SSH into your server and set up MinIO

SERVER="157.10.73.52"
USER="ubuntu"

echo "🚀 MinIO Storage Server Setup"
echo "=============================="
echo ""
echo "Please run the following commands manually:"
echo ""
echo "1. Connect to your server:"
echo "   ssh $USER@$SERVER"
echo "   Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"
echo ""
echo "2. Once connected, run these commands:"
echo ""
cat << 'SETUP_COMMANDS'
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y wget curl nginx nodejs npm

# Download and install MinIO
cd /tmp
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create MinIO user and directories
sudo useradd -r minio-user -s /sbin/nologin || true
sudo mkdir -p /mnt/data
sudo mkdir -p /etc/minio
sudo chown -R minio-user:minio-user /mnt/data
sudo chown -R minio-user:minio-user /etc/minio

# Generate credentials
ACCESS_KEY=$(openssl rand -hex 20)
SECRET_KEY=$(openssl rand -hex 40)

echo "==================================="
echo "SAVE THESE CREDENTIALS:"
echo "Access Key: $ACCESS_KEY"
echo "Secret Key: $SECRET_KEY"
echo "==================================="

# Create MinIO configuration
sudo tee /etc/default/minio > /dev/null <<EOF
MINIO_ROOT_USER="$ACCESS_KEY"
MINIO_ROOT_PASSWORD="$SECRET_KEY"
MINIO_VOLUMES="/mnt/data"
MINIO_OPTS="--console-address :9001"
EOF

# Create systemd service
sudo tee /etc/systemd/system/minio.service > /dev/null <<'SERVICE'
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
SERVICE

# Start MinIO
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio

# Setup Storage API
mkdir -p ~/storage-api
cd ~/storage-api

# Create package.json
cat > package.json <<'PACKAGE'
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
PACKAGE

# Install dependencies
npm install

# Create .env file (UPDATE WITH YOUR CREDENTIALS)
cat > .env <<EOF
PORT=3500
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=$ACCESS_KEY
MINIO_SECRET_KEY=$SECRET_KEY
DEFAULT_BUCKET=uploads
EOF

# Check status
sudo systemctl status minio --no-pager | head -n 5

echo ""
echo "✅ Setup Complete!"
echo ""
echo "MinIO Console: http://$SERVER:9001"
echo "MinIO API: http://$SERVER:9000"
echo "Storage API: http://$SERVER:3500"
echo ""
echo "Next: Copy the storage-api-server.js file to ~/storage-api/server.js"
SETUP_COMMANDS