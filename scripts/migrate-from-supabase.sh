#!/bin/bash
# ==============================================================
# APIS SaaS - Supabase to Self-Hosted PostgreSQL Migration Script
# For Wedos VPS ON deployment
# ==============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  APIS SaaS - Database Migration from Supabase  ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Configuration - Update these values!
SUPABASE_CONNECTION_STRING="${SUPABASE_DATABASE_URL:-postgres://postgres:8Elx3VUbCf5L2cdXlLydyit0UISjw2kinvKKfi2mQlGIteY33iTxHWp5MB69C59h@ns48wss8ok8c8sgoocow4wkg:5432/postgres}"
TARGET_CONNECTION_STRING="${DATABASE_URL:-postgresql://apis_user:your_password@localhost:5432/apis_production}"

BACKUP_DIR="/mnt/wedos-disk/backups/migration"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/supabase_export_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}Step 1: Exporting data from Supabase...${NC}"
echo "This will export only the public schema (your application data)"
echo ""

# Export from Supabase - only public schema, no auth/storage/realtime
pg_dump "${SUPABASE_CONNECTION_STRING}" \
    --schema=public \
    --no-owner \
    --no-acl \
    --no-comments \
    --clean \
    --if-exists \
    --file="${DUMP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Export completed: ${DUMP_FILE}${NC}"
    echo "  File size: $(du -h "${DUMP_FILE}" | cut -f1)"
else
    echo -e "${RED}✗ Export failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Cleaning export file...${NC}"

# Remove Supabase-specific references that might cause issues
sed -i 's/supabase_admin/apis_user/g' "${DUMP_FILE}"
sed -i 's/authenticated/apis_user/g' "${DUMP_FILE}"
sed -i 's/anon/apis_user/g' "${DUMP_FILE}"
sed -i '/GRANT.*supabase/d' "${DUMP_FILE}"
sed -i '/ALTER.*OWNER TO/d' "${DUMP_FILE}"

echo -e "${GREEN}✓ Export file cleaned${NC}"

echo ""
echo -e "${YELLOW}Step 3: Preparing target database...${NC}"

# Create extensions on target database
psql "${TARGET_CONNECTION_STRING}" << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
EOF

echo -e "${GREEN}✓ Extensions created${NC}"

echo ""
echo -e "${YELLOW}Step 4: Importing data to VPS database...${NC}"

# Import the dump
psql "${TARGET_CONNECTION_STRING}" -f "${DUMP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import completed successfully${NC}"
else
    echo -e "${RED}✗ Import failed!${NC}"
    echo "Check the error messages above and the dump file: ${DUMP_FILE}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Verifying data integrity...${NC}"

# Count rows in main tables
echo "Counting records in main tables:"

TABLES=("users" "salons" "services" "employees" "reservations" "payments" "reviews")

for table in "${TABLES[@]}"; do
    count=$(psql "${TARGET_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null || echo "0")
    echo "  - ${table}: ${count// /} rows"
done

echo ""
echo -e "${YELLOW}Step 6: Creating initial admin user (if not exists)...${NC}"

psql "${TARGET_CONNECTION_STRING}" << EOF
INSERT INTO users (email, password_hash, name, role)
SELECT 'admin@salonio.cz', crypt('ChangeThisPassword123!', gen_salt('bf', 12)), 'System Admin', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@salonio.cz');
EOF

echo -e "${GREEN}✓ Admin user ensured${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Migration completed successfully!             ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Update your .env file with the new DATABASE_URL"
echo "  2. Test the application thoroughly"
echo "  3. Update Comgate webhook URL to your new domain"
echo "  4. Add your VPS IP to GoSMS whitelist"
echo "  5. Change the admin password immediately!"
echo ""
echo "Backup file saved at: ${DUMP_FILE}"
echo ""
