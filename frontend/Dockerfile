
# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Argumentos de build
ARG VITE_API_URL
ARG VITE_ENV

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENV=$VITE_ENV

# Build
RUN npm run build

# Etapa de desenvolvimento (opcional, não usada no build padrão)
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Etapa de produção com nginx (deve ser a última!)
FROM nginx:alpine AS production

# Hostname do backend na rede Docker (ex: backend-prod, backend-homol)
ARG BACKEND_HOST=backend-prod
ENV BACKEND_HOST=$BACKEND_HOST

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração nginx como template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Substitui $BACKEND_HOST no template e inicia nginx
CMD ["sh", "-c", "envsubst '$BACKEND_HOST' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
