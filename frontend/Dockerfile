
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

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
