const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const URL_PREASIGNADA = 'https://jsonplaceholder.typicode.com/users/1';

console.log("=== ConsultaWeb ===");
console.log("Consulta de información");

const simularApp = () => {
  rl.question('\n[ BOTÓN ] Presiona [ENTER] para CONSULTAR o escribe "salir": ', async (input) => {
    if (input.toLowerCase() === 'salir') {
      rl.close();
      return;
    }

    console.log("Consultando..."); 

    try {
      const response = await fetch(URL_PREASIGNADA);
      if (!response.ok) throw new Error('Error en la conexión');

      const data = await response.json();

      console.log("\n--- RESULTADO ---");
      console.log(`Nombre: ${data.name}`);
      console.log(`Email: ${data.email}`);
      console.log(`Ciudad: ${data.address.city}`);
      console.log("-----------------");

    } catch (error) {
      console.log("\nNo fue posible obtener la información.");
    }

    simularApp();
  });
};

simularApp();