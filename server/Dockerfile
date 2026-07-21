# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Pre-fetch dependencies to speed up subsequent builds
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/server-0.0.1-SNAPSHOT.jar app.jar
# Ensure the persistent data directory exists
RUN mkdir -p data
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
