# Build
FROM node:20 as builder
WORKDIR /app

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

COPY package*.json prisma ./
RUN npm ci || npm install
COPY . .
RUN mkdir -p public
RUN npm run build

# Runtime
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     openssl ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*
RUN useradd -m appuser
COPY --from=builder --chown=appuser:appuser /app/.next ./.next
COPY --from=builder --chown=appuser:appuser /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/prisma ./prisma

USER appuser

EXPOSE 5000
CMD ["npm", "run", "start"]
