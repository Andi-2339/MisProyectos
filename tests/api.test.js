const request = require('supertest');
const app = require('../index');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let testUserId;

beforeAll((done) => {
    const db = new sqlite3.Database('./database.sqlite');
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)", () => {
        // Limpiamos la bd antes de empezar por si hay datos basura
        db.run("DELETE FROM users", () => db.close(done));
    });
});

describe('Pruebas de la API (10 Endpoints con casos de Éxito y Fallo de Usuario)', () => {

    // ==========================================
    // ENDPOINT 1: GET / (Estado del servidor)
    // ==========================================
    describe('1. Endpoint: GET /', () => {
        test('ÉXITO: Debe retornar que la API está funcionando', async () => {
            const res = await request(app).get('/api/');
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe("Hola Profesor, el Pipeline funciona perfecto");
        });
    });

    // ==========================================
    // ENDPOINT 2: GET /health (Healthcheck)
    // ==========================================
    describe('2. Endpoint: GET /health', () => {
        test('ÉXITO: Debe retornar status healthy', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.data.status).toBe("healthy");
        });
    });

    // ==========================================
    // ENDPOINT 3: POST /users (Crear Usuario)
    // ==========================================
    describe('3. Endpoint: POST /users', () => {
        test('FALLO DE USUARIO: Falta enviar datos (body vacío)', async () => {
            const res = await request(app).post('/api/users').send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.data.error).toMatch(/Faltan campos obligatorios/);
        });

        test('FALLO DE USUARIO: Email sin formato correcto (@)', async () => {
            const res = await request(app).post('/api/users').send({ name: "Juan", email: "juan_sin_arroba" });
            expect(res.statusCode).toBe(400);
            expect(res.body.data.error).toMatch(/Formato de email inválido/);
        });

        test('ÉXITO: Debe crear un usuario correctamente con datos válidos', async () => {
            const res = await request(app).post('/api/users').send({ name: "Usuario Prueba", email: "prueba@test.com" });
            expect(res.statusCode).toBe(201);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe("Usuario Prueba");
            testUserId = res.body.data.id; // Lo guardamos para los siguientes tests
        });
    });

    // ==========================================
    // ENDPOINT 4: GET /users (Listar usuarios)
    // ==========================================
    describe('4. Endpoint: GET /users', () => {
        test('ÉXITO: Debe retornar una lista de usuarios', async () => {
            const res = await request(app).get('/api/users');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThan(0); // Al menos el que creamos arriba
        });
    });

    // ==========================================
    // ENDPOINT 5: GET /users/:id (Obtener por ID)
    // ==========================================
    describe('5. Endpoint: GET /users/:id', () => {
        test('FALLO DE USUARIO: Buscar un ID que no existe (ej. 9999)', async () => {
            const res = await request(app).get('/api/users/9999');
            expect(res.statusCode).toBe(404);
            expect(res.body.data.error).toMatch(/Usuario no encontrado/);
        });

        test('ÉXITO: Debe obtener los datos del usuario correcto', async () => {
            const res = await request(app).get(`/api/users/${testUserId}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(testUserId);
            expect(res.body.data.email).toBe("prueba@test.com");
        });
    });

    // ==========================================
    // ENDPOINT 6: PUT /users/:id (Actualizar)
    // ==========================================
    describe('6. Endpoint: PUT /users/:id', () => {
        test('FALLO DE USUARIO: Actualizar con datos incompletos', async () => {
            const res = await request(app).put(`/api/users/${testUserId}`).send({ name: "Solo Nombre" });
            expect(res.statusCode).toBe(400);
            expect(res.body.data.error).toMatch(/Faltan datos para actualizar/);
        });

        test('FALLO DE USUARIO: Intentar actualizar ID inexistente', async () => {
            const res = await request(app).put('/api/users/9999').send({ name: "Falso", email: "f@f.com" });
            expect(res.statusCode).toBe(404);
            expect(res.body.data.error).toMatch(/Usuario a actualizar no encontrado/);
        });

        test('ÉXITO: Debe actualizar los datos correctamente', async () => {
            const res = await request(app).put(`/api/users/${testUserId}`).send({ name: "Nombre Modificado", email: "mod@test.com" });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe("Nombre Modificado");
        });
    });

    // ==========================================
    // ENDPOINT 7: POST /echo (Eco)
    // ==========================================
    describe('7. Endpoint: POST /echo', () => {
        test('FALLO DE USUARIO: Enviar un body vacío', async () => {
            const res = await request(app).post('/api/echo').send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.data.error).toMatch(/El body no puede estar vacío/);
        });

        test('ÉXITO: Debe retornar el mismo JSON que recibe', async () => {
            const payload = { test: 123, clave: "valor" };
            const res = await request(app).post('/api/echo').send(payload);
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual(payload);
        });
    });

    // ==========================================
    // ENDPOINT 8: POST /backup (Respaldar BD)
    // ==========================================
    describe('8. Endpoint: POST /backup', () => {
        test('ÉXITO: Debe generar un archivo de backup en el sistema', async () => {
            const res = await request(app).post('/api/backup');
            expect(res.statusCode).toBe(200);
            expect(fs.existsSync('./backup.sqlite')).toBeTruthy();
        });
    });

    // ==========================================
    // ENDPOINT 9: DELETE /users/:id (Eliminar)
    // ==========================================
    describe('9. Endpoint: DELETE /users/:id', () => {
        test('FALLO DE USUARIO: Intentar borrar un ID que no existe', async () => {
            const res = await request(app).delete('/api/users/9999');
            expect(res.statusCode).toBe(404);
            expect(res.body.data.error).toMatch(/Usuario a eliminar no encontrado/);
        });

        test('ÉXITO: Debe eliminar el usuario correctamente', async () => {
            const res = await request(app).delete(`/api/users/${testUserId}`);
            expect(res.statusCode).toBe(200);
            
            // Verificamos que realmente se borró
            const check = await request(app).get(`/api/users/${testUserId}`);
            expect(check.statusCode).toBe(404);
        });
    });

    // ==========================================
    // ENDPOINT 10: DELETE /empty (Vaciar BD)
    // ==========================================
    describe('10. Endpoint: DELETE /empty', () => {
        test('ÉXITO: Debe borrar todos los registros de la tabla users', async () => {
            const res = await request(app).delete('/api/empty');
            expect(res.statusCode).toBe(200);
            
            // Verificamos que la base esté vacía
            const listRes = await request(app).get('/api/users');
            expect(listRes.body.data.length).toBe(0);
        });
    });

});
