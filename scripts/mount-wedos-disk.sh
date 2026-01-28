#!/bin/bash
# ==============================================================
# APIS SaaS - WEDOS Disk Mount Script
# ==============================================================
# WEDOS Disk: stor34711 (5 GB)
# Server: 34711.s11.wedos.net
# User: s34711
# 
# Run this script on VPS ON initial setup
# ==============================================================

set -e

# Configuration
WEDOS_SERVER="34711.s11.wedos.net"
WEDOS_USER="s34711"
MOUNT_POINT="/mnt/wedos-disk"

echo "=========================================="
echo "WEDOS Disk Mount Setup"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Install required packages
echo "Installing required packages..."
apt-get update
apt-get install -y davfs2 || yum install -y davfs2

# Create mount point
echo "Creating mount point: ${MOUNT_POINT}"
mkdir -p "${MOUNT_POINT}"
mkdir -p "${MOUNT_POINT}/backups/daily"
mkdir -p "${MOUNT_POINT}/backups/weekly"
mkdir -p "${MOUNT_POINT}/backups/monthly"

# Create credentials file
echo "Setting up credentials..."
SECRETS_FILE="/etc/davfs2/secrets"

# Prompt for password
read -s -p "Enter WEDOS Disk password for user ${WEDOS_USER}: " WEDOS_PASS
echo

# Add credentials
grep -q "${WEDOS_SERVER}" "${SECRETS_FILE}" 2>/dev/null && \
    sed -i "/${WEDOS_SERVER}/d" "${SECRETS_FILE}"

echo "https://${WEDOS_SERVER} ${WEDOS_USER} ${WEDOS_PASS}" >> "${SECRETS_FILE}"
chmod 600 "${SECRETS_FILE}"

# Add to fstab for auto-mount
echo "Configuring auto-mount in fstab..."
FSTAB_ENTRY="https://${WEDOS_SERVER} ${MOUNT_POINT} davfs user,auto,_netdev 0 0"

grep -q "${WEDOS_SERVER}" /etc/fstab || echo "${FSTAB_ENTRY}" >> /etc/fstab

# Configure davfs2
echo "Configuring davfs2..."
DAVFS2_CONF="/etc/davfs2/davfs2.conf"

# Optimize for backup workloads
cat >> "${DAVFS2_CONF}" << EOF

# WEDOS Disk optimization for APIS backups
use_locks 0
cache_size 64
table_size 4096
delay_upload 0
gui_optimize 1
EOF

# Mount the disk
echo "Mounting WEDOS Disk..."
mount "${MOUNT_POINT}"

# Verify mount
if mountpoint -q "${MOUNT_POINT}"; then
    echo "SUCCESS: WEDOS Disk mounted at ${MOUNT_POINT}"
    df -h "${MOUNT_POINT}"
else
    echo "ERROR: Failed to mount WEDOS Disk"
    exit 1
fi

# Create backup directory structure
echo "Creating backup directory structure..."
mkdir -p "${MOUNT_POINT}/backups/apis/daily"
mkdir -p "${MOUNT_POINT}/backups/apis/weekly"
mkdir -p "${MOUNT_POINT}/backups/apis/monthly"

echo "=========================================="
echo "WEDOS Disk setup completed!"
echo "=========================================="
echo ""
echo "Mount point: ${MOUNT_POINT}"
echo "Server: ${WEDOS_SERVER}"
echo "User: ${WEDOS_USER}"
echo ""
echo "The disk will be automatically mounted on system boot."
echo "Backups will be stored in: ${MOUNT_POINT}/backups/apis/"
