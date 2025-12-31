# =========================
# Etapa 1: Build (Compilación del proyecto)
# =========================
# Se utiliza una imagen base con Maven y JDK 21 (Temurin) sobre Alpine
# Esta etapa se encarga de compilar el código fuente y generar el .jar final.
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# =========================
# Etapa 2: Runtime (Ejecución de la aplicación)
# =========================
# Imagen ligera con solo el JRE de Java 21 (sin Maven)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Necesario para que funcione el HEALTHCHECK
RUN apk add --no-cache wget

# Crea un grupo y un usuario no root para ejecutar la app con más seguridad
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=build /app/target/*.jar app.jar

# Cambia el propietario de los archivos al usuario creado
RUN chown -R appuser:appgroup /app
# Cambia al usuario no root
USER appuser

# Expone el puerto 8080 (por defecto de Spring Boot)
EXPOSE 8080

# Define un chequeo de salud (Docker revisará si la app está viva)
# Este comando verifica cada 30s si el endpoint /actuator/health responde.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Variables de entorno para configurar la JVM (memoria y GC)
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"

# Comando de inicio: ejecuta la app usando los parámetros de la JVM definidos
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
