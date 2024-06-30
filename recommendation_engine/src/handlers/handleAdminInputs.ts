import { WebSocket } from 'ws';
import { AdminController } from '../controllers/adminController';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';

export async function handleAdminInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  adminController: AdminController,
  userService: UserService,
  roleService: RoleService,
  currentStateSetter: (state: string) => void
) {
  switch (currentState) {
    case 'viewDiscardList':
      await adminController.viewDiscardList(ws);
      currentStateSetter('authenticated');
      break;
    case 'changeAvailability':
      await adminController.changeAvailability(ws, msg);
      currentStateSetter('authenticated');
      break;
    default:
      ws.send('Unknown command.');
      break;
  }
}
