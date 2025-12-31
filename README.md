# 🎫 DigiTicket - Sistema de Gestión de Tickets

[![Build Status](https://img.shields.io/github/workflow/status/OmarAedoAlvarez/DigiTicket/CI%2FCD%20Pipeline)](https://github.com/OmarAedoAlvarez/DigiTicket/actions)
[![Docker Hub](https://img.shields.io/badge/Docker-Hub-blue)](https://hub.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Descripción

DigiTicket es una plataforma moderna de gestión de tickets desarrollada con tecnologías de vanguardia. El sistema permite a los usuarios registrarse, iniciar sesión y gestionar tickets de manera eficiente.

### ✨ Características Principales

- 🔐 **Autenticación JWT**: Sistema seguro de login y registro
- 📱 **Responsive Design**: Interfaz adaptable a todos los dispositivos
- 🎨 **UI Moderna**: Diseño elegante con gradientes y animaciones suaves
- 🚀 **Alto Rendimiento**: Arquitectura optimizada con Docker y microservicios
- 🛡️ **Seguridad**: Encriptación de contraseñas y validación de datos
- 📊 **Monitoreo**: Health checks y logging integrado

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Base de Datos │
│   React + TS    │◄──►│  Spring Boot    │◄──►│     MySQL       │
│   Tailwind CSS  │    │   + JPA + JWT   │    │   (AWS RDS)     │
│     Nginx       │    │     Java 21     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Docker +      │
                    │  AWS EC2 +      │
                    │ GitHub Actions  │
                    └─────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 20+ 
- **Java** 21+
- **Maven** 3.9+
- **Docker** & **Docker Compose**

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/ByteCraft-IngeSoft/DigiTicket.git
cd DigiTicket
```

2. **Configurar el Backend**
```bash
cd Backend/DigiTicket
mvn clean install
mvn spring-boot:run
```

3. **Configurar el Frontend**
```bash
cd Frontend
npm ci
npm run dev
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/actuator/health

## 🐳 Despliegue con Docker

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
export DOCKERHUB_USERNAME=tu_usuario
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentación

- 📖 **[Guía de Despliegue Completa](DEPLOYMENT.md)** - Documentación detallada del proceso de despliegue
- 🔧 **[API Documentation](docs/API.md)** - Endpoints y especificaciones de la API
- 🎨 **[UI/UX Guide](docs/UI.md)** - Guía de diseño e interfaz de usuario

## 🛠️ Stack Tecnológico

### Frontend
- **React** 18.2.0 - Framework de UI
- **TypeScript** 5.2.2 - Tipado estático
- **Tailwind CSS** 3.4.17 - Framework CSS
- **Vite** 5.0.8 - Build tool y dev server
- **React Router** 7.9.2 - Enrutamiento

### Backend
- **Spring Boot** 3.5.6 - Framework Java
- **Spring Data JPA** - Persistencia de datos
- **Spring Security** - Autenticación y autorización
- **JWT** - Tokens de autenticación
- **MySQL** - Base de datos relacional
- **Maven** - Gestión de dependencias

### DevOps & Infraestructura
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **GitHub Actions** - CI/CD
- **AWS EC2** - Hosting
- **AWS RDS** - Base de datos gestionada
- **Docker Hub** - Registry de imágenes
- **Nginx** - Servidor web

## 📁 Estructura del Proyecto

```
DigiTicket/
├── 📂 Frontend/                 # Aplicación React
│   ├── 📂 src/
│   │   ├── 📂 components/       # Componentes reutilizables
│   │   ├── 📂 pages/           # Páginas (Login, Register)
│   │   ├── 📂 hooks/           # Custom hooks
│   │   ├── 📂 types/           # Definiciones TypeScript
│   │   └── 📂 styles/          # Estilos CSS
│   ├── 📄 Dockerfile           # Imagen Docker Frontend
│   ├── 📄 nginx.conf           # Configuración Nginx
│   └── 📄 package.json         # Dependencias Node.js
├── 📂 Backend/
│   └── 📂 DigiTicket/          # Aplicación Spring Boot
│       ├── 📂 src/main/java/com/digiticket/
│       │   ├── 📂 controller/  # Controladores REST
│       │   ├── 📂 service/     # Lógica de negocio
│       │   ├── 📂 domain/      # Entidades JPA
│       │   ├── 📂 repository/  # Repositorios JPA
│       │   ├── 📂 dto/         # Data Transfer Objects
│       │   ├── 📂 security/    # Configuración JWT
│       │   └── 📂 exception/   # Manejo de excepciones
│       ├── 📄 Dockerfile       # Imagen Docker Backend
│       └── 📄 pom.xml          # Dependencias Maven
├── 📄 docker-compose.yml       # Orquestación contenedores
├── 📂 .github/workflows/       # Pipelines CI/CD
└── 📄 DEPLOYMENT.md            # Documentación de despliegue
```

## 🔌 API Endpoints

### Autenticación
```http
POST /api/auth/login      # Iniciar sesión
POST /api/auth/register   # Registrar usuario
```

### Health Check
```http
GET /api/hello           # Verificar estado del servicio
GET /actuator/health     # Health check detallado
```

## 🎨 Screenshots

### Página de Login
![Login Page](docs/images/login-page.png)

### Página de Registro
![Register Page](docs/images/register-page.png)

## 🧪 Testing

### Backend Tests
```bash
cd Backend/DigiTicket
mvn test
```

### Frontend Tests
```bash
cd Frontend
npm run test
npm run lint
```

### E2E Tests
```bash
npm run test:e2e
```

## 📈 Monitoreo y Métricas

- **Health Checks**: Endpoints `/actuator/health`
- **Logs**: Centralizados con Docker logging
- **Métricas**: Spring Boot Actuator
- **Uptime**: Monitoreo automático con GitHub Actions

## 🤝 Contribución



### Proceso de Contribución

1. **Fork** el repositorio
2. **Crear** una rama feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** los cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### Convenciones de Código

- **Backend**: Seguir convenciones de Spring Boot y Clean Code
- **Frontend**: Usar ESLint y Prettier configurados
- **Commits**: Seguir [Conventional Commits](https://conventionalcommits.org/)

## 📝 Changelog

### v1.0.0 (2025-10-06)
- ✨ Implementación inicial del sistema
- 🔐 Sistema de autenticación JWT
- 📱 Interfaz responsive con React
- 🐳 Containerización con Docker
- 🚀 Pipeline CI/CD con GitHub Actions

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo



## 📞 Soporte

- 🐛 Issues: 
- 💬 Discussions: 

## 🙏 Agradecimientos

- Spring Boot Team por el excelente framework
- React Team por la librería de UI
- Tailwind CSS por el framework de estilos
- Docker por la plataforma de containerización
- AWS por los servicios de cloud

---

<div align="center">
  <p>Hecho con ❤️ por <a href="https://bytecraft.com">Bytecraft</a></p>
  <p>© 2025 DigiTicket. Todos los derechos reservados.</p>
</div>
