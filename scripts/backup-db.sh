#!/bin/bash
# Daily Postgres backup on the VM, keeping the last 7 days.
# Installed by cron (see PROJECT_CONTEXT.md → Deployment → Backups):
#   15 3 * * * /home/ubuntu/Hajj-Website/scripts/backup-db.sh >> /home/ubuntu/backups/backup.log 2>&1
set -euo pipefail

DIR=/home/ubuntu/backups
mkdir -p "$DIR"
FILE="$DIR/hajjdb-$(date -u +%Y-%m-%d).sql.gz"

docker exec hajj-website-db-1 pg_dump -U hajj hajjdb | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
find "$DIR" -name 'hajjdb-*.sql.gz' -mtime +6 -delete

echo "$(date -u +%FT%TZ) backed up $(du -h "$FILE" | cut -f1) to $FILE"
