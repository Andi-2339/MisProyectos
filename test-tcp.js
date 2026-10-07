const net = require('net');

const HOST = '52.15.72.114'; // La IP pública de tu servidor AWS
const PORT = 6061;

const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log(`Conectado al servidor EC2: ${HOST}:${PORT}\n`);
    
    // 1. Prueba de Inserción
    const insertCmd = '{insert:{"name":"Andrea (Via TCP)","email":"andrea.tcp@test.com"}}';
    console.log('Enviando ->', insertCmd);
    client.write(insertCmd);
    
    // 2. Prueba de Obtención (Damos un margen de 1 segundo para asegurar la inserción)
    setTimeout(() => {
        const getCmd = '{get:1}'; // Consulta el ID 1 (puedes cambiarlo si tienes otros IDs)
        console.log('\nEnviando ->', getCmd);
        client.write(getCmd);
        
        // Cerramos la conexión después de probar
        setTimeout(() => client.destroy(), 500); 
    }, 1000);
});

client.on('data', (data) => {
    console.log('Recibido <-', data.toString().trim());
});

client.on('error', (err) => {
    console.log('Error de conexión:', err.message);
});