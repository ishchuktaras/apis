#!/bin/bash
# ==============================================================
# APIS SaaS - Database Restore Script
# For Wedos VPS ON
# 
# Usage: ./restore.sh [backup_file.sql.gz]
# If no file specified, uses the latest backup
# ==============================================================

set -e

# Configuration
BACKUP_DIR="/mnt/wedos-disk/backups/daily"
LOG_FILE="/var/log/apis-restore.log"

# Database connection
PGHOST="${PGHOST:-db}"
PGUSER="${PGUSER:-apis_user}"
PGPASSWORD="${PGPASSWORD}"
PGDATABASE="${PGDATABASE:-apis_production}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Determine backup file to restore
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    BACKUP_FILE="${BACKUP_DIR}/latest.sql.gz"
fi

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    log "${RED}ERROR: Backup file not found: ${BACKUP_FILE}${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

log "${YELLOW}=========================================="
log "APIS SaaS Database Restore"
log "==========================================${NC}"
log "Backup file: ${BACKUP_FILE}"
log "Target database: ${PGDATABASE}@${PGHOST}"
echo ""

# Confirmation prompt
echo -e "${RED}WARNING: This will DROP and RECREATE all tables in ${PGDATABASE}!${NC}"
echo -e "${RED}All existing data will be replaced with the backup.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Verify backup integrity
log "Verifying backup integrity..."
if ! gzip -t "${BACKUP_FILE}"; then
    log "${RED}ERROR: Backup file is corrupted${NC}"
    exit 1
fi
log "${GREEN}Backup integrity verified${NC}"

# Create a pre-restore backup
PRE_RESTORE_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating pre-restore backup: ${PRE_RESTORE_BACKUP}"

pg_dump \
    -h "${PGHOST}" \
    -U "${PGUSER}" \
    -d "${PGDATABASE}" \
    --no-owner \
    --no-acl \
    | gzip > "${PRE_RESTORE_BACKUP}"

log "${GREEN}Pre-restore backup created${NC}"

# Perform restore
log "Starting database restore..."

# Decompress and restore
gunzip -c "${BACKUP_FILE}" | psql \
    -h "${PGHOST}" \
    -U "${PGUSER}" \
    -d "${PGDATABASE}" \
    -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    log "${GREEN}=========================================="
    log "Database restore completed successfully!"
    log "==========================================${NC}"
    
    # Show some stats
    log "Verifying restored data:"
    TABLES=("users" "salons" "services" "employees" "reservations")
    for table in "${TABLES[@]}"; do
        count=$(psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null || echo "0")
        log "  - ${table}: ${count// /} rows"
    done
else
    log "${RED}=========================================="
    log "Database restore FAILED!"
    log "==========================================${NC}"
    log "Pre-restore backup is available at: ${PRE_RESTORE_BACKUP}"
    log "You can restore from it using: ./restore.sh ${PRE_RESTORE_BACKUP}"
    exit 1
fi

log ""
log "Restore completed. Pre-restore backup saved at: ${PRE_RESTORE_BACKUP}"

exit 0
