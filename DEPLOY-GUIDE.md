# 🚀 Guia de Deploy - Financeito v2.0

## 📋 **Pré-requisitos**

- ✅ Node.js 18+ instalado
- ✅ PostgreSQL configurado  
- ✅ Git configurado
- ✅ PM2 ou similar para gerenciamento de processo

---

## 📁 **Arquivos Alterados para Commit**

### **Componentes Principais**
```
components/ui/liquid-button.tsx          # Novo componente liquid glass
components/ui/fluid-menu.tsx             # Menu fluido vertical
components/ui/toast.tsx                  # Sistema de notificações
components/fluid-sidebar.tsx             # Sidebar atualizada
```

### **Sistema de Estado**
```
contexts/toast-context.tsx               # Context para toasts
hooks/use-toast.ts                       # Hook personalizado
app/providers.tsx                        # Providers atualizados
```

### **Páginas Redesenhadas**
```
app/dashboard/page.tsx                   # Dashboard com KPIs
app/budget/page.tsx                      # Orçamento pt-BR
app/loans/page.tsx                       # Empréstimos modernizados
app/subscriptions/page.tsx               # Assinaturas atualizadas
app/goals/page.tsx                       # Metas redesenhadas
```

### **Utilitários e Estilos**
```
lib/format-utils.ts                      # Formatação brasileira
app/globals.css                          # Estilos liquid glass + acessibilidade
```

### **Estados de Loading/Empty**
```
components/skeletons/                    # Todos os skeleton components
components/empty-states/                 # Estados vazios
```

---

## 🔧 **Comandos de Deploy**

### **1. Backup (Recomendado)**
```bash
# Fazer backup do banco atual
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Backup dos arquivos atuais
cp -r . ../financeito-backup-$(date +%Y%m%d)
```

### **2. Git Operations**
```bash
# Verificar status
git status

# Adicionar alterações
git add \
  components/ui/liquid-button.tsx \
  components/ui/fluid-menu.tsx \
  components/ui/toast.tsx \
  components/fluid-sidebar.tsx \
  contexts/toast-context.tsx \
  hooks/use-toast.ts \
  app/providers.tsx \
  app/dashboard/page.tsx \
  app/budget/page.tsx \
  app/loans/page.tsx \
  app/subscriptions/page.tsx \
  app/goals/page.tsx \
  lib/format-utils.ts \
  app/globals.css \
  components/skeletons/ \
  components/empty-states/ \
  CHANGELOG.md \
  DEPLOY-GUIDE.md

# Commit descritivo
git commit -m "feat: Modernização completa UI/UX v2.0

✨ Features:
- Design liquid glass inspirado na 21st.dev
- Localização brasileira (pt-BR) completa
- Sistema de toast notifications global
- Menu fluido vertical moderno
- Dashboard redesenhado com KPIs brasileiros

♿ Acessibilidade:
- Navegação por teclado completa
- ARIA labels e states adequados
- Suporte a prefers-reduced-motion
- Focus management otimizado
- Screen reader friendly

🎨 UI/UX:
- Estados de loading (skeletons) profissionais
- Estados vazios informativos
- Animações Framer Motion suaves
- Formatação de moeda/data brasileira
- Contraste e cores otimizadas

🔧 Técnico:
- Context providers para estado global
- Hooks personalizados reutilizáveis
- Componentes modulares e testáveis
- Performance otimizada com memoização

BREAKING CHANGES:
- Nova estrutura de componentes UI
- ToastProvider obrigatório na raiz da app
- Formatação de dados alterada para pt-BR"

# Push para origem
git push origin main
```

