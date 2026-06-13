#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

{
  find public src prisma scripts -type f -not -path '*/node_modules/*' -print 2>/dev/null
  find . -maxdepth 1 -type f \( -name 'package*.json' -o -name 'Dockerfile' -o -name 'nest-cli.json' -o -name 'tsconfig*.json' \) -print 2>/dev/null
} | sort | xargs sha256sum | sha256sum | awk '{print $1}'
