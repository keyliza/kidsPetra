# 1. Etapa de Construcción (Node.js)
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias y hacer caché
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --include=dev

# Copiar el resto del código del frontend
COPY frontend/ ./frontend/

# Compilar la aplicación para producción
RUN cd frontend && npm run build

# 2. Etapa de Servidor Web (Nginx)
FROM nginx:alpine

# Copiar archivos compilados al directorio de Nginx
COPY --from=build /app/frontend/dist/frontend/browser /usr/share/nginx/html

# Copiar configuración personalizada para Angular Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
