# Build
FROM node:20 as builder
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Runtime
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     openssl ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
CMD ["npm", "run", "start"]
