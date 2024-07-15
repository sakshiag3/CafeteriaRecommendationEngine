import { AppDataSource } from './data-source'; 
import WebSocket from 'ws';
import { handleUserConnection } from './handlers/handleUserConnection';

AppDataSource.initialize().then(async connection => {
  const wss = new WebSocket.Server({ port: 8081 });

  wss.on('connection', (ws: WebSocket) => {
    handleUserConnection(ws);
  });

  console.log('WebSocket server is running on ws://localhost:8080');
}).catch(error => console.log(error));
