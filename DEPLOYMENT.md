# 📋 Documentación de Despliegue - DigiTicket

## 🏗️ Arquitectura del Proyecto

DigiTicket es una aplicación web full-stack que consta de:

- **Frontend**: React + TypeScript + Tailwind CSS (SPA)
- **Backend**: Spring Boot + JPA + MySQL
- **Base de Datos**: MySQL (AWS RDS)
- **Infraestructura**: AWS EC2 + Docker + Docker Compose
- **CI/CD**: GitHub Actions + Docker Hub

## 📁 Estructura del Proyecto

```
DigiTicket/
├── Frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/             # Páginas (Login, Register)
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript definitions
│   │   └── styles/            # Estilos CSS/Tailwind
│   ├── Dockerfile             # Imagen Docker (Nginx)
│   ├── nginx.conf             # Configuración Nginx
│   └── package.json           # Dependencias Node.js
├── Backend/
│   └── DigiTicket/            # Aplicación Spring Boot
│       ├── src/main/java/com/digiticket/
│       │   ├── controller/    # Controladores REST
│       │   ├── service/       # Lógica de negocio
│       │   ├── domain/        # Entidades JPA
│       │   ├── repository/    # Repositorios JPA
│       │   ├── dto/           # Data Transfer Objects
│       │   ├── security/      # Configuración JWT/Security
│       │   └── exception/     # Manejo de excepciones
│       ├── src/main/resources/
│       │   └── application.yml # Configuración Spring Boot
│       ├── Dockerfile         # Imagen Docker (OpenJDK)
│       └── pom.xml            # Dependencias Maven
├── docker-compose.yml         # Orquestación de contenedores
├── .github/workflows/
│   └── deploy.yml             # Pipeline CI/CD
└── README.md
```

## 🔧 Tecnologías y Versiones

### Frontend
- **Node.js**: 20.x
- **React**: 18.2.0
- **TypeScript**: 5.2.2
- **Vite**: 5.0.8 (Build tool)
- **Tailwind CSS**: 3.4.17
- **Nginx**: Alpine (Servidor web en producción)

### Backend
- **Java**: 21 (Eclipse Temurin)
- **Spring Boot**: 3.5.6
- **Maven**: 3.9
- **MySQL Connector**: 8.x
- **JWT**: 0.13.0 (jjwt)
- **Lombok**: 1.18.42

### Infraestructura
- **Docker**: Multi-stage builds
- **Docker Compose**: 3.8
- **AWS EC2**: Instancia Linux
- **AWS RDS**: MySQL 8.x
- **Docker Hub**: Registry de imágenes
- **GitHub Actions**: CI/CD

## 🚀 Proceso de Despliegue Completo

### 1. **Desarrollo Local**

#### Prerrequisitos
```bash
# Verificar versiones requeridas
node --version    # >= 20.x
java --version    # >= 21
mvn --version     # >= 3.9
docker --version  # >= 20.x
```

#### Configuración del Backend
```bash
# Navegar al directorio del backend
cd Backend/DigiTicket

# Instalar dependencias y compilar
mvn clean install

# Ejecutar localmente (requiere BD configurada)
mvn spring-boot:run
```

#### Configuración del Frontend
```bash
# Navegar al directorio del frontend
cd Frontend

# Instalar dependencias
npm ci

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

### 2. **Contenerización con Docker**

#### Backend Dockerfile (Multi-stage)
```dockerfile
# Etapa 1: Build con Maven + JDK 21
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Runtime con JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache wget
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### Frontend Dockerfile (Multi-stage)
```dockerfile
# Etapa 1: Build con Node.js 20
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Nginx para servir archivos estáticos
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 3. **Orquestación con Docker Compose**

```yaml
version: '3.8'

services:
  backend:
    image: ${DOCKERHUB_USERNAME}/digiticket-backend:latest
    container_name: digiticket-backend
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - digiticket-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  frontend:
    image: ${DOCKERHUB_USERNAME}/digiticket-frontend:latest
    container_name: digiticket-frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - digiticket-network

networks:
  digiticket-network:
    driver: bridge
```

### 4. **Pipeline CI/CD con GitHub Actions**

El pipeline se ejecuta automáticamente cuando se hace push a la rama `main` y consta de 4 etapas:

#### Etapa 1: Test Backend
```yaml
test-backend:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
    - name: Set up JDK 21
    - name: Create application.yml (desde secrets)
    - name: Run Tests (mvn clean test)
```

#### Etapa 2: Test Frontend
```yaml
test-frontend:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
    - name: Setup Node.js 20
    - name: Install dependencies (npm ci)
    - name: Lint code
    - name: Build (npm run build)
```

#### Etapa 3: Build and Push
```yaml
build-and-push:
  needs: [test-backend, test-frontend]
  steps:
    - name: Set up Docker Buildx
    - name: Login to Docker Hub
    - name: Build and Push Backend Image
    - name: Build and Push Frontend Image
```

#### Etapa 4: Deploy to EC2
```yaml
deploy:
  needs: build-and-push
  steps:
    - name: SSH to EC2 and deploy
      script: |
        cd ~/digiticket
        docker pull images
        docker-compose up -d --force-recreate
```

### 5. **Configuración de Infraestructura AWS**

#### Base de Datos (RDS MySQL)
```yaml
# Configuración en application.yml
spring:
  datasource:
    url: jdbc:mysql://[RDS_ENDPOINT]:3306/DigiTicket
    username: admin
    password: [SECRET]
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
```

#### Servidor EC2
```bash
# Instalación de Docker y Docker Compose en EC2
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🔐 Configuración de Secrets