### **3. Deploy no Servidor**
```bash
# SSH para o servidor
ssh usuario@seu-servidor.com

# Navegar para diretório do projeto
cd /caminho/para/financeito

# Parar aplicação
pm2 stop financeito

# Fazer backup local no servidor
cp -r . ../financeito-backup-$(date +%Y%m%d)

# Puxar alterações
git pull origin main

# Instalar dependências (caso tenham mudado)
npm install --production

# Se scripts de instalação forem ignorados (ex.: `npm ci --ignore-scripts`), gere o Prisma Client manualmente
npm run db:generate

# Build da aplicação
npm run build

# Verificar se schema do banco precisa sync
# (apenas se houveram alterações no Prisma schema)
npm run db:push

# Reiniciar aplicação
pm2 start financeito
# ou
pm2 restart financeito

# Verificar logs
pm2 logs financeito

# Verificar status
pm2 status
```

### **4. Verificação Pós-Deploy**
```bash
# Testar endpoint de health
curl https://seu-dominio.com/api/health

# Verificar se aplicação está respondendo
curl -I https://seu-dominio.com

# Monitorar logs por alguns minutos
pm2 logs financeito --lines 50 -f
```

---

## ⚠️ **Problemas Conhecidos**

### **Subscription Foreign Key Error**
```
Erro: Foreign key constraint violated: `Subscription_userId_fkey (index)`
```

**Solução temporária:**
```sql
-- Verificar dados órfãos
SELECT * FROM "Subscription" WHERE "userId" NOT IN (SELECT id FROM "User");

-- Limpar dados órfãos (CUIDADO!)
DELETE FROM "Subscription" WHERE "userId" NOT IN (SELECT id FROM "User");
```

**Solução definitiva:**
- Revisar lógica de criação de subscriptions
- Garantir que userId seja válido antes de criar
- Adicionar validação no backend

---

## 🔍 **Troubleshooting**

### **Build Errors**
```bash
# Limpar cache do Next.js
rm -rf .next

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install

# Build novamente
npm run build
```

### **Database Issues**
```bash
# Verificar conexão
npm run db:studio

# Reset do schema (CUIDADO - apaga dados!)
npm run db:push --reset

# Verificar migrations pendentes
npx prisma migrate status
```

### **PM2 Issues**
```bash
# Reiniciar PM2 daemon
pm2 kill
pm2 resurrect

# Recriar aplicação no PM2
pm2 delete financeito
pm2 start npm --name "financeito" -- start

# Salvar configuração PM2
pm2 save
```

---

## 🌐 **Configurações de Produção**

### **Variáveis de Ambiente**
```env
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/financeito_prod"
ENCRYPTION_KEY_BASE64="sua-chave-segura-base64"
NEXTAUTH_SECRET="secret-muito-seguro-para-producao"
NEXTAUTH_URL="https://financeito.seudominio.com"

# Opcional - para backups
GOOGLE_DRIVE_KEY_FILE="/path/to/service-account.json"
GOOGLE_DRIVE_FOLDER_ID="id-da-pasta-backup"

# Opcional - para emails
SMTP_HOST="smtp.seuservidor.com"
SMTP_PORT=587
SMTP_USER="financeito@seudominio.com"
SMTP_PASS="senha-do-email"
```

### **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name financeito.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ **Checklist Final**

- [ ] **Backup realizado** (banco + arquivos)
- [ ] **Variáveis de ambiente** configuradas  
- [ ] **Build executado** sem erros
- [ ] **Schema do banco** sincronizado
- [ ] **Aplicação reiniciada** com sucesso
- [ ] **Endpoints testados** e funcionando
- [ ] **Logs monitorados** por alguns minutos
- [ ] **Interface visual** verificada no browser
- [ ] **Funcionalidades críticas** testadas
- [ ] **Performance** verificada (tempo de carregamento)

---

## 📞 **Suporte**

Em caso de problemas:

1. **Verificar logs**: `pm2 logs financeito`
2. **Verificar status**: `pm2 status`  
3. **Rollback**: Restaurar backup se necessário
4. **Database**: Verificar conexão e dados
5. **Nginx**: Verificar proxy e SSL

**🎉 Deploy concluído! Sua aplicação modernizada está no ar!**