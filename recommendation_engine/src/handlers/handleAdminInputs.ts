import { WebSocket } from 'ws';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';

export async function handleAdminInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  adminService: AdminService,
  currentStateSetter: (state: string) => void
) {
  switch (currentState) {
    case 'viewDiscardList':
      await adminService.viewDiscardList(ws);
      currentStateSetter('authenticated');
      break;
    case 'changeAvailability':
      await adminService.changeAvailability(ws, msg);
      currentStateSetter('authenticated');
      break;
    default:
      ws.send('Unknown command.');
      break;
  }
}
