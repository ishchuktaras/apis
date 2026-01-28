#!/bin/bash
# ==============================================================
# APIS SaaS - WEDOS Disk WebDAV Sync Script
# ==============================================================
# WEDOS Disk: stor34711 (5 GB)
# Server: 34711.s11.wedos.net
# User: s34711
# ==============================================================

set -e

# Configuration
WEDOS_SERVER="${WEDOS_DISK_SERVER:-34711.s11.wedos.net}"
WEDOS_USER="${WEDOS_DISK_USER:-s34711}"
WEDOS_PASS="${WEDOS_DISK_PASS}"
LOCAL_BACKUP_DIR="/mnt/wedos-disk/backups"
REMOTE_BACKUP_DIR="/backups/apis"
LOG_FILE="/var/log/wedos-sync.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "=========================================="
log "Starting WEDOS Disk WebDAV Sync"
log "=========================================="

# Check if password is set
if [ -z "${WEDOS_PASS}" ]; then
    error_exit "WEDOS_DISK_PASS environment variable is not set"
fi

# Check if local backup directory exists
if [ ! -d "${LOCAL_BACKUP_DIR}" ]; then
    error_exit "Local backup directory does not exist: ${LOCAL_BACKUP_DIR}"
fi

# Install curl if not present
if ! command -v curl &> /dev/null; then
    log "Installing curl..."
    apk add --no-cache curl
fi

# Create remote backup directory if it doesn't exist
log "Creating remote directory structure..."
curl -s -u "${WEDOS_USER}:${WEDOS_PASS}" \
    -X MKCOL "https://${WEDOS_SERVER}${REMOTE_BACKUP_DIR}" 2>/dev/null || true

# Sync daily backups to WEDOS Disk
log "Syncing daily backups..."
DAILY_DIR="${LOCAL_BACKUP_DIR}/daily"

if [ -d "${DAILY_DIR}" ]; then
    # Find backups from last 7 days
    find "${DAILY_DIR}" -name "apis_backup_*.sql.gz" -mtime -7 -type f | while read backup_file; do
        filename=$(basename "${backup_file}")
        log "Uploading: ${filename}"
        
        # Upload via WebDAV
        http_code=$(curl -s -w "%{http_code}" -u "${WEDOS_USER}:${WEDOS_PASS}" \
            -T "${backup_file}" \
            "https://${WEDOS_SERVER}${REMOTE_BACKUP_DIR}/daily/${filename}" \
            -o /dev/null)
        
        if [ "${http_code}" = "201" ] || [ "${http_code}" = "204" ]; then
            log "Successfully uploaded: ${filename}"
        else
            log "WARNING: Failed to upload ${filename} (HTTP ${http_code})"
        fi
    done
else
    log "WARNING: Daily backup directory not found"
fi

# Sync weekly backups (keep last 4 weeks)
log "Syncing weekly backups..."
WEEKLY_DIR="${LOCAL_BACKUP_DIR}/weekly"

if [ -d "${WEEKLY_DIR}" ]; then
    find "${WEEKLY_DIR}" -name "apis_weekly_*.sql.gz" -mtime -28 -type f | while read backup_file; do
        filename=$(basename "${backup_file}")
        log "Uploading weekly: ${filename}"
        
        http_code=$(curl -s -w "%{http_code}" -u "${WEDOS_USER}:${WEDOS_PASS}" \
            -T "${backup_file}" \
            "https://${WEDOS_SERVER}${REMOTE_BACKUP_DIR}/weekly/${filename}" \
            -o /dev/null)
        
        if [ "${http_code}" = "201" ] || [ "${http_code}" = "204" ]; then
            log "Successfully uploaded weekly: ${filename}"
        fi
    done
fi

# Cleanup old backups on WEDOS Disk (keep last 30 daily, 12 weekly)
log "Cleaning up old backups on WEDOS Disk..."

# List and delete old daily backups
curl -s -u "${WEDOS_USER}:${WEDOS_PASS}" \
    -X PROPFIND \
    -H "Depth: 1" \
    "https://${WEDOS_SERVER}${REMOTE_BACKUP_DIR}/daily/" 2>/dev/null | \
    grep -oP 'apis_backup_\d{8}_\d{6}\.sql\.gz' | \
    sort | head -n -30 | while read old_backup; do
        log "Deleting old remote backup: ${old_backup}"
        curl -s -u "${WEDOS_USER}:${WEDOS_PASS}" \
            -X DELETE \
            "https://${WEDOS_SERVER}${REMOTE_BACKUP_DIR}/daily/${old_backup}" 2>/dev/null || true
    done

# Report disk usage
log "Checking WEDOS Disk usage..."
DISK_USAGE=$(curl -s -u "${WEDOS_USER}:${WEDOS_PASS}" \
    -X PROPFIND \
    -H "Depth: 0" \
    "https://${WEDOS_SERVER}/" 2>/dev/null | \
    grep -oP '(?<=<d:quota-used-bytes>)\d+' || echo "unknown")

if [ "${DISK_USAGE}" != "unknown" ]; then
    DISK_USAGE_MB=$((DISK_USAGE / 1024 / 1024))
    log "WEDOS Disk usage: ${DISK_USAGE_MB} MB / 5120 MB"
    
    # Alert if usage exceeds 80%
    if [ ${DISK_USAGE_MB} -gt 4096 ]; then
        log "WARNING: WEDOS Disk usage exceeds 80%!"
    fi
fi

log "=========================================="
log "WEDOS Disk sync completed"
log "=========================================="

exit 0
