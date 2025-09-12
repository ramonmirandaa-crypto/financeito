#!/bin/sh
printenv | grep -E '^(POSTGRES_|BACKUP_|GOOGLE_|GDRIVE_)' > /etc/environment
crond -l 2
cd /app && npm init -y >/dev/null 2>&1 || true && npm i googleapis minimist >/dev/null 2>&1
echo "$BACKUP_CRON /bin/sh /app/scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root
crond -f -d 8
