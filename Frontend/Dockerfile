# =========================
# Etapa 1: Build (Compilación del proyecto Node.js)
# =========================
# Imagen base con Node.js 20 sobre Alpine (ligera)
# Esta etapa se usa solo para construir los archivos estáticos (HTML, JS, CSS, etc.)
FROM node:20-alpine AS build

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias (package.json y package-lock.json)
# Se usa package*.json para incluir ambos si existen.
COPY package*.json ./

# Instala las dependencias del proyecto usando npm ci (más rápido y reproducible que npm install)
RUN npm ci

# Copia el resto del código fuente dentro del contenedor
COPY . .

# Ejecuta el script de build definido en package.json
# Esto genera los archivos estáticos en la carpeta /app/dist
RUN npx vite build --mode production

# =========================
# Etapa 2: Runtime (Servidor web Nginx)
# =========================
# Imagen base de Nginx sobre Alpine, muy ligera (~5MB)
FROM nginx:alpine

# Define el directorio donde Nginx sirve los archivos
WORKDIR /usr/share/nginx/html

# Limpia los archivos por defecto del contenedor (index.html, etc.)
RUN rm -rf ./*

# Copia los archivos construidos en la etapa anterior hacia la carpeta pública de Nginx
COPY --from=build /app/dist .

# Copia el archivo de configuración personalizado de Nginx
# (por ejemplo para redirecciones o manejar rutas SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajusta permisos: asigna propiedad a usuario nginx y permisos de lectura/ejecución
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Expone el puerto 80 (donde Nginx servirá la app)
EXPOSE 80

# Define un chequeo de salud: verifica cada 30s si el servidor responde en el puerto 80
# Si wget no puede alcanzar la página, el contenedor se marca como "unhealthy"
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Comando principal para mantener Nginx corriendo en primer plano
CMD ["nginx", "-g", "daemon off;"]
