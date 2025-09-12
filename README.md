# Financeito – Guia Rápido

## 1) Pré-requisitos
- TrueNAS SCALE 25.04
- DNS no Cloudflare (subdomínio `financeapp.ramonma.online` -> Proxy **laranja**)
- Certificado **Cloudflare Origin** exportado como `origin.crt` e `origin.key`
- Variáveis do `.env` preenchidas

## 2) Copiar projeto para o TrueNAS (Shell)
```bash
mkdir -p /mnt/dados/financeito/app && cd /mnt/dados/financeito/app
# Envie o zip para esta pasta e extraia:
# unzip financeito-project.zip -d .
```

## 3) TLS (arquivos)
Coloque:
```
/mnt/dados/financeito/tls/origin.crt
/mnt/dados/financeito/tls/origin.key
```

## 4) Criar o .env
```bash
cd /mnt/dados/financeito/app
cp .env.example .env
nano .env
```

## 5) Subir containers
```bash
docker compose build
docker compose up -d db web
docker compose exec web npx prisma migrate deploy
```

## 6) Proxy externo (Nginx/Cloudflare)
- No `.env`, `PUBLIC_BASE_URL` deve usar `https://`.
- Configure o proxy apontando para `http://localhost:3000` (container `web`).
- Certifique-se de encaminhar os cabeçalhos `Host`, `X-Real-IP`, `X-Forwarded-For` e `X-Forwarded-Proto`.
- Se utilizar Nginx, copie `nginx.conf` para `/etc/nginx/nginx.conf` no servidor host e reinicie o serviço.

## 7) Testes
- HTTPS: `https://financeapp.ramonma.online/healthz` deve retornar `200`
- SMTP: `docker compose exec web node -e "require('./lib/mailer').sendTest(process.env.SMTP_USER).then(console.log).catch(console.error)"`
- Backup manual: `docker compose up -d backup && docker compose exec backup sh /app/scripts/backup.sh`

## 8) Pluggy (Open Finance)
No Dashboard clique **Conectar Conta** e conclua o fluxo do Pluggy Connect.

## 9) Restore
Baixe um `.tar.gz` da pasta do Drive para `/mnt/dados/financeito/backups` e depois:
```bash
docker compose exec backup sh /app/scripts/restore.sh /backups/NOME_DO_ARQUIVO.tar.gz
```
