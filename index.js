const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const app = express();
const PORT = 80; // El puerto 80 es necesario para el mapeo que pide la práctica

app.use(express.json());

// 1. Configuración de BD Sqlite
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)");
});

// Helper para normalizar el JSON Schema solicitado
const responseSchema = (data) => ({ statusCode: 200, data: data });

// Endpoints GET
// 2. Endpoint: Estado del servidor
app.get('/api/', (req, res) => res.json(responseSchema("prueba Pipeline funciona perfecto")));

// 3. Endpoint: Listar usuarios
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => res.json(responseSchema(rows)));
});

// 4. Endpoint: Obtener usuario por ID
app.get('/api/users/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (!row) return res.status(404).json(responseSchema({ error: "Usuario no encontrado" }));
        res.json(responseSchema(row));
    });
});

// 5. Endpoint: Healthcheck
app.get('/api/health', (req, res) => res.json(responseSchema({ status: "healthy" })));

// Endpoints POST
// 6. Endpoint: Crear usuario
app.post('/api/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json(responseSchema({ error: "Error de usuario: Faltan campos obligatorios (name, email)" }));
    }
    if (!email.includes('@')) {
        return res.status(400).json(responseSchema({ error: "Error de usuario: Formato de email inválido" }));
    }

    db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], function (err) {
        res.status(201).json(responseSchema({ id: this.lastID, name, email }));
    });
});

// 7. Endpoint: Eco de datos
app.post('/api/echo', (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json(responseSchema({ error: "Error de usuario: El body no puede estar vacío" }));
    }
    res.json(responseSchema(req.body));
});

// 8. Endpoint: Hacer backup de la BD
app.post('/api/backup', (req, res) => {
    fs.copyFile('./database.sqlite', './backup.sqlite', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(responseSchema("Backup creado exitosamente como backup.sqlite"));
    });
});

// Endpoints PUT
// Endpoint: Actualizar usuario por ID
app.put('/api/users/:id', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json(responseSchema({ error: "Error de usuario: Faltan datos para actualizar" }));
    }

    db.run("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json(responseSchema({ error: "Usuario a actualizar no encontrado" }));
        res.json(responseSchema({ id: req.params.id, name, email }));
    });
});

// Endpoints DELETE
// 9. Endpoint: Eliminar usuario por ID
app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
        if (this.changes === 0) return res.status(404).json(responseSchema({ error: "Usuario a eliminar no encontrado" }));
        res.json(responseSchema(`Usuario ${req.params.id} eliminado`));
    });
});

// 10. Endpoint: Vaciar la BD
app.delete('/api/empty', (req, res) => {
    db.run("DELETE FROM users", (err) => {
        res.json(responseSchema("Base de datos vaciada por completo"));
    });
});



const net = require('net');
const TCP_PORT = 6061;

const tcpServer = net.createServer((socket) => {
    socket.on('data', (data) => {
        const message = data.toString().trim();

        // Lógica para {insert:{"name":"...","email":"..."}}
        if (message.startsWith('{insert:') && message.endsWith('}')) {
            const jsonStr = message.slice(8, -1);
            try {
                const { name, email } = JSON.parse(jsonStr);
                db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], function (err) {
                    if (err) socket.write(`Error: ${err.message}\n`);
                    else socket.write(`{statusCode: 200, data: {id: ${this.lastID}, name: "${name}", email: "${email}"}}\n`);
                });
            } catch (e) {
                socket.write("{statusCode: 400, data: 'JSON Invalido'}\n");
            }
        }
        // Lógica para {get:1}
        else if (message.startsWith('{get:') && message.endsWith('}')) {
            const id = message.slice(5, -1);
            db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
                if (err) socket.write(`Error: ${err.message}\n`);
                else socket.write(`{statusCode: 200, data: ${JSON.stringify(row || {})}}\n`);
            });
        } else {
            socket.write("Comando TCP no reconocido\n");
        }
    });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
    tcpServer.listen(TCP_PORT, () => console.log(`Servidor TCP escuchando en puerto ${TCP_PORT}`));
}

module.exports = app;