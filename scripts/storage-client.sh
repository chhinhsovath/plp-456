#!/bin/bash

# MinIO Storage Client Script
# This script provides easy commands to interact with your MinIO storage

# Configuration (update these after setup)
MINIO_ENDPOINT="https://storage.yourdomain.com"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"

# Function to install mc (MinIO Client) if not present
install_mc() {
    if ! command -v mc &> /dev/null; then
        echo "Installing MinIO Client..."
        wget https://dl.min.io/client/mc/release/linux-amd64/mc
        chmod +x mc
        sudo mv mc /usr/local/bin/
    fi
}

# Function to configure mc
configure_mc() {
    mc alias set mystorage $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
}

# Function to create a bucket
create_bucket() {
    local bucket_name=$1
    if [ -z "$bucket_name" ]; then
        echo "Usage: $0 create-bucket <bucket-name>"
        exit 1
    fi
    mc mb mystorage/$bucket_name
    echo "Bucket '$bucket_name' created successfully"
}

# Function to upload a file
upload_file() {
    local file_path=$1
    local bucket_name=$2
    local object_name=$3
    
    if [ -z "$file_path" ] || [ -z "$bucket_name" ]; then
        echo "Usage: $0 upload <file-path> <bucket-name> [object-name]"
        exit 1
    fi
    
    if [ -z "$object_name" ]; then
        object_name=$(basename $file_path)
    fi
    
    mc cp $file_path mystorage/$bucket_name/$object_name
    echo "File uploaded successfully"
    echo "URL: $MINIO_ENDPOINT/$bucket_name/$object_name"
}

# Function to upload a directory
upload_directory() {
    local dir_path=$1
    local bucket_name=$2
    
    if [ -z "$dir_path" ] || [ -z "$bucket_name" ]; then
        echo "Usage: $0 upload-dir <directory-path> <bucket-name>"
        exit 1
    fi
    
    mc cp --recursive $dir_path mystorage/$bucket_name/
    echo "Directory uploaded successfully"
}

# Function to download a file
download_file() {
    local bucket_name=$1
    local object_name=$2
    local local_path=$3
    
    if [ -z "$bucket_name" ] || [ -z "$object_name" ]; then
        echo "Usage: $0 download <bucket-name> <object-name> [local-path]"
        exit 1
    fi
    
    if [ -z "$local_path" ]; then
        local_path="./$object_name"
    fi
    
    mc cp mystorage/$bucket_name/$object_name $local_path
    echo "File downloaded to: $local_path"
}

# Function to list buckets
list_buckets() {
    mc ls mystorage
}

# Function to list objects in a bucket
list_objects() {
    local bucket_name=$1
    if [ -z "$bucket_name" ]; then
        echo "Usage: $0 list <bucket-name>"
        exit 1
    fi
    mc ls mystorage/$bucket_name
}

# Function to delete a file
delete_file() {
    local bucket_name=$1
    local object_name=$2
    
    if [ -z "$bucket_name" ] || [ -z "$object_name" ]; then
        echo "Usage: $0 delete <bucket-name> <object-name>"
        exit 1
    fi
    
    mc rm mystorage/$bucket_name/$object_name
    echo "File deleted successfully"
}

# Function to make a bucket public
make_public() {
    local bucket_name=$1
    if [ -z "$bucket_name" ]; then
        echo "Usage: $0 make-public <bucket-name>"
        exit 1
    fi
    mc anonymous set download mystorage/$bucket_name
    echo "Bucket '$bucket_name' is now publicly readable"
}

# Function to share a file with expiry
share_file() {
    local bucket_name=$1
    local object_name=$2
    local expiry=${3:-"7d"}
    
    if [ -z "$bucket_name" ] || [ -z "$object_name" ]; then
        echo "Usage: $0 share <bucket-name> <object-name> [expiry]"
        echo "Expiry examples: 7d (7 days), 12h (12 hours)"
        exit 1
    fi
    
    mc share download --expire=$expiry mystorage/$bucket_name/$object_name
}

# Main script logic
case "$1" in
    setup)
        install_mc
        configure_mc
        echo "MinIO client configured successfully"
        ;;
    create-bucket)
        create_bucket "$2"
        ;;
    upload)
        upload_file "$2" "$3" "$4"
        ;;
    upload-dir)
        upload_directory "$2" "$3"
        ;;
    download)
        download_file "$2" "$3" "$4"
        ;;
    list-buckets)
        list_buckets
        ;;
    list)
        list_objects "$2"
        ;;
    delete)
        delete_file "$2" "$3"
        ;;
    make-public)
        make_public "$2"
        ;;
    share)
        share_file "$2" "$3" "$4"
        ;;
    *)
        echo "MinIO Storage Client"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  setup                           - Setup MinIO client"
        echo "  create-bucket <name>            - Create a new bucket"
        echo "  upload <file> <bucket> [name]   - Upload a file"
        echo "  upload-dir <dir> <bucket>       - Upload a directory"
        echo "  download <bucket> <file> [path] - Download a file"
        echo "  list-buckets                    - List all buckets"
        echo "  list <bucket>                   - List objects in bucket"
        echo "  delete <bucket> <file>          - Delete a file"
        echo "  make-public <bucket>            - Make bucket public"
        echo "  share <bucket> <file> [expiry]  - Share file with expiry link"
        echo ""
        echo "First run: $0 setup"
        exit 1
        ;;
esac