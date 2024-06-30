import { AppDataSource } from './data-source'; 
import WebSocket from 'ws';
import { initializeRepositories, initializeServices, initializeControllers } from './initializers';
import { handleUserConnection } from './handlers/handleUserConnection';

AppDataSource.initialize().then(async connection => {
  const repositories = initializeRepositories(AppDataSource);
  const services = initializeServices(repositories);
  const controllers = initializeControllers(services, repositories);

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws: WebSocket) => {
    handleUserConnection(ws, controllers, services, repositories);
  });

  console.log('WebSocket server is running on ws://localhost:8080');
}).catch(error => console.log(error));
