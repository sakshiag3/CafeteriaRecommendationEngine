import WebSocket from 'ws';
import { AdminController } from '../controllers/adminController';

export async function handleUserInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  currentStateSetter: (state: string) => void
) {
  const adminController = new AdminController();

  switch (state) {
    case 'addUserUsername':
      await adminController.handleAddUserUsername(ws, msg, currentStateSetter);
      break;
    case 'addUserPassword':
      await adminController.handleAddUserPassword(ws, msg, currentStateSetter);
      break;
    case 'addUserRole':
      await adminController.handleAddUserRole(ws, msg, currentStateSetter);
      break;
    default:
      ws.send('Invalid state. Please try again.');
  }
}
