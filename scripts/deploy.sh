#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf '==> Verificando estado do repositório\n'
if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Há alterações locais não commitadas. Abortando atualização.\n' >&2
  exit 1
fi

printf '==> Buscando atualizações remotas\n'
git fetch --all --prune

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
printf '==> Atualizando branch %s\n' "$CURRENT_BRANCH"
git pull --ff-only

printf '==> Recriando contêineres Docker (db, web, backup)\n'
docker compose up -d --build db web backup

printf '==> Estado atual dos contêineres\n'
docker compose ps

printf '==> Deploy concluído com sucesso.\n'
