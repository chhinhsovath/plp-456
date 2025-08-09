#!/usr/bin/expect -f

# Set timeout
set timeout 30

# Server credentials
set host "157.10.73.52"
set user "ubuntu"
set password "en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"

# Connect to server
spawn ssh $user@$host

# Handle SSH key prompt if appears
expect {
    "yes/no" {
        send "yes\r"
        expect "*assword:"
        send "$password\r"
    }
    "*assword:" {
        send "$password\r"
    }
}

# Wait for prompt
expect "$ "

# Update system
send "sudo apt update && sudo apt upgrade -y\r"
expect "$ "

# Install required packages
send "sudo apt install -y wget curl nginx certbot python3-certbot-nginx ufw\r"
expect "$ "

# Download and install MinIO
send "cd /tmp && wget https://dl.min.io/server/minio/release/linux-amd64/minio\r"
expect "$ "

send "chmod +x minio && sudo mv minio /usr/local/bin/\r"
expect "$ "

# Create MinIO user and directories
send "sudo useradd -r minio-user -s /sbin/nologin || true\r"
expect "$ "

send "sudo mkdir -p /mnt/data && sudo mkdir -p /etc/minio\r"
expect "$ "

send "sudo chown -R minio-user:minio-user /mnt/data /etc/minio\r"
expect "$ "

# Generate credentials
send "ACCESS_KEY=\$(openssl rand -hex 20) && echo \"Access Key: \$ACCESS_KEY\"\r"
expect "$ "

send "SECRET_KEY=\$(openssl rand -hex 40) && echo \"Secret Key: \$SECRET_KEY\"\r"
expect "$ "

# Create MinIO configuration
send "sudo bash -c 'cat > /etc/default/minio << EOF
MINIO_ROOT_USER=\"\$ACCESS_KEY\"
MINIO_ROOT_PASSWORD=\"\$SECRET_KEY\"
MINIO_VOLUMES=\"/mnt/data\"
MINIO_OPTS=\"--console-address :9001\"
EOF'\r"
expect "$ "

# Display credentials
send "echo '=================================='\r"
expect "$ "
send "echo 'MinIO Setup Complete!'\r"
expect "$ "
send "echo 'Save these credentials:'\r"
expect "$ "
send "cat /etc/default/minio\r"
expect "$ "

# Exit
send "exit\r"
expect eof