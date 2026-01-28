#!/bin/bash
# ==============================================================
# APIS SaaS - Automated Database Backup Script
# ==============================================================
# WEDOS VPS ON: ov8760 (89.221.212.146)
# WEDOS Disk: stor34711 (5 GB) - 34711.s11.wedos.net
# 
# Schedule with cron: 0 2 * * * /path/to/backup.sh
# Weekly backup: 0 3 * * 0 /path/to/backup.sh weekly
# Monthly backup: 0 4 1 * * /path/to/backup.sh monthly
# ==============================================================

set -e

# Backup type (daily, weekly, monthly)
BACKUP_TYPE="${1:-daily}"

# Configuration
BACKUP_BASE_DIR="/mnt/wedos-disk/backups"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_TYPE}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/apis_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/apis-backup.log"

# Retention policies (pravidlo 3-2-1)
DAILY_RETENTION=30
WEEKLY_RETENTION=90
MONTHLY_RETENTION=365

# Database connection (from environment or defaults)
PGHOST="${PGHOST:-db}"
PGUSER="${PGUSER:-apis_user}"
PGPASSWORD="${PGPASSWORD}"
PGDATABASE="${PGDATABASE:-apis_production}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Start backup
log "=========================================="
log "Starting APIS SaaS database backup"
log "=========================================="

# Check if Wedos Disk is mounted
if ! mountpoint -q /mnt/wedos-disk; then
    log "WARNING: Wedos Disk not mounted, attempting to mount..."
    mount -a
    sleep 2
    if ! mountpoint -q /mnt/wedos-disk; then
        error_exit "Wedos Disk is not mounted at /mnt/wedos-disk"
    fi
fi

log "Wedos Disk mounted successfully"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Perform backup
log "Creating backup: ${BACKUP_FILE}"

pg_dump \
    -h "${PGHOST}" \
    -U "${PGUSER}" \
    -d "${PGDATABASE}" \
    --no-owner \
    --no-acl \
    --format=plain \
    | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup completed successfully"
    log "File: ${BACKUP_FILE}"
    log "Size: ${FILESIZE}"
else
    error_exit "pg_dump failed"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gzip -t "${BACKUP_FILE}"; then
    log "Backup verification passed"
else
    error_exit "Backup verification failed - file may be corrupted"
fi

# Cleanup old backups based on type
case "${BACKUP_TYPE}" in
    daily)
        RETENTION_DAYS=${DAILY_RETENTION}
        ;;
    weekly)
        RETENTION_DAYS=${WEEKLY_RETENTION}
        ;;
    monthly)
        RETENTION_DAYS=${MONTHLY_RETENTION}
        ;;
esac

log "Cleaning up ${BACKUP_TYPE} backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "apis_${BACKUP_TYPE}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "Deleted ${DELETED_COUNT} old backup(s)"

# Calculate total backup storage used
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "apis_backup_*.sql.gz" -type f | wc -l)
log "Total backups: ${BACKUP_COUNT}, Total size: ${TOTAL_SIZE}"

# Create latest symlink
ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest.sql.gz"
log "Updated 'latest' symlink"

log "=========================================="
log "Backup process completed"
log "=========================================="

exit 0
