import { AppDataSource } from './data-source'; 
import WebSocket from 'ws';
import { handleUserConnection } from './handlers/handleUserConnection';
import * as dotenv from 'dotenv';

dotenv.config();
AppDataSource.initialize().then(async connection => {
  const port = process.env.WEBSOCKET_PORT;
  const wss = new WebSocket.Server({ port: Number(port) });

  wss.on('connection', (ws: WebSocket) => {
    handleUserConnection(ws);
  });

  console.log('WebSocket server is running');
}).catch(error => console.log(error));
