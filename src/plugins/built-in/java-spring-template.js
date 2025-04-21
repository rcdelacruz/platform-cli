const PluginInterface = require('../interface');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { logger } = require('../../utils/logger');
const os = require('os');

/**
 * Plugin for generating Java Spring Boot projects
 */
class JavaSpringTemplatePlugin extends PluginInterface {
  /**
   * Get plugin name
   * @returns {string} The name of the plugin
   */
  getName() {
    return 'template-java-spring';
  }

  /**
   * Get plugin version
   * @returns {string} The version of the plugin
   */
  getVersion() {
    return '1.0.0';
  }

  /**
   * Get plugin description
   * @returns {string} The description of the plugin
   */
  getDescription() {
    return 'Generates a Java Spring Boot project with standard structure and configurations';
  }

  /**
   * Get plugin dependencies
   * @returns {string[]} Array of plugin names this plugin depends on
   */
  getDependencies() {
    return [];
  }

  /**
   * Get plugin default configuration
   * @returns {Object} Default configuration values
   */
  getDefaults() {
    return {
      javaVersion: '17',
      springBootVersion: '3.2.2',
      dependencies: [
        'web',
        'data-jpa',
        'security',
        'actuator',
        'postgresql',
        'lombok',
        'validation'
      ],
      packageName: 'com.example.demo',
      enableFlyway: true,
      enableSwagger: true
    };
  }

  /**
   * Initialize the plugin
   * @param {Object} context The plugin context
   */
  async initialize(context) {
    logger.debug(`Initializing ${this.getName()}`);
  }

