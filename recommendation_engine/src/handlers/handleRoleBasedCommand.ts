import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { UserService } from '../services/userService';
import { MenuItemService } from '../services/menuItemService';
import { ChefController } from '../controllers/chefController';
import { EmployeeController } from '../controllers/employeeController';
import { handleAdminCommands } from './handleAdminCommands';
import { handleChefCommands } from './handleChefCommands';
import { handleEmployeeCommands } from './handleEmployeeCommands';

export async function handleRoleBasedCommand(
  ws: WebSocket,
  user: User,
  command: string,
  userService: UserService,
  menuItemService: MenuItemService,
  chefController: ChefController,
  employeeController: EmployeeController,
  currentStateSetter: (state: string) => void
) {
  switch (user.role.name) {
    case 'Admin':
      await handleAdminCommands(ws, command, currentStateSetter, userService, user, menuItemService);
      break;
    case 'Chef':
      await handleChefCommands(ws, command, chefController, menuItemService, userService, user, currentStateSetter);
      break;
    case 'Employee':
      await handleEmployeeCommands(ws, command, employeeController, userService, user, currentStateSetter);
      break;
    default:
      ws.send('Unknown role.');
  }
}
