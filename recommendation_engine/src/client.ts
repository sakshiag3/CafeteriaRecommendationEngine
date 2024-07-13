import WebSocket from 'ws';
import readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

const wsUrl = process.env.WS_URL || 'ws://localhost:8080';
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Welcome to the cafeteria');

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
