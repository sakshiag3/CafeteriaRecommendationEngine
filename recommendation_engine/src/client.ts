import WebSocket from 'ws';
import readline from 'readline';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to the server');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    const command = input.trim();
    ws.send(command);
  });

  rl.prompt();
});

ws.on('message', (message) => {
  console.log(`Received message: ${message}`);
});

ws.on('error', (err) => {
  console.error('Cannot connect to the server. Make sure the server is running.');
});

ws.on('close', () => {
  console.log('Connection to the server was lost.');
  process.exit(0);
});
