import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { handleAdminCommands } from './handleAdminCommands';
import { handleChefCommands } from './handleChefCommands';
import { handleEmployeeCommands } from './handleEmployeeCommands';
import { Role } from '../enum/Role';

export async function handleRoleBasedCommand(
  ws: WebSocket,
  user: User,
  command: string,
  currentStateSetter: (state: string) => void
) {
  switch (user.role.name) {
    case Role.Admin:
      await handleAdminCommands(ws, command, currentStateSetter, user);
      break;
    case Role.Chef:
      await handleChefCommands(ws, command, user, currentStateSetter);
      break;
    case Role.Employee:
      await handleEmployeeCommands(ws, command, user, currentStateSetter);
      break;
    default:
      ws.send('Unknown role.');
  }
}
