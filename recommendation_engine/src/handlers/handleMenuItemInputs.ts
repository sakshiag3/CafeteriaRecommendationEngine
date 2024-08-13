import WebSocket from 'ws';
import { MenuItemController } from '../controllers/menuItemController';

export async function handleMenuItemInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  currentStateSetter: (state: string) => void
) {
  console.log(`handleMenuItemInputs: state = ${state}, msg = ${msg}`);

  const menuItemController = new MenuItemController();

  switch (true) {
    case state.startsWith('addMenuItem'):
      await menuItemController.handleAddMenuItem(ws, msg, currentStateSetter);
      break;
    case state.startsWith('deleteMenuItem'):
      await menuItemController.handleDeleteMenuItem(ws, msg, currentStateSetter);
      break;
    case state.startsWith('updateMenuItem'):
      await menuItemController.handleUpdateMenuItem(ws, msg, state, currentStateSetter);
      break;
    default:
      ws.send('Invalid state. Please try again.');
      break;
  }
}