  /**
   * Apply the plugin to a project
   * @param {Object} context The project context
   */
  async apply(context) {
    const { name, outputDir, packageName } = context;
    const config = { ...this.getDefaults(), ...context };
    
    logger.info(`Generating Java Spring Boot project: ${name}`);
    
    // Create temp directory for downloading the template
    const tempDir = path.join(os.tmpdir(), `platform-cli-java-spring-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    try {
      // Method 1: Use Spring Initializr
      await this.generateFromSpringInitializr(tempDir, name, config);
      
      // Copy generated project to output directory
      await fs.ensureDir(outputDir);
      await fs.copy(path.join(tempDir, name), outputDir);
      
      // Add additional files and configurations
      await this.addAdditionalFiles(outputDir, config);
      
      logger.success(`Java Spring Boot project generated at ${outputDir}`);
    } catch (error) {
      logger.error(`Failed to generate Java Spring Boot project: ${error.message}`);
      throw error;
    } finally {
      // Clean up temp directory
      await fs.remove(tempDir);
    }
  }
  
  /**
   * Generate project from Spring Initializr
   * @param {string} tempDir Temporary directory
   * @param {string} name Project name
   * @param {Object} config Configuration
   */
  async generateFromSpringInitializr(tempDir, name, config) {
    const dependencies = config.dependencies.join(',');
    const url = `https://start.spring.io/starter.zip`;
    
    const curlParams = [
      `-d type=maven-project`,
      `-d language=java`,
      `-d bootVersion=${config.springBootVersion}`,
      `-d baseDir=${name}`,
      `-d groupId=${config.packageName.substring(0, config.packageName.lastIndexOf('.'))}`,
      `-d artifactId=${name}`,
      `-d name=${name}`,
      `-d packageName=${config.packageName}`,
      `-d javaVersion=${config.javaVersion}`,
      `-d dependencies=${dependencies}`,
      `-o ${tempDir}/${name}.zip`
    ];
    
    const curlCommand = `curl ${url} ${curlParams.join(' ')}`;
    
    try {
      logger.debug('Generating project from Spring Initializr...');
      execSync(curlCommand, { cwd: tempDir, stdio: 'inherit' });
      
      // Unzip the project
      const unzipCommand = `unzip -q ${name}.zip`;
      execSync(unzipCommand, { cwd: tempDir, stdio: 'inherit' });
      
      logger.debug('Project generated from Spring Initializr');
    } catch (error) {
      logger.error(`Failed to generate from Spring Initializr: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add additional files and configurations to the generated project
   * @param {string} outputDir Output directory
   * @param {Object} config Configuration
   */
  async addAdditionalFiles(outputDir, config) {
    // Convert application.properties to application.yml if it exists
    const propertiesPath = path.join(outputDir, 'src/main/resources/application.properties');
    if (await fs.pathExists(propertiesPath)) {
      const ymlPath = path.join(outputDir, 'src/main/resources/application.yml');
      
      // Create basic YAML configuration
      const yamlConfig = `
spring:
  application:
    name: ${config.name}
  profiles:
    active: local
  datasource:
    url: jdbc:postgresql://localhost:5432/${config.name}
    username: \${DB_USERNAME:postgres}
    password: \${DB_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: true
      
server:
  port: 8080

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

# Application specific settings
app:
  security:
    jwt:
      secret: \${JWT_SECRET:changeThisInProduction}
      expiration: 86400000  # 24 hours
`;
      
      await fs.writeFile(ymlPath, yamlConfig);
      await fs.remove(propertiesPath);
      
      logger.debug('Converted application.properties to application.yml');
    }
    
    // Add Dockerfile
    const dockerfilePath = path.join(outputDir, 'Dockerfile');
    const dockerfileContent = `
FROM eclipse-temurin:${config.javaVersion}-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`;
    
    await fs.writeFile(dockerfilePath, dockerfileContent);
    logger.debug('Added Dockerfile');
    
    // Add docker-compose.yml
    const dockerComposePath = path.join(outputDir, 'docker-compose.yml');
    const dockerComposeContent = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${config.name}
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${config.name}
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
`;
    
    await fs.writeFile(dockerComposePath, dockerComposeContent);
    logger.debug('Added docker-compose.yml');
    
    // Add GitHub Actions workflow
    const githubWorkflowsDir = path.join(outputDir, '.github/workflows');
    await fs.ensureDir(githubWorkflowsDir);
    
    const workflowPath = path.join(githubWorkflowsDir, 'ci.yml');
    const workflowContent = `
name: CI/CD

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK ${config.javaVersion}
      uses: actions/setup-java@v3
      with:
        java-version: '${config.javaVersion}'
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn -B package --file pom.xml
    
    - name: Run tests
      run: mvn test
`;
    
    await fs.writeFile(workflowPath, workflowContent);
    logger.debug('Added GitHub Actions workflow');
    
    // Add README.md
    const readmePath = path.join(outputDir, 'README.md');
    const readmeContent = `
# ${config.name}

This project was generated with the Platform CLI.

## Getting Started

### Prerequisites

- Java ${config.javaVersion} or higher
- Maven 3.8+ or Gradle 8.0+
- Docker (optional)

### Running Locally

1. Start the database:

\`\`\`bash
docker-compose up -d db
\`\`\`

2. Run the application:

\`\`\`bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
\`\`\`

### API Documentation

- Swagger UI: http://localhost:8080/swagger-ui.html
- API docs: http://localhost:8080/v3/api-docs

### Building and Running with Docker

\`\`\`bash
./mvnw clean package
docker-compose up --build
\`\`\`

## Project Structure

\`\`\`
src/main/java/${config.packageName.replace(/\./g, '/')}
├── config/              # Configuration classes
├── controller/          # REST controllers
├── dto/                 # Data transfer objects
├── exception/           # Custom exceptions and handlers
├── model/               # Domain entities
├── repository/          # Data access layer
├── security/            # Security configuration
├── service/             # Business logic
│   └── impl/            # Service implementations
├── util/                # Utility classes
└── Application.java     # Application entry point
\`\`\`
`;
    
    await fs.writeFile(readmePath, readmeContent);
    logger.debug('Added README.md');
    
    if (config.enableFlyway) {
      // Add Flyway migrations directory
      const migrationsDir = path.join(outputDir, 'src/main/resources/db/migration');
      await fs.ensureDir(migrationsDir);
      
      // Add initial Flyway migration
      const migrationFile = path.join(migrationsDir, 'V1__init.sql');
      const migrationContent = `
-- Initial schema migration

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
      
      await fs.writeFile(migrationFile, migrationContent);
      logger.debug('Added Flyway migrations');
    }
    
    if (config.enableSwagger) {
      // Add Swagger configuration
      const swaggerConfigDir = path.join(outputDir, `src/main/java/${config.packageName.replace(/\./g, '/')}/config`);
      await fs.ensureDir(swaggerConfigDir);
      
      const swaggerConfigFile = path.join(swaggerConfigDir, 'SwaggerConfig.java');
      const swaggerConfigContent = `
package ${config.packageName}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("${config.name} API")
                        .version("1.0.0")
                        .description("API documentation for ${config.name}")
                        .termsOfService("https://example.com/terms")
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0.html"))
                );
    }
}
`;
      
      await fs.writeFile(swaggerConfigFile, swaggerConfigContent);
      logger.debug('Added Swagger configuration');
    }
  }
}

module.exports = JavaSpringTemplatePlugin;
