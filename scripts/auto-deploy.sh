#!/usr/bin/env bash
set -euo pipefail

# Auto-deploy script for p0ker (PM2: p0ker-server & p0ker-client)
# Usage: run via cron every minute or PM2 watcher loop

REPO_DIR="${REPO_DIR:-$HOME/p0ker}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="/tmp/p0ker-auto-deploy.lock"
LOG_FILE="$REPO_DIR/auto-deploy.log"

# Ensure node/npm/pm2 are in PATH (supports standard & nvm installs)
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

# Prevent concurrent runs
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  exit 0
fi

cd "$REPO_DIR"

git fetch origin "$BRANCH" --quiet

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commit detected: $LOCAL_HASH -> $REMOTE_HASH" | tee -a "$LOG_FILE"

CHANGED_FILES=$(git diff --name-only "$LOCAL_HASH" "$REMOTE_HASH")

git pull --ff-only origin "$BRANCH" >> "$LOG_FILE" 2>&1

if echo "$CHANGED_FILES" | grep -qE "package(-lock)?\.json"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] package.json changed, running npm install..." | tee -a "$LOG_FILE"
  npm install >> "$LOG_FILE" 2>&1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building shared, server, and client..." | tee -a "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting PM2 p0ker-server & p0ker-client..." | tee -a "$LOG_FILE"
pm2 restart p0ker-server p0ker-client >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy complete!" | tee -a "$LOG_FILE"
