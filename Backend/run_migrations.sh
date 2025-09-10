#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations for the Backend package.
# Usage: ./run_migrations.sh
# Requirements:
# - Python deps installed (pip install -r requirements.txt)
# - DATABASE_URL available (export it or add it to ../.env)

# Move to the Backend directory (script lives in Backend)
cd "$(dirname "$0")"

# Load top-level .env if present (parse safely)
if [ -f "../.env" ]; then
  echo "Loading environment variables from ../.env"
  # Read file line-by-line, skip comments and blank lines, extract KEY=VALUE safely
  while IFS= read -r line || [ -n "$line" ]; do
    # trim leading/trailing whitespace
    line="${line#${line%%[![:space:]]*}}"
    line="${line%${line##*[![:space:]]}}"
    # skip empty or comment lines
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key=${BASH_REMATCH[1]}
      val=${BASH_REMATCH[2]}
      # remove surrounding quotes if present
      if [[ ("${val:0:1}" == '"' && "${val: -1}" == '"') || ("${val:0:1}" == "'" && "${val: -1}" == "'") ]]; then
        val=${val:1:-1}
      fi
      export "$key"="$val"
    fi
  done < ../.env
fi

# Activate local venv if present
if [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# Ensure DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Export it or add it to ../.env"
  exit 1
fi

echo "Using DATABASE_URL=$DATABASE_URL"

echo "Running alembic upgrade head..."
# Use alembic from the environment; alembic.ini is in this directory
alembic -c alembic.ini upgrade head

echo "Migrations complete."
