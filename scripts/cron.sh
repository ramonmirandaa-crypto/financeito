#!/bin/sh
printenv | grep -E '^(POSTGRES_|BACKUP_|GOOGLE_|GDRIVE_|DATABASE_URL)' > /etc/environment
echo "$BACKUP_CRON /bin/sh /app/scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root
cron -f -L 2
