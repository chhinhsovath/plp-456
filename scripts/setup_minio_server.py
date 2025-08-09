#!/usr/bin/env python3

import paramiko
import time
import sys
import os
import random
import string

# Server credentials
HOST = "157.10.73.52"
USER = "ubuntu"
PASSWORD = "en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"

def generate_key(length):
    """Generate random key for MinIO credentials"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def execute_command(ssh, command, print_output=True):
    """Execute command via SSH and return output"""
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if print_output and output:
        print(output)
    if error:
        print(f"Error: {error}")
    
    return output, error

def setup_minio_server():
    """Main setup function"""
    print("🚀 Starting MinIO Storage Server Setup...")
    print(f"📡 Connecting to {HOST}...")
    
    # Create SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Connect to server
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
        print("✅ Connected successfully!")
        
        # Generate credentials
        access_key = generate_key(20)
        secret_key = generate_key(40)
        
        print("\n📦 Installing required packages...")
        commands = [
            # Update system
            "sudo apt update",
            "sudo apt upgrade -y",
            
            # Install required packages
            "sudo apt install -y wget curl nginx certbot python3-certbot-nginx ufw nodejs npm",
            
            # Download and install MinIO
            "cd /tmp && wget -q https://dl.min.io/server/minio/release/linux-amd64/minio",
            "chmod +x /tmp/minio",
            "sudo mv /tmp/minio /usr/local/bin/",
            
            # Create MinIO user and directories
            "sudo useradd -r minio-user -s /sbin/nologin 2>/dev/null || true",
            "sudo mkdir -p /mnt/data",
            "sudo mkdir -p /etc/minio",
            "sudo chown -R minio-user:minio-user /mnt/data",
            "sudo chown -R minio-user:minio-user /etc/minio",
        ]
        
        for cmd in commands:
            print(f"  Running: {cmd}")
            execute_command(ssh, cmd, print_output=False)
        
        print("\n🔐 Creating MinIO configuration...")
        
        # Create MinIO environment file
        minio_config = f"""# MinIO Configuration
MINIO_ROOT_USER="{access_key}"
MINIO_ROOT_PASSWORD="{secret_key}"
MINIO_VOLUMES="/mnt/data"
MINIO_OPTS="--console-address :9001"
"""
        
        # Write config file
        execute_command(ssh, f"echo '{minio_config}' | sudo tee /etc/default/minio > /dev/null")
        
        # Create systemd service
        print("📝 Creating systemd service...")
        service_content = """[Unit]
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
ExecStartPre=/bin/bash -c "if [ -z \\"${MINIO_VOLUMES}\\" ]; then echo \\"Variable MINIO_VOLUMES not set\\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
StandardOutput=journal
StandardError=inherit
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target"""
        
        execute_command(ssh, f"echo '{service_content}' | sudo tee /etc/systemd/system/minio.service > /dev/null")
        
        # Start MinIO service
        print("🚀 Starting MinIO service...")
        execute_command(ssh, "sudo systemctl daemon-reload")
        execute_command(ssh, "sudo systemctl enable minio")
        execute_command(ssh, "sudo systemctl start minio")
        
        # Configure Nginx
        print("\n🌐 Configuring Nginx...")
        nginx_config = """upstream minio {
    server localhost:9000;
}

upstream minio-console {
    server localhost:9001;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    client_max_body_size 100M;
    proxy_buffering off;
    proxy_request_buffering off;
    
    location /minio/ {
        rewrite ^/minio/(.*) /$1 break;
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
    
    location /console/ {
        rewrite ^/console/(.*) /$1 break;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        chunked_transfer_encoding off;
        proxy_pass http://minio-console;
    }
}"""
        
        execute_command(ssh, f"echo '{nginx_config}' | sudo tee /etc/nginx/sites-available/minio > /dev/null")
        execute_command(ssh, "sudo ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/")
        execute_command(ssh, "sudo rm -f /etc/nginx/sites-enabled/default")
        execute_command(ssh, "sudo nginx -t && sudo systemctl reload nginx")
        
        # Setup Storage API
        print("\n📦 Setting up Storage API Server...")
        
        # Create storage API directory
        execute_command(ssh, "mkdir -p ~/storage-api")
        
        # Copy storage API server
        with open('/Users/user/Desktop/apps/plp-456/scripts/storage-api-server.js', 'r') as f:
            api_content = f.read()
        
        # Write API server file
        execute_command(ssh, f"cat > ~/storage-api/server.js << 'EOF'\n{api_content}\nEOF")
        
        # Create package.json
        package_json = """{
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
}"""
        
        execute_command(ssh, f"cat > ~/storage-api/package.json << 'EOF'\n{package_json}\nEOF")
        
        # Create .env file
        env_content = f"""PORT=3500
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY={access_key}
MINIO_SECRET_KEY={secret_key}
DEFAULT_BUCKET=uploads"""
        
        execute_command(ssh, f"cat > ~/storage-api/.env << 'EOF'\n{env_content}\nEOF")
        
        # Install dependencies
        print("  Installing Node.js dependencies...")
        execute_command(ssh, "cd ~/storage-api && npm install")
        
        # Create systemd service for API
        api_service = """[Unit]
Description=Storage API Server
After=network.target minio.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/storage-api
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target"""
        
        execute_command(ssh, f"echo '{api_service}' | sudo tee /etc/systemd/system/storage-api.service > /dev/null")
        execute_command(ssh, "sudo systemctl daemon-reload")
        execute_command(ssh, "sudo systemctl enable storage-api")
        execute_command(ssh, "sudo systemctl start storage-api")
        
        # Configure firewall
        print("\n🔒 Configuring firewall...")
        firewall_commands = [
            "sudo ufw allow 22/tcp",
            "sudo ufw allow 80/tcp",
            "sudo ufw allow 443/tcp",
            "sudo ufw allow 9000/tcp",
            "sudo ufw allow 9001/tcp",
            "sudo ufw allow 3500/tcp",
            "echo 'y' | sudo ufw enable"
        ]
        
        for cmd in firewall_commands:
            execute_command(ssh, cmd, print_output=False)
        
        # Check services status
        print("\n✅ Checking services status...")
        execute_command(ssh, "sudo systemctl status minio --no-pager | head -n 5")
        execute_command(ssh, "sudo systemctl status storage-api --no-pager | head -n 5")
        
        print("\n" + "="*60)
        print("🎉 MinIO Storage Server Setup Complete!")
        print("="*60)
        print("\n📋 IMPORTANT - SAVE THESE CREDENTIALS:")
        print(f"  Access Key: {access_key}")
        print(f"  Secret Key: {secret_key}")
        print("\n🌐 Access URLs:")
        print(f"  MinIO API: http://{HOST}:9000")
        print(f"  MinIO Console: http://{HOST}:9001")
        print(f"  Storage API: http://{HOST}:3500")
        print(f"  Via Nginx: http://{HOST}/console/")
        print("\n📱 For your Vercel app, use:")
        print(f"  STORAGE_API_URL=http://{HOST}:3500")
        print(f"  MINIO_ACCESS_KEY={access_key}")
        print(f"  MINIO_SECRET_KEY={secret_key}")
        print("\n✅ You can now upload files from https://mentor.openplp.com!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    setup_minio_server()