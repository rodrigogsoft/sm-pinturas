# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências (inclui dev para build)
RUN npm install --legacy-peer-deps && npm install -g @nestjs/cli

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Etapa de produção
FROM node:18-alpine AS production

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar build da etapa anterior
COPY --from=builder /app/dist ./dist

# Criar usuário não-root e pasta de uploads com permissão
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 \
    && mkdir -p /app/uploads /app/config \
    && chown -R nestjs:nodejs /app/uploads /app/config
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de start
CMD ["node", "dist/main.js"]

# Etapa de desenvolvimento
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]
