# Financeito – Guia Rápido

## Recursos Suportados

- Autenticação de usuários via NextAuth.
- Conexão de contas bancárias via Pluggy.
- Sincronização e listagem de transações.
- Recursos como orçamento, metas, assinaturas, recorrências e empréstimos familiares ainda não estão disponíveis.

## Tema e prevenção de FOUC

- O layout injeta um script inline (`ThemeScript`) logo na abertura da tag `<head>` para aplicar imediatamente o tema salvo, evitando o flash de conteúdo com cores incorretas (FOUC) antes da hidratação do React.
- O script reutiliza a mesma chave `financeito.theme` empregada no contexto de tema, mantendo o `localStorage` sincronizado com o estado global da aplicação.

## Cookie de Sessão

- Em desenvolvimento (`NODE_ENV !== 'production'`), o cookie de sessão é criado sem a flag `Secure`, permitindo o uso em `http://localhost`.
- Em produção (`NODE_ENV === 'production'`), a flag `Secure` é aplicada e o cookie só é transmitido via HTTPS.

## 1) Cloudflare – Registro A
1. Acesse o painel do Cloudflare e selecione a zona do domínio.
2. Em **DNS**, clique em **Add record** e escolha **Type A**.
3. Use **Name** `financeapp` e informe o IP público do TrueNAS em **IPv4 address**.
4. Em **Proxy Status**, clique para alternar:
   - **Proxied** (ícone laranja) ativa o proxy da Cloudflare.
   - **DNS only** (ícone cinza) envia tráfego direto ao servidor.

## 2) Pré-requisitos
- TrueNAS SCALE 25.04
- Registro A configurado conforme acima
- Certificado **Cloudflare Origin** exportado como `origin.crt` e `origin.key`
- Variáveis do `.env` preenchidas

## 3) Criar datasets no TrueNAS e abrir Shell
1. Na GUI do TrueNAS, navegue em **Storage → Pools → dados → Add Dataset** e crie:
   - `financeito`
   - `financeito/app`
   - `financeito/db`
   - `financeito/tls`
   - `financeito/backups`
   Os dados do PostgreSQL serão armazenados em `/mnt/dados/financeito/db` e os backups em `/mnt/dados/financeito/backups`.
2. Use o botão **Shell** no topo da interface para abrir um terminal no host.

## 4) Clonar o projeto no TrueNAS (Shell)
```bash
mkdir -p /mnt/dados/financeito && cd /mnt/dados/financeito
git clone https://github.com/ramonmirandaa-crypto/financeito.git app
cd app
```

## 5) TLS (arquivos)
Coloque:
```
/mnt/dados/financeito/tls/origin.crt
/mnt/dados/financeito/tls/origin.key
```

## 6) Criar o .env
```bash
cd /mnt/dados/financeito/app
cp .env.example .env
nano .env
```
No arquivo `.env`, defina `ENCRYPTION_KEY_BASE64` com uma chave de 32 bytes codificada em Base64 para criptografia dos dados sensíveis.
Sem uma chave válida, as rotas de sincronização responderão com `503` exibindo o erro `ENCRYPTION_KEY_BASE64 ausente ou inválido. Configure uma chave Base64 de 32 bytes (256 bits) para habilitar a criptografia.`

### Variáveis Pluggy
- `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`: credenciais do painel Pluggy. Sem elas, as rotas retornarão `503` com o erro `PLUGGY_CLIENT_ID e/ou PLUGGY_CLIENT_SECRET não foram configurados. Defina as variáveis de ambiente antes de usar a integração.`
- `PLUGGY_BASE_URL` e `PLUGGY_ENV`: ajuste conforme o ambiente desejado.

### Variáveis Google (backups)
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`: conteúdo do JSON da conta de serviço codificado em Base64.
- `GDRIVE_BACKUP_FOLDER_ID`: ID da pasta de destino no Google Drive.

### Variáveis SMTP
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`: parâmetros do servidor de e‑mail.
- `SMTP_USER` e `SMTP_PASS`: credenciais de autenticação.
- `SMTP_FROM`: endereço do remetente exibido nas mensagens.

## 7) Subir containers
```bash
docker compose up -d --build db web backup
```
O contêiner `web` executa `./node_modules/.bin/prisma migrate deploy` automaticamente ao iniciar.

## 8) Proxy externo (Nginx/Cloudflare)
- No `.env`, `PUBLIC_BASE_URL` deve usar `https://`.
- A variável `DOMAIN` foi removida; use apenas `PUBLIC_BASE_URL` para definir o domínio público.
- Configure o proxy apontando para `http://localhost:3000` (container `web`).
- Encaminhe os cabeçalhos `Host`, `X-Real-IP`, `X-Forwarded-For` e `X-Forwarded-Proto`.
- Se utilizar Nginx, copie `nginx.conf` para `/etc/nginx/nginx.conf` no servidor host e reinicie o serviço.

## 9) Backup, restauração e verificação do TLS
O contêiner `backup` executa rotinas agendadas via cron para gerar backups automáticos.
Para verificar os logs dessas execuções, utilize:
```bash
docker compose logs backup
```
- **Backup manual**
  ```bash
  docker compose up -d backup && docker compose exec backup sh /app/scripts/backup.sh
  ```
  O arquivo gerado é salvo em `/mnt/dados/financeito/backups` e enviado ao Google Drive, sendo mantido por `BACKUP_RETENTION_DAYS`. Caso queira sobrescrever este valor em uma execução específica do `gdrive-upload.js`, use `--retention N`.
- **Exportar tabelas em JSON/CSV**
  ```bash
  docker compose exec backup node /app/scripts/gdrive-upload.js --export-json /backups/json --skip-upload
  ```
  Exemplo de saída:
  ```text
  Exported users (2 rows)
  Exported accounts (5 rows)
  ```
  O upload só ocorre quando `--skip-upload` não é utilizado.
- **Restauração**
  Baixe um `.tar.gz` do Drive para `/mnt/dados/financeito/backups` e execute:
  ```bash
  docker compose exec backup sh /app/scripts/restore.sh /backups/NOME_DO_ARQUIVO.tar.gz
  ```
- **Verificar TLS**
  ```bash
  curl -I https://financeapp.ramonma.online/api/health
  ```
  A resposta deve ser `200` e o certificado apresentado precisa ser o **Cloudflare Origin**.

## 10) Testes
- SMTP:
  ```bash
  docker compose exec web node -e "require('./lib/mailer').sendTest(process.env.SMTP_USER).then(console.log).catch(console.error)"
  ```

## 11) Pluggy (Open Finance)
No Dashboard clique **Conectar Conta** e conclua o fluxo do Pluggy Connect.
