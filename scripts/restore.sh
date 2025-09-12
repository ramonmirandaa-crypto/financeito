#!/bin/sh
set -e
if [ -z "$1" ]; then echo "Uso: restore.sh <arquivo.tar.gz>"; exit 1; fi
FILE=$1
TMP=/backups/_restore
rm -rf "$TMP" && mkdir -p "$TMP"

tar xzf "$FILE" -C "$TMP"
DUMP=$(find "$TMP" -name db.dump | head -n1)

PGPASSWORD="$POSTGRES_PASSWORD" pg_restore   -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB"   --clean --if-exists "$DUMP"

rm -rf "$TMP"
