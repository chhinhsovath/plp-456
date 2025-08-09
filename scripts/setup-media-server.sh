#!/bin/bash

# Media Storage Server Setup Script
# This script sets up MinIO as an S3-compatible object storage server

set -e

echo "=================================="
echo "Media Storage Server Setup"
echo "=================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y wget curl nginx certbot python3-certbot-nginx ufw

# Download and install MinIO
echo "Installing MinIO..."
cd /tmp
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create MinIO user and directories
echo "Creating MinIO user and directories..."
sudo useradd -r minio-user -s /sbin/nologin || true
sudo mkdir -p /mnt/data
sudo mkdir -p /etc/minio

# Set permissions
sudo chown -R minio-user:minio-user /mnt/data
sudo chown -R minio-user:minio-user /etc/minio

# Generate random access and secret keys
ACCESS_KEY=$(openssl rand -hex 20)
SECRET_KEY=$(openssl rand -hex 40)

# Create MinIO configuration
echo "Creating MinIO configuration..."
sudo tee /etc/default/minio > /dev/null <<EOF
# MinIO Configuration
MINIO_ROOT_USER="$ACCESS_KEY"
MINIO_ROOT_PASSWORD="$SECRET_KEY"
MINIO_VOLUMES="/mnt/data"
MINIO_OPTS="--console-address :9001"
EOF

# Create systemd service
echo "Creating MinIO systemd service..."
sudo tee /etc/systemd/system/minio.service > /dev/null <<'EOF'
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
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set in /etc/default/minio\"; exit 1; fi"
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
EOF

# Reload systemd and start MinIO
echo "Starting MinIO service..."
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio

# Configure Nginx reverse proxy
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/minio > /dev/null <<'EOF'
upstream minio {
    server localhost:9000;
}

upstream minio-console {
    server localhost:9001;
}

server {
    listen 80;
    listen [::]:80;
    server_name storage.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name storage.yourdomain.com;

    # SSL will be configured by certbot
    
    # To allow special characters in headers
    ignore_invalid_headers off;
    # Allow any size file to be uploaded
    client_max_body_size 0;
    # Disable buffering
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        proxy_pass http://minio;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name console.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name console.yourdomain.com;

    # SSL will be configured by certbot
    
    ignore_invalid_headers off;
    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;

        real_ip_header X-Real-IP;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        chunked_transfer_encoding off;

        proxy_pass http://minio-console;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Configure UFW firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
echo "y" | sudo ufw enable

# Display credentials
echo ""
echo "=================================="
echo "MinIO Setup Complete!"
echo "=================================="
echo ""
echo "MinIO Credentials (SAVE THESE!):"
echo "Access Key: $ACCESS_KEY"
echo "Secret Key: $SECRET_KEY"
echo ""
echo "MinIO is running on:"
echo "API: http://localhost:9000"
echo "Console: http://localhost:9001"
echo ""
echo "Next steps:"
echo "1. Point your domain to this server's IP"
echo "2. Update the Nginx config with your actual domain"
echo "3. Run: sudo certbot --nginx -d storage.yourdomain.com -d console.yourdomain.com"
echo "4. Access MinIO console at https://console.yourdomain.com"
echo ""
echo "To check MinIO status: sudo systemctl status minio"
echo "To view MinIO logs: sudo journalctl -u minio -f"