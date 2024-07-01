import { AppDataSource } from './data-source'; 
import WebSocket from 'ws';
import {  initializeServices, initializeControllers } from './initializers';
import { handleUserConnection } from './handlers/handleUserConnection';

AppDataSource.initialize().then(async connection => {
  const services = initializeServices();
  const controllers = initializeControllers();

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws: WebSocket) => {
    handleUserConnection(ws, controllers, services);
  });

  console.log('WebSocket server is running on ws://localhost:8080');
}).catch(error => console.log(error));
