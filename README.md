# Proyecto Integrador: Pipeline CI/CD Automatizado para API REST

Este proyecto contiene una API REST en Node.js, empaquetada con Docker y desplegada automáticamente mediante GitHub Actions en una instancia de AWS EC2. Cumple con todos los requerimientos de la práctica DevOps.

## 🏗 Arquitectura
1. **Aplicación Backend**: Node.js + Express con base de datos SQLite (para facilitar portabilidad en el contenedor).
2. **Endpoints**: Más de 6 endpoints funcionales incluyendo operaciones CRUD, un endpoint de Healthcheck, Backup y conexión TCP.
3. **Pruebas Automatizadas**: Jest y Supertest para pruebas unitarias/integración de la API. Cobertura requerida > 70%.
4. **Contenedorización**: Dockerfile multi-stage con `.dockerignore` para optimizar la construcción de la imagen.
5. **CI/CD**: GitHub Actions con un pipeline que:
    * Se activa mediante pushes/pull requests en `main`.
    * Instala dependencias y corre tests + cobertura.
    * Inicia sesión en DockerHub con Secretos.
    * Construye y sube la imagen etiquetada (con el hash del commit y tag 'latest').
    * Despliega en AWS EC2 a través de SSH con Secretos (detiene versión anterior, descarga la nueva, levanta contenedor en puerto 80).
6. **Infraestructura AWS**: Servidor EC2 corriendo Docker, con puertos 80 y 22 (y 6061 para TCP) abiertos.

## 💻 Comandos Locales (Desarrollo)

### Instalación de Dependencias
```bash
npm install
```

### Iniciar el Servidor de Desarrollo
```bash
npm start
```
El servidor se ejecutará en http://localhost:80 (y TCP en 6061).

### Correr Pruebas y Cobertura
```bash
npm run test -- --coverage
```
Este comando corre el conjunto de pruebas de Jest y genera un reporte en consola indicando el porcentaje de código cubierto.

### Construir Imagen de Docker Localmente
```bash
docker build -t practica-devops .
```

### Ejecutar Imagen de Docker Localmente
```bash
docker run -p 80:80 -p 6061:6061 practica-devops
```

## ⚙️ Pasos de Configuración CI/CD

Para asegurar que GitHub Actions pueda construir, publicar y desplegar de manera automatizada se deben configurar los siguientes **GitHub Secrets** en el repositorio:

### Docker Hub
* `DOCKER_USERNAME`: Tu usuario de Docker Hub.
* `DOCKER_PASSWORD`: Tu Personal Access Token (PAT) de Docker Hub.

### AWS EC2
* `EC2_HOST`: La IP pública de tu instancia de EC2 (Ej. 18.231... o ec2-...).
* `EC2_USER`: El usuario SSH de la máquina (Ej. ubuntu).
* `EC2_SSH_KEY`: El contenido *completo* de la clave SSH (.pem) generada al crear la instancia en AWS.

### Nota de Seguridad
Los archivos `.pem`, el archivo de base de datos (`database.sqlite`) y carpetas locales como `node_modules` están excluidos mediante `.gitignore` y `.dockerignore` para prevenir brechas de seguridad y optimizar el proceso CI.