### GitHub Secrets Requeridos:
```
DOCKERHUB_USERNAME=tu_usuario_dockerhub
DOCKERHUB_TOKEN=tu_token_dockerhub
EC2_HOST=ip_de_tu_instancia_ec2
EC2_USER=ec2-user
EC2_SSH_KEY=tu_clave_privada_ssh
APPLICATION_YML=contenido_completo_del_application.yml
```

### Variables de Entorno en EC2:
```bash
# Crear archivo .env en el servidor
echo "DOCKERHUB_USERNAME=tu_usuario" > ~/digiticket/.env
```

## 🚦 Proceso de Despliegue Paso a Paso

### 1. **Push a la rama main**
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

### 2. **GitHub Actions se ejecuta automáticamente**
- ✅ Ejecuta tests del backend (Maven)
- ✅ Ejecuta tests y build del frontend (npm)
- ✅ Construye imágenes Docker
- ✅ Sube imágenes a Docker Hub
- ✅ Se conecta por SSH a EC2
- ✅ Descarga nuevas imágenes
- ✅ Reinicia contenedores

### 3. **Verificación del Despliegue**
```bash
# Verificar servicios en EC2
docker-compose ps
docker-compose logs -f

# Health checks
curl http://tu-servidor/api/hello
curl http://tu-servidor:8080/actuator/health
```

## 🛠️ Comandos Útiles

### Docker
```bash
# Build manual de imágenes
docker build -t digiticket-backend ./Backend/DigiTicket/
docker build -t digiticket-frontend ./Frontend/

# Ejecutar localmente con Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down

# Limpiar imágenes antiguas
docker image prune -af
```

### Maven (Backend)
```bash
# Compilar y empaquetar
mvn clean package

# Ejecutar tests
mvn test

# Ejecutar sin tests
mvn clean package -DskipTests
```

### npm (Frontend)
```bash
# Instalar dependencias
npm ci

# Desarrollo
npm run dev

# Build para producción
npm run build

# Linting
npm run lint
```

## 🔍 Monitoreo y Logs

### Health Checks
- **Backend**: `http://servidor:8080/actuator/health`
- **Frontend**: `http://servidor:80`

### Logs de Contenedores
```bash
# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend

# Ver logs de las últimas 100 líneas
docker-compose logs --tail=100 backend
```

### Métricas de Recursos
```bash
# Estado de contenedores
docker stats

# Uso de espacio
docker system df
```

## 🚨 Solución de Problemas Comunes

### Error de StackOverflowError en Backend
```java
// Problema: Recursión infinita en entidades JPA
// Solución: Excluir campos relacionales en @ToString
@ToString(exclude = {"user", "password"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
```

### Error de CORS en Frontend
```javascript
// Configuración en vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  }
}
```

### Error de Conexión a Base de Datos
```yaml
# Verificar configuración en application.yml
spring:
  datasource:
    url: jdbc:mysql://[HOST]:3306/[DB]?useSSL=true&serverTimezone=UTC
```

### Imagen Docker muy grande
```dockerfile
# Usar imágenes Alpine
FROM node:20-alpine
FROM eclipse-temurin:21-jre-alpine

# Multi-stage builds para reducir tamaño
```

## 📈 Optimizaciones de Rendimiento

### Backend
- **JVM Tuning**: `-Xms512m -Xmx1024m -XX:+UseG1GC`
- **Connection Pooling**: HikariCP (incluido en Spring Boot)
- **Caché**: Spring Cache + Redis (para futuras implementaciones)

### Frontend
- **Code Splitting**: Vite automático
- **Lazy Loading**: React.lazy para rutas
- **Compresión**: Gzip en Nginx
- **CDN**: Para assets estáticos (recomendado)

### Base de Datos
- **Índices**: En campos de búsqueda frecuente
- **Query Optimization**: Usar @Query para consultas complejas
- **Connection Pool**: Configurar según carga esperada

## 🔄 Estrategias de Rollback

### Rollback Automático
```bash
# El healthcheck falla automáticamente si hay problemas
# Docker Compose no actualiza si el nuevo contenedor no pasa el healthcheck
```

### Rollback Manual
```bash
# Volver a una imagen anterior
docker pull usuario/digiticket-backend:previous-sha
docker-compose up -d backend

# O usar tags específicos
docker pull usuario/digiticket-backend:v1.0.0
```

### Rollback de Base de Datos
```sql
-- Usar migraciones versionadas con Flyway (recomendado para el futuro)
-- Mantener backups automáticos en RDS
```

## 📝 Checklist de Despliegue

### Pre-despliegue
- [ ] Tests locales pasan
- [ ] Build local exitoso
- [ ] Secrets de GitHub actualizados
- [ ] RDS accesible desde EC2
- [ ] EC2 con suficiente espacio

### Post-despliegue
- [ ] Health checks responden OK
- [ ] Frontend carga correctamente
- [ ] API endpoints funcionan
- [ ] Login/Register operativos
- [ ] Logs sin errores críticos
- [ ] Métricas de rendimiento aceptables

### Rollback Plan
- [ ] Procedimiento de rollback documentado
- [ ] Backup de base de datos actualizado
- [ ] Imágenes Docker anteriores disponibles
- [ ] Contactos de emergencia definidos

---

## 🤝 Contribución

Para contribuir al proyecto:

1. **Fork** del repositorio
2. **Crear** rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** Pull Request

### Convenciones de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización de código
test: añadir o modificar tests
chore: tareas de mantenimiento
```

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0  
**Autor**: Omar Aedo Alvarez  
**Empresa**: Bytecraft