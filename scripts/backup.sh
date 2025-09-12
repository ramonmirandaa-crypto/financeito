#!/bin/sh
set -e
STAMP=$(date +%Y%m%d-%H%M%S)
DIR=/backups/$STAMP
mkdir -p "$DIR"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump   -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB"   -F c -f "$DIR/db.dump"

if [ "$BACKUP_INCLUDE_JSON_EXPORT" = "true" ]; then
  node /app/scripts/gdrive-upload.js --export-json "$DIR/json" --skip-upload
fi

cd /backups && tar czf "$STAMP.tar.gz" "$STAMP" && rm -rf "$STAMP"

node /app/scripts/gdrive-upload.js --file "/backups/$STAMP.tar.gz" --retention "$BACKUP_RETENTION_DAYS"
