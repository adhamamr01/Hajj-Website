#!/bin/bash
# Daily Postgres backup on the VM, keeping the last 7 days there, plus a copy in
# the private OCI bucket hajj-website-backups (7 daily + 12 monthly).
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

# Off-VM copy to the private bucket hajj-website-backups through a write-only
# pre-authenticated request (BACKUP_PAR_URL in the repo .env; a secret, never
# printed). Fixed names that get overwritten keep 7 daily and 12 monthly copies
# without a lifecycle rule.
PAR=$(grep -m1 '^BACKUP_PAR_URL=' /home/ubuntu/Hajj-Website/.env | cut -d= -f2- || true)
if [ -z "$PAR" ]; then
  echo "BACKUP_PAR_URL not set: skipped the off-VM copy"
  exit 0
fi
upload() {
  curl -sS -f -o /dev/null --max-time 120 -X PUT -H "Content-Type: application/gzip" \
    --data-binary "@$FILE" "$PAR$1"
  echo "copied to bucket as $1"
}
upload "daily/hajjdb-$(date -u +%a).sql.gz"
if [ "$(date -u +%d)" = "01" ]; then
  upload "monthly/hajjdb-$(date -u +%m).sql.gz"
fi
